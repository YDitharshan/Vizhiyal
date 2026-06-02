// SystemHealth.jsx — SuperAdmin: platform uptime, metrics & service status
import { Activity, Server, Database, Wifi, HardDrive, RefreshCw } from "lucide-react";

const systemMetrics = [
  { label: "API Response Time", value: "142ms",  status: "good",    note: "avg over last 24h"   },
  { label: "Error Rate",        value: "0.3%",   status: "good",    note: "last 24 hours"        },
  { label: "Active Sessions",   value: "84",     status: "good",    note: "current live users"   },
  { label: "DB Connections",    value: "12 / 50",status: "good",    note: "pool utilisation 24%" },
  { label: "Storage Used",      value: "34 GB",  status: "warning", note: "68% of 50 GB limit"  },
  { label: "CDN Cache Hit",     value: "91%",    status: "good",    note: "last 7 days"          },
];

const SERVICES = [
  { name: "Web Server",       status: "operational", uptime: "99.98%", icon: Server   },
  { name: "Database",         status: "operational", uptime: "99.95%", icon: Database },
  { name: "CDN / Media",      status: "operational", uptime: "100%",   icon: Wifi     },
  { name: "Storage",          status: "degraded",    uptime: "99.80%", icon: HardDrive},
];

const STATUS_CFG = {
  operational: { label: "Operational", dot: "bg-accent",    badge: "bg-accent-50 text-accent border-accent/20"         },
  degraded:    { label: "Degraded",    dot: "bg-secondary", badge: "bg-secondary-50 text-secondary border-secondary/20"},
  down:        { label: "Down",        dot: "bg-red-500",   badge: "bg-red-50 text-red-500 border-red-200"             },
};

const METRIC_STATUS = {
  good:    { ring: "border-accent/20 bg-accent-50",     dot: "bg-accent",    text: "text-accent"    },
  warning: { ring: "border-secondary/20 bg-secondary-50", dot: "bg-secondary", text: "text-secondary" },
  bad:     { ring: "border-red-200 bg-red-50",          dot: "bg-red-500",   text: "text-red-600"   },
};

export default function SystemHealth() {
  const allOperational = SERVICES.every(s => s.status === "operational");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Health</h1>
          <p className="text-sm text-gray-400 mt-0.5">Live platform performance overview</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Overall status */}
      <div className={`rounded-2xl p-5 flex items-center gap-4 ${
        allOperational ? "bg-accent-50 border border-accent/20" : "bg-secondary-50 border border-secondary/20"
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          allOperational ? "bg-accent text-white" : "bg-secondary text-white"
        }`}>
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <p className={`text-lg font-bold ${allOperational ? "text-accent" : "text-secondary"}`}>
            {allOperational ? "All Systems Operational" : "Some Services Degraded"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Last checked: just now · Platform uptime this month: <strong>99.96%</strong>
          </p>
        </div>
      </div>

      {/* Service status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">Services</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {SERVICES.map(svc => {
            const cfg  = STATUS_CFG[svc.status] || STATUS_CFG.operational;
            const Icon = svc.icon;
            return (
              <div key={svc.name} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{svc.name}</p>
                  <p className="text-xs text-gray-400">Uptime: {svc.uptime}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${svc.status !== "operational" ? "animate-pulse" : ""}`} />
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance metrics */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {systemMetrics.map(m => {
            const cfg = METRIC_STATUS[m.status] || METRIC_STATUS.good;
            return (
              <div key={m.label} className={`rounded-xl border p-4 ${cfg.ring}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{m.label}</p>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot} ${m.status === "warning" ? "animate-pulse" : ""}`} />
                </div>
                <p className={`text-2xl font-bold ${cfg.text}`}>{m.value}</p>
                <p className="text-xs text-gray-400 mt-1">{m.note}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
