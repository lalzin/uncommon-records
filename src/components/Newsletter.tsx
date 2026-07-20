"use client";

import { useState } from "react";
import { api } from "@/lib/apiClient";
import { toast } from "@/lib/toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/events/newsletter-subscribe", { email: email.trim() });
      toast.success("Inscription newsletter prise en compte");
      setEmail("");
    } catch (err) {
      toast.error((err as Error).message || "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={subscribe}
      style={{ display: "flex", gap: "0.5rem", maxWidth: 420, marginTop: "1rem", flexWrap: "wrap" }}
    >
      <input
        className="form-input"
        type="email"
        placeholder="votre@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ flex: 1, minWidth: 200 }}
      />
      <button className="btn btn-outline" disabled={loading}>
        {loading ? "…" : "S'inscrire"}
      </button>
    </form>
  );
}
