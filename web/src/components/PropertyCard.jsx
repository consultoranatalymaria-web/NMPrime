import React from "react";

export default function PropertyCard({ p, onClick }) {
const photos =
  typeof p.photos === "string"
    ? JSON.parse(p.photos || "[]")
    : p.photos;

let cover = null;

if (Array.isArray(p.photos) && p.photos.length > 0) {
  cover = p.photos[0];
} else if (typeof p.photos === "string") {
  try {
    const parsed = JSON.parse(p.photos);
    cover = parsed?.[0];
  } catch (e) {
    cover = null;
  }
}

cover = cover || p.imageUrl;
  return (
    <button type="button" className="card" onClick={onClick}>
      <img className="thumb" src={cover} alt={p.title} />
      <div className="cardBody">
        <div className="strong">{p.title}</div>
        <div className="muted">
          {p.neighborhood}, {p.city} - {p.state}
        </div>
        <div className="row">
          <div className="badge">{p.status === "for-sale" ? "Venda" : "Aluguel"}</div>
          <div className="price">
            R$ {new Intl.NumberFormat("pt-BR").format(p.price)}
            {p.status === "for-rent" ? " /mês" : ""}
          </div>
        </div>
      </div>
    </button>
  );
}
