import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.detail || "Registration failed. Try a different username/email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-void relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow" />
      <form onSubmit={submit} className="relative glass-panel w-full max-w-sm p-8 flex flex-col gap-3">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Sparkles className="text-gold" />
          <h1 className="font-display text-2xl font-bold">
            Cosmo <span className="text-gold">AI</span>
          </h1>
        </div>
        <p className="text-center text-mist text-sm mb-2">Create your account — no shared logins here.</p>

        <input
          className="glass-input"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="glass-input"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="email"
          className="glass-input"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          className="glass-input"
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
        />

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <button disabled={loading} className="gold-btn mt-2">
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-xs text-mist">
          Already have an account? <Link to="/login" className="text-gold hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
