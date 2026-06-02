// AdminAccounts.jsx — SuperAdmin: create, suspend, reinstate admin users (real API)
import { useState, useEffect } from "react";
import {
  Users, Search, Plus, CheckCircle, XCircle,
  X, Loader2, Copy, Check, Eye, EyeOff,
} from "lucide-react";
import { adminApi }  from "../../services/adminApi";
import ConfirmDialog from "../../components/ConfirmDialog";
import UserAvatar from "../../components/common/UserAvatar";

const ROLE_CFG = {
  admin:      { label: "Admin",       badge: "bg-primary-50 text-primary border-primary/20" },
  superadmin: { label: "Super Admin", badge: "bg-gray-900 text-white border-gray-700"        },
};

const blankForm = { name: "", email: "", role: "admin" };

export default function AdminAccounts() {
  const [accounts,      setAccounts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [query,         setQuery]         = useState("");
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState(blankForm);
  const [formErr,       setFormErr]       = useState({});
  const [creating,      setCreating]      = useState(false);
  const [createErr,     setCreateErr]     = useState("");
  const [tempCred,      setTempCred]      = useState(null); // { name, email, tempPassword }
  const [showPass,      setShowPass]      = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [toggling,      setToggling]      = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // ── Load accounts on mount ──
  useEffect(() => {
    adminApi.getAdminAccounts()
      .then(({ data }) => setAccounts(data.admins || []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = accounts.filter(a => {
    const q = query.toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  const activeCount    = accounts.filter(a => a.isActive !== false).length;
  const suspendedCount = accounts.filter(a => a.isActive === false).length;

  // ── Create admin ──
  async function handleCreate(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim())         errs.name  = "Name is required.";
    if (!form.email.includes("@")) errs.email = "Enter a valid email.";
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    setCreating(true);
    setCreateErr("");
    try {
      const { data } = await adminApi.createAdmin(form);
      setAccounts(prev => [data.user, ...prev]);
      setTempCred({ name: data.user.name, email: data.user.email, tempPassword: data.tempPassword });
      setForm(blankForm);
      setFormErr({});
      setShowForm(false);
    } catch (err) {
      setCreateErr(err.response?.data?.message || "Failed to create account.");
    } finally {
      setCreating(false);
    }
  }

  // ── Suspend / Reinstate ──
  async function handleToggle() {
    const { type, account } = confirmAction;
    const newStatus = type === "suspend" ? "SUSPENDED" : "ACTIVE";
    setToggling(account.id);
    try {
      await adminApi.toggleAdminStatus(account.id, { status: newStatus });
      setAccounts(prev => prev.map(a =>
        a.id === account.id ? { ...a, isActive: newStatus === "ACTIVE" } : a
      ));
    } catch { /* silent */ } finally {
      setToggling(null);
      setConfirmAction(null);
    }
  }

  function copyPassword() {
    if (!tempCred) return;
    navigator.clipboard.writeText(tempCred.tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Accounts</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${activeCount} active · ${suspendedCount} suspended`}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
            <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="px-3 py-2.5 text-sm focus:outline-none w-52"
            />
          </div>
          <button
            onClick={() => { setShowForm(s => !s); setCreateErr(""); }}
            className="flex items-center gap-2 bg-gray-900 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Admin
          </button>
        </div>
      </div>

      {/* One-time credentials banner */}
      {tempCred && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                ✅ Admin account created for {tempCred.name}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Share these credentials securely. The password cannot be retrieved again.
              </p>
            </div>
            <button onClick={() => setTempCred(null)} className="text-amber-400 hover:text-amber-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-mono">
            <div className="bg-white rounded-xl border border-amber-200 px-3 py-2">
              <span className="text-xs text-amber-600 block mb-0.5">Email</span>
              <span className="text-gray-800">{tempCred.email}</span>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 px-3 py-2 flex items-center justify-between gap-2">
              <div className="overflow-hidden">
                <span className="text-xs text-amber-600 block mb-0.5">Temporary Password</span>
                <span className="text-gray-800">
                  {showPass ? tempCred.tempPassword : "•".repeat(tempCred.tempPassword.length)}
                </span>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => setShowPass(v => !v)} className="p-1 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={copyPassword} className="p-1 text-gray-400 hover:text-amber-600">
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800">New Admin Account</p>
            <button
              onClick={() => { setShowForm(false); setFormErr({}); setCreateErr(""); }}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErr(er => ({ ...er, name: "" })); }}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErr.name ? "border-red-300" : "border-gray-200"}`}
              />
              {formErr.name && <p className="text-xs text-red-400 mt-1">{formErr.name}</p>}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErr(er => ({ ...er, email: "" })); }}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErr.email ? "border-red-300" : "border-gray-200"}`}
              />
              {formErr.email && <p className="text-xs text-red-400 mt-1">{formErr.email}</p>}
            </div>
            <div className="flex gap-2">
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <button
                type="submit"
                disabled={creating}
                className="bg-gray-900 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 text-sm flex items-center gap-1.5 disabled:opacity-60"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </button>
            </div>
          </form>
          {createErr && <p className="text-xs text-red-500">{createErr}</p>}
          <p className="text-xs text-gray-400">
            A secure temporary password will be generated — shown once after creation.
          </p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No accounts found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Admin</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(account => {
                  const roleCfg  = ROLE_CFG[account.role] || ROLE_CFG.admin;
                  const isActive = account.isActive !== false;
                  return (
                    <tr key={account.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={account.avatar} name={account.name} size={32} />
                          <div>
                            <p className="font-medium text-gray-800">{account.name}</p>
                            <p className="text-xs text-gray-400">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${roleCfg.badge}`}>
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {account.createdAt
                          ? new Date(account.createdAt).toLocaleDateString("en-LK")
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 w-fit ${
                          isActive
                            ? "bg-accent-50 text-accent border-accent/20"
                            : "bg-red-50 text-red-500 border-red-200"
                        }`}>
                          {isActive
                            ? <CheckCircle className="w-3 h-3" />
                            : <XCircle    className="w-3 h-3" />}
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {account.role !== "superadmin" && (
                          <button
                            disabled={toggling === account.id}
                            onClick={() => setConfirmAction({
                              type:    isActive ? "suspend" : "reinstate",
                              account,
                            })}
                            className={`text-xs font-medium hover:underline disabled:opacity-40 flex items-center gap-1 ${
                              isActive ? "text-red-500" : "text-accent"
                            }`}
                          >
                            {toggling === account.id && <Loader2 className="w-3 h-3 animate-spin" />}
                            {isActive ? "Suspend" : "Reinstate"}
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
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === "suspend" ? "Suspend this admin?" : "Reinstate this admin?"}
        description={
          confirmAction?.type === "suspend"
            ? `${confirmAction?.account?.name} will lose admin access immediately.`
            : `${confirmAction?.account?.name} will regain full admin access.`
        }
        confirmLabel={confirmAction?.type === "suspend" ? "Suspend" : "Reinstate"}
        onConfirm={handleToggle}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
