// BackupRecovery.jsx — SuperAdmin: data backup and recovery panel (real API)
// "Run Backup" triggers a real pg_dump on the backend (POST /admin/backups);
// history is loaded from GET /admin/backups. Restore is intentionally guarded.
import { useState, useEffect } from "react";
import {
  Database, Download, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Loader2,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";

const statusCfg = {
  success: { label: "Success", cls: "bg-accent-50 text-accent border-accent/20", icon: CheckCircle },
  failed:  { label: "Failed",  cls: "bg-red-50 text-red-500 border-red-200",     icon: XCircle     },
  running: { label: "Running", cls: "bg-blue-50 text-blue-600 border-blue-200",  icon: Clock       },
};

const typeCfg = {
  full:        { label: "Full Backup", cls: "bg-primary-50 text-primary border-primary/20" },
  incremental: { label: "Incremental", cls: "bg-gray-100 text-gray-600 border-gray-200"    },
};

function fmtTime(iso) {
  return new Date(iso).toLocaleString("en-LK", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default function BackupRecovery() {
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [isBackingUp,   setIsBackingUp]   = useState(false);
  const [confirmBackup, setConfirmBackup] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [banner,        setBanner]        = useState(null); // { kind, text }

  function load() {
    setLoading(true);
    adminApi.getBackups()
      .then(({ data }) => setHistory(data.backups || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const lastSuccess   = history.find(b => b.status === "success");
  const successCount  = history.filter(b => b.status === "success").length;

  async function triggerBackup() {
    setConfirmBackup(false);
    setIsBackingUp(true);
    setBanner(null);
    try {
      const { data } = await adminApi.runBackup();
      setBanner({ kind: "success", text: data.message || "Backup completed." });
    } catch (err) {
      setBanner({ kind: "error", text: err.response?.data?.message || "Backup failed. Is pg_dump available on the server?" });
    } finally {
      setIsBackingUp(false);
      load();
    }
  }

  async function handleRestore() {
    const target = confirmRestore;
    setConfirmRestore(null);
    try {
      const { data } = await adminApi.restoreBackup(target.id);
      setBanner({ kind: "warning", text: data.message });
    } catch (err) {
      setBanner({ kind: "error", text: err.response?.data?.message || "Restore request failed." });
    }
  }

  const bannerCls = {
    success: "bg-accent-50 border-accent/20 text-accent",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    error:   "bg-red-50 border-red-200 text-red-600",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Backup & Recovery</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real PostgreSQL dumps · Restore is guarded for safety</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmBackup(true)}
            disabled={isBackingUp}
            className="flex items-center gap-2 bg-gray-900 text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {isBackingUp
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Backing Up...</>
              : <><Database className="w-4 h-4" /> Run Backup Now</>}
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Last Successful Backup</p>
          <p className="text-sm font-bold text-gray-800">{lastSuccess ? fmtTime(lastSuccess.createdAt) : "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">Size: {lastSuccess?.size ?? "—"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total Backups</p>
          <p className="text-2xl font-bold text-gray-800">{history.length}</p>
          <p className="text-xs text-accent mt-0.5">{successCount} successful</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Backup Method</p>
          <p className="text-sm font-bold text-gray-800">pg_dump (manual)</p>
          <p className="text-xs text-gray-400 mt-0.5">On-demand snapshots</p>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className={`flex items-start gap-3 border rounded-2xl p-4 ${bannerCls[banner.kind]}`}>
          {banner.kind === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="text-sm font-medium flex-1">{banner.text}</p>
          <button onClick={() => setBanner(null)} className="text-current opacity-60 hover:opacity-100">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Backup history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Backup History</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No backups yet — run your first backup above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                <th className="text-left px-5 py-3">File</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Size</th>
                <th className="text-left px-5 py-3">Initiated By</th>
                <th className="text-left px-5 py-3">Date & Time</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.map(b => {
                const sCfg = statusCfg[b.status] || statusCfg.running;
                const tCfg = typeCfg[b.type] || typeCfg.full;
                const StatusIcon = sCfg.icon;
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500" title={b.error || b.fileName}>
                      {b.fileName || b.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tCfg.cls}`}>{tCfg.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border w-fit ${sCfg.cls}`}>
                        <StatusIcon className="w-3 h-3" /> {sCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{b.size}</td>
                    <td className="px-5 py-3.5 text-gray-600">{b.initiatedBy}</td>
                    <td className="px-5 py-3.5 text-gray-500">{fmtTime(b.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      {b.status === "success" && (
                        <button
                          onClick={() => setConfirmRestore(b)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Restore
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={confirmBackup}
        title="Run a full backup now?"
        description="This runs pg_dump against the live database and stores the snapshot on the server. It usually completes within a few seconds."
        confirmLabel="Run Backup"
        onConfirm={triggerBackup}
        onCancel={() => setConfirmBackup(false)}
      />
      <ConfirmDialog
        open={!!confirmRestore}
        title={`Restore from ${confirmRestore?.fileName ?? ""}?`}
        description="Restoring overwrites the live database. For safety this is guarded — you'll get instructions to restore the dump manually rather than it running automatically."
        confirmLabel="Continue"
        onConfirm={handleRestore}
        onCancel={() => setConfirmRestore(null)}
      />
    </div>
  );
}
