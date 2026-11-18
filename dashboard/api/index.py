"""Entrypoint Vercel — Flask dashboard with Chart.js charts."""
from __future__ import annotations

import json
import os
from collections import Counter
from functools import lru_cache
from typing import Any

from flask import Flask, jsonify, render_template_string, request

app = Flask(__name__)
UNIDADE_ABAS = ("COOP Futsal", "COOP/Fla Palmas", "Monteiro Lobato Futsal")

PAGE = """<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Dashboard · TUDO SOBRE FUTSAL</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@600;800&display=swap" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js" defer></script>
<style>
:root{--g:#0f3d2e;--m:#1a5c44;--ink:#10231c;--muted:#4d6359;--pend:#fff3cd;--pago:#d1e7dd;--gold:#c4a35a}
*{box-sizing:border-box}body{margin:0;font-family:Manrope,system-ui,sans-serif;color:var(--ink);background:linear-gradient(180deg,#f7faf8,#eef5f0);padding:2rem 1.25rem 3rem}
.wrap{max-width:1100px;margin:0 auto}h1{font-family:"Archivo Black",sans-serif;color:var(--g);margin:.2rem 0}
.badge{display:inline-flex;padding:.3rem .7rem;border-radius:999px;font-size:.72rem;font-weight:800}
.badge-demo{background:var(--pend)}.badge-live{background:var(--pago)}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.8rem;margin:1rem 0}
.kpi{background:#fff;border-radius:16px;padding:1rem;box-shadow:0 12px 40px rgba(15,61,46,.1)}
.kpi b{display:block;color:var(--muted);font-size:.75rem}.kpi span{font-size:1.35rem;font-weight:800;color:var(--g)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}.panel{background:#fff;border-radius:16px;padding:1rem;box-shadow:0 10px 30px rgba(15,61,46,.08)}
.panel h2{margin:0 0 .7rem;font-size:1rem;color:var(--g)}
ul{list-style:none;margin:0;padding:0}li{display:flex;justify-content:space-between;padding:.5rem 0;border-top:1px solid #e5eee9}
li:first-child{border:0}table{width:100%;border-collapse:collapse;font-size:.92rem}th,td{text-align:left;padding:.5rem;border-bottom:1px solid #e5eee9}
.charts{display:grid;grid-template-columns:1.2fr 1fr;gap:.8rem;margin:1rem 0}
.chart-box{background:#fff;border-radius:16px;padding:1rem 1rem .6rem;box-shadow:0 10px 30px rgba(15,61,46,.08);min-height:280px}
.chart-box h2{margin:0 0 .4rem;font-size:.95rem;color:var(--g)}
.chart-box canvas{max-height:230px}
.charts-wide{grid-column:1/-1}
@media(max-width:860px){.kpis,.grid,.charts{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
<p style="text-transform:uppercase;letter-spacing:.12em;font-size:.72rem;font-weight:800;color:var(--m)">Minha Quadra · painel interno</p>
<h1>TUDO SOBRE FUTSAL</h1>
<p>{{ data.message }}</p>
<span class="badge {{ 'badge-live' if data.mode=='live' else 'badge-demo' }}">{{ 'AO VIVO' if data.mode=='live' else 'DEMO' }}</span>
<section class="kpis">
<article class="kpi"><b>Parcelas</b><span>{{ data.kpis.parcelas }}</span></article>
<article class="kpi"><b>Valor total</b><span>{{ data.kpis.valor_total|brl }}</span></article>
<article class="kpi"><b>Pendente</b><span>{{ data.kpis.pendente|brl }}</span></article>
<article class="kpi"><b>Pago</b><span>{{ data.kpis.pago|brl }}</span></article>
</section>
<section class="charts" aria-label="Gráficos">
  <div class="chart-box charts-wide">
    <h2>Cadastros ao longo do tempo</h2>
    <canvas id="chartTempo" height="90"></canvas>
  </div>
  <div class="chart-box">
    <h2>Por unidade</h2>
    <canvas id="chartUnidade"></canvas>
  </div>
  <div class="chart-box">
    <h2>Por plano / forma</h2>
    <canvas id="chartPlano"></canvas>
  </div>
</section>
<section class="grid">
<div class="panel"><h2>Cadastros</h2><ul>{% for u,q in data.cadastros_por_unidade.items() %}<li><span>{{ u }}</span><strong>{{ q }}</strong></li>{% endfor %}</ul></div>
<div class="panel"><h2>Pagamentos</h2><ul>{% for row in data.por_unidade %}<li><span>{{ row.unidade }}</span><strong>{{ row.valor|brl }}</strong></li>{% endfor %}</ul></div>
</section>
<div class="panel" style="margin-top:.8rem"><h2>Recentes</h2>
<table><thead><tr><th>Unidade</th><th>Nome</th><th>Valor</th><th>Status</th></tr></thead>
<tbody>{% for row in data.pagamentos_recentes %}<tr><td>{{ row.unidade }}</td><td>{{ row.nome }}</td><td>{{ row.valor|brl }}</td><td>{{ row.status }}</td></tr>{% endfor %}</tbody></table>
</div>
<script id="chart-data" type="application/json">{{ data.charts|tojson }}</script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart === 'undefined') return;
  const raw = document.getElementById('chart-data');
  const charts = raw ? JSON.parse(raw.textContent || '{}') : {};
  const green = '#0f3d2e';
  const mid = '#1a5c44';
  const gold = '#c4a35a';
  const soft = ['#0f3d2e','#1a5c44','#4a7c59','#c4a35a','#8b7355','#2f6b52'];
  const common = {responsive:true, maintainAspectRatio:true, plugins:{legend:{labels:{font:{family:'Manrope'}}}}};

  const tempo = charts.tempo || {labels:[], values:[]};
  new Chart(document.getElementById('chartTempo'), {
    type: 'line',
    data: {
      labels: tempo.labels,
      datasets: [{
        label: 'Cadastros',
        data: tempo.values,
        borderColor: green,
        backgroundColor: 'rgba(15,61,46,.12)',
        fill: true,
        tension: .35,
        pointRadius: 3,
        pointBackgroundColor: gold,
      }]
    },
    options: {...common, scales:{y:{beginAtZero:true, ticks:{precision:0}}}}
  });

  const unidade = charts.unidade || {labels:[], values:[]};
  new Chart(document.getElementById('chartUnidade'), {
    type: 'doughnut',
    data: {
      labels: unidade.labels,
      datasets: [{ data: unidade.values, backgroundColor: soft.slice(0, unidade.labels.length), borderWidth: 0 }]
    },
    options: common
  });

  const plano = charts.plano || {labels:[], values:[]};
  new Chart(document.getElementById('chartPlano'), {
    type: 'bar',
    data: {
      labels: plano.labels,
      datasets: [{
        label: 'Parcelas',
        data: plano.values,
        backgroundColor: mid,
        borderRadius: 8,
      }]
    },
    options: {...common, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{precision:0}}}}
  });
});
</script>
</div></body></html>"""


def brl(value: float) -> str:
    try:
        n = float(value or 0)
    except (TypeError, ValueError):
        n = 0.0
    return "R$ " + f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


app.jinja_env.filters["brl"] = brl


def _demo_charts() -> dict[str, Any]:
    return {
        "tempo": {
            "labels": ["Jun", "Jul", "Ago", "Set", "Out", "Nov"],
            "values": [2, 4, 3, 6, 5, 8],
        },
        "unidade": {
            "labels": list(UNIDADE_ABAS),
            "values": [8, 9, 6],
        },
        "plano": {
            "labels": ["À vista", "5x", "8x", "10x", "Mensal"],
            "values": [6, 10, 8, 12, 6],
        },
    }


def demo_payload() -> dict[str, Any]:
    return {
        "mode": "demo",
        "message": "Configure GOOGLE_SHEETS_ID + service account para ler a planilha real.",
        "kpis": {"parcelas": 42, "valor_total": 18480.0, "pendente": 9200.0, "pago": 8200.0},
        "por_unidade": [
            {"unidade": "COOP Futsal", "qtd": 14, "valor": 6160.0},
            {"unidade": "COOP/Fla Palmas", "qtd": 16, "valor": 7040.0},
            {"unidade": "Monteiro Lobato Futsal", "qtd": 12, "valor": 5280.0},
        ],
        "cadastros_por_unidade": {"COOP Futsal": 8, "COOP/Fla Palmas": 9, "Monteiro Lobato Futsal": 6},
        "pagamentos_recentes": [
            {"unidade": "COOP Futsal", "nome": "Ana Silva", "valor": 220.0, "status": "Pendente"},
            {"unidade": "COOP/Fla Palmas", "nome": "Bruno Costa", "valor": 432.0, "status": "Pago"},
        ],
        "charts": _demo_charts(),
    }


def _credentials():
    from google.oauth2.service_account import Credentials

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ]
    raw = (os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") or "").strip()
    if raw:
        return Credentials.from_service_account_info(json.loads(raw), scopes=scopes)
    path = (os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE") or "").strip()
    if path and os.path.isfile(path):
        return Credentials.from_service_account_file(path, scopes=scopes)
    return None


def configured() -> bool:
    return bool((os.getenv("GOOGLE_SHEETS_ID") or "").strip() and _credentials())


def _num(value: Any) -> float:
    if value is None or value == "":
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().replace("R$", "").replace(" ", "")
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return 0.0


@lru_cache(maxsize=1)
def _gc():
    import gspread

    creds = _credentials()
    if not creds:
        raise RuntimeError("missing credentials")
    return gspread.authorize(creds)


def _open():
    return _gc().open_by_key((os.getenv("GOOGLE_SHEETS_ID") or "").strip())


def _safe_records(title: str) -> list[dict[str, Any]]:
    try:
        return _open().worksheet(title).get_all_records()
    except Exception:
        return []


def _safe_values(title: str) -> list[list[Any]]:
    try:
        return _open().worksheet(title).get_all_values()
    except Exception:
        return []


def _build_charts(
    cadastros_por_unidade: dict[str, int],
    pagamentos: list[dict[str, Any]],
    cadastro_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    # Signups over time from cadastro Data/Hora when present; else competências from Pagamentos
    tempo_counter: Counter[str] = Counter()
    for row in cadastro_rows:
        raw = str(row.get("Data/Hora") or row.get("Data") or "")
        label = raw[:7] if len(raw) >= 7 else ""
        if not label and row.get("Competência"):
            label = str(row.get("Competência"))
        if label:
            tempo_counter[label] += 1
    if not tempo_counter:
        for row in pagamentos:
            comp = str(row.get("Competência") or row.get("Competencia") or "").strip()
            if comp:
                tempo_counter[comp] += 1
    tempo_labels = sorted(tempo_counter.keys())[-8:]
    tempo_values = [tempo_counter[k] for k in tempo_labels]

    unidade_labels = list(cadastros_por_unidade.keys()) or list(UNIDADE_ABAS)
    unidade_values = [int(cadastros_por_unidade.get(u, 0)) for u in unidade_labels]

    plano_counter: Counter[str] = Counter()
    for row in pagamentos:
        forma = str(
            row.get("Periodicidade")
            or row.get("Forma de pagamento")
            or row.get("Plano")
            or "Outros"
        ).strip() or "Outros"
        plano_counter[forma] += 1
    if not plano_counter:
        for row in cadastro_rows:
            forma = str(row.get("Forma de pagamento") or row.get("Plano") or "Outros").strip() or "Outros"
            plano_counter[forma] += 1
    plano_items = plano_counter.most_common(8)

    return {
        "tempo": {"labels": tempo_labels, "values": tempo_values},
        "unidade": {"labels": unidade_labels, "values": unidade_values},
        "plano": {
            "labels": [k for k, _ in plano_items],
            "values": [v for _, v in plano_items],
        },
    }


def load_dashboard() -> dict[str, Any]:
    if not configured():
        return demo_payload()
    resumo_values = _safe_values(os.getenv("SHEET_RESUMO", "Resumo"))
    pagamentos = _safe_records(os.getenv("SHEET_PAGAMENTOS", "Pagamentos"))
    kpis = {"parcelas": 0, "valor_total": 0.0, "pendente": 0.0, "pago": 0.0}
    labels = {
        "Parcelas (linhas)": "parcelas",
        "Valor total": "valor_total",
        "Pendente": "pendente",
        "Pago": "pago",
    }
    for row in resumo_values:
        if len(row) < 2:
            continue
        key = labels.get(str(row[0]).strip())
        if key:
            kpis[key] = int(_num(row[1])) if key == "parcelas" else _num(row[1])
    if not kpis["parcelas"] and pagamentos:
        kpis["parcelas"] = len(pagamentos)
        kpis["valor_total"] = sum(_num(r.get("Valor")) for r in pagamentos)
        for r in pagamentos:
            st = str(r.get("Status") or "").lower()
            if st in kpis:
                kpis[st] += _num(r.get("Valor"))
    por_unidade: dict[str, dict[str, Any]] = {}
    for r in pagamentos:
        u = str(r.get("Unidade") or "—").strip() or "—"
        b = por_unidade.setdefault(u, {"unidade": u, "qtd": 0, "valor": 0.0})
        b["qtd"] += 1
        b["valor"] += _num(r.get("Valor"))
    recentes = [
        {
            "unidade": r.get("Unidade") or "—",
            "nome": f"{r.get('Nome') or ''} {r.get('Sobrenome') or ''}".strip() or "—",
            "valor": _num(r.get("Valor")),
            "status": r.get("Status") or "—",
        }
        for r in pagamentos[-8:]
    ]
    cadastros_por_unidade = {a: len(_safe_records(a)) for a in UNIDADE_ABAS}
    cadastro_rows: list[dict[str, Any]] = []
    for aba in UNIDADE_ABAS:
        cadastro_rows.extend(_safe_records(aba))
    return {
        "mode": "live",
        "message": "Dados ao vivo da planilha.",
        "kpis": kpis,
        "por_unidade": list(por_unidade.values()),
        "cadastros_por_unidade": cadastros_por_unidade,
        "pagamentos_recentes": list(reversed(recentes)),
        "charts": _build_charts(cadastros_por_unidade, pagamentos, cadastro_rows),
    }


def _page():
    return render_template_string(PAGE, data=load_dashboard())


@app.route("/", defaults={"path": ""}, methods=["GET"])
@app.route("/<path:path>", methods=["GET"])
def entry(path: str = ""):
    full = (request.path or "/").rstrip("/") or "/"
    if full.endswith("/health") or path.endswith("health"):
        return jsonify({"ok": True, "service": "ndf-futsal-dashboard", "path": request.path})
    if full.endswith("/api/summary") or path.endswith("summary"):
        return jsonify(load_dashboard())
    return _page()
