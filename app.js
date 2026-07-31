"use strict";
(() => {
  const EMPTY = new Set(["", "Nom à définir", "Fonction à définir", "Poste à définir", "Nouvelle case", "Nouveau poste", "Nouvelle personne", "Nouveau joueur"]);
  const clean = value => typeof value === "string" ? value.trim() : "";
  const visible = value => { const text = clean(value); return EMPTY.has(text) ? "" : text; };
  const player = raw => {
    if (typeof raw === "string") {
      const name = clean(raw);
      return { post: "", name: /^Joueur\s+\d+$/i.test(name) ? "" : name };
    }
    raw = raw && typeof raw === "object" ? raw : {};
    return { post: clean(raw.post), name: clean(raw.name) };
  };

  document.getElementById("splashScreen")?.remove();
  document.getElementById("schemeBackground")?.remove();

  const style = document.createElement("style");
  style.textContent = `
    .splash-screen,.scheme-background{display:none!important}
    .tree-viewport{position:relative!important;isolation:isolate!important;background:radial-gradient(circle at 50% 8%,rgba(126,34,206,.18),transparent 32rem),linear-gradient(180deg,#120a1d,#09060f)!important}
    .tree-viewport::before,.tree-viewport::after{display:none!important}
    .forest{position:relative!important;z-index:1!important}
    body.client-view .forest{gap:8px!important;padding:10px 4px 130px!important;align-items:flex-start!important}
    body.client-view .forest>.branch{margin-inline:8px!important}
    body.client-view .branch{min-width:132px!important}
    body.client-view .children{position:relative!important;display:flex!important;flex-direction:row!important;align-items:flex-start!important;justify-content:center!important;gap:2px!important;padding-top:66px!important}
    body.client-view .forest>.branch>.children{gap:16px!important}
    body.client-view .children::before{content:""!important;position:absolute!important;top:31px!important;left:50%!important;width:calc(100% - 132px)!important;min-width:2px!important;height:2px!important;transform:translateX(-50%)!important;background:#a855f7!important;opacity:1!important}
    body.client-view .children::after{content:""!important;position:absolute!important;top:0!important;left:50%!important;width:2px!important;height:33px!important;transform:translateX(-50%)!important;background:#a855f7!important;opacity:1!important}
    body.client-view .children>.branch::before{content:""!important;position:absolute!important;top:-35px!important;left:50%!important;width:2px!important;height:36px!important;transform:translateX(-50%)!important;background:#a855f7!important;opacity:1!important}
    body.client-view .visitor-card{width:126px!important;min-height:76px!important;padding:7px 5px!important;gap:2px!important;border-radius:9px!important;text-align:center!important;background:color-mix(in srgb,var(--card-a) 18%,rgba(12,8,18,.94))!important}
    body.client-view .visitor-card.root{width:154px!important}
    body.client-view .visitor-box-title{font-size:.68rem!important;font-weight:950!important;line-height:1.06!important}
    body.client-view .visitor-function{font-size:.59rem!important;line-height:1.06!important}
    body.client-view .visitor-name{font-size:.59rem!important;line-height:1.08!important}
    body.client-view .visitor-players{display:grid!important;gap:2px!important;width:100%!important;margin-top:3px!important;padding-top:3px!important;border-top:1px solid rgba(255,255,255,.20)!important}
    body.client-view .visitor-player-item{display:block!important;padding:3px!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:5px!important;background:rgba(0,0,0,.24)!important}
    body.client-view .visitor-player-post{display:block!important;color:color-mix(in srgb,var(--card-a) 58%,white)!important;font-size:.53rem!important;font-weight:850!important;line-height:1.05!important}
    body.client-view .visitor-player-name{display:block!important;margin-top:1px!important;color:#fff!important;font-size:.56rem!important;font-weight:760!important;line-height:1.06!important}
    .player-fields{display:grid!important;gap:5px!important}
    .players{grid-template-columns:1fr!important}
    #editCurrentButton{border-color:rgba(59,130,246,.62)!important;background:linear-gradient(135deg,#1d4ed8,#3b82f6)!important;font-weight:800!important}
    @media(max-width:850px){body.client-view .forest>.branch{margin-inline:4px!important}body.client-view .branch{min-width:118px!important}body.client-view .visitor-card{width:114px!important}body.client-view .visitor-card.root{width:140px!important}body.client-view .children::before{width:calc(100% - 118px)!important}body.client-view .forest>.branch>.children{gap:8px!important}}
  `;
  document.head.append(style);
  document.body.classList.add("client-view");

  const nativeFetch = window.fetch.bind(window);
  let releaseData;
  const dataGate = new Promise(resolve => { releaseData = resolve; });
  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    const url = String(args[0] instanceof Request ? args[0].url : args[0]);
    if (url.includes("data.json")) await dataGate;
    return response;
  };

  const core = document.createElement("script");
  core.src = "app-core.js?v=20260731-1255";
  core.onload = () => {
    const baseNormalizeNode = normalizeNode;
    normalizeNode = function(raw, used) {
      const node = baseNormalizeNode(raw, used);
      node.holderName = typeof raw?.holderName === "string" ? raw.holderName : "";
      node.players = Array.isArray(raw?.players) ? raw.players.slice(0, 200).map(player) : [];
      return node;
    };

    updatePlayerCount = function(node, value) {
      if (!isAdmin) return;
      let count = parseInt(value, 10);
      count = Number.isFinite(count) ? Math.max(0, Math.min(200, count)) : 0;
      while (node.players.length < count) node.players.push({ post: "", name: "" });
      if (node.players.length > count) node.players.splice(count);
      saveDraft();
      render();
    };

    renderPlayers = function(node) {
      if (!node.players.length) {
        const empty = document.createElement("div");
        empty.className = "players-empty";
        empty.textContent = "0 joueur dans cette case";
        return empty;
      }
      const list = document.createElement("div");
      list.className = "players";
      node.players.forEach((raw, index) => {
        const entry = player(raw);
        node.players[index] = entry;
        const row = document.createElement("div");
        row.className = "player-row admin-player-row";
        const number = document.createElement("div");
        number.className = "player-number";
        number.textContent = String(index + 1).padStart(2, "0");
        const fields = document.createElement("div");
        fields.className = "player-fields";
        fields.append(
          textInput("player-post-input", entry.post, "Poste du joueur", value => entry.post = value),
          textInput("player-name-input", entry.name, "Nom du joueur", value => entry.name = value)
        );
        row.append(number, fields);
        list.append(row);
      });
      return list;
    };

    const append = (parent, className, value) => {
      const text = visible(value);
      if (!text) return;
      const line = document.createElement("div");
      line.className = className;
      line.textContent = text;
      parent.append(line);
    };

    renderVisitorNode = function(node, isRoot) {
      const branch = document.createElement("div");
      branch.className = "branch";
      const card = document.createElement("article");
      card.className = "node-card visitor-card" + (isRoot ? " root" : "");
      card.dataset.color = node.color;
      append(card, "visitor-box-title", node.boxTitle);
      append(card, "visitor-function", node.roleTitle);
      append(card, "visitor-name", node.holderName);

      const entries = (node.players || []).map(player).filter(item => visible(item.post) || visible(item.name));
      if (entries.length) {
        const list = document.createElement("div");
        list.className = "visitor-players";
        entries.forEach(entry => {
          const row = document.createElement("div");
          row.className = "visitor-player-item";
          append(row, "visitor-player-post", entry.post);
          append(row, "visitor-player-name", entry.name);
          if (row.childElementCount) list.append(row);
        });
        if (list.childElementCount) card.append(list);
      }

      branch.append(card);
      if (node.children.length) {
        const children = document.createElement("div");
        children.className = "children";
        node.children.forEach(child => children.append(renderVisitorNode(child, false)));
        branch.append(children);
      }
      return branch;
    };

    const baseSetAdminMode = setAdminMode;
    setAdminMode = function(enabled) {
      document.body.classList.toggle("client-view", !enabled);
      baseSetAdminMode(enabled);
    };

    const toolbar = document.querySelector(".toolbar");
    const draftButton = document.getElementById("draftButton");
    if (toolbar && !document.getElementById("editCurrentButton")) {
      const button = document.createElement("button");
      button.id = "editCurrentButton";
      button.type = "button";
      button.className = "button admin-only hidden";
      button.textContent = "📂 Modifier le schéma en cours";
      button.onclick = async () => {
        if (!isAdmin) return;
        button.disabled = true;
        mark("Chargement du schéma officiel…");
        try {
          const response = await nativeFetch(DATA_PATH + "?edit=" + Date.now(), { cache: "no-store" });
          if (!response.ok) throw new Error("HTTP " + response.status);
          state = normalizeState(await response.json());
          localStorage.removeItem(LOCAL_KEY);
          saveDraft(true);
          render();
          mark("Schéma officiel prêt à modifier ✓", "ok");
        } catch (error) {
          console.error(error);
          mark("Chargement officiel impossible", "error");
        } finally {
          button.disabled = false;
        }
      };
      if (draftButton) draftButton.before(button); else toolbar.append(button);
    }

    const baseRender = render;
    render = function() {
      baseRender();
      document.body.classList.toggle("client-view", !isAdmin);
    };

    releaseData();
    window.fetch = nativeFetch;
  };
  core.onerror = () => {
    releaseData();
    window.fetch = nativeFetch;
    const status = document.getElementById("saveStatus");
    if (status) {
      status.textContent = "Erreur de chargement du moteur";
      status.className = "save-status error";
    }
  };
  document.head.append(core);
})();
