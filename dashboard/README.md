# Dashboard — TUDO SOBRE FUTSAL

Painel Python (zero custo) que lê a mesma planilha do formulário estático.

Planos e turmas vêm da planilha (Apps Script / cadastros): anual (inclui **11× R$ 200**), **semestral** (à vista R$ 1.500 ou 6× R$ 255), mensal; Taquaralto por ano de nascimento; Flapalmas com turma **17:20–18:30 SUB12 e SUB13**.

## Por que Flask (e não só Streamlit)?

- **Local:** `python app.py` **ou** `streamlit run streamlit_app.py`
- **Vercel free tier:** Streamlit precisa de servidor persistente → usamos **Flask** em `api/index.py`

## Configuração

1. Crie uma [service account](https://console.cloud.google.com/iam-admin/serviceaccounts) no Google Cloud
2. Baixe o JSON da chave
3. Compartilhe a planilha com o e-mail da service account (**Leitor**)
4. Copie `.env.example` → `.env` e preencha:

```env
GOOGLE_SHEETS_ID=seu_id_da_planilha
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Sem credenciais o painel abre em **modo demo** (não quebra).

## Local

```bash
cd dashboard
pip install -r requirements.txt
python app.py
# http://127.0.0.1:8501
```

## Vercel

**Live (hobby/free):** https://ndf-futsal-dashboard.vercel.app/

```bash
cd dashboard
npx vercel --prod
```

No painel da Vercel, defina `GOOGLE_SHEETS_ID` e `GOOGLE_SERVICE_ACCOUNT_JSON` para sair do modo demo.

Root Directory do projeto: `dashboard`. O entrypoint Flask fica em `pyproject.toml`:

```toml
[tool.vercel]
entrypoint = "api.index:app"
```

Localmente você pode usar `python app.py` ou `streamlit run streamlit_app.py`.
