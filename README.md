# TUDO SOBRE FUTSAL EM UM SÓ LUGAR! — Formulário de Mensalidade

Landing page estática (HTML/CSS/JS) para cobrança de mensalidade das escolinhas **TUDO SOBRE FUTSAL EM UM SÓ LUGAR!**, pronta para **GitHub Pages** (grátis).

## O que tem

- **Home** com 3 unidades: COOP Futsal, COOP/Fla Palmas, Monteiro Lobato Futsal
- Formulário por unidade (`cadastro.html?unidade=...`): mesmos campos, local/horários da unidade
- Validação de CPF, contrato em PDF, modal de parcelas
- Gravação em **Google Sheets** (Apps Script) — **uma aba por unidade**
- Botão de pagamento por plano (Mercado Pago)

## 1) Ligar o Google Sheets (5 minutos)

1. Crie uma planilha em [sheets.google.com](https://sheets.google.com) (ex.: `TUDO SOBRE FUTSAL EM UM SÓ LUGAR! — Mensalidades`)
2. Menu **Extensões → Apps Script**
3. Apague o código padrão e cole o conteúdo de `google-apps-script/Code.gs`
4. Salve o projeto
5. **Implantar → Nova implantação**
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
6. Autorize a conta Google quando pedir
7. Copie a URL (termina com `/exec`)
8. Cole em `config.js` → `GOOGLE_SCRIPT_URL`

### Abas da planilha

| Aba | Função |
|-----|--------|
| **COOP Futsal** | Cadastros desta unidade |
| **COOP/Fla Palmas** | Cadastros desta unidade |
| **Monteiro Lobato Futsal** | Cadastros desta unidade |
| **Pagamentos** | Parcelas de todas as unidades (coluna **Unidade**) |
| **MesAtual** | Painel do mês corrente |
| **Horarios** | Orientação do controle por unidade |

Exemplo: cliente escolhe **COOP/Fla Palmas** + **10x** + horário **14:00** → linha na aba **COOP/Fla Palmas** e parcelas em **Pagamentos**.

### Atualizar a planilha (unidades + horários)

1. Abra a planilha → **Extensões → Apps Script**
2. Substitua o código pelo conteúdo atual de `google-apps-script/Code.gs`
3. Salve
4. Rode **`setupPlanilha`** (▶) — cria as 3 abas de unidade e atualiza cabeçalhos
5. **Implantar → Gerenciar implantações → ✏️ editar → Nova versão → Implantar**

**Ao atualizar o `Code.gs`:** use **Gerenciar implantações → editar → Nova versão** (não crie implantação nova, senão a URL muda).

## 2) Guia: gerar links de pagamento no Mercado Pago

O site **não processa cartão**. Depois do cadastro, o botão **Ir para o pagamento** só aparece se existir uma URL real (`https://...`) em `config.js`. Enquanto estiver `#` ou `COLE_AQUI_...`, o botão fica oculto.

**Total a gerar:** ~13 links (COOP: 4 cada × 2 + Monteiro: 5).

### O que criar no Mercado Pago

| Forma no formulário | Tipo no Mercado Pago | Por quê |
|---------------------|----------------------|---------|
| **1x** (à vista) | **Link de pagamento** | Cobrança única do valor total |
| **5× / 8× / 10× / 11×** | **Link de pagamento** | Cliente paga o valor da parcela (ou o total parcelado no cartão, conforme você configurar) |

> Dica: use a **mesma conta Mercado Pago** da escolinha. Nomeie cada link com a unidade + forma (ex.: `COOP — À vista 2000`, `Monteiro — 5x 320`) para não misturar depois.

### Passo a passo — Link de pagamento (1x, 5x, 8x, 10x)

1. Acesse [https://www.mercadopago.com.br](https://www.mercadopago.com.br) e entre na conta
2. No menu, vá em **Ferramentas** → **Link de pagamento**  
   (ou busque “Criar link de pagamento”)
3. Clique em **Criar link** / **Novo link**
4. Preencha:
   - **Título:** ex. `COOP Futsal — Parcela única`
   - **Valor:** use a tabela da unidade abaixo
   - **Descrição (opcional):** unidade + forma de pagamento
5. Em opções de pagamento, deixe Pix / cartão conforme a preferência da escolinha
6. Salve / publique o link
7. Clique em **Copiar link** (URL começa com `https://mpago.la/...` ou `https://www.mercadopago.com.br/...`)
8. Cole no `config.js`, no `paymentLinks` da unidade, no lugar do `COLE_AQUI_...`

Repita para cada combinação **unidade × forma**.

### Onde colar no projeto

Arquivo: **`config.js`** → `UNIDADES.<id>.paymentLinks`

Exemplo (COOP Futsal):

```js
paymentLinks: {
  "1x": "https://mpago.la/SEU_LINK_AVISTA",
  "5x": "https://mpago.la/SEU_LINK_5X",
  "8x": "https://mpago.la/SEU_LINK_8X",
  "10x": "https://mpago.la/SEU_LINK_10X",
},
```

Depois de colar:
1. Salve o arquivo
2. Faça commit/push (se for GitHub Pages) **ou** só recarregue o localhost
3. Teste: cadastre na unidade → escolha o plano → na tela de sucesso deve aparecer **Ir para o pagamento**

### Checklist por unidade

#### COOP Futsal — `UNIDADES.coop.paymentLinks`

| # | Forma | Valor | Placeholder → trocar |
|---|--------|-------|----------------------|
| 1 | À vista | R$ 2.000 | `["1x"]` → `COLE_AQUI_TAQUARALTO_LINK_AVISTA` |
| 2 | 5× | R$ 432 / parcela | `["5x"]` → `COLE_AQUI_TAQUARALTO_LINK_5X` |
| 3 | 8× | R$ 270 / parcela | `["8x"]` → `COLE_AQUI_TAQUARALTO_LINK_8X` |
| 4 | 10× | R$ 220 / parcela | `["10x"]` → `COLE_AQUI_TAQUARALTO_LINK_10X` |

#### COOP/Fla Palmas — `UNIDADES.flapalmas.paymentLinks`

| # | Forma | Valor | Placeholder → trocar |
|---|--------|-------|----------------------|
| 1 | À vista | R$ 2.000 | `["1x"]` → `COLE_AQUI_FLAPALMAS_LINK_AVISTA` |
| 2 | 5× | R$ 432 / parcela | `["5x"]` → `COLE_AQUI_FLAPALMAS_LINK_5X` |
| 3 | 8× | R$ 270 / parcela | `["8x"]` → `COLE_AQUI_FLAPALMAS_LINK_8X` |
| 4 | 10× | R$ 220 / parcela | `["10x"]` → `COLE_AQUI_FLAPALMAS_LINK_10X` |

#### Monteiro Lobato — `UNIDADES["monteiro-lobato"].paymentLinks`

| # | Forma | Valor | Placeholder → trocar |
|---|--------|-------|----------------------|
| 1 | À vista | R$ 1.550 | `["1x"]` → `COLE_AQUI_LINK_AVISTA` |
| 2 | 5× | R$ 320 / parcela | `["5x"]` → `COLE_AQUI_LINK_5X` |
| 3 | 8× | R$ 200 / parcela | `["8x"]` → `COLE_AQUI_LINK_8X` |
| 4 | 10× | R$ 160 / parcela | `["10x"]` → `COLE_AQUI_LINK_10X` |
| 5 | 11× | R$ 150 / parcela | `["11x"]` → `COLE_AQUI_LINK_11X` |

Fallback global (se a unidade não tiver `paymentLinks`): `PAYMENT_LINKS` no topo do `config.js`.

### Problemas comuns

| Situação | O que fazer |
|----------|-------------|
| Botão de pagar não aparece | URL ainda é placeholder (`COLE_AQUI_...`) ou `#`. Tem que ser `https://...` |
| Link abre mas valor errado | Confira se colou o link na chave certa (`1x`, `5x`…) da unidade certa |
| Misturou unidades | Renomeie os links no painel MP e confira o `config.js` |

### Contrato + assinatura no envio

1. O responsável abre **Ver contrato** e **rola até o final**
2. **Assina com o dedo/mouse** no quadro de assinatura
3. Só então libera fechar o modal e marcar o aceite
4. No submit, o site gera o PDF (com dados + assinatura) e o Apps Script salva no Drive (pasta **Contratos TUDO SOBRE FUTSAL EM UM SÓ LUGAR!**), gravando o link na coluna **Contrato PDF**

Após atualizar o `Code.gs`, rode **`setupPlanilha`** e publique **nova versão** da implantação.

### Ideia (não usada) — mensal recorrente sem fim

Há um slot só documentado em `paymentLinksIdeia.mensal` (assinatura Preapproval mensal avulsa). **O site não usa** esse campo hoje.

| Unidade | Placeholder |
|---------|-------------|
| COOP Futsal | `UNIDADES.coop.paymentLinksIdeia.mensal` |
| COOP/Fla Palmas | `UNIDADES.flapalmas.paymentLinksIdeia.mensal` |
| Monteiro Lobato | `UNIDADES["monteiro-lobato"].paymentLinksIdeia.mensal` |

## 3) Publicar no GitHub Pages

Repo: https://github.com/marcosvrca/ndf-futsal

No GitHub: **Settings → Pages → Branch `main` / pasta `/ (root)`**

Site: `https://marcosvrca.github.io/ndf-futsal/`

## Custos

| Item | Custo |
|------|--------|
| GitHub Pages | Grátis |
| Google Sheets + Apps Script | Grátis |
| Mercado Pago | Só taxa por pagamento |
| Domínio próprio (opcional) | ~R$ 40–80/ano |
