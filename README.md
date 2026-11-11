# NDF Futsal — Formulário de Mensalidade

Landing page estática (HTML/CSS/JS) para cobrança de mensalidade da **COOP/FLAPALMAS FUTSAL**, pronta para **GitHub Pages** (grátis).

## O que tem

- **Home** com 3 unidades: COOP Futsal, Fla Palmas Futsal, Monteiro Lobato Futsal
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
| **COOP Futsal** | Cadastros desta unidade |
| **Fla Palmas Futsal** | Cadastros desta unidade |
| **Monteiro Lobato Futsal** | Cadastros desta unidade |
| **Pagamentos** | Parcelas de todas as unidades (coluna **Unidade**) |
| **MesAtual** | Painel do mês corrente |
| **Horarios** | Orientação do controle por unidade |

Exemplo: cliente escolhe **Fla Palmas** + **6x** + horário **14:00** → linha na aba **Fla Palmas Futsal** e parcelas em **Pagamentos**.

### Atualizar a planilha (unidades + horários)

1. Abra a planilha → **Extensões → Apps Script**
2. Substitua o código pelo conteúdo atual de `google-apps-script/Code.gs`
3. Salve
4. Rode **`setupPlanilha`** (▶) — cria as 3 abas de unidade e atualiza cabeçalhos
5. **Implantar → Gerenciar implantações → ✏️ editar → Nova versão → Implantar**

**Ao atualizar o `Code.gs`:** use **Gerenciar implantações → editar → Nova versão** (não crie implantação nova, senão a URL muda).

## 2) Cobranças (Mercado Pago)

1. Crie links/planos no Mercado Pago (Mensal, Trimestral, Semestral, Anual)
2. Cole em `config.js` → `PAYMENT_LINKS`
3. Ajuste `VALOR_MENSAL` se necessário

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
