(() => {
  const config = window.NDF_CONFIG || {};
  const form = document.getElementById("mensalidade-form");
  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");
  const successPanel = document.getElementById("success-panel");
  const successText = document.getElementById("success-text");
  const payLink = document.getElementById("pay-link");
  const resetBtn = document.getElementById("reset-btn");
  const valorResumo = document.getElementById("valor-resumo");
  const cpfInput = document.getElementById("cpf");
  const telefoneInput = document.getElementById("telefone");
  const alunoCpfInput = document.getElementById("aluno_cpf");
  const cienteInput = document.getElementById("ciente");
  const cienteHint = document.getElementById("ciente-hint");
  const agreeWrap = document.getElementById("agree-wrap");
  const planoInput = document.getElementById("plano");
  const planoTrigger = document.getElementById("plano-trigger");
  const planoTriggerText = document.getElementById("plano-trigger-text");
  const planoOptions = document.getElementById("plano-options");
  const horarioInput = document.getElementById("horario");
  const horarioTrigger = document.getElementById("horario-trigger");
  const horarioTriggerText = document.getElementById("horario-trigger-text");
  const horarioOptions = document.getElementById("horario-options");
  const contractTrigger = document.getElementById("contract-trigger");
  const closeContratoBtn = document.getElementById("close-contrato");
  const closeContratoX = document.getElementById("close-contrato-x");
  const contratoScroll = document.getElementById("contrato-scroll");
  const contratoScrollHint = document.getElementById("contrato-scroll-hint");
  const assinaturaCanvas = document.getElementById("assinatura-canvas");
  const assinaturaImg = document.getElementById("assinatura-img");
  const limparAssinaturaBtn = document.getElementById("limpar-assinatura");
  const assinaturaHint = document.getElementById("assinatura-hint");
  const modalPlano = document.getElementById("modal-plano");
  const modalHorario = document.getElementById("modal-horario");
  const modalContrato = document.getElementById("modal-contrato");

  const params = new URLSearchParams(window.location.search);
  let unidadeId = (params.get("unidade") || "").trim().toLowerCase();
  if (!unidadeId) {
    try {
      unidadeId = (sessionStorage.getItem("ndf-unidade") || "").trim().toLowerCase();
    } catch (_) {
      unidadeId = "";
    }
  }
  if (!unidadeId && window.__NDF_UNIDADE_ID__) {
    unidadeId = String(window.__NDF_UNIDADE_ID__).trim().toLowerCase();
  }

  const unidades = (config && config.UNIDADES) || {};

  function goHome(reason) {
    const theme = params.get("theme") || localStorage.getItem("ndf-theme") || "dark";
    console.warn("[NDF] Redirecionando para home:", reason, {
      unidadeId,
      search: window.location.search,
      hasConfig: Boolean(window.NDF_CONFIG),
      unidadeKeys: Object.keys(unidades),
    });
    window.location.replace(`./index.html?theme=${encodeURIComponent(theme)}`);
  }

  // Restaura ?unidade= na URL se veio só do sessionStorage
  if (unidadeId && !params.get("unidade")) {
    const url = new URL(window.location.href);
    url.searchParams.set("unidade", unidadeId);
    window.history.replaceState({}, "", url);
  }

  // Só volta à home se não houver unidade em lugar nenhum.
  if (!unidadeId) {
    goHome("parametro unidade ausente");
    return;
  }

  let unidade =
    unidades[unidadeId] ||
    (unidadeId === "copp" || unidadeId === "copy" || unidadeId === "taquaralto"
      ? unidades.coop
      : null) ||
    null;
  if (!unidade) {
    console.error("[NDF] Unidade não encontrada no config:", unidadeId, {
      hasConfig: Boolean(window.NDF_CONFIG),
      keys: Object.keys(unidades),
    });
    const banner = document.createElement("div");
    banner.setAttribute("role", "alert");
    banner.style.cssText =
      "position:fixed;inset:auto 1rem 1rem;z-index:9999;padding:1rem 1.2rem;border-radius:1rem;background:#7f1d1d;color:#fff;font:600 0.95rem Manrope,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.35)";
    banner.innerHTML =
      `Não foi possível carregar a unidade <strong>${unidadeId}</strong>. Recarregue com Ctrl+F5. ` +
      `<a href="./index.html" style="color:#fff;text-decoration:underline">Voltar às unidades</a>`;
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(banner));
    if (document.body) document.body.appendChild(banner);
    return;
  }

  try {
    sessionStorage.setItem("ndf-unidade", unidadeId);
  } catch (_) {
    /* ignore */
  }

  const planos = Array.isArray(unidade.planos)
    ? unidade.planos
    : Array.isArray(config.PLANOS)
      ? config.PLANOS
      : [];
  let horarios = Array.isArray(unidade.horarios) ? unidade.horarios : [];
  let activeModal = null;
  let lastFocus = null;
  let contratoLidoAteFim = false;
  let assinaturaOk = false;
  let assinaturaDataUrl = "";
  let signatureCtx = null;
  let drawing = false;
  let hasStroke = false;

  function applyUnidadeContext() {
    const club = document.getElementById("unit-club");
    const slogan = document.getElementById("unit-slogan");
    const hint = document.getElementById("horario-hint");
    const eyebrow = document.getElementById("modal-horario-eyebrow");
    const footer = document.getElementById("form-footer");
    const backHome = document.getElementById("back-home");

    if (club) club.textContent = unidade.nome;
    if (slogan) slogan.textContent = `“${unidade.slogan}”`;
    if (hint) {
      hint.textContent = `Treinos em ${unidade.local} — ${unidade.diasLabel}.`;
    }
    if (eyebrow) eyebrow.textContent = `Local: ${unidade.local}`;
    if (footer) footer.textContent = `${unidade.nome} · Mensalidades`;
    if (backHome) {
      const theme = document.documentElement.getAttribute("data-theme") || "dark";
      backHome.href = `./?theme=${encodeURIComponent(theme)}`;
    }
    document.title = `Ficha de mensalidade | ${unidade.nome}`;
  }

  applyUnidadeContext();

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

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setButtonLabel(button, label) {
    if (button) button.textContent = label;
  }

  function initReveal() {
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    nodes.forEach((node, index) => {
      if (!node.hasAttribute("data-delay")) {
        node.setAttribute("data-delay", String(Math.min(index, 3)));
      }
    });

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
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
  }

  function initCardTilt() {
    const card = document.querySelector(".card");
    if (!card || reduceMotion || window.matchMedia("(hover: none)").matches) return;

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 2.2;
      const rotateX = (0.5 - py) * 1.6;
      card.classList.add("is-tilting");
      card.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-1px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.transform = "";
    });
  }

  function initPhotoParallax() {
    const rail = document.querySelector(".photo-rail");
    const form = document.querySelector(".form-rail");
    if (!rail || !form || reduceMotion) return;

    const desktop = window.matchMedia("(min-width: 921px)");
    let ticking = false;

    const update = () => {
      if (!desktop.matches) {
        rail.style.setProperty("--photo-parallax", "0px");
        ticking = false;
        return;
      }

      const formRect = form.getBoundingClientRect();
      const start = window.scrollY + formRect.top - 88;
      const traveled = Math.max(0, window.scrollY - start);
      const shift = Math.min(traveled * 0.22, 160);
      rail.style.setProperty("--photo-parallax", `${shift}px`);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    desktop.addEventListener("change", onScroll);
    update();
  }

  function initAuroraShift() {
    const blobs = document.querySelectorAll(".aurora__blob");
    if (!blobs.length || reduceMotion) return;

    window.addEventListener(
      "pointermove",
      (event) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        blobs.forEach((blob, index) => {
          const strength = (index + 1) * 8;
          blob.style.translate = `${nx * strength}px ${ny * strength}px`;
        });
      },
      { passive: true }
    );
  }

  initReveal();
  initCardTilt();
  initPhotoParallax();
  initAuroraShift();

  function formatBRL(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getPlanoById(id) {
    return planos.find((p) => p.id === id) || null;
  }

  function getHorarioById(id) {
    return horarios.find((h) => h.id === id) || null;
  }

  function selectedPlano() {
    return planoInput ? getPlanoById(planoInput.value) : null;
  }

  function selectedHorario() {
    return horarioInput ? getHorarioById(horarioInput.value) : null;
  }

  function selectedUsoImagem() {
    const checked = form.querySelector('input[name="uso_imagem"]:checked');
    return checked ? checked.value : "";
  }

  function syncPlanoTrigger(plano) {
    if (!planoTrigger || !planoTriggerText) return;
    if (!plano) {
      planoTriggerText.textContent = "Selecione a parcela";
      planoTrigger.classList.remove("picker-trigger--filled");
      return;
    }
    planoTriggerText.textContent = plano.label;
    planoTrigger.classList.add("picker-trigger--filled");
  }

  function syncHorarioTrigger(horario) {
    if (!horarioTrigger || !horarioTriggerText) return;
    if (!horario) {
      horarioTriggerText.textContent = "Selecione o horário";
      horarioTrigger.classList.remove("picker-trigger--filled");
      return;
    }
    horarioTriggerText.textContent = `${horario.horario} · ${horario.turma}`;
    horarioTrigger.classList.add("picker-trigger--filled");
  }

  function updateValor() {
    const plano = selectedPlano();
    syncPlanoTrigger(plano);

    if (!plano) {
      valorResumo.innerHTML = "Valor selecionado: <strong>—</strong>";
      return;
    }

    if (plano.tipo === "mensal") {
      valorResumo.innerHTML = `Valor selecionado: <strong>${formatBRL(plano.valorParcela)}</strong> (mensal)`;
      return;
    }

    if (plano.parcelas === 1) {
      valorResumo.innerHTML = `Valor selecionado: <strong>${formatBRL(plano.valorTotal)}</strong> (à vista)`;
      return;
    }

    valorResumo.innerHTML =
      `Valor selecionado: <strong>${plano.parcelas}× de ${formatBRL(plano.valorParcela)}</strong>` +
      ` · total ${formatBRL(plano.valorTotal)}`;
  }

  function contratoPronto() {
    return contratoLidoAteFim && assinaturaOk;
  }

  function syncAssinaturaUi() {
    const pronto = contratoPronto();

    if (cienteInput) {
      cienteInput.disabled = !pronto;
      if (!pronto) cienteInput.checked = false;
    }
    if (agreeWrap) {
      agreeWrap.classList.toggle("agree--locked", !pronto);
    }
    if (cienteHint) {
      if (!contratoLidoAteFim) {
        cienteHint.textContent = "Abra o contrato e role até o final.";
      } else if (!assinaturaOk) {
        cienteHint.textContent = "Assine no final do contrato para liberar o aceite.";
      } else {
        cienteHint.textContent = "Contrato lido e assinado — marque o aceite para continuar.";
      }
    }
    if (closeContratoBtn) closeContratoBtn.disabled = !pronto;
    if (closeContratoX) closeContratoX.disabled = !pronto;

    if (contratoScrollHint) {
      contratoScrollHint.hidden = false;
      if (!contratoLidoAteFim) {
        contratoScrollHint.textContent = "Role até o final do contrato.";
        contratoScrollHint.classList.remove("is-done");
      } else if (!assinaturaOk) {
        contratoScrollHint.textContent = "Agora assine no quadro abaixo.";
        contratoScrollHint.classList.remove("is-done");
      } else {
        contratoScrollHint.textContent = "Assinatura ok — você já pode fechar.";
        contratoScrollHint.classList.add("is-done");
      }
    }

    if (assinaturaHint) {
      assinaturaHint.textContent = assinaturaOk
        ? "Assinatura capturada."
        : "Assine no quadro acima com o dedo ou mouse.";
      assinaturaHint.classList.toggle("is-done", assinaturaOk);
    }

    if (contractTrigger) {
      markValidity(contractTrigger, pronto);
      contractTrigger.textContent = pronto
        ? "Contrato assinado — ver novamente"
        : "Ver contrato";
    }
  }

  function setContratoLido(liberado) {
    contratoLidoAteFim = Boolean(liberado);
    syncAssinaturaUi();
  }

  function setAssinaturaOk(ok, dataUrl) {
    assinaturaOk = Boolean(ok);
    assinaturaDataUrl = ok && dataUrl ? dataUrl : "";
    // A imagem fica só para o PDF; na tela o responsável assina no canvas
    if (assinaturaImg) {
      if (assinaturaOk && assinaturaDataUrl) {
        assinaturaImg.src = assinaturaDataUrl;
      } else {
        assinaturaImg.removeAttribute("src");
      }
      assinaturaImg.hidden = true;
    }
    if (assinaturaCanvas) {
      assinaturaCanvas.classList.toggle("is-signed", assinaturaOk);
    }
    syncAssinaturaUi();
  }

  function resetAssinatura() {
    hasStroke = false;
    drawing = false;
    if (signatureCtx && assinaturaCanvas) {
      signatureCtx.clearRect(0, 0, assinaturaCanvas.width, assinaturaCanvas.height);
      signatureCtx.fillStyle = "#ffffff";
      signatureCtx.fillRect(0, 0, assinaturaCanvas.width, assinaturaCanvas.height);
    }
    setAssinaturaOk(false, "");
  }

  function captureAssinatura() {
    if (!assinaturaCanvas || !hasStroke) {
      setAssinaturaOk(false, "");
      return;
    }
    setAssinaturaOk(true, assinaturaCanvas.toDataURL("image/png"));
  }

  function initSignaturePad() {
    if (!assinaturaCanvas) return;
    signatureCtx = assinaturaCanvas.getContext("2d");
    signatureCtx.lineWidth = 2.4;
    signatureCtx.lineCap = "round";
    signatureCtx.lineJoin = "round";
    signatureCtx.strokeStyle = "#0f172a";
    signatureCtx.fillStyle = "#ffffff";
    signatureCtx.fillRect(0, 0, assinaturaCanvas.width, assinaturaCanvas.height);

    const pointFromEvent = (event) => {
      const rect = assinaturaCanvas.getBoundingClientRect();
      const source = event.touches && event.touches[0] ? event.touches[0] : event;
      const scaleX = assinaturaCanvas.width / rect.width;
      const scaleY = assinaturaCanvas.height / rect.height;
      return {
        x: (source.clientX - rect.left) * scaleX,
        y: (source.clientY - rect.top) * scaleY,
      };
    };

    const startDraw = (event) => {
      event.preventDefault();
      drawing = true;
      const point = pointFromEvent(event);
      signatureCtx.beginPath();
      signatureCtx.moveTo(point.x, point.y);
    };

    const moveDraw = (event) => {
      if (!drawing) return;
      event.preventDefault();
      const point = pointFromEvent(event);
      signatureCtx.lineTo(point.x, point.y);
      signatureCtx.stroke();
      hasStroke = true;
    };

    const endDraw = (event) => {
      if (!drawing) return;
      event.preventDefault();
      drawing = false;
      if (hasStroke) captureAssinatura();
    };

    assinaturaCanvas.addEventListener("mousedown", startDraw);
    assinaturaCanvas.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", endDraw);
    assinaturaCanvas.addEventListener("touchstart", startDraw, { passive: false });
    assinaturaCanvas.addEventListener("touchmove", moveDraw, { passive: false });
    assinaturaCanvas.addEventListener("touchend", endDraw);
    assinaturaCanvas.addEventListener("touchcancel", endDraw);

    if (limparAssinaturaBtn) {
      limparAssinaturaBtn.addEventListener("click", () => {
        resetAssinatura();
        setStatus("Assinatura limpa. Assine novamente para continuar.");
      });
    }
  }

  function formatDateBR(isoDate) {
    if (!isoDate) return "";
    const match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return String(isoDate);
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  function fillContractPlaceholders() {
    const article = document.getElementById("contract-article");
    if (!article) return;

    const horario = selectedHorario();
    const plano = selectedPlano();
    const hoje = new Date();
    const dataHoje = `${String(hoje.getDate()).padStart(2, "0")}/${String(
      hoje.getMonth() + 1
    ).padStart(2, "0")}/${hoje.getFullYear()}`;
    const values = {
      responsavel_nome: [form.nome?.value, form.sobrenome?.value]
        .map((v) => (v || "").trim())
        .filter(Boolean)
        .join(" ") || "[NOME DO RESPONSÁVEL]",
      responsavel_cpf: (form.cpf?.value || "").trim() || "[CPF]",
      responsavel_telefone: (form.telefone?.value || "").trim() || "[CONTATO]",
      responsavel_email: (form.email?.value || "").trim() || "[E-MAIL]",
      aluno_nome: (form.aluno_nome?.value || "").trim() || "[NOME DO ALUNO]",
      aluno_nascimento: formatDateBR(form.aluno_nascimento?.value) || "[DD/MM/AAAA]",
      aluno_cpf: (form.aluno_cpf?.value || "").trim() || "[CPF/RG]",
      local: (horario && (horario.local || unidade.local)) || unidade.local || "[LOCAL]",
      dias_horario: horario
        ? `${horario.dias}, ${horario.horario}${horario.turma ? ` — ${horario.turma}` : ""}`
        : "[DIAS / HORÁRIO]",
      plano: plano ? plano.label : "[PLANO]",
      data_assinatura: dataHoje,
    };

    article.querySelectorAll("[data-fill]").forEach((node) => {
      const key = node.getAttribute("data-fill");
      if (key && values[key] !== undefined) node.textContent = values[key];
    });

    if (assinaturaImg && assinaturaDataUrl) {
      assinaturaImg.src = assinaturaDataUrl;
    }
  }

  function checkContratoScrollEnd() {
    if (!contratoScroll || contratoLidoAteFim) return;
    const remaining =
      contratoScroll.scrollHeight - contratoScroll.scrollTop - contratoScroll.clientHeight;
    if (remaining <= 32) {
      setContratoLido(true);
    }
  }

  function openModal(modal) {
    if (!modal || activeModal === modal) return;
    if (activeModal) closeModal(activeModal, { restoreFocus: false, force: true });

    lastFocus = document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      const focusTarget =
        modal.querySelector("[data-modal-close].modal__close:not([disabled])") ||
        modal.querySelector("button:not([disabled]), [href], input, select, textarea");
      if (focusTarget) focusTarget.focus();
      if (modal === modalContrato) {
        fillContractPlaceholders();
        if (contratoScroll) {
          contratoScroll.scrollTop = 0;
          requestAnimationFrame(checkContratoScrollEnd);
        }
      }
    });
  }

  function closeModal(modal, { restoreFocus = true, force = false } = {}) {
    if (!modal) return;

    if (modal === modalContrato && !contratoPronto() && !force) {
      if (!contratoLidoAteFim) {
        setStatus("Role o contrato até o final para poder fechar.");
      } else if (!assinaturaOk) {
        setStatus("Assine o contrato no final da página para poder fechar.");
      }
      if (contratoScrollHint) {
        contratoScrollHint.hidden = false;
        contratoScrollHint.classList.remove("is-done");
      }
      return;
    }

    modal.classList.remove("is-open");

    const finish = () => {
      modal.hidden = true;
      if (activeModal === modal) activeModal = null;
      if (!activeModal) document.body.style.overflow = "";
      if (restoreFocus && lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
    };

    if (reduceMotion) {
      finish();
      return;
    }

    window.setTimeout(finish, 280);
  }

  function selectPlano(id) {
    if (!planoInput) return;
    planoInput.value = id || "";
    markValidity(planoTrigger, Boolean(id));
    updateValor();
    highlightSelectedPlan();
    closeModal(modalPlano);
  }

  function selectHorario(id) {
    if (!horarioInput) return;
    horarioInput.value = id || "";
    markValidity(horarioTrigger, Boolean(id));
    syncHorarioTrigger(selectedHorario());
    highlightSelectedHorario();
    closeModal(modalHorario);
  }

  function highlightSelectedPlan() {
    if (!planoOptions) return;
    const current = planoInput ? planoInput.value : "";
    planoOptions.querySelectorAll(".plan-option").forEach((btn) => {
      btn.classList.toggle("is-selected", btn.dataset.planoId === current);
    });
  }

  function highlightSelectedHorario() {
    if (!horarioOptions) return;
    const current = horarioInput ? horarioInput.value : "";
    horarioOptions.querySelectorAll(".plan-option").forEach((btn) => {
      btn.classList.toggle("is-selected", btn.dataset.horarioId === current);
    });
  }

  function planMeta(plano) {
    if (plano.tipo === "mensal") return "Mensal";
    if (plano.parcelas === 1) return "À vista";
    return `${plano.parcelas}×`;
  }

  function renderPlanGroup(title, items) {
    if (!items.length) return "";
    return `
      <div class="plan-group">
        <p class="plan-group__title">${title}</p>
        ${items
          .map(
            (plano) => `
          <button
            type="button"
            class="plan-option"
            data-plano-id="${plano.id}"
          >
            <span>${plano.label}</span>
            <span class="plan-option__meta">${planMeta(plano)}</span>
          </button>`
          )
          .join("")}
      </div>`;
  }

  function renderPlanos() {
    if (!planoOptions) return;

    const anuais = planos.filter((p) => p.tipo === "anual");
    const mensais = planos.filter((p) => p.tipo === "mensal");

    planoOptions.innerHTML = `
      <div class="plan-list">
        ${renderPlanGroup("Pacote anual", anuais)}
        ${renderPlanGroup("Pagamento mensal", mensais)}
      </div>
    `;

    planoOptions.querySelectorAll(".plan-option").forEach((btn) => {
      btn.addEventListener("click", () => selectPlano(btn.dataset.planoId));
    });

    highlightSelectedPlan();
    updateValor();
  }

  function renderHorarios() {
    if (!horarioOptions) return;

    horarios = Array.isArray(unidade.horarios) ? unidade.horarios : [];
    const local = unidade.local || "Local a confirmar";
    const dias = unidade.diasLabel || "Dias a confirmar";

    horarioOptions.innerHTML = `
      <div class="plan-list">
        <div class="plan-group">
          <p class="plan-group__title">${dias} · ${local}</p>
          ${horarios
            .map(
              (horario) => `
            <button
              type="button"
              class="plan-option"
              data-horario-id="${horario.id}"
            >
              <span>
                <strong>${horario.horario}</strong><br />
                <small>${horario.turma}</small>
              </span>
              <span class="plan-option__meta">${horario.dias}</span>
            </button>`
            )
            .join("")}
        </div>
      </div>
    `;

    horarioOptions.querySelectorAll(".plan-option").forEach((btn) => {
      btn.addEventListener("click", () => selectHorario(btn.dataset.horarioId));
    });

    highlightSelectedHorario();
    syncHorarioTrigger(selectedHorario());
  }

  function cleanupPdfHost_(host) {
    if (!host) return;
    try {
      if (host._pdfStyleEl && host._pdfStyleEl.parentNode) {
        host._pdfStyleEl.parentNode.removeChild(host._pdfStyleEl);
      }
    } catch (_) {
      /* ignore */
    }
    if (host.parentNode) host.parentNode.removeChild(host);
  }

  function waitTwoFrames_() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function getHtml2Canvas_() {
    if (typeof window.html2canvas === "function") return window.html2canvas;
    throw new Error(
      "html2canvas não disponível. Confira se o script CDN html2canvas carregou."
    );
  }

  function getJsPDF_() {
    if (window.jspdf && typeof window.jspdf.jsPDF === "function") {
      return window.jspdf.jsPDF;
    }
    if (typeof window.jsPDF === "function") return window.jsPDF;
    throw new Error(
      "jsPDF não disponível. Confira se o script CDN jspdf carregou."
    );
  }

  /** Fallback se html2canvas global falhar: API interna do html2pdf → toCanvas(). */
  async function captureHostCanvasViaHtml2Pdf_(host, scale) {
    if (typeof window.html2pdf !== "function") {
      throw new Error("html2pdf também indisponível.");
    }
    var canvas = await window
      .html2pdf()
      .set({
        html2canvas: {
          scale: scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: host.scrollWidth || 794,
          windowHeight: host.scrollHeight || host.offsetHeight,
        },
      })
      .from(host)
      .toCanvas();
    return canvas;
  }

  function countNonWhitePixels_(canvas, maxW, maxH) {
    try {
      var ctx = canvas.getContext("2d");
      var w = Math.min(maxW || 80, canvas.width);
      var h = Math.min(maxH || 80, canvas.height);
      var data = ctx.getImageData(0, 0, w, h).data;
      var nonWhite = 0;
      for (var i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) nonWhite++;
      }
      return nonWhite;
    } catch (err) {
      console.warn("[pdf-contrato] pixel sample failed", err);
      return -1;
    }
  }

  /** Uma imagem alta → várias páginas A4 (evita pagebreak do html2pdf que saía em branco). */
  function canvasToMultiPagePdfDataUri_(canvas) {
    var JsPDF = getJsPDF_();
    var pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    var pageW = pdf.internal.pageSize.getWidth();
    var pageH = pdf.internal.pageSize.getHeight();
    var margin = 10;
    var usableW = pageW - margin * 2;
    var usableH = pageH - margin * 2;
    var imgW = usableW;
    var imgH = (canvas.height * imgW) / canvas.width;
    var imgData = canvas.toDataURL("image/jpeg", 0.95);

    var heightLeft = imgH;
    var y = margin;
    pdf.addImage(imgData, "JPEG", margin, y, imgW, imgH);
    heightLeft -= usableH;

    while (heightLeft > 0.5) {
      y = margin - (imgH - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, y, imgW, imgH);
      heightLeft -= usableH;
    }

    return pdf.output("datauristring");
  }

  async function captureHostCanvas_(host, scale) {
    var canvas;
    try {
      var html2canvasFn = getHtml2Canvas_();
      canvas = await html2canvasFn(host, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: host.scrollWidth || 794,
        windowHeight: host.scrollHeight || host.offsetHeight,
      });
    } catch (err) {
      console.warn("[pdf-contrato] html2canvas direto falhou, tentando html2pdf.toCanvas", err);
      canvas = await captureHostCanvasViaHtml2Pdf_(host, scale);
    }
    var probe = canvas.toDataURL("image/jpeg", 0.5);
    var nonWhite = countNonWhitePixels_(canvas, 80, 80);
    console.info(
      "[pdf-contrato] scale=",
      scale,
      "canvas=",
      canvas.width,
      "x",
      canvas.height,
      "dataUrlPrefix=",
      probe.slice(0, 31),
      "dataUrlLen=",
      probe.length,
      "nonWhite80x80=",
      nonWhite
    );
    return { canvas: canvas, probe: probe, nonWhite: nonWhite };
  }

  /**
   * Fallback: captura em 2 metades (1–7 / 8–fim+assinatura) e une no jsPDF.
   * Usado se o canvas único vier quase branco (bug de elemento muito alto).
   */
  async function captureContratoSplitPdf_(scratchHtml) {
    var JsPDF = getJsPDF_();
    var pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    var margin = 10;
    var pageW = pdf.internal.pageSize.getWidth();
    var usableW = pageW - margin * 2;

    function buildPartialHost(nodes) {
      var host = document.createElement("div");
      host.style.cssText =
        "position:fixed;left:0;top:0;width:794px;padding:16px 20px;margin:0;background:#ffffff;color:#0f172a;font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:1.45;box-sizing:border-box;z-index:2147483646;opacity:1;visibility:visible;display:block;";
      nodes.forEach(function (n) {
        host.appendChild(n.cloneNode(true));
      });
      document.body.appendChild(host);
      void host.offsetHeight;
      return host;
    }

    var shell = document.createElement("div");
    shell.innerHTML = scratchHtml;
    var kids = Array.prototype.slice.call(shell.childNodes).filter(function (n) {
      return n.nodeType === 1;
    });
    var mid = Math.ceil(kids.length / 2);
    var partA = kids.slice(0, mid);
    var partB = kids.slice(mid);

    var hostA = buildPartialHost(partA);
    await waitTwoFrames_();
    var capA = await captureHostCanvas_(hostA, 1);
    cleanupPdfHost_(hostA);

    var hostB = buildPartialHost(partB);
    await waitTwoFrames_();
    var capB = await captureHostCanvas_(hostB, 1);
    cleanupPdfHost_(hostB);

    function addCanvasPages(canvas, isFirst) {
      var imgW = usableW;
      var imgH = (canvas.height * imgW) / canvas.width;
      var imgData = canvas.toDataURL("image/jpeg", 0.95);
      var pageH = pdf.internal.pageSize.getHeight();
      var usableH = pageH - margin * 2;
      var heightLeft = imgH;
      var y = margin;
      if (!isFirst) pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, y, imgW, imgH);
      heightLeft -= usableH;
      while (heightLeft > 0.5) {
        y = margin - (imgH - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, y, imgW, imgH);
        heightLeft -= usableH;
      }
    }

    if (capA.nonWhite < 5 && capB.nonWhite < 5) {
      throw new Error(
        "Canvas do contrato ficou branco mesmo em 2 partes (scale 1). nonWhite A/B=" +
          capA.nonWhite +
          "/" +
          capB.nonWhite
      );
    }

    addCanvasPages(capA.canvas, true);
    addCanvasPages(capB.canvas, false);
    console.info("[pdf-contrato] usou captura em 2 partes (split)");
    return pdf.output("datauristring");
  }

  /**
   * Monta host isolado com HTML + estilos inline (modal hidden não importa).
   */
  function buildContratoPdfHost_() {
    if (typeof window.html2canvas !== "function" && typeof window.html2pdf !== "function") {
      return null;
    }

    var article = modalContrato
      ? modalContrato.querySelector("#contract-article") ||
        modalContrato.querySelector(".contract__text")
      : null;
    if (!article) return null;

    fillContractPlaceholders();
    if (assinaturaOk && assinaturaDataUrl && assinaturaImg) {
      assinaturaImg.src = assinaturaDataUrl;
      assinaturaImg.hidden = false;
    }

    var scratch = document.createElement("div");
    scratch.innerHTML = article.innerHTML;

    scratch
      .querySelectorAll(
        "canvas, button, #limpar-assinatura, #assinatura-hint, .signature-block__hint"
      )
      .forEach(function (n) {
        n.remove();
      });

    var img = scratch.querySelector("#assinatura-img, img.signature-img");
    if (img && assinaturaDataUrl) {
      img.removeAttribute("hidden");
      img.setAttribute("src", assinaturaDataUrl);
      img.setAttribute(
        "style",
        "display:block;width:420px;max-width:100%;height:120px;object-fit:contain;object-position:left bottom;margin:8px 0 4px;border-bottom:1px solid #94a3b8;background:#ffffff;"
      );
    } else if (img) {
      img.remove();
    }

    var sigWrap = scratch.querySelector(".signature-pad-wrap");
    if (sigWrap) {
      sigWrap.setAttribute(
        "style",
        "border:none;padding:0;margin:0;background:#ffffff;min-height:120px;"
      );
    }
    var sigBlock = scratch.querySelector(".signature-block");
    if (sigBlock) {
      sigBlock.setAttribute(
        "style",
        "margin-top:18px;padding-top:12px;border-top:1px solid #cbd5e1;"
      );
    }

    scratch.querySelectorAll("h4").forEach(function (el) {
      el.setAttribute(
        "style",
        "margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;font-family:Georgia,'Times New Roman',serif;"
      );
    });
    scratch.querySelectorAll("h5").forEach(function (el) {
      el.setAttribute(
        "style",
        "margin:12px 0 4px;font-size:12px;font-weight:700;color:#0f172a;font-family:Georgia,'Times New Roman',serif;"
      );
    });
    scratch.querySelectorAll("p, li").forEach(function (el) {
      el.setAttribute(
        "style",
        "margin:0 0 6px;font-size:11px;line-height:1.45;color:#0f172a;font-family:Georgia,'Times New Roman',serif;"
      );
    });
    scratch.querySelectorAll("ul").forEach(function (el) {
      el.setAttribute("style", "margin:0 0 8px;padding-left:18px;color:#0f172a;");
    });

    var texto = String(scratch.innerText || "").replace(/\s+/g, " ").trim();
    console.info(
      "[pdf-contrato] texto=",
      texto.length,
      "html=",
      String(scratch.innerHTML || "").length
    );
    if (texto.length < 200) {
      throw new Error(
        "HTML do contrato veio vazio no PDF (texto=" +
          texto.length +
          "). Abra o contrato, assine e tente de novo."
      );
    }

    var host = document.createElement("div");
    host.id = "pdf-contrato-host";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "width:794px",
      "padding:16px 20px",
      "margin:0",
      "background:#ffffff",
      "color:#0f172a",
      "font-family:Georgia,'Times New Roman',serif",
      "font-size:11px",
      "line-height:1.45",
      "box-sizing:border-box",
      "z-index:2147483646",
      "opacity:1",
      "visibility:visible",
      "display:block",
      "overflow:visible",
      "height:auto",
      "max-height:none",
      "pointer-events:none",
    ].join(";");
    host.innerHTML = scratch.innerHTML;
    host._scratchHtml = scratch.innerHTML;

    document.body.appendChild(host);
    void host.offsetHeight;
    console.info(
      "[pdf-contrato] host size=",
      host.offsetWidth,
      "x",
      host.offsetHeight
    );
    if (host.offsetHeight < 80) {
      cleanupPdfHost_(host);
      throw new Error(
        "Host do PDF com altura zero (" + host.offsetHeight + "px)."
      );
    }

    return host;
  }

  /**
   * Pipeline: (1) scale 1 + jsPDF fatiado; se canvas branco → (3) split 2 partes.
   * Não usa html2pdf().set().from() — o pagebreak dele gerava 1 página branca.
   */
  async function renderContratoPdfDataUri_(host) {
    await waitTwoFrames_();

    // (1) scale 1 — reduz canvas (~1954px) vs scale 2 (~3908px)
    var cap = await captureHostCanvas_(host, 1);

    if (!cap.probe || cap.probe.indexOf("data:image") !== 0) {
      throw new Error(
        "toDataURL não retornou data:image (prefix=" +
          String(cap.probe || "").slice(0, 40) +
          ")"
      );
    }

    if (cap.nonWhite >= 5) {
      console.info("[pdf-contrato] approach=scale1+jsPDF-slice OK");
      return canvasToMultiPagePdfDataUri_(cap.canvas);
    }

    // Canvas único veio branco → (3) split
    console.warn(
      "[pdf-contrato] canvas scale1 quase branco; tentando split 2 partes"
    );
    var html = host._scratchHtml || host.innerHTML;
    cleanupPdfHost_(host);
    host._cleanedEarly = true;
    return await captureContratoSplitPdf_(html);
  }

  async function downloadContrato() {
    var downloadBtn = document.getElementById("download-contrato");
    var host = null;
    if (downloadBtn) {
      downloadBtn.disabled = true;
      setButtonLabel(downloadBtn, "Gerando PDF...");
    }

    try {
      host = buildContratoPdfHost_();
      if (!host) {
        setStatus(
          "Falha ao montar o PDF: biblioteca html2canvas/jsPDF indisponível."
        );
        return;
      }
      var dataUri = await renderContratoPdfDataUri_(host);
      if (host._cleanedEarly) host = null;
      var comma = dataUri.indexOf(",");
      var b64 = comma >= 0 ? dataUri.slice(comma + 1) : dataUri;
      var bytes = Uint8Array.from(atob(b64), function (c) {
        return c.charCodeAt(0);
      });
      var blob = new Blob([bytes], { type: "application/pdf" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "contrato-escolinha-futsal.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setStatus(
        "Falha ao baixar o PDF: " +
          (error && error.message ? error.message : String(error))
      );
    } finally {
      if (host && !host._cleanedEarly) cleanupPdfHost_(host);
      if (downloadBtn) {
        downloadBtn.disabled = false;
        setButtonLabel(downloadBtn, "Baixar contrato");
      }
    }
  }

  /** Gera PDF do contrato preenchido e devolve base64 (sem prefixo data:). */
  async function generateContratoPdfBase64() {
    var host = buildContratoPdfHost_();
    if (!host) {
      throw new Error(
        "Não foi possível montar o HTML do contrato para PDF (html2canvas/jsPDF)."
      );
    }
    try {
      var dataUri = await renderContratoPdfDataUri_(host);
      if (host._cleanedEarly) host = null;
      var comma = String(dataUri).indexOf(",");
      var b64 =
        comma >= 0 ? String(dataUri).slice(comma + 1) : String(dataUri);
      if (!b64 || b64.length < 64) {
        throw new Error("PDF gerado vazio ou inválido (base64 curto).");
      }
      return b64;
    } catch (error) {
      console.error(error);
      throw error instanceof Error
        ? error
        : new Error(String(error || "Falha desconhecida ao gerar PDF"));
    } finally {
      if (host && !host._cleanedEarly) cleanupPdfHost_(host);
    }
  }

  function initModals() {
    if (horarioTrigger && modalHorario) {
      horarioTrigger.addEventListener("click", () => openModal(modalHorario));
    }

    if (planoTrigger && modalPlano) {
      planoTrigger.addEventListener("click", () => openModal(modalPlano));
    }

    if (contractTrigger && modalContrato) {
      contractTrigger.addEventListener("click", () => openModal(modalContrato));
    }

    if (contratoScroll) {
      contratoScroll.addEventListener("scroll", checkContratoScrollEnd, { passive: true });
    }

    const downloadBtn = document.getElementById("download-contrato");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadContrato);
    }

    document.querySelectorAll("[data-modal-close]").forEach((el) => {
      el.addEventListener("click", (event) => {
        const targetId = el.getAttribute("data-modal-close");
        const target = document.getElementById(targetId);
        if (target === modalContrato && el.hasAttribute("disabled")) {
          event.preventDefault();
          setStatus(
            !contratoLidoAteFim
              ? "Role o contrato até o final para poder fechar."
              : "Assine o contrato para poder fechar."
          );
          return;
        }
        if (
          target === modalContrato &&
          el.classList.contains("modal__backdrop") &&
          !contratoPronto()
        ) {
          event.preventDefault();
          setStatus(
            !contratoLidoAteFim
              ? "Role o contrato até o final para poder fechar."
              : "Assine o contrato para poder fechar."
          );
          return;
        }
        closeModal(target);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && activeModal) {
        event.preventDefault();
        if (activeModal === modalContrato && !contratoPronto()) {
          setStatus(
            !contratoLidoAteFim
              ? "Role o contrato até o final para poder fechar."
              : "Assine o contrato para poder fechar."
          );
          return;
        }
        closeModal(activeModal);
      }
    });
  }

  initSignaturePad();
  initModals();
  setContratoLido(false);
  setAssinaturaOk(false, "");

  function maskCPF(value) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function isValidCPF(cpf) {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
    let rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== Number(digits[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    return rest === Number(digits[10]);
  }

  function setStatus(message, ok = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle("is-ok", ok);
  }

  function markValidity(input, valid) {
    if (!input) return;
    input.classList.toggle("is-invalid", !valid);
  }

  /** Link de pagar: unidade.paymentLinks[plano] → PAYMENT_LINKS global → oculto se placeholder. */
  function isPaymentLinkReady(href) {
    if (!href || href === "#") return false;
    const value = String(href).trim();
    if (!value) return false;
    if (/^COLE_AQUI_/i.test(value)) return false;
    if (!/^https?:\/\//i.test(value)) return false;
    return true;
  }

  function resolvePaymentLink(plano) {
    const unitLinks =
      unidade && unidade.paymentLinks && typeof unidade.paymentLinks === "object"
        ? unidade.paymentLinks
        : {};
    const globalLinks = config.PAYMENT_LINKS || {};
    const raw = unitLinks[plano.id] || globalLinks[plano.id] || "#";
    return isPaymentLinkReady(raw) ? String(raw).trim() : "#";
  }

  function syncPayLink(plano) {
    if (!payLink) return;
    const href = resolvePaymentLink(plano);
    const ready = isPaymentLinkReady(href);
    payLink.href = ready ? href : "#";
    payLink.hidden = !ready;
    payLink.style.display = ready ? "inline-flex" : "none";
    payLink.setAttribute("data-plano-id", plano.id || "");
    payLink.setAttribute("aria-hidden", ready ? "false" : "true");
    if (ready) {
      payLink.textContent = `Ir para o pagamento (${plano.label})`;
    } else {
      payLink.textContent = "Ir para o pagamento";
    }
  }

  function showSuccess(data, plano) {
    syncPayLink(plano);

    if (plano.tipo === "mensal") {
      successText.textContent =
        `${data.nome}, cadastro salvo em ${unidade.nome} (${plano.label}). Foi gerada 1 competência na aba Pagamentos.`;
    } else if (plano.parcelas > 1) {
      successText.textContent =
        `${data.nome}, cadastro salvo em ${unidade.nome} (${plano.label}). Foram geradas ${plano.parcelas} competências na aba Pagamentos.`;
    } else {
      successText.textContent =
        `${data.nome}, cadastro salvo em ${unidade.nome} (${plano.label}).`;
    }

    form.hidden = true;
    successPanel.hidden = false;
    setStatus("");
  }

  function maskPhone(value) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function isValidPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 11;
  }

  if (cpfInput) {
    cpfInput.addEventListener("input", () => {
      cpfInput.value = maskCPF(cpfInput.value);
    });
  }

  function isValidAlunoDocumento(value) {
    const raw = String(value || "").trim();
    if (!raw) return false;
    const digits = raw.replace(/\D/g, "");
    // Se parece CPF (11 dígitos), valida CPF; senão aceita como RG
    if (digits.length === 11 && /^[\d.\-\s]+$/.test(raw)) {
      return isValidCPF(raw);
    }
    return raw.length >= 4;
  }

  if (alunoCpfInput) {
    alunoCpfInput.addEventListener("input", () => {
      const raw = alunoCpfInput.value;
      const digits = raw.replace(/\D/g, "");
      // Máscara de CPF só enquanto digita só números até 11 dígitos
      if (digits.length > 0 && digits.length <= 11 && /^[\d.\-\s]*$/.test(raw)) {
        alunoCpfInput.value = maskCPF(raw);
      }
    });
  }

  if (telefoneInput) {
    telefoneInput.addEventListener("input", () => {
      telefoneInput.value = maskPhone(telefoneInput.value);
    });
  }

  renderHorarios();
  renderPlanos();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    const plano = selectedPlano();
    const horario = selectedHorario();
    const usoImagem = selectedUsoImagem();
    const alunoCpfRaw = (form.aluno_cpf?.value || "").trim();
    const data = {
      nome: form.nome.value.trim(),
      sobrenome: form.sobrenome.value.trim(),
      cpf: form.cpf.value.trim(),
      telefone: (form.telefone?.value || "").trim(),
      email: form.email.value.trim(),
      aluno_nome: (form.aluno_nome?.value || "").trim(),
      aluno_nascimento: (form.aluno_nascimento?.value || "").trim(),
      aluno_cpf: alunoCpfRaw,
      ciente: Boolean(cienteInput.checked),
      uso_imagem: usoImagem,
    };

    markValidity(form.nome, Boolean(data.nome));
    markValidity(form.sobrenome, Boolean(data.sobrenome));
    markValidity(form.email, form.email.checkValidity());
    const cpfOk = isValidCPF(data.cpf);
    markValidity(form.cpf, cpfOk);
    const telefoneOk = isValidPhone(data.telefone);
    markValidity(form.telefone, telefoneOk);
    markValidity(form.aluno_nome, Boolean(data.aluno_nome));
    markValidity(form.aluno_nascimento, Boolean(data.aluno_nascimento));
    const alunoCpfOk = isValidAlunoDocumento(alunoCpfRaw);
    markValidity(form.aluno_cpf, alunoCpfOk);
    markValidity(horarioTrigger, Boolean(horario));
    markValidity(planoTrigger, Boolean(plano));
    markValidity(contractTrigger, contratoPronto());
    markValidity(cienteInput.closest(".agree"), data.ciente);
    markValidity(
      form.querySelector(".field--imagem"),
      Boolean(usoImagem)
    );

    if (!horario) {
      setStatus("Selecione o local e o horário da turma para continuar.");
      horarioTrigger?.focus();
      return;
    }

    if (!plano) {
      setStatus("Selecione a parcela para continuar.");
      return;
    }

    if (
      !data.nome ||
      !data.sobrenome ||
      !form.email.checkValidity() ||
      !cpfOk ||
      !telefoneOk ||
      !data.aluno_nome ||
      !data.aluno_nascimento ||
      !alunoCpfOk
    ) {
      if (!cpfOk) setStatus("Informe um CPF válido do responsável.");
      else if (!telefoneOk) setStatus("Informe um Telefone/WhatsApp válido.");
      else if (!alunoCpfOk) setStatus("Informe o CPF ou RG do aluno.");
      else setStatus("Preencha os campos obrigatórios corretamente.");
      return;
    }

    if (!usoImagem) {
      setStatus("Informe se autoriza ou não o uso de imagem e voz.");
      return;
    }

    if (!contratoLidoAteFim || !assinaturaOk) {
      setStatus(
        !contratoLidoAteFim
          ? "Abra o contrato e role até o final antes de enviar."
          : "Assine o contrato no final da leitura antes de enviar."
      );
      contractTrigger?.focus();
      return;
    }

    if (!data.ciente) {
      setStatus("Marque que leu, assinou e está ciente do contrato para continuar.");
      return;
    }

    const scriptUrl = (config.GOOGLE_SCRIPT_URL || "").trim();
    if (!scriptUrl || scriptUrl === "COLE_A_URL_DO_APPS_SCRIPT_AQUI") {
      setStatus("Configure GOOGLE_SCRIPT_URL em config.js (veja README).");
      return;
    }

    const periodicidade =
      plano.tipo === "mensal"
        ? "Mensal"
        : plano.parcelas === 1
          ? "Anual à vista"
          : `Anual ${plano.parcelas}x`;

    submitBtn.disabled = true;
    setButtonLabel(submitBtn, "Gerando contrato...");

    let contratoPdfBase64 = "";
    try {
      contratoPdfBase64 = await generateContratoPdfBase64();
    } catch (error) {
      console.error(error);
      // Mantém formulário aberto (não marca sucesso) para retentar
      setStatus(
        "Falha ao gerar o PDF do contrato: " +
          (error && error.message ? error.message : String(error)) +
          " Abra o contrato, confira a assinatura e tente de novo."
      );
      submitBtn.disabled = false;
      setButtonLabel(submitBtn, "Continuar");
      return;
    }

    const payload = {
      nome: data.nome,
      sobrenome: data.sobrenome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email,
      aluno_nome: data.aluno_nome,
      data_nascimento: data.aluno_nascimento,
      aluno_cpf: data.aluno_cpf,
      plano_id: plano.id,
      plano_label: plano.label,
      periodicidade,
      tipo_plano: plano.tipo,
      meses: plano.parcelas,
      valor_mensal: plano.valorParcela,
      valor_total: plano.valorTotal,
      valor: formatBRL(plano.valorTotal),
      status_pagamento: "Pendente",
      // Servidor só grava "Contrato ciente = Sim" depois do PDF no Drive
      contrato_ciente: true,
      contrato_assinado: true,
      uso_imagem: data.uso_imagem,
      contrato_pdf_base64: contratoPdfBase64,
      assinatura_data_url: assinaturaDataUrl,
      clube: unidade.nome,
      unidade_id: unidade.id,
      unidade_nome: unidade.nome,
      aba: unidade.aba || unidade.nome,
      horario_id: horario.id,
      local: horario.local || unidade.local || "",
      dias: horario.dias,
      horario: horario.horario,
      turma: horario.turma,
      horario_label: horario.label,
    };

    setButtonLabel(submitBtn, "Enviando...");

    try {
      // text/plain evita preflight CORS bloqueado pelo Apps Script
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      let result = null;
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch (_) {
        // Alguns redirects do Apps Script retornam HTML; se chegou 200, segue
      }

      if (result && result.success === false) {
        throw new Error(result.message || "Falha no envio");
      }

      if (!response.ok && !result) {
        throw new Error("HTTP " + response.status);
      }

      // Só conclui se o servidor gravou E salvou o PDF (URL de Drive)
      if (result && !result.contrato_pdf_url) {
        throw new Error(
          "Cadastro sem link do PDF no Drive. O contrato não foi confirmado — tente de novo."
        );
      }

      showSuccess(data, plano);
    } catch (error) {
      console.error(error);
      // Formulário permanece — usuário pode retentar (status ainda não é “assinado” no sheet)
      setStatus(
        "Não foi possível concluir o cadastro: " +
          (error && error.message ? error.message : String(error))
      );
    } finally {
      submitBtn.disabled = false;
      setButtonLabel(submitBtn, "Continuar");
    }
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    if (planoInput) planoInput.value = "";
    if (horarioInput) horarioInput.value = "";
    setContratoLido(false);
    resetAssinatura();
    markValidity(contractTrigger, true);
    renderHorarios();
    renderPlanos();
    form.hidden = false;
    successPanel.hidden = true;
    setStatus("");
    form.nome.focus();
  });
})();
