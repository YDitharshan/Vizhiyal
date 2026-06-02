// Login — buyer sign-in page (connected to real backend)

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  // Where to return after login (e.g. vendor page guest came from)
  const from = location.state?.from?.pathname
    ? location.state.from.pathname + (location.state.from.search || "")
    : null;

  const [form,    setForm]    = useState({ email: "", password: "" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.email.trim() || !form.email.includes("@"))
      return "Please enter a valid email address.";
    if (!form.password)
      return "Please enter your password.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");
    try {
      const user = await login(form.email, form.password);
      // Route based on role; but if they came from a browse page, go back there
      if (user.role === "admin")      return navigate("/admin");
      if (user.role === "superadmin") return navigate("/superadmin");
      if (user.role === "seller" && !from) return navigate("/seller");
      navigate(from || "/home");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Join free
          </Link>
        </p>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-400 mb-7">Sign in to continue to Vizhiyal</p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set("email")}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Password
                  </label>
                  <button type="button" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={set("password")}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <hr className="flex-1 border-gray-100" />
              <span className="text-xs text-gray-400">or continue with</span>
              <hr className="flex-1 border-gray-100" />
            </div>

            {/* Social buttons (visual only) */}
            <div className="grid grid-cols-2 gap-3">
              {["Google", "Facebook"].map(provider => (
                <button
                  key={provider}
                  type="button"
                  className="flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  {provider}
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400 mt-6">
              New to Vizhiyal?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
