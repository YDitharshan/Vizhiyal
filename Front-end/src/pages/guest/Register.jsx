// Register — 2-step registration flow (connected to real backend)
// Step 1: Account details (name, email, password)
// Step 2: "Do you want to become a seller?" — two option cards

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User, Mail, Lock, Eye, EyeOff, AlertCircle, AtSign,
  CheckCircle, ShoppingBag, Store, ArrowRight, ChevronLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1); // 1 = details form, 2 = seller choice

  // Step 1 state
  const [form, setForm] = useState({ name: "", email: "", userId: "", password: "", confirm: "" });
  const [showPw, setShowPw]   = useState({ password: false, confirm: false });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors]   = useState({});

  // Step 2 state
  const [loading, setLoading] = useState(false);

  // ── Step 1 helpers ─────────────────────────────────────────────
  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())                           errs.name     = "Full name is required.";
    if (!form.email.includes("@"))                   errs.email    = "Enter a valid email address.";
    if (!form.userId.trim())                         errs.userId   = "User ID is required.";
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.userId))
                                                     errs.userId   = "3–20 characters, letters, numbers and underscores only.";
    if (form.password.length < 8)                   errs.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm)              errs.confirm  = "Passwords do not match.";
    if (!agreeTerms)                                 errs.terms    = "Please accept the terms to continue.";
    return errs;
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(2); // move to seller choice
  };

  // ── Step 2 — complete registration ────────────────────────────
  const [registerError, setRegisterError] = useState("");

  const finishRegister = async (wantsSeller) => {
    setLoading(true);
    setRegisterError("");
    try {
      await register(form.name, form.email, form.password, wantsSeller);
      navigate(wantsSeller ? "/become-seller" : "/home");
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || "Registration failed. Please try again.";
      setRegisterError(msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-primary text-xl font-bold tracking-tight select-none"
        >
          vizhiyal<span className="text-secondary">.</span>
        </button>
        <p className="text-sm text-gray-500">
          Already a member?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </header>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 py-5">
        {[1, 2].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= n ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
            }`}>
              {step > n ? <CheckCircle className="w-4 h-4" /> : n}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step >= n ? "text-primary" : "text-gray-400"}`}>
              {n === 1 ? "Account details" : "Account type"}
            </span>
            {n < 2 && <div className={`w-10 h-0.5 ${step > 1 ? "bg-primary" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-md">

          {/* ── Step 1: Account details ─────────────────────────── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Create your account</h1>
              <p className="text-sm text-gray-400 mb-7">Join Vizhiyal — plan and book amazing events</p>

              {registerError && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl mb-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {registerError}
                </div>
              )}

              <form onSubmit={handleStep1} className="space-y-4">

                <InputField
                  icon={User}
                  label="Full Name"
                  placeholder="e.g. Navaam Chandran"
                  value={form.name}
                  onChange={set("name")}
                  error={errors.name}
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    User ID <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. navaam_lk"
                      value={form.userId}
                      onChange={e => {
                        setForm(f => ({ ...f, userId: e.target.value.toLowerCase().replace(/\s/g, "_") }));
                        setErrors(er => ({ ...er, userId: "" }));
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.userId ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Choose wisely — this cannot be changed after registration.</p>
                  {errors.userId && <p className="text-xs text-red-400 mt-1">{errors.userId}</p>}
                </div>

                <InputField
                  icon={Mail}
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set("email")}
                  error={errors.email}
                />

                <PasswordField
                  label="Password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  show={showPw.password}
                  onToggle={() => setShowPw(s => ({ ...s, password: !s.password }))}
                  error={errors.password}
                />

                <PasswordField
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  show={showPw.confirm}
                  onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                  error={errors.confirm}
                />

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAgreeTerms(s => !s)}>
                    <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      agreeTerms ? "border-primary bg-primary" : "border-gray-300"
                    }`}>
                      {agreeTerms && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs text-gray-500 leading-relaxed">
                      I agree to the{" "}
                      <span className="text-primary font-medium">Terms of Service</span>
                      {" "}and{" "}
                      <span className="text-primary font-medium">Privacy Policy</span>
                    </span>
                  </label>
                  {errors.terms && <p className="text-xs text-red-400 mt-1 ml-7">{errors.terms}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── Step 2: Seller choice ───────────────────────────── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary transition-colors mb-5"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome, {form.name.split(" ")[0]}!
              </h1>
              <p className="text-sm text-gray-400 mb-8">
                Your account is ready. Would you also like to offer your services on Vizhiyal?
              </p>

              <div className="space-y-4">

                {/* Option A — Become a seller */}
                <button
                  onClick={() => finishRegister(true)}
                  disabled={loading}
                  className="w-full group border-2 border-secondary hover:border-secondary bg-white hover:bg-secondary/5 rounded-2xl p-5 text-left transition-all disabled:opacity-60"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary/10 group-hover:bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                      <Store className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800">Yes, I want to be a Seller</p>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        List your services, receive order requests, and earn on Vizhiyal. You can switch between buyer and seller anytime.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {["List your services", "Receive orders", "Earn & grow"].map(tag => (
                          <span key={tag} className="text-xs text-secondary bg-secondary/10 px-2.5 py-1 rounded-full font-medium">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-secondary flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Option B — Stay as buyer */}
                <button
                  onClick={() => finishRegister(false)}
                  disabled={loading}
                  className="w-full group border-2 border-gray-100 hover:border-primary bg-white hover:bg-primary/5 rounded-2xl p-5 text-left transition-all disabled:opacity-60"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                      <ShoppingBag className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 mb-1">No, I&apos;ll stay as a Buyer</p>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Browse vendors, book services, and manage your events. You can always become a seller later from your profile.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {["Browse vendors", "Book services", "Manage orders"].map(tag => (
                          <span key={tag} className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full font-medium">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-400">
                  <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                  Setting up your account…
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────
function InputField({ icon: Icon, label, type = "text", placeholder, value, onChange, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            error ? "border-red-300" : "border-gray-200"
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function PasswordField({ label, placeholder, value, onChange, show, onToggle, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            error ? "border-red-300" : "border-gray-200"
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
