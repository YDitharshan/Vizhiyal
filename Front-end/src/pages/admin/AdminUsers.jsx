// AdminUsers.jsx — connected to real admin users API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, ShoppingCart, Loader2 } from "lucide-react";
import { adminApi } from "../../services/adminApi";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    adminApi.getUsers()
      .then(({ data }) => {
        const raw = data.users || data || [];
        setUsers(raw.map(u => ({
          id:     u.id,
          name:   u.name   || "User",
          email:  u.email  || "",
          avatar: u.avatar || "",
          joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-LK") : "—",
          orders: u._count?.bookings ?? u.ordersCount ?? 0,
          status: (u.status || "ACTIVE").toUpperCase() === "SUSPENDED" ? "suspended" : "active",
        })));
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !query.trim() ||
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  async function toggleStatus(id) {
    const user = users.find(u => u.id === id);
    if (!user || toggling) return;
    const newStatus = user.status === "active" ? "SUSPENDED" : "ACTIVE";
    setToggling(id);
    try {
      await adminApi.updateUserStatus(id, { status: newStatus });
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, status: newStatus === "SUSPENDED" ? "suspended" : "active" } : u
      ));
    } catch { /* silent */ } finally { setToggling(null); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${users.length} registered buyers`}
          </p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="px-3 py-2.5 text-sm flex-1 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Orders</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(user => (
                  <tr key={user.id} onClick={() => navigate(`/admin/users/${user.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || undefined}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={e => { e.target.style.display = "none"; }}
                        />
                        <p className="font-medium text-gray-800">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                    <td className="px-5 py-3.5 text-gray-500">{user.joined}</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-gray-600">
                        <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                        {user.orders}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        user.status === "active"
                          ? "bg-accent-50 text-accent border-accent/20"
                          : "bg-red-50 text-red-500 border-red-200"
                      }`}>
                        {user.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); toggleStatus(user.id); }}
                        disabled={toggling === user.id}
                        className={`text-xs font-medium hover:underline disabled:opacity-60 ${
                          user.status === "active" ? "text-red-500" : "text-accent"
                        }`}
                      >
                        {toggling === user.id ? "…" : user.status === "active" ? "Suspend" : "Reinstate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
