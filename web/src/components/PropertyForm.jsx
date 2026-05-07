import React, { useEffect, useMemo, useState } from "react";
import { apiUpload } from "../api.js";

const SAMPLE =
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80";

function buildInit(initial) {
  const base = {
    title: "",
    description: "",
    state: "SP",
    city: "",
    neighborhood: "",
    status: "for-sale",
    type: "Apartamento",
    price: 0,
    beds: 0,
    baths: 0,
    areaSqm: 0,
    featured: false,
  };

  if (!initial) return { ...base, photos: [SAMPLE] };

  let photos = [];
  if (Array.isArray(initial.photos) && initial.photos.length > 0) photos = [...initial.photos];
  else if (initial.imageUrl) photos = [initial.imageUrl];

  if (!photos.length) photos = [SAMPLE];

  return {
    ...base,
    title: initial.title ?? "",
    description: initial.description ?? "",
    state: initial.state ?? "SP",
    city: initial.city ?? "",
    neighborhood: initial.neighborhood ?? "",
    status: initial.status ?? "for-sale",
    type: initial.type ?? "Apartamento",
    price: Number(initial.price ?? 0),
    beds: Number(initial.beds ?? 0),
    baths: Number(initial.baths ?? 0),
    areaSqm: Number(initial.areaSqm ?? 0),
    featured: Boolean(initial.featured),
    photos,
  };
}

export default function PropertyForm({ initial, token, onSubmit, onCancel }) {
  const init = useMemo(() => buildInit(initial), [initial]);

  const [v, setV] = useState(init);
  const [urlDraft, setUrlDraft] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setV(init);
    setUrlDraft("");
  }, [init]);

  function setField(k, val) {
    setV((x) => ({ ...x, [k]: val }));
  }

  async function handlePickFiles(files) {
    if (!token) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => apiUpload(f, token)));
      setV((x) => ({ ...x, photos: [...x.photos, ...urls] }));
    } catch (e) {
      alert(e.message || "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }

  function addUrl() {
    const u = urlDraft.trim();
    if (!u) return;
    try {
      new URL(u);
    } catch {
      alert("URL inválida.");
      return;
    }
    setV((x) => ({ ...x, photos: [...x.photos, u] }));
    setUrlDraft("");
  }

  function removePhoto(idx) {
    setV((x) => {
      const photos = x.photos.filter((_, i) => i !== idx);
      if (!photos.length) return { ...x, photos: [SAMPLE] };
      return { ...x, photos };
    });
  }

  function setCover(idx) {
    setV((x) => {
      if (idx <= 0) return x;
      const photos = [...x.photos];
      const item = photos.splice(idx, 1)[0];
      photos.unshift(item);
      return { ...x, photos };
    });
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const photos = Array.from(new Set(v.photos.map((s) => s.trim()))).filter(Boolean);
        const finalPhotos = photos.length ? photos : [SAMPLE];
        onSubmit({
          ...v,
          state: String(v.state).toUpperCase(),
          price: Number(v.price),
          beds: Number(v.beds),
          baths: Number(v.baths),
          areaSqm: Number(v.areaSqm),
          photos: finalPhotos,
        });
      }}
    >
      <label className="label">Fotos</label>
      <div className="photoHints muted">
        A primeira foto é a <strong className="textStrong">capa</strong> no catálogo. Envie arquivos ou cole URLs públicas (https…).
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        disabled={uploading || !token}
        className="input fileInput"
        onChange={(e) => {
          const files = [...(e.target.files || [])];
          e.target.value = "";
          handlePickFiles(files);
        }}
      />
      {!token && <div className="error inline">Faça login para habilitar upload.</div>}
      {uploading && <div className="muted">Enviando imagens…</div>}

      <div className="thumbGrid">
        {v.photos.map((src, idx) => (
          <div key={`${idx}-${src}`} className="thumbItem">
            <img src={src} alt="" className="thumbPreview" loading="lazy" />
            <div className="thumbActions">
              {idx !== 0 && (
                <button type="button" className="btn small" onClick={() => setCover(idx)}>
                  Capa
                </button>
              )}
              <button type="button" className="btn small danger" onClick={() => removePhoto(idx)}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cols urlRow">
        <input
          className="input"
          placeholder="Colar URL de uma foto"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button type="button" className="btn" onClick={addUrl}>
          Adicionar URL
        </button>
      </div>

      <label className="label">Título</label>
      <input className="input" value={v.title} onChange={(e) => setField("title", e.target.value)} />

      <label className="label">Descrição</label>
      <textarea className="input" rows={4} value={v.description} onChange={(e) => setField("description", e.target.value)} />

      <div className="cols">
        <div>
          <label className="label">UF</label>
          <input className="input" value={v.state} onChange={(e) => setField("state", e.target.value)} />
        </div>
        <div>
          <label className="label">Cidade</label>
          <input className="input" value={v.city} onChange={(e) => setField("city", e.target.value)} />
        </div>
      </div>

      <label className="label">Bairro</label>
      <input className="input" value={v.neighborhood} onChange={(e) => setField("neighborhood", e.target.value)} />

      <div className="cols">
        <div>
          <label className="label">Finalidade</label>
          <select className="input" value={v.status} onChange={(e) => setField("status", e.target.value)}>
            <option value="for-sale">Venda</option>
            <option value="for-rent">Aluguel</option>
          </select>
        </div>
        <div>
          <label className="label">Tipo</label>
          <input className="input" value={v.type} onChange={(e) => setField("type", e.target.value)} />
        </div>
      </div>

      <div className="cols">
        <div>
          <label className="label">Preço (R$)</label>
          <input className="input" type="number" value={v.price} onChange={(e) => setField("price", e.target.value)} />
        </div>
        <div>
          <label className="label">Área (m²)</label>
          <input className="input" type="number" value={v.areaSqm} onChange={(e) => setField("areaSqm", e.target.value)} />
        </div>
      </div>

      <div className="cols">
        <div>
          <label className="label">Quartos</label>
          <input className="input" type="number" value={v.beds} onChange={(e) => setField("beds", e.target.value)} />
        </div>
        <div>
          <label className="label">Banheiros</label>
          <input className="input" type="number" value={v.baths} onChange={(e) => setField("baths", e.target.value)} />
        </div>
      </div>

      <label className="check">
        <input type="checkbox" checked={v.featured} onChange={(e) => setField("featured", e.target.checked)} />
        Destaque
      </label>

      <div className="rowEnd">
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn primary">
          Salvar
        </button>
      </div>
    </form>
  );
}
