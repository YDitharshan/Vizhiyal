// BackupRecovery.jsx — SuperAdmin: data backup and recovery panel
import { useState } from "react";
import { Database, Download, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const initialHistory = [
  { id: "BK-001", type: "full",        status: "success", size: "1.2 GB",  initiatedBy: "System (auto)",  createdAt: "2026-03-22 02:00" },
  { id: "BK-002", type: "full",        status: "success", size: "1.18 GB", initiatedBy: "System (auto)",  createdAt: "2026-03-21 02:00" },
  { id: "BK-003", type: "incremental", status: "success", size: "48 MB",   initiatedBy: "Nadeeka Perera", createdAt: "2026-03-20 14:30" },
  { id: "BK-004", type: "full",        status: "failed",  size: "—",       initiatedBy: "System (auto)",  createdAt: "2026-03-20 02:00" },
  { id: "BK-005", type: "full",        status: "success", size: "1.15 GB", initiatedBy: "System (auto)",  createdAt: "2026-03-19 02:00" },
];
import ConfirmDialog from "../../components/ConfirmDialog";

const statusCfg = {
  success: { label: "Success", cls: "bg-accent-50 text-accent border-accent/20",     icon: CheckCircle },
  failed:  { label: "Failed",  cls: "bg-red-50 text-red-500 border-red-200",         icon: XCircle     },
  running: { label: "Running", cls: "bg-blue-50 text-blue-600 border-blue-200",      icon: Clock       },
};

const typeCfg = {
  full:        { label: "Full Backup",        cls: "bg-primary-50 text-primary border-primary/20"     },
  incremental: { label: "Incremental",        cls: "bg-gray-100 text-gray-600 border-gray-200"        },
};

export default function BackupRecovery() {
  const [history,        setHistory]        = useState(initialHistory);
  const [isBackingUp,    setIsBackingUp]    = useState(false);
  const [confirmBackup,  setConfirmBackup]  = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [restored,       setRestored]       = useState(null);

  const lastSuccess = history.find(b => b.status === "success");

  function triggerBackup() {
    setIsBackingUp(true);
    setConfirmBackup(false);
    // Simulate backup completing after 2.5s
    setTimeout(() => {
      const newEntry = {
        id: `BK-${String(history.length + 1).padStart(3, "0")}`,
        type: "full",
        status: "success",
        size: "1.21 GB",
        initiatedBy: "Nadeeka Perera",
        createdAt: new Date().toLocaleString("en-CA", { hour12: false }).replace(",", "").slice(0, 16),
      };
      setHistory(prev => [newEntry, ...prev]);
      setIsBackingUp(false);
    }, 2500);
  }

  function handleRestore() {
    setRestored(confirmRestore.id);
    setConfirmRestore(null);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Backup & Recovery</h1>
          <p className="text-sm text-gray-400 mt-0.5">Automated daily backups · Manual backup available</p>
        </div>
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

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Last Successful Backup</p>
          <p className="text-sm font-bold text-gray-800">{lastSuccess?.createdAt ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">Size: {lastSuccess?.size ?? "—"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total Backups</p>
          <p className="text-2xl font-bold text-gray-800">{history.length}</p>
          <p className="text-xs text-accent mt-0.5">{history.filter(b => b.status === "success").length} successful</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Auto Backup Schedule</p>
          <p className="text-sm font-bold text-gray-800">Daily at 2:00 AM</p>
          <p className="text-xs text-accent mt-0.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Enabled
          </p>
        </div>
      </div>

      {/* Warning banner */}
      {restored && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Restore initiated for {restored}</p>
            <p className="text-xs text-amber-600 mt-0.5">
              The platform will restore to this snapshot. This is a simulation — no real data was changed.
            </p>
          </div>
        </div>
      )}

      {/* Backup history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Backup History</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
              <th className="text-left px-5 py-3">ID</th>
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
              const sCfg = statusCfg[b.status];
              const tCfg = typeCfg[b.type];
              const StatusIcon = sCfg.icon;
              return (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{b.id}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tCfg.cls}`}>
                      {tCfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border w-fit ${sCfg.cls}`}>
                      <StatusIcon className="w-3 h-3" /> {sCfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{b.size}</td>
                  <td className="px-5 py-3.5 text-gray-600">{b.initiatedBy}</td>
                  <td className="px-5 py-3.5 text-gray-500">{b.createdAt}</td>
                  <td className="px-5 py-3.5">
                    {b.status === "success" && restored !== b.id && (
                      <button
                        onClick={() => setConfirmRestore(b)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Restore
                      </button>
                    )}
                    {restored === b.id && (
                      <span className="text-xs text-amber-600 font-medium">Restored</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmBackup}
        title="Run a full backup now?"
        description="This will create a full snapshot of all platform data. The process runs in the background and typically completes in under a minute."
        confirmLabel="Run Backup"
        onConfirm={triggerBackup}
        onCancel={() => setConfirmBackup(false)}
      />
      <ConfirmDialog
        open={!!confirmRestore}
        title={`Restore to backup ${confirmRestore?.id}?`}
        description={`This will restore the platform to the snapshot from ${confirmRestore?.createdAt}. All changes made after this point will be lost. This action cannot be undone.`}
        confirmLabel="Restore"
        onConfirm={handleRestore}
        onCancel={() => setConfirmRestore(null)}
      />
    </div>
  );
}
