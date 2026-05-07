import React, { useEffect, useState } from "react";
import PublicCatalog from "./pages/PublicCatalog.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import { clearToken, getToken } from "./authStore.js";

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || "#/catalogo");
  const [token, setTokenState] = useState(() => getToken());

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/catalogo");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const isAuthed = Boolean(token);

  // Nome da sua imobiliária para mudar em um só lugar
  const agencyName = "NM Prime"; 

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          {/* AQUI ESTÁ A LOGO: Ela busca o arquivo logo-imobiliaria.jpeg na pasta public */}
          <img 
            src="/logo-imobiliaria.jpeg" 
            alt={agencyName} 
            style={{ height: '40px', width: 'auto', marginRight: '10px' }} 
            onError={(e) => e.target.style.display = 'none'} // Esconde se a imagem não existir
          />
          <div>
            <div className="brandTitle">{agencyName}</div>
            <div className="brandSub">Consultoria Imobiliária</div>
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
          <Admin token={token} onRequireLogin={() => (window.location.hash = "#/login")} />
        )}
        {route !== "#/login" && route !== "#/admin" && <PublicCatalog />}
      </main>

      <footer className="siteFooter">
        <div className="siteFooterInner">
          <span>{agencyName}</span>
          <span className="siteFooterMuted">© 2024 · Todos os direitos reservados</span>
        </div>
      </footer>
    </div>
  );
}
