(() => {
  const supported = ["en", "es", "fr", "de", "pt-br"];
  const commonCopy = {
    en: { navPrivacy: "Privacy", navTerms: "Terms", print: "Print", readIn: "Read in", onThisPage: "On this page", support: "Support", backToTop: "Back to top", legalDocuments: "Legal documents", chooseLanguage: "Choose document language", languages: "Languages", footerNavigation: "Footer navigation", useLightTheme: "Use light theme", useDarkTheme: "Use dark theme", lightTheme: "Light theme", darkTheme: "Dark theme" },
    es: { navPrivacy: "Privacidad", navTerms: "Condiciones", print: "Imprimir", readIn: "Leer en", onThisPage: "En esta página", support: "Soporte", backToTop: "Volver arriba", legalDocuments: "Documentos legales", chooseLanguage: "Elegir el idioma del documento", languages: "Idiomas", footerNavigation: "Navegación del pie de página", useLightTheme: "Usar tema claro", useDarkTheme: "Usar tema oscuro", lightTheme: "Tema claro", darkTheme: "Tema oscuro" },
    fr: { navPrivacy: "Confidentialité", navTerms: "Conditions", print: "Imprimer", readIn: "Lire en", onThisPage: "Sur cette page", support: "Assistance", backToTop: "Retour en haut", legalDocuments: "Documents juridiques", chooseLanguage: "Choisir la langue du document", languages: "Langues", footerNavigation: "Navigation du pied de page", useLightTheme: "Utiliser le thème clair", useDarkTheme: "Utiliser le thème sombre", lightTheme: "Thème clair", darkTheme: "Thème sombre" },
    de: { navPrivacy: "Datenschutz", navTerms: "Bedingungen", print: "Drucken", readIn: "Lesen auf", onThisPage: "Auf dieser Seite", support: "Support", backToTop: "Nach oben", legalDocuments: "Rechtliche Dokumente", chooseLanguage: "Dokumentsprache auswählen", languages: "Sprachen", footerNavigation: "Fußzeilennavigation", useLightTheme: "Helles Design verwenden", useDarkTheme: "Dunkles Design verwenden", lightTheme: "Helles Design", darkTheme: "Dunkles Design" },
    "pt-br": { navPrivacy: "Privacidade", navTerms: "Termos", print: "Imprimir", readIn: "Ler em", onThisPage: "Nesta página", support: "Suporte", backToTop: "Voltar ao topo", legalDocuments: "Documentos jurídicos", chooseLanguage: "Escolher o idioma do documento", languages: "Idiomas", footerNavigation: "Navegação do rodapé", useLightTheme: "Usar tema claro", useDarkTheme: "Usar tema escuro", lightTheme: "Tema claro", darkTheme: "Tema escuro" }
  };
  const documentCopy = {
    privacy: {
      en: { title: "Privacy Policy" },
      es: { title: "Política de Privacidad" },
      fr: { title: "Politique de confidentialité" },
      de: { title: "Datenschutzrichtlinie" },
      "pt-br": { title: "Política de Privacidade" }
    },
    terms: {
      en: { title: "Terms of Service" },
      es: { title: "Condiciones del Servicio" },
      fr: { title: "Conditions d’utilisation" },
      de: { title: "Nutzungsbedingungen" },
      "pt-br": { title: "Termos de Serviço" }
    }
  };
  const root = document.documentElement;
  const sections = Array.from(document.querySelectorAll(".lang-section"));
  const languageButtons = Array.from(document.querySelectorAll("[data-lang]"));
  const tocNav = document.querySelector("[data-toc]");
  const progress = document.querySelector(".progress");
  const topButton = document.querySelector(".back-to-top");
  const themeButton = document.querySelector("[data-theme-toggle]");
  const printButton = document.querySelector("[data-print]");
  let observer;
  let currentLanguage = "en";

  const browserLanguage = (navigator.language || "en").toLowerCase();
  const queryLanguage = new URLSearchParams(location.search).get("lang")?.toLowerCase();
  const oldHashLanguage = supported.includes(location.hash.slice(1).toLowerCase())
    ? location.hash.slice(1).toLowerCase()
    : null;
  const savedLanguage = localStorage.getItem("imposter-legal-language");
  const initialLanguage = supported.includes(queryLanguage)
    ? queryLanguage
    : supported.includes(oldHashLanguage)
      ? oldHashLanguage
      : supported.includes(savedLanguage)
        ? savedLanguage
        : browserLanguage.startsWith("pt")
          ? "pt-br"
          : supported.find((code) => browserLanguage.startsWith(code)) || "en";

  function updateDocumentLinks(language) {
    document.querySelectorAll("[data-document-link]").forEach((link) => {
      const url = new URL(link.getAttribute("href"), location.href);
      url.searchParams.set("lang", language);
      link.setAttribute("href", `${url.pathname.split("/").pop()}?${url.searchParams.toString()}`);
    });
  }

  function applyTranslations(language) {
    const documentType = document.body.dataset.document || "privacy";
    const copy = { ...commonCopy[language], ...documentCopy[documentType][language] };
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = copy[element.dataset.i18n];
      if (value) element.textContent = value;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      const value = copy[element.dataset.i18nAria];
      if (value) element.setAttribute("aria-label", value);
    });
    document.title = copy.title;
    updateThemeLabel(language);
  }

  function updateThemeLabel(language = currentLanguage) {
    if (!themeButton) return;
    const copy = commonCopy[language] || commonCopy.en;
    const isLight = root.dataset.theme === "light";
    themeButton.setAttribute("aria-label", isLight ? copy.useDarkTheme : copy.useLightTheme);
    themeButton.title = isLight ? copy.darkTheme : copy.lightTheme;
  }

  function rebuildToc(activeSection) {
    if (!tocNav) return;
    tocNav.replaceChildren();
    const targets = Array.from(activeSection.querySelectorAll("[data-section]"));
    targets.forEach((target) => {
      const heading = target.querySelector("h2");
      if (!heading) return;
      const link = document.createElement("a");
      link.href = `#${target.id}`;
      link.textContent = heading.textContent.trim();
      tocNav.append(link);
    });

    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        tocNav.querySelectorAll("a").forEach((link) => {
          link.classList.toggle("active", link.hash === `#${visible.target.id}`);
        });
      },
      { rootMargin: "-18% 0px -66% 0px", threshold: [0, 0.25, 0.6] }
    );
    targets.forEach((target) => observer.observe(target));
  }

  function setLanguage(language, updateUrl = true) {
    const next = supported.includes(language) ? language : "en";
    currentLanguage = next;
    let activeSection;
    sections.forEach((section) => {
      const active = section.dataset.language === next;
      section.hidden = !active;
      if (active) activeSection = section;
    });
    languageButtons.forEach((button) => {
      const active = button.dataset.lang === next;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    root.lang = next === "pt-br" ? "pt-BR" : next;
    localStorage.setItem("imposter-legal-language", next);
    applyTranslations(next);
    updateDocumentLinks(next);
    if (activeSection) rebuildToc(activeSection);

    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set("lang", next);
      if (supported.includes(url.hash.slice(1).toLowerCase())) url.hash = "";
      history.replaceState(null, "", url);
    }
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });

  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem("imposter-legal-theme", theme);
    if (themeButton) {
      const isLight = theme === "light";
      themeButton.textContent = isLight ? "☾" : "☀";
      updateThemeLabel();
    }
  }

  const savedTheme = localStorage.getItem("imposter-legal-theme");
  const initialTheme = savedTheme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  setTheme(initialTheme);
  themeButton?.addEventListener("click", () => setTheme(root.dataset.theme === "light" ? "dark" : "light"));
  printButton?.addEventListener("click", () => window.print());
  topButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  function updateScrollUi() {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    const ratio = scrollable > 0 ? scrollY / scrollable : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    topButton?.classList.toggle("visible", scrollY > 520);
  }

  addEventListener("scroll", updateScrollUi, { passive: true });
  addEventListener("resize", updateScrollUi);
  setLanguage(initialLanguage, Boolean(queryLanguage || oldHashLanguage));
  updateScrollUi();
})();
