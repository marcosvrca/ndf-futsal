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
 * 2) Links Mercado Pago (opcional, por plano):
 *    - Crie um link por opção de pagamento
 *    - Cole em PAYMENT_LINKS usando o id do plano
 *
 * 3) Unidades:
 *    - Ajuste nome, local, slogan e HORARIOS de cada unidade abaixo
 */
window.NDF_CONFIG = {
  // URL da implantação do Apps Script (termina com /exec)
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzC7UYY24Q6Bjm-y5nrBw7BnzvSuRytuoi46MNKRf60Q1pAjRBJYx5m8TOYooMBlFvaHw/exec",

  // Pacote anual (parcelado) + opção mensal avulsa — igual para todas as unidades
  PLANOS: [
    { id: "1x", label: "Parcela Única de R$ 2.160,00", parcelas: 1, valorParcela: 2160, valorTotal: 2160, tipo: "anual" },
    { id: "2x", label: "2 Parcelas de R$ 1.080,00", parcelas: 2, valorParcela: 1080, valorTotal: 2160, tipo: "anual" },
    { id: "3x", label: "3 Parcelas de R$ 720,00", parcelas: 3, valorParcela: 720, valorTotal: 2160, tipo: "anual" },
    { id: "4x", label: "4 Parcelas de R$ 540,00", parcelas: 4, valorParcela: 540, valorTotal: 2160, tipo: "anual" },
    { id: "5x", label: "5 Parcelas de R$ 432,00", parcelas: 5, valorParcela: 432, valorTotal: 2160, tipo: "anual" },
    { id: "6x", label: "6 Parcelas de R$ 360,00", parcelas: 6, valorParcela: 360, valorTotal: 2160, tipo: "anual" },
    { id: "7x", label: "7 Parcelas de R$ 308,57", parcelas: 7, valorParcela: 308.57, valorTotal: 2160, tipo: "anual" },
    { id: "8x", label: "8 Parcelas de R$ 270,00", parcelas: 8, valorParcela: 270, valorTotal: 2160, tipo: "anual" },
    { id: "9x", label: "9 Parcelas de R$ 240,00", parcelas: 9, valorParcela: 240, valorTotal: 2160, tipo: "anual" },
    { id: "10x", label: "10 Parcelas de R$ 216,00", parcelas: 10, valorParcela: 216, valorTotal: 2160, tipo: "anual" },
    { id: "11x", label: "11 Parcelas de R$ 196,36", parcelas: 11, valorParcela: 196.36, valorTotal: 2160, tipo: "anual" },
    { id: "12x", label: "12 Parcelas de R$ 180,00", parcelas: 12, valorParcela: 180, valorTotal: 2160, tipo: "anual" },
    { id: "mensal", label: "Parcela de R$ 260,00", parcelas: 1, valorParcela: 260, valorTotal: 260, tipo: "mensal" },
  ],

  PAYMENT_LINKS: {
    "1x": "#",
    "2x": "#",
    "3x": "#",
    "4x": "#",
    "5x": "#",
    "6x": "#",
    "7x": "#",
    "8x": "#",
    "9x": "#",
    "10x": "#",
    "11x": "#",
    "12x": "#",
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
      nome: "COOP/Taquaralto Futsal",
      aba: "COOP/Taquaralto Futsal",
      slogan: "Formando atletas com disciplina e alegria",
      local: "Prisma Taquaralto",
      diasLabel: "Terça e Quinta",
      horarios: [
        {
          id: "coop-t3-1400-sub10",
          dias: "Terça e Quinta",
          horario: "14:00 às 15:00",
          turma: "SUB10",
          local: "Prisma Taquaralto",
          label: "14:00 às 15:00 — SUB10",
        },
        {
          id: "coop-t3-1500-sub12",
          dias: "Terça e Quinta",
          horario: "15:00 às 16:00",
          turma: "SUB12",
          local: "Prisma Taquaralto",
          label: "15:00 às 16:00 — SUB12",
        },
      ],
    },
    flapalmas: {
      id: "flapalmas",
      nome: "COOP/Fla Palmas",
      aba: "COOP/Fla Palmas",
      slogan: "Por um esporte que qualifica e unifica",
      local: "906 Sul",
      diasLabel: "Segunda e Quarta",
      horarios: [
        {
          id: "fla-segqua-14-sub8-9",
          dias: "Segunda e Quarta",
          horario: "14:00 às 15:10",
          turma: "SUB8 e SUB9",
          local: "906 Sul",
          label: "14:00 às 15:10 — SUB8 e SUB9",
        },
        {
          id: "fla-segqua-1510-sub11-12",
          dias: "Segunda e Quarta",
          horario: "15:10 às 16:20",
          turma: "SUB11 e SUB12",
          local: "906 Sul",
          label: "15:10 às 16:20 — SUB11 e SUB12",
        },
        {
          id: "fla-segqua-1620-sub10",
          dias: "Segunda e Quarta",
          horario: "16:20 às 17:30",
          turma: "SUB10",
          local: "906 Sul",
          label: "16:20 às 17:30 — SUB10",
        },
      ],
    },
    "monteiro-lobato": {
      id: "monteiro-lobato",
      nome: "Monteiro Lobato Futsal",
      aba: "Monteiro Lobato Futsal",
      slogan: "Esporte e educação no mesmo ritmo",
      local: "Escola Monteiro Lobato",
      diasLabel: "Segunda e Quarta",
      horarios: [
        {
          id: "ml-segqua-1730-2019-2017",
          dias: "Segunda e Quarta",
          horario: "17:30 às 18:30",
          turma: "Nascidos 2019, 2018 e 2017",
          local: "Escola Monteiro Lobato",
          label: "17:30 às 18:30 — Nascidos 2019, 2018 e 2017",
        },
        {
          id: "ml-segqua-1830-2016-2014",
          dias: "Segunda e Quarta",
          horario: "18:30 às 19:30",
          turma: "Nascidos 2016, 2015 e 2014",
          local: "Escola Monteiro Lobato",
          label: "18:30 às 19:30 — Nascidos 2016, 2015 e 2014",
        },
        {
          id: "ml-segqua-1930-2013-2011",
          dias: "Segunda e Quarta",
          horario: "19:30 às 20:30",
          turma: "Nascidos 2013, 2012 e 2011",
          local: "Escola Monteiro Lobato",
          label: "19:30 às 20:30 — Nascidos 2013, 2012 e 2011",
        },
      ],
    },
  },
};
