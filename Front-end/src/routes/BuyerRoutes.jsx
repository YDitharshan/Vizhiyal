// BuyerRoutes — customer (buyer) pages, all wrapped in BuyerLayout
// All routes require a logged-in user (any role can browse buyer pages).
import { Route } from "react-router-dom";
import ProtectedRoute   from "../components/ProtectedRoute";
import BuyerLayout      from "../layouts/BuyerLayout";
import Home             from "../pages/buyer/Home";
import SearchVendor     from "../pages/buyer/SearchVendor";
import VendorDetail     from "../pages/buyer/VendorDetail";
import Messages         from "../pages/buyer/Messages";
import Orders           from "../pages/buyer/Orders";
import OrderDetail      from "../pages/buyer/OrderDetail";
import Disputes         from "../pages/buyer/Disputes";
import Notifications    from "../pages/buyer/Notifications";
import Wishlist         from "../pages/buyer/Wishlist";
import EventPlanner     from "../pages/buyer/EventPlanner";
import Events           from "../pages/buyer/Events";
import EventDetail      from "../pages/buyer/EventDetail";
import Profile          from "../pages/buyer/Profile";
import AccountSettings  from "../pages/buyer/AccountSettings";
import PaymentSummary   from "../pages/buyer/PaymentSummary";
import BecomeSeller     from "../pages/buyer/BecomeSeller";
import BuyerSupport     from "../pages/buyer/BuyerSupport";

// Any authenticated user can access buyer pages
const BUYER_ROLES = ["buyer", "seller", "admin", "superadmin"];

function Protect({ children }) {
  return <ProtectedRoute allowedRoles={BUYER_ROLES}>{children}</ProtectedRoute>;
}

export default function BuyerRoutes() {
  return (
    <>
      {/* Home has its own self-contained navbar (category sub-nav) */}
      <Route path="/home"         element={<Protect><Home /></Protect>} />

      {/* Become seller — no layout wrapper */}
      <Route path="/become-seller" element={<Protect><BecomeSeller /></Protect>} />

      {/* Inner pages use shared BuyerLayout navbar */}
      {/* Public — guests can browse without login */}
      <Route path="/search"             element={<BuyerLayout><SearchVendor /></BuyerLayout>} />
      <Route path="/vendor/:id"         element={<BuyerLayout><VendorDetail /></BuyerLayout>} />
      <Route path="/messages"           element={<Protect><BuyerLayout><Messages /></BuyerLayout></Protect>} />
      <Route path="/messages/:vendorId" element={<Protect><BuyerLayout><Messages /></BuyerLayout></Protect>} />
      <Route path="/orders"             element={<Protect><BuyerLayout><Orders /></BuyerLayout></Protect>} />
      <Route path="/orders/:id"         element={<Protect><BuyerLayout><OrderDetail /></BuyerLayout></Protect>} />
      <Route path="/disputes"           element={<Protect><BuyerLayout><Disputes /></BuyerLayout></Protect>} />
      <Route path="/notifications"      element={<Protect><BuyerLayout><Notifications /></BuyerLayout></Protect>} />
      <Route path="/wishlist"           element={<Protect><BuyerLayout><Wishlist /></BuyerLayout></Protect>} />
      <Route path="/plan-event"         element={<Protect><BuyerLayout><EventPlanner /></BuyerLayout></Protect>} />
      <Route path="/events"             element={<Protect><BuyerLayout><Events /></BuyerLayout></Protect>} />
      <Route path="/events/:id"         element={<Protect><BuyerLayout><EventDetail /></BuyerLayout></Protect>} />
      <Route path="/profile"            element={<Protect><BuyerLayout><Profile /></BuyerLayout></Protect>} />
      <Route path="/settings"           element={<Protect><BuyerLayout><AccountSettings /></BuyerLayout></Protect>} />
      <Route path="/payment"            element={<Protect><BuyerLayout><PaymentSummary /></BuyerLayout></Protect>} />
      <Route path="/support"            element={<Protect><BuyerLayout><BuyerSupport /></BuyerLayout></Protect>} />
    </>
  );
}
