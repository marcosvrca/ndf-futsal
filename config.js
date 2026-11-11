/**
 * Configuração do site — edite estes valores.
 *
 * 1) Google Sheets (grátis, sem limite prático de envios):
 *    - Crie uma planilha no Google Drive
 *    - Extensões → Apps Script → cole o código de google-apps-script/Code.gs
 *    - Implantar → Nova implantação → App da Web
 *      Executar como: Eu | Quem tem acesso: Qualquer pessoa
 *    - Cole a URL da implantação em GOOGLE_SCRIPT_URL
 *
 * 2) Links Mercado Pago (opcional, por plano):
 *    - Crie um link por opção de pagamento
 *    - Cole em PAYMENT_LINKS usando o id do plano
 */
window.NDF_CONFIG = {
  // URL da implantação do Apps Script (termina com /exec)
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzC7UYY24Q6Bjm-y5nrBw7BnzvSuRytuoi46MNKRf60Q1pAjRBJYx5m8TOYooMBlFvaHw/exec",

  CLUBE_NOME: "COOP/FLAPALMAS FUTSAL",

  // Pacote anual (parcelado) + opção mensal avulsa
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

  // Links de pagamento por id do plano (Mercado Pago)
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
};
