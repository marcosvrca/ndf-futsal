"""
Dashboard financeiro — TUDO SOBRE FUTSAL EM UM SÓ LUGAR!

Local:
  cd dashboard
  pip install -r requirements.txt
  python app.py

Vercel: api/index.py importa `app` deste módulo.
Streamlit não roda no free tier serverless da Vercel — por isso Flask.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template

from sheets_client import load_dashboard

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

app = Flask(__name__, template_folder=str(ROOT / "templates"), static_folder=str(ROOT / "static"))


def brl(value: float) -> str:
    try:
        n = float(value or 0)
    except (TypeError, ValueError):
        n = 0.0
    formatted = f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {formatted}"


app.jinja_env.filters["brl"] = brl


@app.get("/")
def home():
    data = load_dashboard()
    return render_template("index.html", data=data)


@app.get("/api/summary")
def api_summary():
    return jsonify(load_dashboard())


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "ndf-futsal-dashboard"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8501"))
    app.run(host="127.0.0.1", port=port, debug=True)
