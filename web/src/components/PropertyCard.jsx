import React from "react";

export default function PropertyCard({ p, onClick }) {
  // normaliza photos (pode vir string ou array)
  let photos = [];

  if (typeof p.photos === "string") {
    try {
      photos = JSON.parse(p.photos || "[]");
    } catch (e) {
      photos = [];
    }
  } else if (Array.isArray(p.photos)) {
    photos = p.photos;
  }

  // imagem principal
  const cover = photos[0] || p.imageUrl || "";

  return (
    <button type="button" className="card" onClick={onClick}>
      <img
        className="thumb"
        src={cover}
        alt={p.title}
        loading="lazy"
      />

      <div className="cardBody">
        <div className="strong">{p.title}</div>

        <div className="muted">
          {p.neighborhood}, {p.city} - {p.state}
        </div>

        <div className="row">
          <div className="badge">
            {p.status === "for-sale" ? "Venda" : "Aluguel"}
          </div>

          <div className="price">
            R$ {new Intl.NumberFormat("pt-BR").format(p.price)}
            {p.status === "for-rent" ? " /mês" : ""}
          </div>
        </div>
      </div>
    </button>
  );
}