import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "../api.js";
import PropertyForm from "../components/PropertyForm.jsx";

export default function Admin({ token, onRequireLogin }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setError("");
    setLoading(true);
    try {
      if (!token) return onRequireLogin();
      const data = await apiGet("/admin/properties", token);
      setItems(data);
    } catch (e) {
      if (String(e.message || "").toLowerCase().includes("token")) onRequireLogin();
      setError(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const stats = useMemo(() => {
    const total = items.length;
    const venda = items.filter((x) => x.status === "for-sale").length;
    const aluguel = items.filter((x) => x.status === "for-rent").length;
    return { total, venda, aluguel };
  }, [items]);

  async function remove(id) {
    if (!confirm("Excluir este imóvel?")) return;
    try {
      await apiSend("DELETE", `/admin/properties/${id}`, null, token);
      await load();
    } catch (e) {
      alert(e.message || "Erro ao excluir");
    }
  }

  return (
    <div className="crm">
      <div className="crmHeader">
        <div>
          <h2>CRM — Imóveis</h2>
          <div className="muted">Criar, editar ou excluir imóveis e fotos.</div>
        </div>
        <button type="button" className="btn" onClick={() => setCreating(true)}>
          + Novo imóvel
        </button>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="muted">Total</div>
          <div className="kpiVal">{stats.total}</div>
        </div>
        <div className="kpi">
          <div className="muted">Venda</div>
          <div className="kpiVal">{stats.venda}</div>
        </div>
        <div className="kpi">
          <div className="muted">Aluguel</div>
          <div className="kpiVal">{stats.aluguel}</div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? (
        <div className="muted">Carregando…</div>
      ) : (
        <div className="table">
          <div className="tr th">
            <div>ID</div>
            <div>Título</div>
            <div>Local</div>
            <div>Finalidade</div>
            <div>Preço</div>
            <div>Ações</div>
          </div>
          {items.map((p) => (
            <div key={p.id} className="tr">
              <div>#{p.id}</div>
              <div className="strong">{p.title}</div>
              <div>
                {p.city} - {p.state}
              </div>
              <div>{p.status === "for-sale" ? "Venda" : "Aluguel"}</div>
              <div>R$ {new Intl.NumberFormat("pt-BR").format(p.price)}</div>
              <div className="actions">
                <button type="button" className="btn small" onClick={() => setEditing(p)}>
                  Editar
                </button>
                <button type="button" className="btn small danger" onClick={() => remove(p.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <div className="modalBack">
          <div className="modal">
            <div className="modalHeader">
              <div className="strong">{creating ? "Novo imóvel" : `Editar imóvel #${editing.id}`}</div>
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Fechar
              </button>
            </div>

            <PropertyForm
              initial={editing}
              token={token}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
              }}
              onSubmit={async (payload) => {
                try {
                  if (creating) {
                    await apiSend("POST", "/admin/properties", payload, token);
                  } else {
                    await apiSend("PUT", `/admin/properties/${editing.id}`, payload, token);
                  }
                  setCreating(false);
                  setEditing(null);
                  await load();
                } catch (e) {
                  alert(e.message || "Erro ao salvar");
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
