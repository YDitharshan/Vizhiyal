// AuthContext — JWT-backed auth state
// Stores token in localStorage, user object in state + localStorage
// currentRole is a UI-only concept (sellers can browse as buyers)

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi } from "../services/authApi.js";
import { resolveUrl } from "../utils/uploadUrl.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "vizhiyal_token";
const AUTH_KEY  = "vizhiyal_auth";

function loadToken() { return localStorage.getItem(TOKEN_KEY) || null; }
function loadAuth()  {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
}

// Map backend user → frontend auth shape
function toAuthShape(user, currentRole = null) {
  return {
    // Core fields from backend
    id:           user._id || user.id,
    name:         user.name,
    email:        user.email,
    role:         user.role,           // buyer | seller | admin | superadmin
    avatar:       resolveUrl(user.avatar) || "",
    phone:        user.phone        || "",
    location:     user.location     || "",
    bio:          user.bio          || "",
    sellerStatus: user.sellerStatus === "none" ? null : user.sellerStatus,
    isActive:     user.isActive,
    createdAt:    user.createdAt,
    // UI-only: sellers can switch to buyer view
    currentRole: currentRole || (user.role === "seller" ? "seller" : user.role),
  };
}

export function AuthProvider({ children }) {
  const [auth,    setAuthState] = useState(() => loadAuth());
  const [loading, setLoading]   = useState(!!loadToken()); // true while verifying token on mount

  // ── Persist auth object ───────────────────────────────────────
  const setAuth = useCallback((next) => {
    if (next) localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    else      clearSession();
    setAuthState(next);
  }, []);

  // ── Verify stored token on mount ──────────────────────────────
  useEffect(() => {
    const token = loadToken();
    if (!token) { setLoading(false); return; }

    authApi.getMe()
      .then(({ data }) => {
        const currentRole = loadAuth()?.currentRole;
        setAuthState(toAuthShape(data.user, currentRole));
      })
      .catch(() => {
        clearSession();
        setAuthState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── login ─────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    saveSession(data.token, toAuthShape(data.user));
    setAuthState(toAuthShape(data.user));
    return data.user;
  }, []);

  // ── register ──────────────────────────────────────────────────
  const register = useCallback(async (name, email, password, wantsSeller = false) => {
    const role = wantsSeller ? "seller" : "buyer";
    const { data } = await authApi.register({ name, email, password, role });
    saveSession(data.token, toAuthShape(data.user));
    setAuthState(toAuthShape(data.user));
    return data.user;
  }, []);

  // ── logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
    setAuthState(null);
  }, []);

  // ── switchRole — UI toggle (seller ↔ buyer view) ──────────────
  const switchRole = useCallback(() => {
    if (!auth) return;
    const next = auth.currentRole === "buyer" ? "seller" : "buyer";
    const updated = { ...auth, currentRole: next };
    setAuth(updated);
  }, [auth, setAuth]);

  // ── updateProfile — patch local state after API call ─────────
  const updateProfile = useCallback(async (fields) => {
    const { data } = await authApi.updateProfile(fields);
    const updated = toAuthShape(data.user, auth?.currentRole);
    setAuth(updated);
    return updated;
  }, [auth, setAuth]);

  // ── becomeSellerApply — calls API to save pending status + VendorProfile ──
  const becomeSellerApply = useCallback(async (formData = {}) => {
    if (!auth) return;
    const { data } = await authApi.becomeSeller(formData);
    const updated = toAuthShape(data.user, auth.currentRole);
    setAuth(updated);
    return updated;
  }, [auth, setAuth]);

  return (
    <AuthContext.Provider value={{
      auth,
      loading,
      login,
      register,
      logout,
      switchRole,
      updateProfile,
      becomeSellerApply,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
