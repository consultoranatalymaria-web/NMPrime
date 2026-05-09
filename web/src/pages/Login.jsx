import React, { useState } from "react";
import { apiSend } from "../api.js";
import { setToken } from "../authStore.js";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiSend("POST", "/auth/login", { email, password });
      setToken(data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Login do dono (admin)</h2>
      <p className="muted">Somente usuários autorizados podem editar o catálogo.</p>

      <form className="form" onSubmit={submit}>
        <label className="label">Email</label>
        <input className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="label">Senha</label>
        <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <div className="error">{error}</div>}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
