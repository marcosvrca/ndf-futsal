(() => {
  function syncThemeButtons(theme) {
    document.querySelectorAll("[data-theme-set]").forEach((btn) => {
      const active = btn.getAttribute("data-theme-set") === theme;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setTheme(theme, { persist = true, updateUrl = true } = {}) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    syncThemeButtons(next);
    if (persist) localStorage.setItem("ndf-theme", next);
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("theme", next);
      window.history.replaceState({}, "", url);
    }
  }

  const initialTheme =
    new URLSearchParams(window.location.search).get("theme") ||
    localStorage.getItem("ndf-theme") ||
    "dark";
  setTheme(initialTheme, { persist: true, updateUrl: false });

  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setTheme(btn.getAttribute("data-theme-set"));
    });
  });

  // Guarda unidade + tema e abre o cadastro (sessionStorage evita perder o contexto)
  document.querySelectorAll(".unit-card").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const theme = document.documentElement.getAttribute("data-theme") || "dark";
      const url = new URL(link.href, window.location.href);
      const unidade = (url.searchParams.get("unidade") || "").trim().toLowerCase();
      if (unidade) {
        try {
          sessionStorage.setItem("ndf-unidade", unidade);
        } catch (_) {
          /* ignore */
        }
      }
      url.searchParams.set("theme", theme);
      if (unidade) url.searchParams.set("unidade", unidade);
      // Usa /cadastro (sem .html) para não perder a query no redirect cleanUrls do serve
      const path = url.pathname.replace(/cadastro\.html$/i, "cadastro");
      window.location.assign(path + "?" + url.searchParams.toString());
    });
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );
  nodes.forEach((node) => observer.observe(node));
})();
