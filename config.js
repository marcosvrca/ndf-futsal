/**
 * Configuração do site — edite estes valores.
 *
 * 1) Google Sheets (grátis, sem limite prático de envios):
 *    - Crie uma planilha no Google Drive
 *    - Extensões → Apps Script → cole o código de google-apps-script/Code.gs
 *    - Implantar → Nova implantação → App da Web
 *      Executar como: Eu | Quem tem acesso: Qualquer pessoa
 *    - Cole a URL da implantação em GOOGLE_SCRIPT_URL
 *    - Rode setupPlanilha() para criar uma aba por unidade
 *
 * 2) Links Mercado Pago (opcional):
 *    - Globais: PAYMENT_LINKS (COOP e fallback)
 *    - Por unidade: UNIDADES[id].paymentLinks (ativos quando URL real)
 *    - Ideia (não usada): UNIDADES[id].paymentLinksIdeia — script NÃO lê
 *    - Enquanto o valor for placeholder (COLE_AQUI_...) ou "#", o botão de pagar fica oculto
 *
 * 3) Unidades:
 *    - Ajuste nome, local, slogan, HORARIOS e paymentLinks
 */
window.NDF_CONFIG = {
  // URL da implantação do Apps Script (termina com /exec)
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxOOL0z3kU6nu1GDThQulT5L5OmQnVsk63VT5xcozQj9nJOuTDufDxCAT2stRuNJ53Ipg/exec",

  // WhatsApp do responsável pela escolinha (somente dígitos com DDI)
  WHATSAPP_ESCOLINHA: "556381150191",

  // Pacote anual / semestral + opção mensal avulsa — COOP Futsal e COOP/FLAPALMAS.
  PLANOS: [
    { id: "1x", label: "Parcela Única de R$ 2.000,00", parcelas: 1, valorParcela: 2000, valorTotal: 2000, tipo: "anual" },
    { id: "2x", label: "2 Parcelas de R$ 1.080,00", parcelas: 2, valorParcela: 1080, valorTotal: 2160, tipo: "anual" },
    { id: "3x", label: "3 Parcelas de R$ 720,00", parcelas: 3, valorParcela: 720, valorTotal: 2160, tipo: "anual" },
    { id: "4x", label: "4 Parcelas de R$ 540,00", parcelas: 4, valorParcela: 540, valorTotal: 2160, tipo: "anual" },
    { id: "5x", label: "5 Parcelas de R$ 432,00", parcelas: 5, valorParcela: 432, valorTotal: 2160, tipo: "anual" },
    { id: "8x", label: "8 Parcelas de R$ 270,00", parcelas: 8, valorParcela: 270, valorTotal: 2160, tipo: "anual" },
    { id: "9x", label: "9 Parcelas de R$ 240,00", parcelas: 9, valorParcela: 240, valorTotal: 2160, tipo: "anual" },
    { id: "10x", label: "10 Parcelas de R$ 220,00", parcelas: 10, valorParcela: 220, valorTotal: 2200, tipo: "anual" },
    { id: "11x", label: "11 Parcelas de R$ 200,00", parcelas: 11, valorParcela: 200, valorTotal: 2200, tipo: "anual" },
    { id: "semestral-1x", label: "Semestral — Parcela Única de R$ 1.500,00", parcelas: 1, valorParcela: 1500, valorTotal: 1500, tipo: "semestral" },
    { id: "semestral-6x", label: "Semestral — 6 Parcelas de R$ 255,00", parcelas: 6, valorParcela: 255, valorTotal: 1530, tipo: "semestral" },
    { id: "mensal", label: "Parcela de R$ 260,00", parcelas: 1, valorParcela: 260, valorTotal: 260, tipo: "mensal" },
  ],

  // Fallback global (COOP e COOP/FLAPALMAS). "#" = ainda sem link.
  PAYMENT_LINKS: {
    "1x": "#",
    "2x": "#",
    "3x": "#",
    "4x": "#",
    "5x": "#",
    "8x": "#",
    "9x": "#",
    "10x": "#",
    "11x": "#",
    "semestral-1x": "#",
    "semestral-6x": "#",
    mensal: "#",
  },

  /**
   * Unidades da escolinha.
   * `aba` = nome exato da aba na planilha Google Sheets.
   * Ajuste local/horários quando tiver a grade definitiva.
   */
  UNIDADES: {
    // id da URL: ?unidade=coop (aliases "copp", "copy" e "taquaralto" no script)
    coop: {
      id: "coop",
      nome: "COOP Futsal",
      aba: "COOP Futsal",
      slogan: "Formando atletas com disciplina e alegria",
      local: "Prisma Taquaralto",
      diasLabel: "Terça e Quinta",
      /**
       * Links Mercado Pago — COOP Futsal.
       * Substitua cada COLE_AQUI_... pela URL real. Placeholders mantêm o botão oculto.
       */
      paymentLinks: {
        "1x": "COLE_AQUI_TAQUARALTO_LINK_AVISTA", // à vista R$ 2.000
        "5x": "COLE_AQUI_TAQUARALTO_LINK_5X", // 5× R$ 432
        "8x": "COLE_AQUI_TAQUARALTO_LINK_8X", // 8× R$ 270
        "10x": "COLE_AQUI_TAQUARALTO_LINK_10X", // 10× R$ 220
        "11x": "COLE_AQUI_TAQUARALTO_LINK_11X", // 11× R$ 200
        "semestral-1x": "COLE_AQUI_TAQUARALTO_LINK_SEMESTRAL_AVISTA", // à vista R$ 1.500
        "semestral-6x": "COLE_AQUI_TAQUARALTO_LINK_SEMESTRAL_6X", // 6× R$ 255
      },
      // IDEIA (não usado): assinatura Preapproval mensal avulsa — script.js NÃO lê este objeto
      paymentLinksIdeia: {
        mensal: "COLE_AQUI_TAQUARALTO_LINK_MENSAL",
      },
      horarios: [
        {
          id: "coop-t3-1400-nascidos-2018-2020",
          dias: "Terça e Quinta",
          horario: "14:00 às 15:00",
          turma: "Nascidos 2018, 2019, 2020",
          local: "Prisma Taquaralto",
          label: "14:00 às 15:00 — Nascidos 2018, 2019, 2020",
        },
        {
          id: "coop-t3-1500-nascidos-2015-2017",
          dias: "Terça e Quinta",
          horario: "15:00 às 16:00",
          turma: "Nascidos 2017, 2016, 2015",
          local: "Prisma Taquaralto",
          label: "15:00 às 16:00 — Nascidos 2017, 2016, 2015",
        },
      ],
    },
    flapalmas: {
      id: "flapalmas",
      nome: "COOP/FLAPALMAS",
      aba: "COOP/FLAPALMAS",
      slogan: "Por um esporte que qualifica e unifica",
      local: "906 Sul",
      diasLabel: "Segunda e Quarta",
      /**
       * Links Mercado Pago — COOP/FLAPALMAS.
       * Substitua cada COLE_AQUI_... pela URL real. Placeholders mantêm o botão oculto.
       */
      paymentLinks: {
        "1x": "COLE_AQUI_FLAPALMAS_LINK_AVISTA", // à vista R$ 2.000
        "5x": "COLE_AQUI_FLAPALMAS_LINK_5X", // 5× R$ 432
        "8x": "COLE_AQUI_FLAPALMAS_LINK_8X", // 8× R$ 270
        "10x": "COLE_AQUI_FLAPALMAS_LINK_10X", // 10× R$ 220
        "11x": "COLE_AQUI_FLAPALMAS_LINK_11X", // 11× R$ 200
        "semestral-1x": "COLE_AQUI_FLAPALMAS_LINK_SEMESTRAL_AVISTA", // à vista R$ 1.500
        "semestral-6x": "COLE_AQUI_FLAPALMAS_LINK_SEMESTRAL_6X", // 6× R$ 255
      },
      // IDEIA (não usado): assinatura Preapproval mensal avulsa — script.js NÃO lê este objeto
      paymentLinksIdeia: {
        mensal: "COLE_AQUI_FLAPALMAS_LINK_MENSAL",
      },
      horarios: [
        {
          id: "fla-segqua-1400-sub8-9",
          dias: "Segunda e Quarta",
          horario: "14:00 às 15:00",
          turma: "SUB8 e SUB9",
          local: "906 Sul",
          label: "14:00 às 15:00 — SUB8 e SUB9",
        },
        {
          id: "fla-segqua-1500-sub10",
          dias: "Segunda e Quarta",
          horario: "15:00 às 16:00",
          turma: "SUB10",
          local: "906 Sul",
          label: "15:00 às 16:00 — SUB10",
        },
        {
          id: "fla-segqua-1600-sub11-12",
          dias: "Segunda e Quarta",
          horario: "16:00 às 17:20",
          turma: "SUB11 e SUB12",
          local: "906 Sul",
          label: "16:00 às 17:20 — SUB11 e SUB12",
        },
        {
          id: "fla-segqua-1720-sub12-13",
          dias: "Segunda e Quarta",
          horario: "17:20 às 18:30",
          turma: "SUB12 e SUB13",
          local: "906 Sul",
          label: "17:20 às 18:30 — SUB12 e SUB13",
        },
      ],
    },
  },
};
