// NotFound — global 404 fallback page
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  const { auth } = useAuth();

  function goHome() {
    if (!auth) return navigate("/");
    if (auth.role === "seller")     return navigate("/seller");
    if (auth.role === "admin")      return navigate("/admin");
    if (auth.role === "superadmin") return navigate("/superadmin");
    navigate("/home");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Large 404 */}
        <p className="text-8xl font-extrabold text-primary/10 select-none leading-none mb-2">404</p>

        {/* Logo */}
        <p className="text-primary text-2xl font-bold tracking-tight mb-6">
          vizhiyal<span className="text-secondary">.</span>
        </p>

        <h1 className="text-xl font-bold text-gray-800 mb-2">Page not found</h1>
        <p className="text-sm text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={goHome}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
