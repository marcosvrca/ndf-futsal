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
 * 2) Links Mercado Pago (assinatura / payment link):
 *    - Crie um link por periodicidade no app/site do Mercado Pago
 *    - Cole em PAYMENT_LINKS
 */
window.NDF_CONFIG = {
  // URL da implantação do Apps Script (termina com /exec)
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzC7UYY24Q6Bjm-y5nrBw7BnzvSuRytuoi46MNKRf60Q1pAjRBJYx5m8TOYooMBlFvaHw/exec",

  CLUBE_NOME: "COOP/FLAPALMAS FUTSAL",

  // Valor base mensal em reais
  VALOR_MENSAL: 10,

  // Links de pagamento por periodicidade (Mercado Pago)
  PAYMENT_LINKS: {
    Mensal: "#",
    Trimestral: "#",
    Semestral: "#",
    Anual: "#",
  },
};
