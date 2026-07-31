"use strict";
(() => {
  const EMPTY = new Set(["", "Nom à définir", "Fonction à définir", "Poste à définir", "Nouvelle case", "Nouveau poste", "Nouvelle personne", "Nouveau joueur"]);
  const clean = value => typeof value === "string" ? value.trim() : "";
  const visible = value => { const text = clean(value); return EMPTY.has(text) ? "" : text; };
  const normalizePlayer = raw => {
    if (typeof raw === "string") {
      const name = clean(raw);
      return { post: "", name: /^Joueur\s+\d+$/i.test(name) ? "" : name };
    }
    raw = raw && typeof raw === "object" ? raw : {};
    return { post: clean(raw.post), name: clean(raw.name) };
  };

  document.getElementById("splashScreen")?.remove();
  const viewport = document.getElementById("treeViewport");
  if (viewport) {
    const old = document.getElementById("schemeBackground");
    old?.remove();
    const image = document.createElement("img");
    image.id = "schemeBackground";
    image.className = "scheme-background";
    image.src = "./novaris-background.svg?v=20260731-1220";
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.onerror = () => {
      const status = document.getElementById("saveStatus");
      if (status) {
        status.textContent = "Fond NOVARIS introuvable";
        status.className = "save-status error";
      }
    };
    viewport.prepend(image);
  }

  const style = document.createElement("style");
  style.textContent = `
    .splash-screen{display:none!important}
    .tree-viewport{position:relative!important;isolation:isolate!important;background:#07040b!important;padding-bottom:170px!important}
    .scheme-background{position:absolute!important;z-index:0!important;inset:0!important;width:100%!important;height:100%!important;min-height:100%!important;object-fit:cover!important;object-position:center top!important;opacity:1!important;pointer-events:none!important;user-select:none!important}
    .tree-viewport::after{content:""!important;position:absolute!important;z-index:0!important;inset:0!important;background:rgba(4,1,7,.05)!important;pointer-events:none!important}
    .forest{position:relative!important;z-index:1!important}

    body.client-view .forest{gap:16px!important;padding:14px 6px 220px!important;align-items:flex-start!important}
    body.client-view .branch{min-width:146px!important}
    body.client-view .forest>.branch{margin-inline:18px!important}
    body.client-view .visitor-card{width:140px!important;min-height:80px!important;padding:8px 6px!important;gap:3px!important;border-radius:10px!important;background:color-mix(in srgb,var(--card-a) 20%,rgba(9,5,14,.84))!important;backdrop-filter:blur(1px)!important}
    body.client-view .visitor-card.root{width:174px!important}
    body.client-view .visitor-box-title{font-size:.74rem!important;font-weight:950!important;line-height:1.08!important}
    body.client-view .visitor-function{font-size:.64rem!important;line-height:1.08!important}
    body.client-view .visitor-name{margin-top:0!important;font-size:.63rem!important;line-height:1.1!important}
    body.client-view .visitor-players{display:grid!important;gap:3px!important;width:100%!important;margin-top:4px!important;padding-top:4px!important;border-top:1px solid rgba(255,255,255,.18)!important}
    body.client-view .visitor-player-item{padding:3px!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:6px!important;background:rgba(0,0,0,.22)!important}
    body.client-view .visitor-player-post{font-size:.57rem!important;font-weight:850!important}
    body.client-view .visitor-player-name{margin-top:1px!important;font-size:.60rem!important;font-weight:750!important}

    body.client-view .forest>.branch>.children{position:relative!important;display:flex!important;flex-direction:row!important;align-items:flex-start!important;gap:76px!important;padding-top:104px!important}
    body.client-view .forest>.branch>.children::before{content:""!important;position:absolute!important;top:50px!important;left:50%!important;width:calc(100% - 146px)!important;height:3px!important;transform:translateX(-50%)!important;background:#c77cff!important;opacity:1!important}
    body.client-view .forest>.branch>.children::after{content:""!important;position:absolute!important;top:0!important;left:50%!important;width:3px!important;height:53px!important;transform:translateX(-50%)!important;background:#c77cff!important;opacity:1!important}
    body.client-view .forest>.branch>.children>.branch::before{content:""!important;position:absolute!important;top:-55px!important;left:50%!important;width:3px!important;height:56px!important;transform:translateX(-50%)!important;background:#c77cff!important;opacity:1!important}

    body.client-view .forest>.branch>.children .children{position:relative!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:94px!important;padding-top:92px!important}
    body.client-view .forest>.branch>.children .children::before{content:""!important;position:absolute!important;top:0!important;bottom:0!important;left:50%!important;width:3px!important;height:auto!important;transform:translateX(-50%)!important;background:#c77cff!important;opacity:1!important}
    body.client-view .forest>.branch>.children .children::after{display:none!important}
    body.client-view .forest>.branch>.children .children>.branch::before{content:""!important;position:absolute!important;top:-48px!important;left:50%!important;width:3px!important;height:49px!important;transform:translateX(-50%)!important;background:#c77cff!important;opacity:1!important}

    .player-fields{display:grid!important;gap:5px!important}
    .players{grid-template-columns:1fr!important}
    #editCurrentButton{border-color:rgba(59,130,246,.62)!important;background:linear-gradient(135deg,#1d4ed8,#3b82f6)!important;font-weight:800!important}
    @media(max-width:850px){
      body.client-view .branch{min-width:132px!important}
      body.client-view .visitor-card{width:126px!important}
      body.client-view .visitor-card.root{width:158px!important}
      body.client-view .forest>.branch>.children{gap:32px!important}
      body.client-view .forest>.branch>.children::before{width:calc(100% - 132px)!important}
    }
  `;
  document.head.append(style);
  document.body.classList.add("client-view");

  const core = document.createElement("script");
  core.src = "app-core.js?v=8";
  core.onload = () => {
    const originalNormalizeNode = normalizeNode;
    normalizeNode = function(raw, used) {
      const node = originalNormalizeNode(raw, used);
      node.holderName = typeof raw?.holderName === "string" ? raw.holderName : "";
      node.players = Array.isArray(raw?.players) ? raw.players.slice(0, 200).map(normalizePlayer) : [];
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
        const entry = normalizePlayer(raw);
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

    const appendLine = (parent, className, value) => {
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
      appendLine(card, "visitor-box-title", node.boxTitle);
      appendLine(card, "visitor-function", node.roleTitle);
      appendLine(card, "visitor-name", node.holderName);
      const players = (node.players || []).map(normalizePlayer).filter(item => visible(item.post) || visible(item.name));
      if (players.length) {
        const list = document.createElement("div");
        list.className = "visitor-players";
        players.forEach(item => {
          const row = document.createElement("div");
          row.className = "visitor-player-item";
          appendLine(row, "visitor-player-post", item.post);
          appendLine(row, "visitor-player-name", item.name);
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

    const originalSetAdminMode = setAdminMode;
    setAdminMode = function(enabled) {
      document.body.classList.toggle("client-view", !enabled);
      originalSetAdminMode(enabled);
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
          const response = await fetch(DATA_PATH + "?edit=" + Date.now(), { cache: "no-store" });
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

    const originalRender = render;
    render = function() {
      originalRender();
      requestAnimationFrame(() => document.body.classList.toggle("client-view", !isAdmin));
    };

    loadOfficial();
  };
  core.onerror = () => {
    const status = document.getElementById("saveStatus");
    if (status) {
      status.textContent = "Erreur chargement moteur";
      status.className = "save-status error";
    }
  };
  document.body.append(core);
})();
