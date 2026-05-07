import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api.js";
import PropertyCard from "../components/PropertyCard.jsx";

export default function PublicCatalog() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ q: "", state: "all", city: "all" });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filters.q) qs.set("q", filters.q);
      if (filters.state !== "all") qs.set("state", filters.state);
      if (filters.city !== "all") qs.set("city", filters.city);

      const data = await apiGet(`/properties?${qs.toString()}`);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.state, filters.city]);

  const states = useMemo(() => {
    return Array.from(new Set(items.map((x) => x.state))).sort();
  }, [items]);

  const cities = useMemo(() => {
    const base = filters.state === "all" ? items : items.filter((x) => x.state === filters.state);
    return Array.from(new Set(base.map((x) => x.city))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items, filters.state]);

  const galleryPhotos = useMemo(() => {
    if (!selected) return [];
    if (Array.isArray(selected.photos) && selected.photos.length) return selected.photos;
    return selected.imageUrl ? [selected.imageUrl] : [];
  }, [selected]);

  useEffect(() => {
    setGalleryIdx(0);
  }, [selected?.id]);

  const mainPhoto = galleryPhotos[galleryIdx] || "";

  return (
    <div className="catalog">
      <div className="catalogHeader">
        <div>
          <h2>Catálogo de imóveis (Brasil)</h2>
          <div className="muted">Clique em um imóvel para ver detalhes e fotos.</div>
        </div>
      </div>

      <div className="filtersRow">
        <input
          className="input"
          placeholder="Buscar por título, bairro, cidade…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          className="input"
          value={filters.state}
          onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value, city: "all" }))}
        >
          <option value="all">Todos os estados</option>
          {states.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>

        <select className="input" value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}>
          <option value="all">Todas as cidades</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="muted">Carregando…</div>
      ) : (
        <div className="grid">
          {items.map((p) => (
            <PropertyCard key={p.id} p={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      )}

      {selected && (
        <div className="modalBack" onMouseDown={() => setSelected(null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="strong">{selected.title}</div>
              <button type="button" className="btn small" onClick={() => setSelected(null)}>
                Fechar
              </button>
            </div>
            {galleryPhotos.length > 1 && (
              <div className="galleryTop">
                <button
                  type="button"
                  className="btn small"
                  onClick={() => setGalleryIdx((i) => (i - 1 + galleryPhotos.length) % galleryPhotos.length)}
                  aria-label="Foto anterior"
                >
                  ‹
                </button>
                <div className="galleryCount muted">
                  {galleryIdx + 1} / {galleryPhotos.length}
                </div>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => setGalleryIdx((i) => (i + 1) % galleryPhotos.length)}
                  aria-label="Próxima foto"
                >
                  ›
                </button>
              </div>
            )}

            {mainPhoto ? (
              <img className="heroImg" src={mainPhoto} alt={`${selected.title} — foto ${galleryIdx + 1}`} />
            ) : null}

            {galleryPhotos.length > 1 && (
              <div className="thumbStrip">
                {galleryPhotos.map((src, i) => (
                  <button
                    key={`${selected.id}-${i}`}
                    type="button"
                    className={`thumbBtn ${i === galleryIdx ? "active" : ""}`}
                    onClick={() => setGalleryIdx(i)}
                    aria-label={`Miniatura ${i + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            <div className="muted">
              {selected.neighborhood}, {selected.city} - {selected.state}
            </div>
            <div className="strong price">
              R$ {new Intl.NumberFormat("pt-BR").format(selected.price)}
              {selected.status === "for-rent" ? " / mês" : ""}
            </div>
            <p>{selected.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
