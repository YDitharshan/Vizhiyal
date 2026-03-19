import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Briefcase,
  Clock3,
  DollarSign,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Trophy,
  UserCircle2,
  Bell,
  Settings,
  PieChart,
} from "lucide-react";
import { brand } from "../src-data";
import { ActionButton, MetricCard } from "../ui-helpers";

function WeeklyBarChart() {
  const data = [55, 72, 68, 84, 77, 92, 88];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900">Weekly Performance</div>
          <div className="text-sm text-slate-500">Project engagement showcase</div>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }}
        >
          +14%
        </div>
      </div>

      <div className="mt-8 flex h-56 items-end justify-between gap-3">
        {data.map((value, index) => (
          <div key={labels[index]} className="flex flex-1 flex-col items-center justify-end gap-3">
            <div
              className="w-full rounded-t-2xl transition-all duration-500"
              style={{
                height: `${value * 1.6}px`,
                background:
                  index % 2 === 0
                    ? `linear-gradient(180deg, ${brand.primary}, #4F6EDB)`
                    : `linear-gradient(180deg, ${brand.accent}, #5BC78F)`,
              }}
            />
            <span className="text-xs font-medium text-slate-400">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessPieCard() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900">Success Ratio</div>
          <div className="text-sm text-slate-500">Delivery quality overview</div>
        </div>
        <PieChart style={{ color: brand.secondary }} />
      </div>

      <div className="mt-6 flex items-center gap-8">
        <div
          className="relative h-40 w-40 rounded-full"
          style={{
            background: `conic-gradient(${brand.accent} 0deg 306deg, ${brand.secondary} 306deg 338deg, #E2E8F0 338deg 360deg)`,
          }}
        >
          <div className="absolute inset-5 flex items-center justify-center rounded-full bg-white text-center">
            <div>
              <div className="text-3xl font-black text-slate-950">85%</div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Success</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.accent }} />
            Completed
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: brand.secondary }} />
            Ongoing
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-slate-300" />
            Pending
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorDashboardPage() {
  const location = useLocation();
  const user = location.state || { email: "vendor@vizhiyal.com", role: "Vendor" };

  const messages = [
    {
      name: "Nadeesha Perera",
      tag: "Wedding Client",
      time: "10:30 AM",
      text: "Can we finalize the Gold package with floral entrance décor and photography add-on?",
    },
    {
      name: "Kasun Fernando",
      tag: "Birthday Client",
      time: "Yesterday",
      text: "Please send the updated quotation for the kids birthday setup in Kandy.",
    },
  ];

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
              <UserCircle2 size={34} style={{ color: brand.primary }} />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
                Vendor Dashboard
              </div>
              <div className="text-2xl font-black text-slate-950">{user.role} Account</div>
              <div className="mt-1 text-sm text-slate-500">{user.email} • Amazing Wedding Planners</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <Bell size={16} /> 4 Alerts
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              <Settings size={16} /> Settings
            </button>
            <Link to="/">
              <ActionButton>Back to Site</ActionButton>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">Menu</div>
            <div className="mt-5 space-y-3">
              {[
                [LayoutDashboard, "Main Dashboard"],
                [FolderKanban, "Projects"],
                [MessageSquare, "Messages"],
                [DollarSign, "Earnings"],
                [Briefcase, "Services"],
              ].map(([Icon, label], idx) => (
                <button
                  key={label}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition"
                  style={
                    idx === 0
                      ? { backgroundColor: "rgba(38,62,139,0.08)", color: brand.primary }
                      : { color: "#475569" }
                  }
                >
                  <Icon size={18} /> {label}
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Completed Project" value="148" note="Finished successfully" icon={Trophy} tone="green" />
              <MetricCard title="Ongoing Project" value="12" note="Currently active" icon={Clock3} tone="gold" />
              <MetricCard title="Total Earning" value="LKR 2.8M" note="This financial period" icon={DollarSign} tone="blue" />
              <MetricCard title="Success Ratio" value="85%" note="Client satisfaction" icon={TrendingUp} tone="slate" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <WeeklyBarChart />
              <SuccessPieCard />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-bold text-slate-900">Recent Projects</div>
                <div className="mt-6 space-y-4">
                  {["Royal Wedding Setup", "Colombo Birthday Theme", "Corporate Summit Décor"].map((title) => (
                    <div key={title} className="rounded-2xl border border-slate-200 px-4 py-4">
                      <div className="font-semibold text-slate-900">{title}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-bold text-slate-900">Client Messages</div>
                <div className="mt-6 space-y-4">
                  {messages.map((message) => (
                    <div key={message.name} className="rounded-2xl border border-slate-200 p-4">
                      <div className="font-semibold text-slate-900">{message.name}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {message.tag} • {message.time}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{message.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}