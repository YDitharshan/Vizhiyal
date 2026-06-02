// SellerRoutes — vendor (seller) pages, all wrapped in SellerLayout
// Requires: seller (approved), admin, or superadmin role.
// Pending sellers see the approval-pending screen via ProtectedRoute.
import { Route } from "react-router-dom";
import ProtectedRoute        from "../components/ProtectedRoute";
import SellerLayout          from "../layouts/SellerLayout";
import Dashboard             from "../pages/seller/Dashboard";
import Gigs                  from "../pages/seller/Gigs";
import GigForm               from "../pages/seller/GigForm";
import SellerOrders          from "../pages/seller/SellerOrders";
import SellerOrderDetail     from "../pages/seller/SellerOrderDetail";
import SellerMessages        from "../pages/seller/SellerMessages";
import Earnings              from "../pages/seller/Earnings";
import SellerNotifications   from "../pages/seller/SellerNotifications";
import SellerProfile         from "../pages/seller/SellerProfile";
import SellerSupport         from "../pages/seller/SellerSupport";
import SellerReviews         from "../pages/seller/SellerReviews";
import Availability          from "../pages/seller/Availability";

// seller (approved), admin, and superadmin can access seller pages
const SELLER_ROLES = ["seller", "admin", "superadmin"];

function Protect({ children }) {
  return <ProtectedRoute allowedRoles={SELLER_ROLES}>{children}</ProtectedRoute>;
}

export default function SellerRoutes() {
  return (
    <>
      <Route path="/seller"               element={<Protect><SellerLayout><Dashboard /></SellerLayout></Protect>} />
      <Route path="/seller/gigs"          element={<Protect><SellerLayout><Gigs /></SellerLayout></Protect>} />
      <Route path="/seller/gigs/create"   element={<Protect><SellerLayout><GigForm /></SellerLayout></Protect>} />
      <Route path="/seller/gigs/:id/edit" element={<Protect><SellerLayout><GigForm /></SellerLayout></Protect>} />
      <Route path="/seller/orders"        element={<Protect><SellerLayout><SellerOrders /></SellerLayout></Protect>} />
      <Route path="/seller/orders/:id"    element={<Protect><SellerLayout><SellerOrderDetail /></SellerLayout></Protect>} />
      <Route path="/seller/messages"      element={<Protect><SellerLayout><SellerMessages /></SellerLayout></Protect>} />
      <Route path="/seller/earnings"      element={<Protect><SellerLayout><Earnings /></SellerLayout></Protect>} />
      <Route path="/seller/notifications" element={<Protect><SellerLayout><SellerNotifications /></SellerLayout></Protect>} />
      <Route path="/seller/profile"       element={<Protect><SellerLayout><SellerProfile /></SellerLayout></Protect>} />
      <Route path="/seller/reviews"       element={<Protect><SellerLayout><SellerReviews /></SellerLayout></Protect>} />
      <Route path="/seller/support"       element={<Protect><SellerLayout><SellerSupport /></SellerLayout></Protect>} />
      <Route path="/seller/availability"  element={<Protect><SellerLayout><Availability /></SellerLayout></Protect>} />
    </>
  );
}
