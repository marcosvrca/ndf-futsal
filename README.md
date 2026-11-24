# TUDO SOBRE FUTSAL EM UM SÓ LUGAR! — Formulário de Mensalidade

Site **estático** (HTML/CSS/JS) para matrícula/mensalidade das escolinhas, sem backend próprio e sem taxa de hospedagem.

- Formulário → **Google Apps Script** → **Google Sheets**
- Publicação: **GitHub Pages** (grátis)
- Painel interno: pasta `dashboard/` (Python / Vercel free)

## Estrutura

| Arquivo / pasta | Função |
|-----------------|--------|
| `index.html`, `home.js` | Home com COOP Futsal e COOP/FLAPALMAS |
| `cadastro.html`, `script.js` | Formulário por unidade (`?unidade=`) |
| `config.js` | Planos, horários, URL do Apps Script |
| `styles.css`, `light.html`, `dark.html` | Visual / temas |
| `google-apps-script/Code.gs` | Web app que grava na planilha + PDF no Drive |
| `dashboard/` | Painel Python (Flask; Streamlit opcional local) |
| `vercel.json` | Clean URLs (site estático); dashboard tem o seu próprio |
| `.github/workflows/pages.yml` | Deploy GitHub Pages |

## Fluxo do formulário

1. Home → escolhe a unidade  
2. `cadastro.html?unidade=coop|flapalmas`  

3. Dados do responsável/aluno, horário, plano  
4. Lê o contrato até o fim + assinatura no canvas  
5. Gera PDF (html2pdf) e **POST** JSON para `GOOGLE_SCRIPT_URL`  
6. Apps Script grava na aba da unidade + linhas em **Pagamentos** + PDF no Drive  

Validação de CPF, telefone e contrato ficam no front (`script.js`). O envio usa `Content-Type: text/plain` para evitar preflight CORS no Apps Script.

## Planos (como em `config.js`)

**COOP Futsal** e **COOP/FLAPALMAS** (`PLANOS` global):

| ID | Resumo |
|----|--------|
| `1x` | À vista R$ 2.000 |
| `2x` … `5x`, `8x`, `9x` | Anual parcelado (total R$ 2.160, exceto 10x/11x) |
| `10x` | 10× R$ 220 (total R$ 2.200) |
| `11x` | 11× R$ 200 (total R$ 2.200) |
| `semestral-1x` | Semestral à vista R$ 1.500 |
| `semestral-6x` | Semestral 6× R$ 255 (total R$ 1.530) |
| `mensal` | R$ 260 avulso |

Horários e locais também estão em `config.js` por unidade (Taquaralto por ano de nascimento; Flapalmas por SUB).

## Ligar o Google Sheets

1. Crie a planilha no Google Sheets  
2. **Extensões → Apps Script** → cole `google-apps-script/Code.gs`  
3. **Implantar → Nova implantação → App da Web**  
   - Executar como: **Eu**  
   - Quem tem acesso: **Qualquer pessoa** (só o endpoint; a planilha pode ficar privada)  
4. Copie a URL `/exec` → `config.js` → `GOOGLE_SCRIPT_URL`  
5. Rode **`setupPlanilha`** no editor (▶)

### Abas

| Aba | Função |
|-----|--------|
| COOP Futsal / COOP/FLAPALMAS | Cadastros |
| Pagamentos | Parcelas de todas as unidades |
| Resumo | KPIs / totais |
| MesAtual | Painel do mês |
| Horarios | Orientação |

**Ao atualizar o `Code.gs`:** Gerenciar implantações → editar → **Nova versão** (não crie outra implantação, senão a URL muda).

### Privacidade da planilha

A planilha pode ficar só com e-mails autorizados (compartilhamento Google). O formulário continua gravando porque o web app roda **como o dono** (`SpreadsheetApp`). Não compartilhe a planilha como “qualquer pessoa com o link”.

## Publicar o site (GitHub Pages)

Repo: https://github.com/marcosvrca/ndf-futsal  

**Settings → Pages → Branch `main` / root**  

Site: https://marcosvrca.github.io/ndf-futsal/

## Dashboard Python

Ver `dashboard/README.md`.

```bash
cd dashboard
pip install -r requirements.txt
python app.py
```

Sem service account → modo **demo**. Com `GOOGLE_SHEETS_ID` + JSON da service account (planilha compartilhada como **Leitor** com o e-mail da SA) → dados ao vivo.

## Mercado Pago

**Futuro / fora do escopo atual.** O front já esconde o botão de pagar se não houver URL `https://...` real em `config.js`.

## Custos

| Item | Custo |
|------|--------|
| GitHub Pages | Grátis |
| Google Sheets + Apps Script | Grátis |
| Dashboard (local / Vercel hobby) | Grátis |
| Domínio próprio (opcional) | ~R$ 40–80/ano |
