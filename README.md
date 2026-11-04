# NDF Futsal — Formulário de Mensalidade

Landing page estática (HTML/CSS/JS) para cobrança de mensalidade da **COOP/FLAPALMAS FUTSAL**, pronta para **GitHub Pages** (grátis).

## O que tem

- Formulário: nome, sobrenome, CPF, e-mail e periodicidade
- Validação de CPF
- Cálculo do valor (base × período)
- Gravação em **Google Sheets** (Apps Script)
- Botão de pagamento por periodicidade (Mercado Pago)

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
| **Cadastros** | 1 linha por inscrição (quem assinou e o período) |
| **Pagamentos** | 1 linha **por mês coberto** — ex.: Trimestral cria 3 linhas |
| **MesAtual** | Painel com pendentes/todos do mês corrente |

Exemplo: cliente escolhe **Trimestral** → entram Nov, Dez e Jan em **Pagamentos**, status `Pendente`. O responsável só marca `Pago` (dropdown).

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
