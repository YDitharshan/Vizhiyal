// utils/auditLog.js
// Fire-and-forget audit logger. Records one AuditLog row per admin action.
// Designed to NEVER break the parent request — any failure is swallowed and
// logged to the console only. Read by the SuperAdmin Audit Logs + Activity Feed.
import prisma from "../config/db.js";

/**
 * @param {object} req               Express request (uses req.user as the actor)
 * @param {object} entry
 * @param {string} entry.action      Human-readable action, e.g. "Suspended user account"
 * @param {string} [entry.type]      seller | user | order | gig | system  (default: system)
 * @param {string} [entry.targetType]user | booking | gig | review | ...
 * @param {string} [entry.targetLabel]Name/id of the affected entity
 */
export async function logAudit(req, { action, type = "system", targetType = "", targetLabel = "" }) {
  try {
    const actor = req?.user;
    await prisma.auditLog.create({
      data: {
        actorId:     actor?.id   ?? null,
        actorName:   actor?.name  || "System",
        actorRole:   actor?.role  || "system",
        action,
        type,
        targetType,
        targetLabel: targetLabel || "",
      },
    });
  } catch (err) {
    // Auditing must never interfere with the actual operation.
    console.error("auditLog error:", err.message);
  }
}
