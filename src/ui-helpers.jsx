import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Search, Settings, Star } from "lucide-react";
import { brand } from "./src-data";

export function ActionButton({ children, onClick, type = "button", variant = "primary", className = "" }) {
  const styles =
    variant === "primary"
      ? { backgroundColor: brand.primary, color: "white" }
      : variant === "secondary"
      ? { backgroundColor: "white", color: "#0f172a", border: "1px solid #e2e8f0" }
      : variant === "gold"
      ? { backgroundColor: brand.secondary, color: "#111827" }
      : variant === "success"
      ? { backgroundColor: brand.accent, color: "white" }
      : { backgroundColor: "#fee2e2", color: "#991b1b" };

  return (
    <button type={type} onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-300 ${className}`} style={styles}>
      {children}
    </button>
  );
}

export function Stars({ value }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((item) => (
        <Star key={item} size={14} className={item <= Math.round(value) ? "fill-current" : ""} style={{ color: brand.secondary }} />
      ))}
      <span className="ml-1 text-sm font-medium text-slate-600">{value}</span>
    </div>
  );
}

export function MetricCard({ title, value, note, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: { bg: "#EEF2FF", color: brand.primary },
    gold: { bg: "#FFF5E8", color: "#A16207" },
    green: { bg: "#EAF8F1", color: brand.accent },
    slate: { bg: "#F1F5F9", color: "#475569" },
  };
  const t = tones[tone];
  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{title}</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
          <div className="mt-2 text-sm text-slate-500">{note}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: t.bg }}>
          <Icon style={{ color: t.color }} />
        </div>
      </div>
    </motion.div>
  );
}

export function AdminHeader({ title, subtitle, onAlerts }) {
  return (
    <div className="mb-8 flex flex-col gap-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">Admin Panel</div>
        <div className="text-2xl font-black text-slate-950">{title}</div>
        <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={onAlerts} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
          <Bell size={16} /> Alerts
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
          <Settings size={16} /> Settings
        </button>
      </div>
    </div>
  );
}

export function SearchBox({ placeholder = "Search" }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
      <Search size={18} className="text-slate-400" />
      <input placeholder={placeholder} className="outline-none" />
    </div>
  );
}

export function BackButton({ label, onClick }) {
  return (
    <ActionButton variant="secondary" onClick={onClick} className="inline-flex items-center gap-2">
      <ArrowLeft size={16} /> {label}
    </ActionButton>
  );
}