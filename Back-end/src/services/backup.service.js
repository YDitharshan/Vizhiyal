// services/backup.service.js
// Produces a real PostgreSQL dump via pg_dump and records metadata in the
// Backup table. Connection details are parsed from the same DATABASE_URL that
// Prisma uses, so whatever the app can reach, pg_dump can reach too.
//
// Requires the `pg_dump` binary (postgresql-client) to be present — it is
// installed in the backend Docker image. If it is missing, the backup row is
// marked "failed" with a helpful message rather than crashing the server.
import { spawn } from "child_process";
import fs   from "fs";
import path from "path";
import prisma from "../config/db.js";

// Default to public/backups — that path is bind-mounted in docker-compose, so
// dumps persist across container restarts. It is NOT served statically.
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), "public", "backups");

// Resolve the pg_dump binary. Prefer an explicit override, then the highest
// versioned client under /usr/libexec (Alpine installs e.g. postgresql18 there
// without always linking it onto PATH), then plain "pg_dump" from PATH.
function resolvePgDump() {
  if (process.env.PG_DUMP_BIN) return process.env.PG_DUMP_BIN;
  try {
    const base = "/usr/libexec";
    const dirs = fs.readdirSync(base)
      .filter(d => /^postgresql\d+$/.test(d))
      .sort((a, b) => parseInt(b.replace(/\D/g, ""), 10) - parseInt(a.replace(/\D/g, ""), 10));
    for (const d of dirs) {
      const p = path.join(base, d, "pg_dump");
      if (fs.existsSync(p)) return p;
    }
  } catch { /* /usr/libexec may not exist on non-Alpine hosts */ }
  return "pg_dump";
}

function parseDbUrl() {
  const url = new URL(process.env.DATABASE_URL);
  return {
    host:     url.hostname,
    port:     url.port || "5432",
    user:     decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
}

/** Run a full pg_dump. Resolves with the (updated) Backup record. */
export async function runBackup(initiatedBy) {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const stamp    = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `vizhiyal-${stamp}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  const record = await prisma.backup.create({
    data: {
      type:            "full",
      status:          "running",
      fileName,
      initiatedById:   initiatedBy?.id   ?? null,
      initiatedByName: initiatedBy?.name || "System",
    },
  });

  const db = parseDbUrl();

  return new Promise((resolve) => {
    const out  = fs.createWriteStream(filePath);
    const args = [
      "-h", db.host,
      "-p", db.port,
      "-U", db.user,
      "-d", db.database,
      "--no-owner",
      "--no-privileges",
    ];

    let child;
    try {
      child = spawn(resolvePgDump(), args, { env: { ...process.env, PGPASSWORD: db.password } });
    } catch (e) {
      return finalizeFailure(record.id, filePath, `Could not start pg_dump: ${e.message}`, resolve);
    }

    child.stdout.pipe(out);
    let errBuf = "";
    child.stderr.on("data", (d) => { errBuf += d.toString(); });

    child.on("error", (e) => {
      const msg = e.code === "ENOENT"
        ? "pg_dump not found on the server (install postgresql-client)."
        : e.message;
      finalizeFailure(record.id, filePath, msg, resolve);
    });

    child.on("close", async (code) => {
      out.close();
      if (code === 0) {
        let size = 0;
        try { size = fs.statSync(filePath).size; } catch { /* ignore */ }
        const updated = await prisma.backup.update({
          where: { id: record.id },
          data:  { status: "success", sizeBytes: BigInt(size) },
        });
        resolve(updated);
      } else {
        finalizeFailure(record.id, filePath, errBuf.slice(0, 480) || `pg_dump exited with code ${code}`, resolve);
      }
    });
  });
}

async function finalizeFailure(id, filePath, message, resolve) {
  try { fs.unlinkSync(filePath); } catch { /* file may not exist */ }
  const updated = await prisma.backup.update({
    where: { id },
    data:  { status: "failed", error: message },
  });
  resolve(updated);
}
