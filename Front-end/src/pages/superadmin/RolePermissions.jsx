// RolePermissions.jsx — SuperAdmin: permission matrix for admin roles
import { CheckCircle, XCircle, Shield, Lock } from "lucide-react";

const rolePermissions = [
  { feature: "View Dashboard",              category: "General",     admin: true,  superadmin: true  },
  { feature: "View Analytics",              category: "General",     admin: true,  superadmin: true  },
  { feature: "Manage Seller Applications",  category: "Marketplace", admin: true,  superadmin: true  },
  { feature: "Suspend / Reinstate Vendors", category: "Marketplace", admin: true,  superadmin: true  },
  { feature: "Manage Users",                category: "Marketplace", admin: true,  superadmin: true  },
  { feature: "Manage Orders",               category: "Marketplace", admin: true,  superadmin: true  },
  { feature: "Manage Gigs",                 category: "Marketplace", admin: true,  superadmin: true  },
  { feature: "Handle Disputes",             category: "Management",  admin: true,  superadmin: true  },
  { feature: "Moderate Reviews",            category: "Management",  admin: true,  superadmin: true  },
  { feature: "Process Payouts",             category: "Management",  admin: true,  superadmin: true  },
  { feature: "Manage Support Tickets",      category: "Management",  admin: true,  superadmin: true  },
  { feature: "Set Featured Gigs",           category: "Management",  admin: true,  superadmin: true  },
  { feature: "Manage Admin Accounts",       category: "Platform",    admin: false, superadmin: true  },
  { feature: "Set Role Permissions",        category: "Platform",    admin: false, superadmin: true  },
  { feature: "Platform Settings",           category: "Platform",    admin: false, superadmin: true  },
  { feature: "Post Announcements",          category: "Platform",    admin: false, superadmin: true  },
  { feature: "Manage Promo Codes",          category: "Platform",    admin: false, superadmin: true  },
  { feature: "Revenue Analytics",           category: "Platform",    admin: false, superadmin: true  },
  { feature: "Backup & Recovery",           category: "Platform",    admin: false, superadmin: true  },
  { feature: "View Full Audit Logs",        category: "Platform",    admin: false, superadmin: true  },
  { feature: "System Health Monitor",       category: "Platform",    admin: false, superadmin: true  },
  { feature: "Delete Admin Accounts",       category: "Platform",    admin: false, superadmin: true  },
];

const CATEGORIES = ["General", "Marketplace", "Management", "Platform"];

const categoryColors = {
  General:     "bg-gray-100 text-gray-600",
  Marketplace: "bg-primary-50 text-primary",
  Management:  "bg-secondary-50 text-secondary",
  Platform:    "bg-purple-50 text-purple-600",
};

export default function RolePermissions() {
  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    perms: rolePermissions.filter(p => p.category === cat),
  }));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Role Permissions</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Platform-wide permission matrix — read-only reference
        </p>
      </div>

      {/* Role legend */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-gray-700">Admin</span>
          <span className="text-xs text-gray-400">— standard administrator</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 shadow-sm">
          <Lock className="w-4 h-4 text-secondary" />
          <span className="text-sm font-semibold text-white">Super Admin</span>
          <span className="text-xs text-white/50">— full platform access</span>
        </div>
      </div>

      {/* Permission table */}
      {grouped.map(({ category, perms }) => (
        <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[category]}`}>
              {category}
            </span>
            <span className="text-xs text-gray-400">{perms.length} permissions</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                <th className="text-left px-5 py-3">Feature / Action</th>
                <th className="text-center px-5 py-3 w-32">
                  <span className="flex items-center justify-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-primary" /> Admin
                  </span>
                </th>
                <th className="text-center px-5 py-3 w-32 bg-gray-900/5">
                  <span className="flex items-center justify-center gap-1 text-gray-700">
                    <Lock className="w-3.5 h-3.5 text-secondary" /> Super Admin
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {perms.map(p => (
                <tr key={p.feature} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-gray-700">{p.feature}</td>
                  <td className="px-5 py-3.5 text-center">
                    {p.admin
                      ? <CheckCircle className="w-5 h-5 text-accent mx-auto" />
                      : <XCircle    className="w-5 h-5 text-gray-200 mx-auto" />}
                  </td>
                  <td className="px-5 py-3.5 text-center bg-gray-900/[0.02]">
                    {p.superadmin
                      ? <CheckCircle className="w-5 h-5 text-accent mx-auto" />
                      : <XCircle    className="w-5 h-5 text-gray-200 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <p className="text-xs text-gray-400 text-center pb-2">
        Permission changes require a platform code update. Contact Nadeeka Perera (Super Admin) for modifications.
      </p>
    </div>
  );
}
