"use strict";
(() => {
  const hidden = new Set(["", "Nom à définir", "Fonction à définir", "Poste à définir", "Nouvelle case", "Nouveau poste", "Nouvelle personne", "Nouveau joueur"]);
  const clean = value => typeof value === "string" ? value.trim() : "";
  const shown = value => {
    const text = clean(value);
    return hidden.has(text) ? "" : text;
  };
  const player = raw => {
    if (typeof raw === "string") {
      const text = clean(raw);
      return { post: "", name: /^Joueur\s+\d+$/i.test(text) ? "" : text };
    }
    raw = raw && typeof raw === "object" ? raw : {};
    return { post: clean(raw.post), name: clean(raw.name) };
  };

  const splash = document.getElementById("splashScreen");
  const splashImage = splash?.querySelector(".splash-image");
  const splashSource = splashImage?.getAttribute("src") || "";
  if (splashSource) document.documentElement.style.setProperty("--hero-bg", `url("${splashSource}")`);
  splash?.remove();

  const core = document.createElement("script");
  core.src = "app-core.js?v=3";
  core.onload = () => {
    const oldNormalizeNode = normalizeNode;
    normalizeNode = function (raw, used) {
      const node = oldNormalizeNode(raw, used);
      node.holderName = typeof raw?.holderName === "string" ? raw.holderName : "";
      node.players = Array.isArray(raw?.players) ? raw.players.slice(0, 200).map(player) : [];
      return node;
    };

    updatePlayerCount = function (node, value) {
      if (!isAdmin) return;
      let count = parseInt(value, 10);
      count = Number.isFinite(count) ? Math.max(0, Math.min(200, count)) : 0;
      while (node.players.length < count) node.players.push({ post: "", name: "" });
      if (node.players.length > count) node.players.splice(count);
      saveDraft();
      render();
    };

    renderPlayers = function (node) {
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
      const text = shown(value);
      if (!text) return;
      const line = document.createElement("div");
      line.className = className;
      line.textContent = text;
      parent.append(line);
    };

    renderVisitorNode = function (node, isRoot) {
      const branch = document.createElement("div");
      branch.className = "branch";
      const card = document.createElement("article");
      card.className = "node-card visitor-card" + (isRoot ? " root" : "");
      card.dataset.color = node.color;
      append(card, "visitor-box-title", node.boxTitle);
      append(card, "visitor-function", node.roleTitle);
      append(card, "visitor-name", node.holderName);

      const validPlayers = (node.players || []).map(player).filter(item => shown(item.post) || shown(item.name));
      if (validPlayers.length) {
        const players = document.createElement("div");
        players.className = "visitor-players";
        validPlayers.forEach(item => {
          const row = document.createElement("div");
          row.className = "visitor-player-item";
          append(row, "visitor-player-post", item.post);
          append(row, "visitor-player-name", item.name);
          if (row.childElementCount) players.append(row);
        });
        if (players.childElementCount) card.append(players);
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

    loadOfficial();
  };
  core.onerror = () => {
    const status = document.getElementById("saveStatus");
    if (status) status.textContent = "Erreur chargement moteur";
  };
  document.body.append(core);
})();
