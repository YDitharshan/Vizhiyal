import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, UserRound } from "lucide-react";
import logo from "../assets/logo.png";
import { brand } from "../src-data";
import { ActionButton } from "../ui-helpers";

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center gap-3">
          <img
            src={logo}
            alt="Vizhiyal logo"
            className="h-12 w-12 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
          />
          <div>
            <div className="text-xl font-black" style={{ color: brand.primary }}>
              Vizhiyal
            </div>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Register
            </div>
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.28em]"
              style={{ color: brand.accent }}
            >
              Join the platform
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Choose how you want to use Vizhiyal
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">
              Register as a vendor to create your business on the platform, or
              register as a client to find the perfect services for your event.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(38,62,139,0.08)" }}
              >
                <Building2 style={{ color: brand.primary }} />
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-950">
                Are you vendor?
              </h2>
              <p className="mt-3 text-slate-500">
                Create your business in this platform.
              </p>
              <ActionButton
                onClick={() => navigate("/register/vendor")}
                className="mt-6"
              >
                I am Vendor
              </ActionButton>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(44,163,107,0.10)" }}
              >
                <UserRound style={{ color: brand.accent }} />
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-950">
                Are you client?
              </h2>
              <p className="mt-3 text-slate-500">
                Find the perfect services for your event from this platform.
              </p>
              <ActionButton
                onClick={() => navigate("/register/client")}
                className="mt-6"
              >
                I am Client
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}