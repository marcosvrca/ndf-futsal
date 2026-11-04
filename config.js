/**
 * Configuração do site — edite estes valores.
 *
 * 1) Web3Forms (grátis): https://web3forms.com
 *    - Crie a chave com o e-mail do clube
 *    - Cole em WEB3FORMS_ACCESS_KEY
 *
 * 2) Links Mercado Pago (assinatura / payment link):
 *    - Crie um link por periodicidade no app/site do Mercado Pago
 *    - Cole em PAYMENT_LINKS
 */
window.NDF_CONFIG = {
  // Substitua pela sua chave do Web3Forms
  WEB3FORMS_ACCESS_KEY: "0a4afb91-9c4d-40f6-9e2f-ec38eee59bc2",
  // E-mail que aparece no assunto (o destino real é o da chave Web3Forms)
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
