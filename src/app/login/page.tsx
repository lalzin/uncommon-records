"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { session, type SessionUser } from "@/lib/clientAuth";

interface LoginResponse {
  token: string;
  user: SessionUser;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/auth/login", { email, password });
      session.set(res.token, res.user, remember);
      router.push(res.user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/artist");
    } catch (err) {
      setError((err as Error).message || "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: "5rem" }}>
      <div className="badge">Espace pro</div>
      <h1 className="display-md" style={{ margin: "1rem 0 2rem" }}>
        Connexion
      </h1>
      <form onSubmit={onSubmit} className="surface" style={{ padding: "1.75rem" }}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem", marginBottom: "1rem" }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Se souvenir de moi
        </label>
        {error && (
          <p style={{ color: "#ff8a8a", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
        )}
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
