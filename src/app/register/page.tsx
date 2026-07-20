"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { session, type SessionUser } from "@/lib/clientAuth";

interface RegisterResponse {
  token: string;
  user: SessionUser;
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const emailFromLink = params.get("email") || "";

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailFromLink);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError("Lien d'invitation manquant.");
      setChecking(false);
      return;
    }
    const qs = new URLSearchParams({ token });
    if (emailFromLink) qs.set("email", emailFromLink);
    api
      .get<{ valid: boolean; email: string | null; error?: string }>(
        `/auth/invite/validate?${qs.toString()}`,
      )
      .then((d) => {
        setValid(d.valid);
        if (d.email) setEmail(d.email);
      })
      .catch((e) => setValidationError((e as Error).message || "Invitation invalide"))
      .finally(() => setChecking(false));
  }, [token, emailFromLink]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<RegisterResponse>("/auth/register", {
        token,
        name,
        email,
        password,
      });
      session.set(res.token, res.user);
      router.push(res.user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/artist");
    } catch (err) {
      setError((err as Error).message || "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <p className="text-muted">Vérification de l&apos;invitation…</p>;
  if (!valid)
    return (
      <p style={{ color: "#ff8a8a" }}>{validationError || "Invitation invalide ou expirée."}</p>
    );

  return (
    <form onSubmit={onSubmit} className="surface" style={{ padding: "1.75rem" }}>
      <div className="form-group">
        <label className="form-label">Nom</label>
        <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          className="form-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={!!emailFromLink}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label">Mot de passe (8 caractères min.)</label>
        <input
          className="form-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      {error && <p style={{ color: "#ff8a8a", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>}
      <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
        {loading ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: "5rem" }}>
      <div className="badge">Invitation</div>
      <h1 className="display-md" style={{ margin: "1rem 0 2rem" }}>
        Créer un compte
      </h1>
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
