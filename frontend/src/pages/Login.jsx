import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username_or_email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form.username_or_email, form.password);
      navigate("/");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-void relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow" />
      <form onSubmit={submit} className="relative glass-panel w-full max-w-sm p-8 flex flex-col gap-4">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Sparkles className="text-gold" />
          <h1 className="font-display text-2xl font-bold">
            Cosmo <span className="text-gold">AI</span>
          </h1>
        </div>
        <p className="text-center text-mist text-sm mb-2">Welcome back. Sign in to continue.</p>

        <input
          className="glass-input"
          placeholder="Username or email"
          value={form.username_or_email}
          onChange={(e) => setForm({ ...form, username_or_email: e.target.value })}
          required
        />
        <input
          type="password"
          className="glass-input"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <button disabled={loading} className="gold-btn mt-2">
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-xs text-mist">
          New to Cosmo? <Link to="/register" className="text-gold hover:underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
