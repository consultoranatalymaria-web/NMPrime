import React from "react";

export default function PropertyCard({ p, onClick }) {
  const cover = p.imageUrl;

  return (
    <button type="button" className="card" onClick={onClick}>
      <img
        className="thumb"
        src={cover}
        alt={p.title}
        loading="lazy"
        onError={(e) => {
          e.target.style.display = "none";
        }}
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