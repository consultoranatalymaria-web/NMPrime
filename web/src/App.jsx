import React, { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

import PublicCatalog from "./pages/PublicCatalog.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";

import { clearToken, getToken } from "./authStore.js";

export default function App() {
  const [route, setRoute] = useState(
    () => window.location.hash || "#/catalogo"
  );

  const [token, setTokenState] = useState(() => getToken());

  useEffect(() => {
    const onHash = () =>
      setRoute(window.location.hash || "#/catalogo");

    window.addEventListener("hashchange", onHash);

    return () =>
      window.removeEventListener("hashchange", onHash);
  }, []);

  const isAuthed = Boolean(token);
  const agencyName = "NM Prime";

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <img
            src="/logo-imobiliaria.jpeg"
            alt={agencyName}
            style={{
              height: "40px",
              width: "auto",
              marginRight: "10px",
            }}
            onError={(e) => (e.target.style.display = "none")}
          />

          <div>
            <div className="brandTitle">{agencyName}</div>

            <div className="brandSub">
              Consultoria Imobiliária
            </div>
          </div>
        </div>

        <nav className="nav">
          <a className="navLink" href="#/catalogo">
            Catálogo
          </a>

          <a className="navLink" href="#/admin">
            CRM
          </a>

          {!isAuthed ? (
            <a className="navLink btnLink" href="#/login">
              Entrar
            </a>
          ) : (
            <button
              type="button"
              className="navLink btnLink"
              onClick={() => {
                clearToken();
                setTokenState("");
                window.location.hash = "#/login";
              }}
            >
              Sair
            </button>
          )}
        </nav>
      </header>

      <main className="content">
        {route === "#/login" && (
          <Login
            onLogin={(t) => {
              setTokenState(t);
              window.location.hash = "#/admin";
            }}
          />
        )}

        {route === "#/admin" && (
          <Admin
            token={token}
            onRequireLogin={() =>
              (window.location.hash = "#/login")
            }
          />
        )}

        {route !== "#/login" &&
          route !== "#/admin" && <PublicCatalog />}
      </main>

      <footer className="siteFooter">
        <div className="siteFooterInner">
          <span>{agencyName}</span>

          <span className="siteFooterMuted">
            © 2024 · Todos os direitos reservados
          </span>
        </div>
      </footer>

      {/* BOTÃO FLUTUANTE WHATSAPP */}
      <a
        href="https://wa.me/5515998090876?text=Vi%20o%20site%20da%20NM%20Prime%20e%20gostaria%20de%20mais%20informações."
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#25d366",
          color: "white",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "2px 2px 10px rgba(0,0,0,0.3)",
          zIndex: 9999,
          textDecoration: "none",
          fontSize: "32px",
          transition: "0.3s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "scale(1.1)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "scale(1)")
        }
      >
        <FaWhatsapp />
      </a>
    </div>
  );
}