import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { brand } from "../src-data";
import { ActionButton } from "../ui-helpers";

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Vendor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleLogin = () => {
  if (role === "Vendor") {
    navigate("/vendor-dashboard", { state: { email, role } });
  } else {
    navigate("/client-dashboard", { state: { email, role } });
  }
};

  return (
    <section className="relative min-h-screen overflow-hidden px-5 py-16 lg:px-8">
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at top left, rgba(38,62,139,0.08), transparent 30%), radial-gradient(circle at bottom right, rgba(44,163,107,0.12), transparent 28%), linear-gradient(180deg, #ffffff, #f8fbff)" }} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: brand.primary }}>Welcome Back</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Login to continue to your dashboard.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">Sign in as a Vendor or Client.</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Vizhiyal logo" className="h-12 w-12 rounded-2xl border border-slate-200 p-1" />
            <div>
              <div className="font-bold" style={{ color: brand.primary }}>Vizhiyal</div>
              <div className="text-sm text-slate-400">Login Page</div>
            </div>
          </div>
          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4"><Mail size={18} className="text-slate-400" /><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter email" className="w-full outline-none placeholder:text-slate-400" /></div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-4"><Lock size={18} className="text-slate-400" /><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Enter password" className="w-full outline-none placeholder:text-slate-400" /></div>
            </div>
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">Login as</label>
              <div className="grid grid-cols-2 gap-3">
                {["Vendor", "Client"].map((item) => (
                  <button key={item} onClick={() => setRole(item)} className="rounded-2xl border px-4 py-4 text-sm font-bold transition" style={role === item ? { backgroundColor: brand.primary, borderColor: brand.primary, color: "white" } : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#334155" }}>{item}</button>
                ))}
              </div>
            </div>
            <ActionButton onClick={handleLogin} className="w-full">Login</ActionButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}