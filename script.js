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
  const cienteInput = document.getElementById("ciente");
  const planoInput = document.getElementById("plano");
  const planoTrigger = document.getElementById("plano-trigger");
  const planoTriggerText = document.getElementById("plano-trigger-text");
  const planoOptions = document.getElementById("plano-options");
  const horarioInput = document.getElementById("horario");
  const horarioTrigger = document.getElementById("horario-trigger");
  const horarioTriggerText = document.getElementById("horario-trigger-text");
  const horarioOptions = document.getElementById("horario-options");
  const contractTrigger = document.getElementById("contract-trigger");
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

  let unidade = unidades[unidadeId] || (unidadeId === "copy" ? unidades.copp : null) || null;
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

  const planos = Array.isArray(config.PLANOS) ? config.PLANOS : [];
  let horarios = Array.isArray(unidade.horarios) ? unidade.horarios : [];
  let activeModal = null;
  let lastFocus = null;
  let contratoVisualizado = false;

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

  function openModal(modal) {
    if (!modal || activeModal === modal) return;
    if (activeModal) closeModal(activeModal, { restoreFocus: false });

    lastFocus = document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      const focusTarget =
        modal.querySelector("[data-modal-close].modal__close") ||
        modal.querySelector("button, [href], input, select, textarea");
      if (focusTarget) focusTarget.focus();
    });
  }

  function closeModal(modal, { restoreFocus = true } = {}) {
    if (!modal) return;

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

  async function downloadContrato() {
    const article = modalContrato
      ? modalContrato.querySelector(".contract__text")
      : null;
    const downloadBtn = document.getElementById("download-contrato");
    if (!article) return;

    if (typeof window.html2pdf !== "function") {
      setStatus("Não foi possível gerar o PDF agora. Recarregue a página e tente de novo.");
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.style.cssText =
      "position:fixed;left:-10000px;top:0;width:720px;padding:28px 32px;background:#ffffff;color:#0f172a;font-family:Georgia,'Times New Roman',serif;line-height:1.55;font-size:12px;";
    const clone = article.cloneNode(true);
    clone.style.color = "#0f172a";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    if (downloadBtn) {
      downloadBtn.disabled = true;
      setButtonLabel(downloadBtn, "Gerando PDF...");
    }

    try {
      await window
        .html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename: "contrato-escolinha-ndf.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(wrapper)
        .save();
    } catch (error) {
      console.error(error);
      setStatus("Não foi possível baixar o contrato em PDF. Tente novamente.");
    } finally {
      wrapper.remove();
      if (downloadBtn) {
        downloadBtn.disabled = false;
        setButtonLabel(downloadBtn, "Baixar contrato");
      }
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
      contractTrigger.addEventListener("click", () => {
        contratoVisualizado = true;
        markValidity(contractTrigger, true);
        openModal(modalContrato);
      });
    }

    const downloadBtn = document.getElementById("download-contrato");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadContrato);
    }

    document.querySelectorAll("[data-modal-close]").forEach((el) => {
      el.addEventListener("click", () => {
        const target = document.getElementById(el.getAttribute("data-modal-close"));
        closeModal(target);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && activeModal) {
        event.preventDefault();
        closeModal(activeModal);
      }
    });
  }

  initModals();

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

  function showSuccess(data, plano) {
    const links = config.PAYMENT_LINKS || {};
    const href = links[plano.id] || "#";
    payLink.href = href;
    payLink.style.display = href === "#" ? "none" : "inline-flex";

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

  cpfInput.addEventListener("input", () => {
    cpfInput.value = maskCPF(cpfInput.value);
  });

  renderHorarios();
  renderPlanos();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    const plano = selectedPlano();
    const horario = selectedHorario();
    const usoImagem = selectedUsoImagem();
    const data = {
      nome: form.nome.value.trim(),
      sobrenome: form.sobrenome.value.trim(),
      cpf: form.cpf.value.trim(),
      email: form.email.value.trim(),
      ciente: Boolean(cienteInput.checked),
      uso_imagem: usoImagem,
    };

    markValidity(form.nome, Boolean(data.nome));
    markValidity(form.sobrenome, Boolean(data.sobrenome));
    markValidity(form.email, form.email.checkValidity());
    const cpfOk = isValidCPF(data.cpf);
    markValidity(form.cpf, cpfOk);
    markValidity(horarioTrigger, Boolean(horario));
    markValidity(planoTrigger, Boolean(plano));
    markValidity(contractTrigger, contratoVisualizado);
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

    if (!data.nome || !data.sobrenome || !form.email.checkValidity() || !cpfOk) {
      setStatus(cpfOk ? "Preencha os campos obrigatórios corretamente." : "Informe um CPF válido.");
      return;
    }

    if (!usoImagem) {
      setStatus("Informe se autoriza ou não o uso de imagem e voz.");
      return;
    }

    if (!contratoVisualizado) {
      setStatus("Abra e visualize o contrato em “Ver contrato” antes de enviar.");
      contractTrigger?.focus();
      return;
    }

    if (!data.ciente) {
      setStatus("Marque que leu e está ciente do contrato para continuar.");
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

    const payload = {
      nome: data.nome,
      sobrenome: data.sobrenome,
      cpf: data.cpf,
      email: data.email,
      plano_id: plano.id,
      plano_label: plano.label,
      periodicidade,
      tipo_plano: plano.tipo,
      meses: plano.parcelas,
      valor_mensal: plano.valorParcela,
      valor_total: plano.valorTotal,
      valor: formatBRL(plano.valorTotal),
      status_pagamento: "Pendente",
      contrato_ciente: true,
      uso_imagem: data.uso_imagem,
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

    submitBtn.disabled = true;
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

      showSuccess(data, plano);
    } catch (error) {
      console.error(error);
      setStatus("Não foi possível salvar na planilha. Confira a URL do Apps Script.");
    } finally {
      submitBtn.disabled = false;
      setButtonLabel(submitBtn, "Continuar");
    }
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    if (planoInput) planoInput.value = "";
    if (horarioInput) horarioInput.value = "";
    contratoVisualizado = false;
    markValidity(contractTrigger, true);
    renderHorarios();
    renderPlanos();
    form.hidden = false;
    successPanel.hidden = true;
    setStatus("");
    form.nome.focus();
  });
})();
