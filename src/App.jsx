import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import VendorPage from "./pages/VendorPage";
import LoginPage from "./pages/LoginPage";
import VendorDashboardPage from "./pages/VendorDashboardPage";
import RegisterPage from "./pages/RegisterPage";
import VendorRegisterPage from "./pages/VendorRegisterPage";
import ClientRegisterPage from "./pages/ClientRegisterPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ManageVendorsPage from "./pages/admin/ManageVendorsPage";
import ManageClientsPage from "./pages/admin/ManageClientsPage";
import VerificationPage from "./pages/admin/VerificationPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/vendor/:id" element={<VendorPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/vendor-dashboard" element={<VendorDashboardPage />} />

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/vendor" element={<VendorRegisterPage />} />
        <Route path="/register/client" element={<ClientRegisterPage />} />
        <Route path="/client-dashboard" element={<ClientDashboardPage />} />

        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/manage-vendors" element={<ManageVendorsPage />} />
        <Route path="/admin/manage-clients" element={<ManageClientsPage />} />
        <Route path="/admin/verification" element={<VerificationPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}