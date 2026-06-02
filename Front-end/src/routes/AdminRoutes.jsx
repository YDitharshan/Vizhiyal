// AdminRoutes — admin and superadmin pages, role-gated via ProtectedRoute
import { Route } from "react-router-dom";
import ProtectedRoute        from "../components/ProtectedRoute";
import AdminLayout           from "../layouts/AdminLayout";
import SuperAdminLayout      from "../layouts/SuperAdminLayout";
import AdminDashboard        from "../pages/admin/Dashboard";
import SellerApplications    from "../pages/admin/SellerApplications";
import ApplicationDetail     from "../pages/admin/ApplicationDetail";
import AdminUsers            from "../pages/admin/AdminUsers";
import AdminUserDetail       from "../pages/admin/AdminUserDetail";
import AdminOrders           from "../pages/admin/AdminOrders";
import AdminOrderDetail      from "../pages/admin/AdminOrderDetail";
import AdminGigs             from "../pages/admin/AdminGigs";
import AdminGigDetail        from "../pages/admin/AdminGigDetail";
import AdminVendors          from "../pages/admin/AdminVendors";
import AdminNotifications    from "../pages/admin/AdminNotifications";
import AdminAnalytics        from "../pages/admin/AdminAnalytics";
import AdminDisputes         from "../pages/admin/AdminDisputes";
import AdminDisputeDetail    from "../pages/admin/AdminDisputeDetail";
import AdminReviews          from "../pages/admin/AdminReviews";
import AdminPayouts          from "../pages/admin/AdminPayouts";
import AdminSupport          from "../pages/admin/AdminSupport";
import AdminSupportDetail    from "../pages/admin/AdminSupportDetail";
import AdminFeaturedGigs     from "../pages/admin/AdminFeaturedGigs";
import SuperAdminDashboard   from "../pages/superadmin/Dashboard";
import AdminAccounts         from "../pages/superadmin/AdminAccounts";
import PlatformSettings      from "../pages/superadmin/PlatformSettings";
import AuditLogs             from "../pages/superadmin/AuditLogs";
import SystemHealth          from "../pages/superadmin/SystemHealth";
import RevenueAnalytics      from "../pages/superadmin/RevenueAnalytics";
import AdminActivityFeed     from "../pages/superadmin/AdminActivityFeed";
import RolePermissions       from "../pages/superadmin/RolePermissions";
import Announcements         from "../pages/superadmin/Announcements";
import PromoCodes            from "../pages/superadmin/PromoCodes";
import BackupRecovery        from "../pages/superadmin/BackupRecovery";

const ADMIN_ROLES      = ["admin", "superadmin"];
const SUPERADMIN_ROLES = ["superadmin"];

function AdminOnly({ children }) {
  return <ProtectedRoute allowedRoles={ADMIN_ROLES}>{children}</ProtectedRoute>;
}
function SuperAdminOnly({ children }) {
  return <ProtectedRoute allowedRoles={SUPERADMIN_ROLES}>{children}</ProtectedRoute>;
}

export default function AdminRoutes() {
  return (
    <>
      {/* ── Admin panel ─────────────────────────────────────────── */}
      <Route path="/admin"               element={<AdminOnly><AdminLayout><AdminDashboard /></AdminLayout></AdminOnly>} />
      <Route path="/admin/sellers"       element={<AdminOnly><AdminLayout><SellerApplications /></AdminLayout></AdminOnly>} />
      <Route path="/admin/sellers/:id"   element={<AdminOnly><AdminLayout><ApplicationDetail /></AdminLayout></AdminOnly>} />
      <Route path="/admin/users"         element={<AdminOnly><AdminLayout><AdminUsers /></AdminLayout></AdminOnly>} />
      <Route path="/admin/users/:id"     element={<AdminOnly><AdminLayout><AdminUserDetail /></AdminLayout></AdminOnly>} />
      <Route path="/admin/orders"        element={<AdminOnly><AdminLayout><AdminOrders /></AdminLayout></AdminOnly>} />
      <Route path="/admin/orders/:id"    element={<AdminOnly><AdminLayout><AdminOrderDetail /></AdminLayout></AdminOnly>} />
      <Route path="/admin/gigs"          element={<AdminOnly><AdminLayout><AdminGigs /></AdminLayout></AdminOnly>} />
      <Route path="/admin/gigs/:id"      element={<AdminOnly><AdminLayout><AdminGigDetail /></AdminLayout></AdminOnly>} />
      <Route path="/admin/vendors"       element={<AdminOnly><AdminLayout><AdminVendors /></AdminLayout></AdminOnly>} />
      <Route path="/admin/notifications" element={<AdminOnly><AdminLayout><AdminNotifications /></AdminLayout></AdminOnly>} />
      <Route path="/admin/analytics"     element={<AdminOnly><AdminLayout><AdminAnalytics /></AdminLayout></AdminOnly>} />
      <Route path="/admin/disputes"      element={<AdminOnly><AdminLayout><AdminDisputes /></AdminLayout></AdminOnly>} />
      <Route path="/admin/disputes/:id"  element={<AdminOnly><AdminLayout><AdminDisputeDetail /></AdminLayout></AdminOnly>} />
      <Route path="/admin/reviews"       element={<AdminOnly><AdminLayout><AdminReviews /></AdminLayout></AdminOnly>} />
      <Route path="/admin/payouts"       element={<AdminOnly><AdminLayout><AdminPayouts /></AdminLayout></AdminOnly>} />
      <Route path="/admin/support"       element={<AdminOnly><AdminLayout><AdminSupport /></AdminLayout></AdminOnly>} />
      <Route path="/admin/support/:id"   element={<AdminOnly><AdminLayout><AdminSupportDetail /></AdminLayout></AdminOnly>} />
      <Route path="/admin/featured"      element={<AdminOnly><AdminLayout><AdminFeaturedGigs /></AdminLayout></AdminOnly>} />

      {/* ── Superadmin panel (own dark layout) ──────────────────── */}
      <Route path="/superadmin"                   element={<SuperAdminOnly><SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/revenue"           element={<SuperAdminOnly><SuperAdminLayout><RevenueAnalytics /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/admins"            element={<SuperAdminOnly><SuperAdminLayout><AdminAccounts /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/permissions"       element={<SuperAdminOnly><SuperAdminLayout><RolePermissions /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/activity"          element={<SuperAdminOnly><SuperAdminLayout><AdminActivityFeed /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/announcements"     element={<SuperAdminOnly><SuperAdminLayout><Announcements /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/promos"            element={<SuperAdminOnly><SuperAdminLayout><PromoCodes /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/settings"          element={<SuperAdminOnly><SuperAdminLayout><PlatformSettings /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/audit"             element={<SuperAdminOnly><SuperAdminLayout><AuditLogs /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/health"            element={<SuperAdminOnly><SuperAdminLayout><SystemHealth /></SuperAdminLayout></SuperAdminOnly>} />
      <Route path="/superadmin/backup"            element={<SuperAdminOnly><SuperAdminLayout><BackupRecovery /></SuperAdminLayout></SuperAdminOnly>} />
    </>
  );
}
