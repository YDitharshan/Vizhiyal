

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, Clock, ShieldCheck } from "lucide-react";

// Role → home path mapping
const HOME = {
  superadmin: "/superadmin",
  admin: "/admin",
  seller: "/seller",
  buyer: "/home",
};

// Shown to pending sellers who try to reach /seller/* before approval
function SellerPendingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Application Under Review</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Your seller application is being reviewed by our admin team.
          You'll receive a notification once it's approved — usually within 24 hours.
        </p>
        <div className="flex items-center gap-2 bg-accent-50 rounded-xl px-4 py-3 text-sm text-gray-600">
          <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
          We verify every seller to keep the platform safe.
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { auth, loading } = useAuth();
  const location = useLocation();

  // ── Still verifying stored token ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // ── Not logged in → go to /login, remember where they were trying to go ──
  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Wrong role → send to their own home ──
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={HOME[auth.role] ?? "/home"} replace />;
  }

  // ── Pending seller trying to reach seller-only pages ──
  // Seller routes allow ["seller","admin","superadmin"] but not "buyer".
  // Admins/superadmins bypass this check.
  const isSellerOnlyRoute = allowedRoles && !allowedRoles.includes("buyer");
  if (isSellerOnlyRoute && auth.role === "seller" && auth.sellerStatus !== "approved") {
    return <SellerPendingScreen />;
  }

  return children;
}
