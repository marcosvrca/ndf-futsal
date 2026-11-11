# NDF Futsal — Formulário de Mensalidade

Landing page estática (HTML/CSS/JS) para cobrança de mensalidade da **COOP/FLAPALMAS FUTSAL**, pronta para **GitHub Pages** (grátis).

## O que tem

- **Home** com 3 unidades: COOP/Taquaralto Futsal, COOP/Fla Palmas, Monteiro Lobato Futsal
- Formulário por unidade (`cadastro.html?unidade=...`): mesmos campos, local/horários da unidade
- Validação de CPF, contrato em PDF, modal de parcelas
- Gravação em **Google Sheets** (Apps Script) — **uma aba por unidade**
- Botão de pagamento por plano (Mercado Pago)

## 1) Ligar o Google Sheets (5 minutos)

1. Crie uma planilha em [sheets.google.com](https://sheets.google.com) (ex.: `NDF Futsal — Mensalidades`)
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
| **COOP/Taquaralto Futsal** | Cadastros desta unidade |
| **COOP/Fla Palmas** | Cadastros desta unidade |
| **Monteiro Lobato Futsal** | Cadastros desta unidade |
| **Pagamentos** | Parcelas de todas as unidades (coluna **Unidade**) |
| **MesAtual** | Painel do mês corrente |
| **Horarios** | Orientação do controle por unidade |

Exemplo: cliente escolhe **COOP/Fla Palmas** + **6x** + horário **14:00** → linha na aba **COOP/Fla Palmas** e parcelas em **Pagamentos**.

### Atualizar a planilha (unidades + horários)

1. Abra a planilha → **Extensões → Apps Script**
2. Substitua o código pelo conteúdo atual de `google-apps-script/Code.gs`
3. Salve
4. Rode **`setupPlanilha`** (▶) — cria as 3 abas de unidade e atualiza cabeçalhos
5. **Implantar → Gerenciar implantações → ✏️ editar → Nova versão → Implantar**

**Ao atualizar o `Code.gs`:** use **Gerenciar implantações → editar → Nova versão** (não crie implantação nova, senão a URL muda).

## 2) Cobranças (Mercado Pago)

O site só redireciona para um **link** do Mercado Pago depois do cadastro. Enquanto o valor for `#` ou `COLE_AQUI_...`, o botão **Ir para o pagamento** fica oculto.

**Total a gerar:** 15 links (5 por unidade × 3 unidades). Cada unidade tem `paymentLinks` próprio em `config.js`.

Passos no painel (vale para todas):
1. Conta Mercado Pago → **Link de pagamento** (à vista / 5× / 8× / 10×) ou **Planos de Assinatura** (12× mensal, duração 12 cobranças)
2. Crie com o valor da tabela da unidade
3. Cole a URL no slot `COLE_AQUI_...` correspondente
4. Publique — o botão só aparece com URL `https://...`

### COOP/Taquaralto — 5 links (`UNIDADES.coop.paymentLinks`)

| # | Forma | Valor (pacote R$ 2.160) | Placeholder → trocar |
|---|--------|-------------------------|----------------------|
| 1 | À vista | R$ 2.160 | `["1x"]` → `COLE_AQUI_TAQUARALTO_LINK_AVISTA` |
| 2 | 5× | R$ 432 / parcela | `["5x"]` → `COLE_AQUI_TAQUARALTO_LINK_5X` |
| 3 | 8× | R$ 270 / parcela | `["8x"]` → `COLE_AQUI_TAQUARALTO_LINK_8X` |
| 4 | 10× | R$ 216 / parcela | `["10x"]` → `COLE_AQUI_TAQUARALTO_LINK_10X` |
| 5 | 12× | R$ 180 / mês | `["12x"]` → `COLE_AQUI_TAQUARALTO_LINK_12X` |

### COOP/Fla Palmas — 5 links (`UNIDADES.flapalmas.paymentLinks`)

| # | Forma | Valor (pacote R$ 2.160) | Placeholder → trocar |
|---|--------|-------------------------|----------------------|
| 1 | À vista | R$ 2.160 | `["1x"]` → `COLE_AQUI_FLAPALMAS_LINK_AVISTA` |
| 2 | 5× | R$ 432 / parcela | `["5x"]` → `COLE_AQUI_FLAPALMAS_LINK_5X` |
| 3 | 8× | R$ 270 / parcela | `["8x"]` → `COLE_AQUI_FLAPALMAS_LINK_8X` |
| 4 | 10× | R$ 216 / parcela | `["10x"]` → `COLE_AQUI_FLAPALMAS_LINK_10X` |
| 5 | 12× | R$ 180 / mês | `["12x"]` → `COLE_AQUI_FLAPALMAS_LINK_12X` |

### Monteiro Lobato — 5 links (`UNIDADES["monteiro-lobato"].paymentLinks`)

| # | Forma | Valor | Placeholder → trocar |
|---|--------|-------|----------------------|
| 1 | À vista | R$ 1.680 | `["1x"]` → `COLE_AQUI_LINK_AVISTA` |
| 2 | 5× | R$ 320 / parcela | `["5x"]` → `COLE_AQUI_LINK_5X` |
| 3 | 8× | R$ 200 / parcela | `["8x"]` → `COLE_AQUI_LINK_8X` |
| 4 | 10× | R$ 160 / parcela | `["10x"]` → `COLE_AQUI_LINK_10X` |
| 5 | 12× | R$ 140 / mês | `["12x"]` → `COLE_AQUI_LINK_12X` |

Fallback global (se a unidade não tiver `paymentLinks`): `PAYMENT_LINKS` no topo do `config.js`.

### Ideia (não usada) — link mensal Preapproval

Há um slot **documentado apenas** em `paymentLinksIdeia.mensal` em cada unidade. **Não entra no botão de pagar** e o `script.js` **não lê** esse objeto.

| Unidade | Placeholder |
|---------|-------------|
| COOP/Taquaralto | `UNIDADES.coop.paymentLinksIdeia.mensal` → `COLE_AQUI_TAQUARALTO_LINK_MENSAL` |
| COOP/Fla Palmas | `UNIDADES.flapalmas.paymentLinksIdeia.mensal` → `COLE_AQUI_FLAPALMAS_LINK_MENSAL` |
| Monteiro Lobato | `UNIDADES["monteiro-lobato"].paymentLinksIdeia.mensal` → `COLE_AQUI_LINK_MENSAL` |

Uso futuro (se for ativar): plano de assinatura no Mercado Pago com cobrança mensal recorrente (Preapproval), sem data de término. Por enquanto **ignore** esses slots.

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
