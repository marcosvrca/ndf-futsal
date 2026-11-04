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

  const multipliers = {
    Mensal: 1,
    Trimestral: 3,
    Semestral: 6,
    Anual: 12,
  };

  function formatBRL(value) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function selectedPeriod() {
    const checked = form.querySelector('input[name="periodicidade"]:checked');
    return checked ? checked.value : "Mensal";
  }

  function updateValor() {
    const base = Number(config.VALOR_MENSAL) || 0;
    const period = selectedPeriod();
    const total = base * (multipliers[period] || 1);
    valorResumo.innerHTML = `Valor estimado: <strong>${formatBRL(total)}</strong> (${period.toLowerCase()})`;
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
    input.classList.toggle("is-invalid", !valid);
  }

  cpfInput.addEventListener("input", () => {
    cpfInput.value = maskCPF(cpfInput.value);
  });

  form.querySelectorAll('input[name="periodicidade"]').forEach((radio) => {
    radio.addEventListener("change", updateValor);
  });

  updateValor();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    const data = {
      nome: form.nome.value.trim(),
      sobrenome: form.sobrenome.value.trim(),
      cpf: form.cpf.value.trim(),
      email: form.email.value.trim(),
      periodicidade: selectedPeriod(),
    };

    let valid = true;
    markValidity(form.nome, Boolean(data.nome));
    markValidity(form.sobrenome, Boolean(data.sobrenome));
    markValidity(form.email, form.email.checkValidity());
    const cpfOk = isValidCPF(data.cpf);
    markValidity(form.cpf, cpfOk);

    if (!data.nome || !data.sobrenome || !form.email.checkValidity() || !cpfOk) {
      valid = false;
    }

    if (!valid) {
      setStatus(cpfOk ? "Preencha os campos obrigatórios corretamente." : "Informe um CPF válido.");
      return;
    }

    const accessKey = (config.WEB3FORMS_ACCESS_KEY || "").trim();
    if (!accessKey || accessKey === "COLE_SUA_CHAVE_AQUI") {
      setStatus("Configure WEB3FORMS_ACCESS_KEY em config.js (grátis em web3forms.com).");
      return;
    }

    const total =
      (Number(config.VALOR_MENSAL) || 0) * (multipliers[data.periodicidade] || 1);

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Mensalidade ${data.periodicidade} — ${config.CLUBE_NOME || "NDF Futsal"}`,
          from_name: `${data.nome} ${data.sobrenome}`,
          nome: data.nome,
          sobrenome: data.sobrenome,
          cpf: data.cpf,
          email: data.email,
          periodicidade: data.periodicidade,
          valor: formatBRL(total),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Falha no envio");
      }

      const links = config.PAYMENT_LINKS || {};
      const href = links[data.periodicidade] || "#";
      payLink.href = href;
      payLink.style.display = href === "#" ? "none" : "inline-flex";

      successText.textContent = `${data.nome}, seu cadastro (${data.periodicidade} — ${formatBRL(total)}) foi enviado.`;
      form.hidden = true;
      successPanel.hidden = false;
      setStatus("");
    } catch (error) {
      console.error(error);
      setStatus("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Continuar";
    }
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    updateValor();
    form.hidden = false;
    successPanel.hidden = true;
    setStatus("");
    form.nome.focus();
  });
})();
