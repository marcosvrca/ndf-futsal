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
  const planosAnuais = document.getElementById("planos-anuais");
  const planosMensais = document.getElementById("planos-mensais");

  const planos = Array.isArray(config.PLANOS) ? config.PLANOS : [];

  function formatBRL(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getPlanoById(id) {
    return planos.find((p) => p.id === id) || null;
  }

  function selectedPlano() {
    const checked = form.querySelector('input[name="plano"]:checked');
    return checked ? getPlanoById(checked.value) : null;
  }

  function selectedUsoImagem() {
    const checked = form.querySelector('input[name="uso_imagem"]:checked');
    return checked ? checked.value : "";
  }

  function updateValor() {
    const plano = selectedPlano();
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

  function renderPlanos() {
    const anuais = planos.filter((p) => p.tipo === "anual");
    const mensais = planos.filter((p) => p.tipo === "mensal");

    planosAnuais.innerHTML = anuais
      .map(
        (plano, index) => `
      <label class="plan">
        <input type="radio" name="plano" value="${plano.id}" ${index === 0 ? "checked" : ""} required />
        <span>${plano.label}</span>
      </label>`
      )
      .join("");

    planosMensais.innerHTML = mensais
      .map(
        (plano) => `
      <label class="plan">
        <input type="radio" name="plano" value="${plano.id}" />
        <span>${plano.label}</span>
      </label>`
      )
      .join("");

    form.querySelectorAll('input[name="plano"]').forEach((radio) => {
      radio.addEventListener("change", updateValor);
    });

    updateValor();
  }

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
        `${data.nome}, cadastro salvo (${plano.label}). Foi gerada 1 competência na aba Pagamentos.`;
    } else if (plano.parcelas > 1) {
      successText.textContent =
        `${data.nome}, cadastro salvo (${plano.label}). Foram geradas ${plano.parcelas} competências na aba Pagamentos.`;
    } else {
      successText.textContent =
        `${data.nome}, cadastro salvo (${plano.label}) na planilha.`;
    }

    form.hidden = true;
    successPanel.hidden = false;
    setStatus("");
  }

  cpfInput.addEventListener("input", () => {
    cpfInput.value = maskCPF(cpfInput.value);
  });

  renderPlanos();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    const plano = selectedPlano();
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
    markValidity(cienteInput.closest(".agree"), data.ciente);
    markValidity(
      form.querySelector(".field--imagem"),
      Boolean(usoImagem)
    );

    if (!plano) {
      setStatus("Selecione uma opção de pagamento.");
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
      clube: config.CLUBE_NOME || "NDF Futsal",
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

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
      submitBtn.textContent = "Continuar";
    }
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    renderPlanos();
    form.hidden = false;
    successPanel.hidden = true;
    setStatus("");
    form.nome.focus();
  });
})();
