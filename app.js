"use strict";
(() => {
  const style = document.createElement("style");
  style.textContent = `
    .splash-screen,.scheme-background{display:none!important}
    .tree-viewport{
      position:relative!important;
      isolation:isolate!important;
      background:radial-gradient(circle at 50% 8%,rgba(126,34,206,.16),transparent 34rem),linear-gradient(180deg,#120a1d,#09060f)!important
    }
    .tree-viewport::before,.tree-viewport::after{display:none!important}
    .forest{position:relative!important;z-index:1!important}
  `;
  document.head.append(style);

  const removeBackground = () => {
    document.getElementById("splashScreen")?.remove();
    document.getElementById("schemeBackground")?.remove();
    document.documentElement.style.removeProperty("--hero-bg");
  };

  removeBackground();

  const observer = new MutationObserver(removeBackground);
  observer.observe(document.body, { childList: true, subtree: true });

  const core = document.createElement("script");
  core.src = "app-core.js?v=20260731-1235";
  core.onload = () => {
    removeBackground();
    setTimeout(removeBackground, 50);
    setTimeout(removeBackground, 500);
    setTimeout(() => observer.disconnect(), 5000);
  };
  core.onerror = () => {
    observer.disconnect();
    const status = document.getElementById("saveStatus");
    if (status) {
      status.textContent = "Erreur de chargement du moteur";
      status.className = "save-status error";
    }
  };
  document.head.append(core);
})();
