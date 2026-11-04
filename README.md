# NDF Futsal — Formulário de Mensalidade

Landing page estática (HTML/CSS/JS) para cobrança de mensalidade da **COOP/FLAPALMAS FUTSAL**, pronta para **GitHub Pages** (grátis).

## O que tem

- Formulário: nome, sobrenome, CPF, e-mail e periodicidade
- Validação de CPF
- Cálculo do valor (base × período)
- Envio por e-mail via [Web3Forms](https://web3forms.com) (grátis)
- Botão de pagamento por periodicidade (Mercado Pago)

## Configurar em 5 minutos

1. Abra `config.js`
2. Em [web3forms.com](https://web3forms.com), crie uma Access Key com o e-mail do clube e cole em `WEB3FORMS_ACCESS_KEY`
3. Ajuste `VALOR_MENSAL` (padrão: `10`)
4. Cole os links do Mercado Pago em `PAYMENT_LINKS` (Mensal / Trimestral / Semestral / Anual)

## Testar local

Abra `index.html` no navegador, ou:

```bash
cd C:\Users\04510018185\Documents\projetos\ndf_futsal
npx --yes serve .
```

## Publicar no GitHub Pages (grátis)

```bash
cd C:\Users\04510018185\Documents\projetos\ndf_futsal
git init
git add .
git commit -m "Landing de mensalidade Flapalmas Futsal"
```

1. Crie um repositório no GitHub (ex.: `ndf_futsal`)
2. Conecte e envie:

```bash
git remote add origin https://github.com/SEU_USUARIO/ndf_futsal.git
git branch -M main
git push -u origin main
```

3. No GitHub: **Settings → Pages → Branch: `main` / pasta `/ (root)` → Save**
4. Em alguns minutos o site fica em:  
   `https://SEU_USUARIO.github.io/ndf_futsal/`

## Custos

| Item | Custo |
|------|--------|
| GitHub Pages | Grátis |
| Web3Forms (plano free) | Grátis |
| Mercado Pago | Só taxa por pagamento |
| Domínio próprio (opcional) | ~R$ 40–80/ano |
