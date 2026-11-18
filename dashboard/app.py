"""
Dashboard financeiro — TUDO SOBRE FUTSAL EM UM SÓ LUGAR!

Local:
  cd dashboard
  pip install -r requirements.txt
  python app.py

Vercel Flask entry: this module exports `app` from api/index.py (Chart.js UI).
Streamlit (streamlit_app.py) is local-only — not used on Vercel free serverless.
"""

from __future__ import annotations

import os

from api.index import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8501"))
    app.run(host="127.0.0.1", port=port, debug=True)
