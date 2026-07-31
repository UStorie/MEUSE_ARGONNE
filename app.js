"use strict";
(() => {
  const hiddenValues = new Set([
    "", "Nom à définir", "Fonction à définir", "Poste à définir",
    "Nouvelle case", "Nouveau poste", "Nouvelle personne", "Nouveau joueur"
  ]);
  const clean = value => typeof value === "string" ? value.trim() : "";
  const shown = value => {
    const text = clean(value);
    return hiddenValues.has(text) ? "" : text;
  };
  const normalizePlayer = raw => {
    if (typeof raw === "string") {
      const text = clean(raw);
      return { post: "", name: /^Joueur\s+\d+$/i.test(text) ? "" : text };
    }
    raw = raw && typeof raw === "object" ? raw : {};
    return { post: clean(raw.post), name: clean(raw.name) };
  };

  const splash = document.getElementById("splashScreen");
  if (splash) splash.style.display = "none";
  const backgroundImage = splash?.querySelector(".splash-image") || null;
  const viewport = document.getElementById("treeViewport");
  if (backgroundImage && viewport) {
    backgroundImage.className = "scheme-background";
    backgroundImage.alt = "";
    backgroundImage.setAttribute("aria-hidden", "true");
    viewport.prepend(backgroundImage);
  }
  splash?.remove();

  const style = document.createElement("style");
  style.textContent = `
    .splash-screen{display:none!important}
    .tree-viewport{position:relative!important;isolation:isolate;background:rgba(255,255,255,.012)!important}
    .scheme-background{position:absolute;z-index:0;top:20px;left:50%;width:min(1120px,92vw);height:auto;transform:translateX(-50%);opacity:.26;pointer-events:none;user-select:none;filter:saturate(1.16) contrast(1.07);mix-blend-mode:screen}
    .forest{position:relative;z-index:1}
    body.client-view .forest{gap:10px!important;padding:8px 8px 110px!important}
    body.client-view .branch{min-width:190px!important}
    body.client-view .children{gap:5px!important;padding-top:62px!important}
    body.client-view .children::before{top:30px!important;width:calc(100% - 190px)!important}
    body.client-view .children>.branch::before{top:-33px!important;height:34px!important}
    body.client-view .visitor-card{width:184px!important;min-height:88px!important;padding:10px 8px!important;gap:4px!important}
    body.client-view .visitor-card.root{width:218px!important}
    body.client-view .visitor-box-title{font-size:.82rem!important;font-weight:950!important;line-height:1.1!important}
    body.client-view .visitor-function{font-size:.72rem!important;line-height:1.1!important}
    body.client-view .visitor-name{margin-top:0!important;font-size:.7rem!important;line-height:1.12!important}
    body.client-view .visitor-players{display:grid!important;gap:4px!important;width:100%!important;margin-top:4px!important;padding-top:5px!important;border-top:1px solid rgba(255,255,255,.16)!important}
    body.client-view .visitor-player-item{padding:4px!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:7px!important;background:rgba(0,0,0,.12)!important}
    body.client-view .visitor-player-post{font-size:.64rem!important;font-weight:850!important;color:color-mix(in srgb,var(--card-a) 60%,white)!important}
    body.client-view .visitor-player-name{margin-top:2px!important;font-size:.67rem!important;font-weight:750!important}
    .player-fields{display:grid!important;gap:5px!important}
    .players{grid-template-columns:1fr!important}
    #editCurrentButton{border-color:rgba(59,130,246,.58);background:linear-gradient(135deg,#1d4ed8,#3b82f6);font-weight:800}
    @media(max-width:850px){
      .scheme-background{top:55px;width:96vw;opacity:.24}
      body.client-view .branch{min-width:174px!important}
      body.client-view .visitor-card{width:168px!important}
      body.client-view .visitor-card.root{width:198px!important}
      body.client-view .children::before{width:calc(100% - 174px)!important}
    }
  `;
  document.head.append(style);
  document.body.classList.add("client-view");

  const core = document.createElement("script");
  core.src = "app-core.js?v=5";
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
      const text = shown(value);
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

      const visiblePlayers = (node.players || [])
        .map(normalizePlayer)
        .filter(item => shown(item.post) || shown(item.name));
      if (visiblePlayers.length) {
        const list = document.createElement("div");
        list.className = "visitor-players";
        visiblePlayers.forEach(item => {
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
      const editCurrentButton = document.createElement("button");
      editCurrentButton.id = "editCurrentButton";
      editCurrentButton.type = "button";
      editCurrentButton.className = "button admin-only hidden";
      editCurrentButton.textContent = "📂 Modifier le schéma en cours";
      editCurrentButton.onclick = async () => {
        if (!isAdmin) return;
        mark("Chargement du schéma officiel…");
        editCurrentButton.disabled = true;
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
          mark("Impossible de charger le schéma officiel", "error");
        } finally {
          editCurrentButton.disabled = false;
        }
      };
      if (draftButton) draftButton.before(editCurrentButton);
      else toolbar.append(editCurrentButton);
    }

    const originalRender = render;
    render = function() {
      originalRender();
      requestAnimationFrame(() => {
        document.body.classList.toggle("client-view", !isAdmin);
      });
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
