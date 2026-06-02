// App.jsx — root router, delegates to role-based route files
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }   from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

import GuestRoutes  from "./routes/GuestRoutes";
import BuyerRoutes  from "./routes/BuyerRoutes";
import SellerRoutes from "./routes/SellerRoutes";
import AdminRoutes  from "./routes/AdminRoutes";
import NotFound     from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {GuestRoutes()}
            {BuyerRoutes()}
            {SellerRoutes()}
            {AdminRoutes()}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
