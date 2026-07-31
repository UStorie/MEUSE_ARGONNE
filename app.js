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
  const normalizeExtraHeight = value => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(1200, Math.round(number))) : 0;
  };

  document.getElementById("splashScreen")?.remove();
  document.getElementById("schemeBackground")?.remove();

  const style = document.createElement("style");
  style.textContent = `
    .splash-screen,.scheme-background{display:none!important}
    .tree-viewport{
      position:relative!important;isolation:isolate!important;
      background:radial-gradient(circle at 50% 8%,rgba(126,34,206,.22),transparent 34rem),linear-gradient(180deg,#160b24 0%,#100817 48%,#09060f 100%)!important
    }
    .tree-viewport::after{display:none!important}
    .forest{position:relative!important;z-index:1!important}
    .node-card[data-color="gold"]{--card-a:#f6c453;--card-b:#8a5a00}

    body.client-view .forest{
      gap:18px!important;padding:12px 6px 150px!important;align-items:flex-start!important
    }
    body.client-view .forest>.branch{margin-inline:28px!important}
    body.client-view .branch{min-width:158px!important}
    body.client-view .children{gap:4px!important;padding-top:72px!important;position:relative!important}
    body.client-view .forest>.branch>.children{gap:42px!important}
    body.client-view .children::before{
      content:""!important;position:absolute!important;top:35px!important;left:50%!important;
      width:calc(100% - 158px)!important;min-width:2px!important;height:2px!important;
      transform:translateX(-50%)!important;background:#b96cff!important;opacity:1!important
    }
    body.client-view .children::after{
      content:""!important;position:absolute!important;top:0!important;left:50%!important;
      width:2px!important;height:36px!important;transform:translateX(-50%)!important;
      background:#b96cff!important;opacity:1!important
    }
    body.client-view .children>.branch::before{
      content:""!important;position:absolute!important;top:-37px!important;left:50%!important;
      width:2px!important;height:38px!important;transform:translateX(-50%)!important;
      background:#b96cff!important;opacity:1!important
    }

    body.client-view .visitor-card{
      width:152px!important;min-height:84px!important;padding:9px 7px!important;
      gap:3px!important;border-radius:11px!important;text-align:center!important;
      background:color-mix(in srgb,var(--card-a) 18%,rgba(12,8,18,.90))!important;
      backdrop-filter:blur(1px)!important
    }
    body.client-view .visitor-card.root{width:184px!important}
    body.client-view .visitor-box-title{font-size:.76rem!important;font-weight:950!important;line-height:1.08!important}
    body.client-view .visitor-function{font-size:.66rem!important;line-height:1.08!important}
    body.client-view .visitor-name{margin-top:0!important;font-size:.65rem!important;line-height:1.1!important}
    body.client-view .visitor-players{
      display:grid!important;gap:3px!important;width:100%!important;margin-top:4px!important;
      padding-top:4px!important;border-top:1px solid rgba(255,255,255,.18)!important
    }
    body.client-view .visitor-player-item{
      padding:3px!important;border:1px solid rgba(255,255,255,.13)!important;
      border-radius:6px!important;background:rgba(0,0,0,.22)!important
    }
    body.client-view .visitor-player-post{font-size:.59rem!important;font-weight:850!important}
    body.client-view .visitor-player-name{margin-top:1px!important;font-size:.62rem!important;font-weight:750!important}

    .player-fields{display:grid!important;gap:5px!important}
    .players{grid-template-columns:1fr!important}
    .height-control{
      display:grid;grid-template-columns:minmax(0,1fr) 92px;align-items:end;gap:7px;
      padding:9px 10px;border-top:1px solid rgba(216,180,254,.14);background:rgba(0,0,0,.08)
    }
    .height-control label{display:grid;gap:2px;color:var(--muted);font-size:.68rem;font-weight:800}
    .height-control label span{font-size:.62rem;font-weight:650;opacity:.78}
    .height-input{
      min-height:33px;padding:6px 7px;color:var(--text);border:1px solid var(--line);
      border-radius:8px;outline:none;background:rgba(255,255,255,.045);text-align:center;font-weight:850;user-select:text
    }
    .height-input:focus{border-color:rgba(168,85,247,.72);box-shadow:0 0 0 2px rgba(168,85,247,.11)}
    .node-height-spacer{width:100%;min-height:0;pointer-events:none}
    #editCurrentButton{
      border-color:rgba(59,130,246,.58)!important;
      background:linear-gradient(135deg,#1d4ed8,#3b82f6)!important;font-weight:800!important
    }
    .schema-footer{
      position:sticky;left:0;z-index:2;display:flex;align-items:center;justify-content:center;
      flex-wrap:wrap;gap:8px;width:100%;min-width:100%;padding:16px 10px 12px;
      color:#fff!important;border-top:1px solid rgba(216,180,254,.14);
      background:linear-gradient(180deg,transparent,rgba(9,6,15,.36));
      text-align:center;font-size:.72rem;font-weight:800;letter-spacing:.03em
    }
    .schema-footer .schema-footer-separator{color:rgba(255,255,255,.38)}
    .schema-footer .visitor-counter,.schema-footer .site-copyright{color:#fff!important}
    .schema-footer .visitor-counter-value{font-weight:950;color:#fff!important}
    @media(max-width:850px){
      body.client-view .forest>.branch{margin-inline:10px!important}
      body.client-view .branch{min-width:146px!important}
      body.client-view .visitor-card{width:140px!important}
      body.client-view .visitor-card.root{width:170px!important}
      body.client-view .children::before{width:calc(100% - 146px)!important}
      body.client-view .forest>.branch>.children{gap:20px!important}
    }
  `;
  document.head.append(style);
  document.body.classList.add("client-view");

  const core = document.createElement("script");
  core.src = "app-core.js?v=8";
  core.onload = () => {
    if (!COLORS.includes("gold")) COLORS.push("gold");
    COLOR_LABELS.gold = "Jaune or";

    const originalNormalizeNode = normalizeNode;
    normalizeNode = function(raw, used) {
      const node = originalNormalizeNode(raw, used);
      node.holderName = typeof raw?.holderName === "string" ? raw.holderName : "";
      node.players = Array.isArray(raw?.players) ? raw.players.slice(0, 200).map(normalizePlayer) : [];
      node.cardExtraHeight = normalizeExtraHeight(raw?.cardExtraHeight);
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

    const createHeightSpacer = node => {
      const height = normalizeExtraHeight(node.cardExtraHeight);
      if (!height) return null;
      const spacer = document.createElement("div");
      spacer.className = "node-height-spacer";
      spacer.style.height = height + "px";
      spacer.setAttribute("aria-hidden", "true");
      return spacer;
    };

    const originalRenderAdminNode = renderAdminNode;
    renderAdminNode = function(node, isRoot) {
      const branch = originalRenderAdminNode(node, isRoot);
      const card = Array.from(branch.children).find(element => element.classList?.contains("node-card"));
      if (!card) return branch;

      const actions = Array.from(card.children).find(element => element.classList?.contains("node-actions")) || null;
      const control = document.createElement("div");
      control.className = "height-control";

      const label = document.createElement("label");
      label.innerHTML = "Hauteur supplémentaire<span>0 à 1200 px</span>";

      const input = document.createElement("input");
      input.type = "number";
      input.className = "height-input";
      input.min = "0";
      input.max = "1200";
      input.step = "20";
      input.value = String(normalizeExtraHeight(node.cardExtraHeight));
      input.setAttribute("aria-label", "Hauteur supplémentaire de la case en pixels");
      input.onchange = () => {
        node.cardExtraHeight = normalizeExtraHeight(input.value);
        saveDraft();
        render();
      };

      control.append(label, input);
      card.insertBefore(control, actions);

      const spacer = createHeightSpacer(node);
      if (spacer) card.insertBefore(spacer, actions);
      return branch;
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

      const visiblePlayers = (node.players || []).map(normalizePlayer)
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

      const spacer = createHeightSpacer(node);
      if (spacer) card.append(spacer);
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
      requestAnimationFrame(() => document.body.classList.toggle("client-view", !isAdmin));
    };

    document.getElementById("siteCopyright")?.remove();
    document.getElementById("schemaFooter")?.remove();

    const schemaViewport = document.getElementById("treeViewport");
    const schemaForest = document.getElementById("forest");
    if (schemaViewport) {
      const footer = document.createElement("footer");
      footer.id = "schemaFooter";
      footer.className = "schema-footer";

      const counter = document.createElement("span");
      counter.className = "visitor-counter";
      counter.innerHTML = 'Entrées sur le site : <span id="visitorCount" class="visitor-counter-value">…</span>';

      const separator = document.createElement("span");
      separator.className = "schema-footer-separator";
      separator.textContent = "•";
      separator.setAttribute("aria-hidden", "true");

      const copyright = document.createElement("span");
      copyright.className = "site-copyright";
      copyright.textContent = "Copyright barnaber55";

      footer.append(counter, separator, copyright);
      if (schemaForest && schemaForest.parentElement === schemaViewport) schemaForest.after(footer);
      else schemaViewport.append(footer);

      fetch("https://visitor.6developer.com/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: "barnaber55.github.io/NOVARISRP-",
          page_path: "/NOVARISRP-/"
        })
      })
        .then(response => {
          if (!response.ok) throw new Error("HTTP " + response.status);
          return response.json();
        })
        .then(data => {
          const value = document.getElementById("visitorCount");
          if (value) value.textContent = Number.isFinite(Number(data.totalCount))
            ? Number(data.totalCount).toLocaleString("fr-FR")
            : "—";
        })
        .catch(error => {
          console.warn("Compteur de visites indisponible", error);
          const value = document.getElementById("visitorCount");
          if (value) value.textContent = "—";
        });
    }

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
