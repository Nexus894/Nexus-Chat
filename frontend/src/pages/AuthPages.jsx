/**
 * Auth Pages — Login & Register
 * Clean, modern auth UI with animated background
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Shared Auth Layout ────────────────────────────────────
const AuthLayout = ({ children, title, subtitle }) => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-primary)",
    position: "relative",
    overflow: "hidden",
  }}>
    {/* Animated background orbs */}
    <div style={{
      position: "absolute", top: "10%", left: "15%",
      width: 400, height: 400,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
      animation: "auraGlow 4s ease-in-out infinite",
    }} />
    <div style={{
      position: "absolute", bottom: "15%", right: "10%",
      width: 300, height: 300,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
      animation: "auraGlow 6s ease-in-out infinite reverse",
    }} />

    {/* Card */}
    <div style={{
      width: "100%", maxWidth: 440,
      margin: "0 20px",
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      padding: "40px",
      position: "relative",
      zIndex: 1,
      boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 52, height: 52,
          background: "var(--accent)",
          borderRadius: 16,
          fontSize: 24,
          marginBottom: 16,
          boxShadow: "var(--accent-glow)",
        }}>⚡</div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)" }}>
          {title}
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: "0.9rem" }}>
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  </div>
);

// ── Login Page ────────────────────────────────────────────
export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to NexusChat">
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 6 }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 6 }}>
              Password
            </label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171", borderRadius: "var(--radius-md)", padding: "10px 14px",
              fontSize: "0.85rem",
            }}>{error}</div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : "Sign In"}
          </button>
        </div>
      </form>

      <p style={{ textAlign: "center", marginTop: 24, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        No account?{" "}
        <button onClick={() => navigate("/register")}
          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>
          Create one
        </button>
      </p>
    </AuthLayout>
  );
};

// ── Register Page ─────────────────────────────────────────
export const RegisterPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    setLoading(true);
    try {
      await signup(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Join NexusChat" subtitle="Create your account in seconds">
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 6 }}>
                Username
              </label>
              <input className="input" type="text" placeholder="cooluser42"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required minLength={3} maxLength={20} />
            </div>
            <div>
              <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 6 }}>
                Display Name
              </label>
              <input className="input" type="text" placeholder="Cool User"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                maxLength={30} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 6 }}>
              Email
            </label>
            <input className="input" type="email" placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 6 }}>
              Password
            </label>
            <input className="input" type="password" placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required minLength={6} />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171", borderRadius: "var(--radius-md)", padding: "10px 14px",
              fontSize: "0.85rem",
            }}>{error}</div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : "Create Account"}
          </button>
        </div>
      </form>

      <p style={{ textAlign: "center", marginTop: 24, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        Already have an account?{" "}
        <button onClick={() => navigate("/login")}
          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
};
