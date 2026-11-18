"""Entrypoint Vercel — Flask dashboard with Chart.js charts."""
from __future__ import annotations

import json
import os
from collections import Counter
from functools import lru_cache, wraps
from typing import Any, Callable

from flask import Flask, jsonify, redirect, render_template_string, request, session, url_for

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "ndf-futsal-dashboard-session-key")

AUTH_USER = "marcos.farias@mail.uft.edu.br"
AUTH_PASS = "NDF-futsal@2016"
UNIDADE_ABAS = ("COOP Futsal", "COOP/FLAPALMAS", "Monteiro Lobato Futsal")

THEME_BOOT = """
<script>
(function(){
  var t=localStorage.getItem('ndf-dash-theme')||'light';
  if(t!=='dark'&&t!=='light'&&t!=='contrast')t='light';
  document.documentElement.setAttribute('data-theme',t);
})();
</script>
"""

THEME_SWITCH = """
<div class="theme-bar">
  <div class="theme-switch" role="group" aria-label="Escolher tema">
    <button type="button" class="theme-switch__btn" data-theme-set="dark">Dark</button>
    <button type="button" class="theme-switch__btn" data-theme-set="light">Light</button>
    <button type="button" class="theme-switch__btn" data-theme-set="contrast">Alto contraste</button>
  </div>
</div>
"""

THEME_SCRIPT = """
<script>
(function(){
  var KEY='ndf-dash-theme';
  function sync(theme){
    document.querySelectorAll('[data-theme-set]').forEach(function(btn){
      var on=btn.getAttribute('data-theme-set')===theme;
      btn.setAttribute('aria-pressed',on?'true':'false');
    });
  }
  function setTheme(theme){
    var next=(theme==='dark'||theme==='contrast')?theme:'light';
    document.documentElement.setAttribute('data-theme',next);
    localStorage.setItem(KEY,next);
    sync(next);
    document.dispatchEvent(new CustomEvent('ndf-theme-change',{detail:{theme:next}}));
  }
  var initial=localStorage.getItem(KEY)||'light';
  setTheme(initial);
  document.querySelectorAll('[data-theme-set]').forEach(function(btn){
    btn.addEventListener('click',function(){setTheme(btn.getAttribute('data-theme-set'));});
  });
})();
</script>
"""

THEME_CSS = """
html[data-theme="light"]{
  --g:#0f3d2e;--m:#1a5c44;--ink:#10231c;--muted:#4d6359;--gold:#c4a35a;--danger:#f8d7da;
  --pend:#fff3cd;--pago:#d1e7dd;--bg:linear-gradient(180deg,#f7faf8,#eef5f0);--card:#fff;
  --line:#e5eee9;--input-bg:#f7faf8;--input-border:#d5e3db;--btn-text:#fff;
  --shadow:0 18px 50px rgba(15,61,46,.12);--theme-bar:rgba(255,255,255,.75);
  --theme-btn:#10231c;--theme-btn-bg:transparent;--theme-btn-border:rgba(15,61,46,.2);
  --theme-btn-on-bg:#0f3d2e;--theme-btn-on:#fff;--err-text:#7a1f2b;--radius:16px;
  color-scheme:light;
}
html[data-theme="dark"]{
  --g:#34d399;--m:#6ee7b7;--ink:#e8f0ec;--muted:#94a3b8;--gold:#e3c878;--danger:#4a1d24;
  --pend:#3d3420;--pago:#1a3d2e;--bg:linear-gradient(180deg,#0b1220,#071018);--card:#121a28;
  --line:rgba(148,163,184,.16);--input-bg:#0a1220;--input-border:rgba(148,163,184,.22);--btn-text:#04110c;
  --shadow:0 18px 50px rgba(0,0,0,.45);--theme-bar:rgba(8,12,20,.72);
  --theme-btn:#e8f0ec;--theme-btn-bg:transparent;--theme-btn-border:rgba(148,163,184,.28);
  --theme-btn-on-bg:#34d399;--theme-btn-on:#04110c;--err-text:#fecdd3;--radius:16px;
  color-scheme:dark;
}
html[data-theme="contrast"]{
  --g:#ffff00;--m:#ffff00;--ink:#ffffff;--muted:#ffffff;--gold:#ffff00;--danger:#000;
  --pend:#000;--pago:#000;--bg:#000;--card:#000;
  --line:#ffff00;--input-bg:#000;--input-border:#ffff00;--btn-text:#000;
  --shadow:none;--theme-bar:#000;
  --theme-btn:#ffff00;--theme-btn-bg:#000;--theme-btn-border:#ffff00;
  --theme-btn-on-bg:#ffff00;--theme-btn-on:#000;--err-text:#ffff00;--radius:0;
  color-scheme:dark;
}
.theme-bar{display:flex;justify-content:flex-end;margin:0 0 1rem}
.theme-switch{display:inline-flex;flex-wrap:wrap;gap:.35rem;padding:.3rem;border-radius:999px;background:var(--theme-bar);border:1px solid var(--theme-btn-border);backdrop-filter:blur(8px)}
html[data-theme="contrast"] .theme-switch{border-radius:0;backdrop-filter:none}
.theme-switch__btn{appearance:none;border:1px solid var(--theme-btn-border);background:var(--theme-btn-bg);color:var(--theme-btn);font:inherit;font-size:.72rem;font-weight:800;letter-spacing:.02em;padding:.4rem .7rem;border-radius:999px;cursor:pointer}
html[data-theme="contrast"] .theme-switch__btn{border-radius:0}
.theme-switch__btn[aria-pressed="true"]{background:var(--theme-btn-on-bg);color:var(--theme-btn-on);border-color:transparent}
html[data-theme="contrast"] .theme-switch__btn[aria-pressed="true"]{border-color:#ffff00}
"""

LOGIN_PAGE = """<!DOCTYPE html><html lang="pt-BR" data-theme="light"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Login · Dashboard Futsal</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@600;800&display=swap" rel="stylesheet"/>
""" + THEME_BOOT + """
<style>
""" + THEME_CSS + """
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Manrope,system-ui,sans-serif;color:var(--ink);background:var(--bg);display:flex;align-items:center;justify-content:center;padding:1.5rem}
.shell{width:100%;max-width:420px}
.card{width:100%;background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:1.6rem 1.4rem 1.4rem;box-shadow:var(--shadow)}
.eyebrow{margin:0 0 .35rem;text-transform:uppercase;letter-spacing:.12em;font-size:.72rem;font-weight:800;color:var(--m)}
h1{font-family:"Archivo Black",sans-serif;color:var(--g);margin:.1rem 0 .35rem;font-size:1.55rem}
.lead{margin:0 0 1.1rem;color:var(--muted);font-size:.92rem}
label{display:block;font-size:.78rem;font-weight:800;color:var(--m);margin:0 0 .35rem}
input{width:100%;padding:.75rem .85rem;border:1px solid var(--input-border);border-radius:12px;font:inherit;margin-bottom:.85rem;background:var(--input-bg);color:var(--ink)}
html[data-theme="contrast"] input{border-radius:0}
input:focus{outline:2px solid var(--m);border-color:var(--m)}
button.submit{width:100%;border:1px solid transparent;border-radius:12px;padding:.85rem 1rem;font:inherit;font-weight:800;color:var(--btn-text);background:linear-gradient(135deg,var(--g),var(--m));cursor:pointer}
html[data-theme="contrast"] button.submit{border-radius:0;background:#ffff00;border-color:#ffff00;color:#000}
button.submit:hover{filter:brightness(1.05)}
.err{background:var(--danger);color:var(--err-text);border:1px solid var(--line);border-radius:10px;padding:.65rem .8rem;margin:0 0 .9rem;font-size:.88rem;font-weight:700}
html[data-theme="contrast"] .err{border-radius:0;border-color:#ffff00}
</style></head><body>
<div class="shell">
""" + THEME_SWITCH + """
<form class="card" method="post" action="{{ url_for('login') }}" autocomplete="username">
  <p class="eyebrow">Minha Quadra · acesso interno</p>
  <h1>Entrar no painel</h1>
  <p class="lead">Use seu e-mail e senha para ver cadastros e gráficos.</p>
  {% if error %}<p class="err">{{ error }}</p>{% endif %}
  <label for="username">E-mail</label>
  <input id="username" name="username" type="email" required autofocus value="{{ username or '' }}"/>
  <label for="password">Senha</label>
  <input id="password" name="password" type="password" required/>
  <button class="submit" type="submit">Entrar</button>
</form>
</div>
""" + THEME_SCRIPT + """
</body></html>"""

PAGE = """<!DOCTYPE html><html lang="pt-BR" data-theme="light"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Dashboard · TUDO SOBRE FUTSAL</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@600;800&display=swap" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js" defer></script>
""" + THEME_BOOT + """
<style>
""" + THEME_CSS + """
*{box-sizing:border-box}body{margin:0;font-family:Manrope,system-ui,sans-serif;color:var(--ink);background:var(--bg);padding:2rem 1.25rem 3rem}
.wrap{max-width:1100px;margin:0 auto}
.top-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.top-row .theme-bar{margin:0}
h1{font-family:"Archivo Black",sans-serif;color:var(--g);margin:.2rem 0}
.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:.72rem;font-weight:800;color:var(--m);margin:0}
.lead{color:var(--muted)}
.logout{color:var(--m);font-size:.85rem;font-weight:800}
.badge{display:inline-flex;padding:.3rem .7rem;border-radius:999px;font-size:.72rem;font-weight:800;border:1px solid transparent}
html[data-theme="contrast"] .badge{border-radius:0;border-color:#ffff00}
.badge-demo{background:var(--pend);color:var(--ink)}.badge-live{background:var(--pago);color:var(--ink)}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.8rem;margin:1rem 0}
.kpi,.panel,.chart-box{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:1rem;box-shadow:var(--shadow)}
.kpi b{display:block;color:var(--muted);font-size:.75rem}.kpi span{font-size:1.35rem;font-weight:800;color:var(--g)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}
.panel h2,.chart-box h2{margin:0 0 .7rem;font-size:1rem;color:var(--g)}
ul{list-style:none;margin:0;padding:0}li{display:flex;justify-content:space-between;padding:.5rem 0;border-top:1px solid var(--line);color:var(--ink)}
li:first-child{border:0}li strong{color:var(--g)}
table{width:100%;border-collapse:collapse;font-size:.92rem}th,td{text-align:left;padding:.5rem;border-bottom:1px solid var(--line);color:var(--ink)}
th{color:var(--muted);font-size:.75rem;text-transform:uppercase;letter-spacing:.04em}
.charts{display:grid;grid-template-columns:1.2fr 1fr;gap:.8rem;margin:1rem 0}
.chart-box{padding:1rem 1rem .6rem;min-height:280px}
.chart-box h2{margin:0 0 .4rem;font-size:.95rem}
.chart-box canvas{max-height:230px}
.charts-wide{grid-column:1/-1}
@media(max-width:860px){.kpis,.grid,.charts{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
<div class="top-row">
  <div>
    <p class="eyebrow">Minha Quadra · painel interno</p>
    <h1>TUDO SOBRE FUTSAL</h1>
  </div>
""" + THEME_SWITCH + """
</div>
<p class="lead">{{ data.message }}</p>
<span class="badge {{ 'badge-live' if data.mode=='live' else 'badge-demo' }}">{{ 'AO VIVO' if data.mode=='live' else 'DEMO' }}</span>
<p style="margin:.7rem 0 0"><a class="logout" href="{{ url_for('logout') }}">Sair</a></p>
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
  let chartTempo, chartUnidade, chartPlano;

  function palette(theme) {
    if (theme === 'dark') {
      return {
        green: '#34d399', mid: '#6ee7b7', gold: '#e3c878',
        soft: ['#34d399','#6ee7b7','#2dd4bf','#e3c878','#94a3b8','#22c55e'],
        fill: 'rgba(52,211,153,.15)', grid: 'rgba(148,163,184,.2)', tick: '#94a3b8',
      };
    }
    if (theme === 'contrast') {
      return {
        green: '#ffff00', mid: '#ffff00', gold: '#ffffff',
        soft: ['#ffff00','#ffffff','#00ffff','#ff00ff','#00ff00','#ffaa00'],
        fill: 'rgba(255,255,0,.2)', grid: '#ffff00', tick: '#ffffff',
      };
    }
    return {
      green: '#0f3d2e', mid: '#1a5c44', gold: '#c4a35a',
      soft: ['#0f3d2e','#1a5c44','#4a7c59','#c4a35a','#8b7355','#2f6b52'],
      fill: 'rgba(15,61,46,.12)', grid: '#d5e3db', tick: '#4d6359',
    };
  }

  function renderCharts() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const p = palette(theme);
    const common = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { color: p.tick, font: { family: 'Manrope' } } } },
      scales: {
        x: { ticks: { color: p.tick }, grid: { color: p.grid } },
        y: { ticks: { color: p.tick }, grid: { color: p.grid } },
      },
    };

    if (chartTempo) chartTempo.destroy();
    if (chartUnidade) chartUnidade.destroy();
    if (chartPlano) chartPlano.destroy();

    const tempo = charts.tempo || { labels: [], values: [] };
    chartTempo = new Chart(document.getElementById('chartTempo'), {
      type: 'line',
      data: {
        labels: tempo.labels,
        datasets: [{
          label: 'Cadastros',
          data: tempo.values,
          borderColor: p.green,
          backgroundColor: p.fill,
          fill: true,
          tension: .35,
          pointRadius: 3,
          pointBackgroundColor: p.gold,
        }]
      },
      options: { ...common, scales: { ...common.scales, y: { ...common.scales.y, beginAtZero: true, ticks: { ...common.scales.y.ticks, precision: 0 } } } }
    });

    const unidade = charts.unidade || { labels: [], values: [] };
    chartUnidade = new Chart(document.getElementById('chartUnidade'), {
      type: 'doughnut',
      data: {
        labels: unidade.labels,
        datasets: [{ data: unidade.values, backgroundColor: p.soft.slice(0, unidade.labels.length), borderWidth: theme === 'contrast' ? 2 : 0, borderColor: '#000' }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: p.tick, font: { family: 'Manrope' } } } } }
    });

    const plano = charts.plano || { labels: [], values: [] };
    chartPlano = new Chart(document.getElementById('chartPlano'), {
      type: 'bar',
      data: {
        labels: plano.labels,
        datasets: [{
          label: 'Parcelas',
          data: plano.values,
          backgroundColor: p.mid,
          borderRadius: theme === 'contrast' ? 0 : 8,
          borderWidth: theme === 'contrast' ? 2 : 0,
          borderColor: '#ffff00',
        }]
      },
      options: { ...common, plugins: { legend: { display: false } }, scales: { ...common.scales, y: { ...common.scales.y, beginAtZero: true, ticks: { ...common.scales.y.ticks, precision: 0 } } } }
    });
  }

  renderCharts();
  document.addEventListener('ndf-theme-change', renderCharts);
});
</script>
""" + THEME_SCRIPT + """
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
            {"unidade": "COOP/FLAPALMAS", "qtd": 16, "valor": 7040.0},
            {"unidade": "Monteiro Lobato Futsal", "qtd": 12, "valor": 5280.0},
        ],
        "cadastros_por_unidade": {"COOP Futsal": 8, "COOP/FLAPALMAS": 9, "Monteiro Lobato Futsal": 6},
        "pagamentos_recentes": [
            {"unidade": "COOP Futsal", "nome": "Ana Silva", "valor": 220.0, "status": "Pendente"},
            {"unidade": "COOP/FLAPALMAS", "nome": "Bruno Costa", "valor": 432.0, "status": "Pago"},
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


def _logged_in() -> bool:
    return bool(session.get("auth"))


def login_required(view: Callable):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not _logged_in():
            if request.path.rstrip("/").endswith("/api/summary") or request.path.endswith("summary"):
                return jsonify({"ok": False, "error": "unauthorized"}), 401
            return redirect(url_for("login", next=request.path))
        return view(*args, **kwargs)

    return wrapped


def _page():
    return render_template_string(PAGE, data=load_dashboard())


@app.route("/login", methods=["GET", "POST"])
def login():
    if _logged_in():
        return redirect(url_for("entry"))
    error = ""
    username = ""
    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""
        if username.lower() == AUTH_USER.lower() and password == AUTH_PASS:
            session.clear()
            session["auth"] = True
            session["user"] = AUTH_USER
            nxt = request.args.get("next") or "/"
            if not nxt.startswith("/") or nxt.startswith("//"):
                nxt = "/"
            return redirect(nxt)
        error = "E-mail ou senha inválidos."
    return render_template_string(LOGIN_PAGE, error=error, username=username)


@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "service": "ndf-futsal-dashboard"})


@app.route("/api/summary", methods=["GET"])
@login_required
def api_summary():
    return jsonify(load_dashboard())


@app.route("/", defaults={"path": ""}, methods=["GET"])
@app.route("/<path:path>", methods=["GET"])
@login_required
def entry(path: str = ""):
    full = (request.path or "/").rstrip("/") or "/"
    if full.endswith("/health") or path.endswith("health"):
        return health()
    if full.endswith("/api/summary") or path.endswith("summary"):
        return api_summary()
    if full.endswith("/logout") or path.endswith("logout"):
        return logout()
    if full.endswith("/login") or path.endswith("login"):
        return login()
    return _page()
