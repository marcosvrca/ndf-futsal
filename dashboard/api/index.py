"""Entrypoint Vercel — Flask dashboard with Chart.js charts."""
from __future__ import annotations

import json
import os
from collections import Counter
from datetime import date, datetime
from functools import lru_cache, wraps
from typing import Any, Callable

from flask import Flask, jsonify, redirect, render_template_string, request, session, url_for

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "ndf-futsal-dashboard-session-key")

AUTH_USER = "marcos.farias@mail.uft.edu.br"
AUTH_PASS = "Ndffutsal@2026"
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
<title>Painel gerencial · TUDO SOBRE FUTSAL</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js" defer></script>
""" + THEME_BOOT + """
<style>
""" + THEME_CSS + """
*{box-sizing:border-box}body{margin:0;font-family:Manrope,system-ui,sans-serif;color:var(--ink);background:var(--bg);padding:1.5rem 1.1rem 3rem}
.wrap{max-width:1180px;margin:0 auto}
.top-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.top-row .theme-bar{margin:0}
h1{font-family:"Archivo Black",sans-serif;color:var(--g);margin:.15rem 0 0;font-size:clamp(1.55rem,3.4vw,2.35rem)}
.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:.72rem;font-weight:800;color:var(--m);margin:0}
.sub{margin:.35rem 0 0;color:var(--muted);font-size:.92rem}
.meta{display:flex;flex-wrap:wrap;gap:.55rem;align-items:center;margin:.85rem 0 0}
.badge{display:inline-flex;padding:.3rem .7rem;border-radius:999px;font-size:.72rem;font-weight:800;border:1px solid transparent}
html[data-theme="contrast"] .badge{border-radius:0;border-color:#ffff00}
.badge-demo{background:var(--pend);color:var(--ink)}.badge-live{background:var(--pago);color:var(--ink)}
.logout{color:var(--m);font-size:.85rem;font-weight:800}
.filters{display:flex;flex-wrap:wrap;gap:.7rem;margin:1rem 0;padding:1rem;background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}
.filters label{display:flex;flex-direction:column;gap:.3rem;font-size:.72rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
.filters select{min-width:160px;padding:.55rem .7rem;border:1px solid var(--input-border);border-radius:10px;background:var(--input-bg);color:var(--ink);font:inherit;font-weight:700}
html[data-theme="contrast"] .filters select{border-radius:0}
.filters button{align-self:end;border:0;border-radius:10px;padding:.65rem 1rem;font:inherit;font-weight:800;color:var(--btn-text);background:linear-gradient(135deg,var(--g),var(--m));cursor:pointer}
html[data-theme="contrast"] .filters button{border-radius:0;background:#ffff00;color:#000;border:1px solid #ffff00}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.8rem;margin:0 0 1rem}
.kpi,.panel,.chart-box,.alert-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:1rem;box-shadow:var(--shadow)}
.kpi b{display:block;color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.05em}.kpi span{display:block;margin-top:.35rem;font-size:clamp(1.15rem,2.3vw,1.55rem);font-weight:800;color:var(--g)}
.kpi small{display:block;margin-top:.25rem;color:var(--muted);font-size:.78rem;font-weight:700}
.kpi--warn span{color:#b45309}html[data-theme="dark"] .kpi--warn span{color:#fbbf24}html[data-theme="contrast"] .kpi--warn span{color:#ffff00}
.charts{display:grid;grid-template-columns:1.25fr 1fr;gap:.8rem;margin:0 0 1rem}
.charts-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.8rem;margin:0 0 1rem}
.chart-box{min-height:270px;padding:1rem 1rem .55rem}
.chart-box h2,.panel h2,.alert-card h2{margin:0 0 .55rem;font-size:.95rem;color:var(--g)}
.chart-box canvas{max-height:210px}
.charts-wide{grid-column:1/-1}
.grid{display:grid;grid-template-columns:1.4fr .8fr;gap:.8rem;margin:0 0 1rem}
.alerts{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem;margin:0 0 1rem}
.alert-card strong{display:block;font-size:1.6rem;color:var(--g);margin:.2rem 0}
.alert-card p{margin:0;color:var(--muted);font-size:.85rem;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;padding:.55rem .4rem;border-bottom:1px solid var(--line);color:var(--ink)}
th{color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.04em}
.status{display:inline-flex;padding:.15rem .45rem;border-radius:999px;font-size:.72rem;font-weight:800;background:var(--pend)}
.status--pago{background:var(--pago)}html[data-theme="contrast"] .status{border:1px solid #ffff00;border-radius:0}
.empty{color:var(--muted);font-weight:700;padding:.4rem 0}
@media(max-width:960px){.kpis,.charts,.charts-3,.grid,.alerts{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
<div class="top-row">
  <div>
    <p class="eyebrow">Painel gerencial · visão geral</p>
    <h1>TUDO SOBRE FUTSAL</h1>
    <p class="sub">{{ data.message }}</p>
    <div class="meta">
      <span class="badge {{ 'badge-live' if data.mode=='live' else 'badge-demo' }}">{{ 'AO VIVO' if data.mode=='live' else 'DEMO' }}</span>
      <a class="logout" href="{{ url_for('logout') }}">Sair</a>
    </div>
  </div>
""" + THEME_SWITCH + """
</div>

<form class="filters" method="get" action="/">
  <label>Período
    <select name="periodo">
      {% for opt in data.periodos %}
      <option value="{{ opt }}" {% if opt==data.filtros.periodo %}selected{% endif %}>{{ opt }}</option>
      {% endfor %}
    </select>
  </label>
  <label>Unidade
    <select name="unidade">
      <option value="todas" {% if data.filtros.unidade=='todas' %}selected{% endif %}>Todas</option>
      {% for u in data.unidades %}
      <option value="{{ u }}" {% if data.filtros.unidade==u %}selected{% endif %}>{{ u }}</option>
      {% endfor %}
    </select>
  </label>
  <button type="submit">Aplicar</button>
</form>

<section class="kpis" aria-label="Indicadores">
  <article class="kpi"><b>Alunos ativos</b><span>{{ data.kpis.alunos_ativos }}</span><small>Matrículas vigentes</small></article>
  <article class="kpi"><b>Novos cadastros</b><span>{{ data.kpis.novos_cadastros }}</span><small>No período {{ data.filtros.periodo }}</small></article>
  <article class="kpi"><b>Valor recebido</b><span>{{ data.kpis.recebido|brl }}</span><small>Pagamentos confirmados</small></article>
  <article class="kpi kpi--warn"><b>Em atraso</b><span>{{ data.kpis.vencido|brl }}</span><small>Pendente: {{ data.kpis.pendente|brl }}</small></article>
  <article class="kpi"><b>Parcelas do período</b><span>{{ data.kpis.parcelas }}</span><small>Previsto: {{ data.kpis.previsto|brl }}</small></article>
  <article class="kpi"><b>Inadimplentes</b><span>{{ data.kpis.inadimplentes }}</span><small>Alunos com vencidas</small></article>
  <article class="kpi"><b>Ticket médio</b><span>{{ data.kpis.ticket_medio|brl }}</span><small>Valor médio da parcela</small></article>
  <article class="kpi"><b>Taxa de recebimento</b><span>{{ data.kpis.taxa_recebimento }}%</span><small>Recebido ÷ previsto</small></article>
</section>

<section class="charts" aria-label="Visão geral">
  <div class="chart-box charts-wide">
    <h2>Evolução de matrículas</h2>
    <canvas id="chartTempo" height="90"></canvas>
  </div>
  <div class="chart-box">
    <h2>Alunos por unidade</h2>
    <canvas id="chartUnidade"></canvas>
  </div>
  <div class="chart-box">
    <h2>Situação das parcelas</h2>
    <canvas id="chartStatus"></canvas>
  </div>
</section>

<section class="charts-3" aria-label="Distribuição">
  <div class="chart-box">
    <h2>Faixa etária</h2>
    <canvas id="chartIdade"></canvas>
  </div>
  <div class="chart-box">
    <h2>Alunos por turma</h2>
    <canvas id="chartTurma"></canvas>
  </div>
  <div class="chart-box">
    <h2>Forma de pagamento</h2>
    <canvas id="chartForma"></canvas>
  </div>
</section>

<section class="alerts" aria-label="Pendências">
  <div class="alert-card"><h2>Inadimplentes</h2><strong>{{ data.kpis.inadimplentes }}</strong><p>Alunos com parcelas vencidas</p></div>
  <div class="alert-card"><h2>Contratos pendentes</h2><strong>{{ data.kpis.contratos_pendentes }}</strong><p>Sem confirmação de ciência</p></div>
  <div class="alert-card"><h2>Autorizações pendentes</h2><strong>{{ data.kpis.autorizacoes_pendentes }}</strong><p>Uso de imagem sem OK</p></div>
</section>

<section class="grid">
  <div class="panel">
    <h2>Atenção financeira · alunos inadimplentes</h2>
    {% if data.inadimplentes %}
    <div class="table-wrap">
      <table>
        <thead><tr><th>Aluno</th><th>Unidade</th><th>Parcelas</th><th>Valor</th></tr></thead>
        <tbody>
        {% for row in data.inadimplentes %}
          <tr>
            <td>{{ row.nome }}</td>
            <td>{{ row.unidade }}</td>
            <td>{{ row.qtd }}</td>
            <td>{{ row.valor|brl }}</td>
          </tr>
        {% endfor %}
        </tbody>
      </table>
    </div>
    {% else %}
    <p class="empty">Nenhum aluno com parcela vencida no filtro atual.</p>
    {% endif %}
  </div>
  <div class="panel">
    <h2>Recebido por unidade</h2>
    <ul style="list-style:none;margin:0;padding:0">
      {% for row in data.por_unidade %}
      <li style="display:flex;justify-content:space-between;padding:.55rem 0;border-top:1px solid var(--line)">
        <span>{{ row.unidade }} · {{ row.qtd }} pagas</span>
        <strong style="color:var(--g)">{{ row.valor|brl }}</strong>
      </li>
      {% else %}
      <li class="empty">Sem pagamentos no período.</li>
      {% endfor %}
    </ul>
  </div>
</section>

<script id="chart-data" type="application/json">{{ data.charts|tojson }}</script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart === 'undefined') return;
  const charts = JSON.parse(document.getElementById('chart-data').textContent || '{}');
  const store = {};

  function palette(theme) {
    if (theme === 'dark') {
      return {
        green:'#34d399', mid:'#6ee7b7', gold:'#e3c878', danger:'#fb7185',
        soft:['#34d399','#6ee7b7','#2dd4bf','#e3c878','#94a3b8','#22c55e','#38bdf8'],
        fill:'rgba(52,211,153,.15)', grid:'rgba(148,163,184,.2)', tick:'#94a3b8'
      };
    }
    if (theme === 'contrast') {
      return {
        green:'#ffff00', mid:'#ffff00', gold:'#ffffff', danger:'#ff00ff',
        soft:['#ffff00','#ffffff','#00ffff','#ff00ff','#00ff00','#ffaa00','#66ff66'],
        fill:'rgba(255,255,0,.2)', grid:'#ffff00', tick:'#ffffff'
      };
    }
    return {
      green:'#0f3d2e', mid:'#1a5c44', gold:'#c4a35a', danger:'#b45309',
      soft:['#0f3d2e','#1a5c44','#4a7c59','#c4a35a','#8b7355','#2f6b52','#0ea5e9'],
      fill:'rgba(15,61,46,.12)', grid:'#d5e3db', tick:'#4d6359'
    };
  }

  function mk(id, conf) {
    if (store[id]) store[id].destroy();
    const el = document.getElementById(id);
    if (!el) return;
    store[id] = new Chart(el, conf);
  }

  function renderCharts() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const p = palette(theme);
    const common = {
      responsive:true, maintainAspectRatio:true,
      plugins:{legend:{labels:{color:p.tick, font:{family:'Manrope'}}}},
      scales:{
        x:{ticks:{color:p.tick}, grid:{color:p.grid}},
        y:{ticks:{color:p.tick, precision:0}, grid:{color:p.grid}, beginAtZero:true}
      }
    };
    const doughnut = {
      responsive:true, maintainAspectRatio:true,
      plugins:{legend:{position:'bottom', labels:{color:p.tick, font:{family:'Manrope', size:11}}}}
    };
    const contrastBorder = theme === 'contrast' ? 2 : 0;

    const tempo = charts.tempo || {labels:[], values:[]};
    mk('chartTempo', {
      type:'line',
      data:{labels:tempo.labels, datasets:[{label:'Novos cadastros', data:tempo.values, borderColor:p.green, backgroundColor:p.fill, fill:true, tension:.35, pointRadius:3, pointBackgroundColor:p.gold}]},
      options:common
    });

    const unidade = charts.unidade || {labels:[], values:[]};
    mk('chartUnidade', {
      type:'doughnut',
      data:{labels:unidade.labels, datasets:[{data:unidade.values, backgroundColor:p.soft.slice(0, unidade.labels.length), borderWidth:contrastBorder, borderColor:'#000'}]},
      options:doughnut
    });

    const status = charts.status || {labels:[], values:[]};
    mk('chartStatus', {
      type:'doughnut',
      data:{labels:status.labels, datasets:[{data:status.values, backgroundColor:[p.green, p.gold, p.danger].slice(0, status.labels.length), borderWidth:contrastBorder, borderColor:'#000'}]},
      options:doughnut
    });

    const idade = charts.idade || {labels:[], values:[]};
    mk('chartIdade', {
      type:'bar',
      data:{labels:idade.labels, datasets:[{label:'Alunos', data:idade.values, backgroundColor:p.mid, borderRadius: theme==='contrast'?0:8, borderWidth:contrastBorder, borderColor:'#ffff00'}]},
      options:{...common, plugins:{legend:{display:false}}}
    });

    const turma = charts.turma || {labels:[], values:[]};
    mk('chartTurma', {
      type:'bar',
      data:{labels:turma.labels, datasets:[{label:'Alunos', data:turma.values, backgroundColor:p.green, borderRadius: theme==='contrast'?0:8, borderWidth:contrastBorder, borderColor:'#ffff00'}]},
      options:{...common, plugins:{legend:{display:false}}}
    });

    const forma = charts.forma || {labels:[], values:[]};
    mk('chartForma', {
      type:'doughnut',
      data:{labels:forma.labels, datasets:[{data:forma.values, backgroundColor:p.soft.slice(0, forma.labels.length), borderWidth:contrastBorder, borderColor:'#000'}]},
      options:doughnut
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


def _truthy_flag(value: Any) -> bool:
    text = str(value or "").strip().lower()
    return text in {"sim", "yes", "true", "1", "ok", "ciente", "autorizado"}


def _parse_date(value: Any) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(text[:10], fmt).date()
        except ValueError:
            continue
    if "T" in text:
        try:
            return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
        except ValueError:
            return None
    return None


def _parse_month(value: Any) -> str:
    """Return YYYY-MM when possible."""
    text = str(value or "").strip()
    if len(text) >= 7 and text[4] == "-":
        return text[:7]
    dt = _parse_date(value)
    if dt:
        return dt.strftime("%Y-%m")
    # Competência like 11/2026
    if "/" in text:
        parts = text.split("/")
        if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
            return f"{int(parts[1]):04d}-{int(parts[0]):02d}"
    return ""


def _age_band(idade: Any) -> str:
    try:
        n = int(float(str(idade).replace(",", ".")))
    except (TypeError, ValueError):
        return "Sem idade"
    if n <= 6:
        return "Até 6"
    if n <= 9:
        return "7–9"
    if n <= 12:
        return "10–12"
    if n <= 15:
        return "13–15"
    return "16+"


def _is_active_status(status: Any) -> bool:
    text = str(status or "").strip().lower()
    if not text:
        return True
    return text not in {"cancelado", "inativo", "encerrado", "baixado"}


def _is_pago(status: Any) -> bool:
    return str(status or "").strip().lower() in {"pago", "isento"}


def _is_pendente(status: Any) -> bool:
    return str(status or "").strip().lower() == "pendente"


def _full_name(row: dict[str, Any]) -> str:
    aluno = str(row.get("Nome do aluno") or "").strip()
    if aluno:
        return aluno
    return f"{row.get('Nome') or ''} {row.get('Sobrenome') or ''}".strip() or "—"


def _demo_payload(periodo: str, unidade: str) -> dict[str, Any]:
    return {
        "mode": "demo",
        "message": "Configure GOOGLE_SHEETS_ID + service account para ler a planilha real.",
        "filtros": {"periodo": periodo or "2026-11", "unidade": unidade or "todas"},
        "periodos": ["2026-11", "2026-10", "2026-09"],
        "unidades": list(UNIDADE_ABAS),
        "kpis": {
            "alunos_ativos": 248,
            "novos_cadastros": 32,
            "recebido": 12450.0,
            "pendente": 3200.0,
            "vencido": 2350.0,
            "previsto": 15650.0,
            "parcelas": 180,
            "inadimplentes": 18,
            "ticket_medio": 85.0,
            "taxa_recebimento": 80,
            "contratos_pendentes": 7,
            "autorizacoes_pendentes": 12,
        },
        "por_unidade": [
            {"unidade": "COOP Futsal", "qtd": 14, "valor": 5200.0},
            {"unidade": "COOP/FLAPALMAS", "qtd": 16, "valor": 4300.0},
            {"unidade": "Monteiro Lobato Futsal", "qtd": 12, "valor": 2950.0},
        ],
        "inadimplentes": [
            {"nome": "Aluno A", "unidade": "COOP Futsal", "qtd": 2, "valor": 170.0},
            {"nome": "Aluno B", "unidade": "Monteiro Lobato Futsal", "qtd": 1, "valor": 85.0},
            {"nome": "Aluno C", "unidade": "COOP/FLAPALMAS", "qtd": 3, "valor": 255.0},
        ],
        "charts": {
            "tempo": {"labels": ["Jun", "Jul", "Ago", "Set", "Out", "Nov"], "values": [12, 18, 15, 22, 27, 32]},
            "unidade": {"labels": list(UNIDADE_ABAS), "values": [90, 86, 72]},
            "status": {"labels": ["Pagas", "Pendentes", "Vencidas"], "values": [140, 22, 18]},
            "idade": {"labels": ["Até 6", "7–9", "10–12", "13–15", "16+"], "values": [28, 64, 82, 54, 20]},
            "turma": {
                "labels": [
                    "Nascidos 2018-2020",
                    "Nascidos 2015-2017",
                    "SUB11 e SUB12",
                    "SUB12 e SUB13",
                ],
                "values": [40, 55, 48, 36],
            },
            "forma": {
                "labels": ["Anual 11x", "Semestral 6x", "Mensal", "Anual 10x"],
                "values": [58, 30, 12, 20],
            },
        },
    }


def _credentials():
    from google.oauth2.service_account import Credentials

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ]
    raw = (os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") or "").strip()
    if raw:
        info = json.loads(raw)
        key = info.get("private_key")
        if isinstance(key, str) and "\\n" in key and "\n" not in key:
            info["private_key"] = key.replace("\\n", "\n")
        return Credentials.from_service_account_info(info, scopes=scopes)
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


_SHEET_ERRORS: list[str] = []


def _fmt_err(err: BaseException) -> str:
    parts = [type(err).__name__]
    text = str(err).strip()
    if text:
        parts.append(text)
    cause = getattr(err, "__cause__", None) or getattr(err, "__context__", None)
    if cause is not None:
        cause_txt = str(cause).strip() or repr(cause)
        parts.append(f"cause={type(cause).__name__}: {cause_txt}")
        response = getattr(cause, "response", None)
        if response is not None:
            try:
                body = response.text if hasattr(response, "text") else str(response)
                parts.append(f"body={str(body)[:220]}")
            except Exception:
                pass
    return " | ".join(parts)[:500]


def _note_sheet_error(msg: str) -> None:
    text = str(msg or "").strip()
    if text and text not in _SHEET_ERRORS:
        _SHEET_ERRORS.append(text[:500])


def _sa_email() -> str:
    raw = (os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") or "").strip()
    if not raw:
        return ""
    try:
        return str(json.loads(raw).get("client_email") or "").strip()
    except Exception:
        return ""


@lru_cache(maxsize=1)
def _gc():
    import gspread

    creds = _credentials()
    if not creds:
        raise RuntimeError("missing credentials")
    return gspread.authorize(creds)


def _open():
    sheet_id = (os.getenv("GOOGLE_SHEETS_ID") or "").strip()
    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEETS_ID ausente")
    return _gc().open_by_key(sheet_id)


def _records_from_values(values: list[list[Any]]) -> list[dict[str, Any]]:
    """Converte grade A1 em dicts, tolerando cabeçalhos vazios/duplicados."""
    if not values:
        return []
    headers_raw = [str(h or "").strip() for h in values[0]]
    headers: list[str] = []
    seen: dict[str, int] = {}
    for idx, name in enumerate(headers_raw):
        if not name:
            name = f"_col_{idx + 1}"
        count = seen.get(name, 0)
        seen[name] = count + 1
        headers.append(name if count == 0 else f"{name}_{count + 1}")

    rows: list[dict[str, Any]] = []
    for raw in values[1:]:
        if not any(str(c or "").strip() for c in raw):
            continue
        item: dict[str, Any] = {}
        for i, key in enumerate(headers):
            item[key] = raw[i] if i < len(raw) else ""
        rows.append(item)
    return rows


def _safe_records(title: str) -> list[dict[str, Any]]:
    try:
        ws = _open().worksheet(title)
        try:
            return ws.get_all_records()
        except Exception as rec_err:
            _note_sheet_error(
                f"{title}: get_all_records falhou ({_fmt_err(rec_err)}); usando fallback."
            )
            return _records_from_values(ws.get_all_values())
    except Exception as err:
        _note_sheet_error(f"{title}: {_fmt_err(err)}")
        return []


def _probe_sheets() -> dict[str, Any]:
    """Diagnóstico leve da conexão com a planilha (sem expor segredos)."""
    sheet_id = (os.getenv("GOOGLE_SHEETS_ID") or "").strip()
    info: dict[str, Any] = {
        "configured": configured(),
        "sheet_id_set": bool(sheet_id),
        "sheet_id": sheet_id,
        "sheet_id_suffix": sheet_id[-8:] if len(sheet_id) >= 8 else sheet_id,
        "service_account": _sa_email() or "(não lido)",
        "titles": [],
        "counts": {},
        "errors": [],
    }
    if not info["configured"]:
        info["errors"].append("Credenciais ou GOOGLE_SHEETS_ID ausentes.")
        return info
    try:
        ss = _open()
        info["title"] = ss.title
        info["titles"] = [ws.title for ws in ss.worksheets()]
        for name in [os.getenv("SHEET_PAGAMENTOS", "Pagamentos"), *UNIDADE_ABAS]:
            info["counts"][name] = len(_safe_records(name))
    except Exception as err:
        _note_sheet_error(_fmt_err(err))
    info["errors"] = list(_SHEET_ERRORS)
    return info


def _match_unidade(row_unidade: Any, filtro: str) -> bool:
    if not filtro or filtro == "todas":
        return True
    return str(row_unidade or "").strip() == filtro


def load_dashboard() -> dict[str, Any]:
    global _SHEET_ERRORS
    _SHEET_ERRORS = []

    today = date.today()
    periodo_arg = (request.args.get("periodo") or "").strip()
    unidade = (request.args.get("unidade") or "todas").strip() or "todas"
    periodo = periodo_arg or today.strftime("%Y-%m")

    if not configured():
        return _demo_payload(periodo, unidade)

    pagamentos = _safe_records(os.getenv("SHEET_PAGAMENTOS", "Pagamentos"))
    cadastro_rows: list[dict[str, Any]] = []
    for aba in UNIDADE_ABAS:
        for row in _safe_records(aba):
            row = dict(row)
            row.setdefault("Unidade", aba)
            cadastro_rows.append(row)

    # Se o mês atual não tem dados e o usuário não escolheu período, usa o mais recente.
    if not periodo_arg:
        months = sorted(
            {
                _parse_month(r.get("Competência") or r.get("Competencia") or r.get("Data/Hora") or r.get("Data"))
                for r in (pagamentos + cadastro_rows)
            },
            reverse=True,
        )
        months = [m for m in months if m]
        if months and periodo not in months:
            periodo = months[0]

    cadastros_f = [r for r in cadastro_rows if _match_unidade(r.get("Unidade"), unidade)]
    pagamentos_f = [r for r in pagamentos if _match_unidade(r.get("Unidade"), unidade)]

    ativos = [r for r in cadastros_f if _is_active_status(r.get("Status"))]
    novos = []
    for r in cadastros_f:
        month = _parse_month(r.get("Data/Hora") or r.get("Data"))
        if month == periodo:
            novos.append(r)

    # Period payments by competência
    pag_periodo = []
    for r in pagamentos_f:
        comp = _parse_month(r.get("Competência") or r.get("Competencia") or f"{r.get('Ano')}-{r.get('Mês')}")
        if not comp and r.get("Mês") and r.get("Ano"):
            try:
                comp = f"{int(r.get('Ano')):04d}-{int(r.get('Mês')):02d}"
            except (TypeError, ValueError):
                comp = ""
        r = dict(r)
        r["_competencia"] = comp
        if comp == periodo or not periodo:
            pag_periodo.append(r)

    recebido = sum(_num(r.get("Valor")) for r in pag_periodo if _is_pago(r.get("Status")))
    pendente = sum(_num(r.get("Valor")) for r in pag_periodo if _is_pendente(r.get("Status")))
    previsto = sum(
        _num(r.get("Valor"))
        for r in pag_periodo
        if str(r.get("Status") or "").strip().lower() != "cancelado"
    )
    vencido = 0.0
    inad_map: dict[str, dict[str, Any]] = {}
    for r in pagamentos_f:
        if not _is_pendente(r.get("Status")):
            continue
        venc = _parse_date(r.get("Vencimento"))
        if not venc or venc >= today:
            continue
        valor = _num(r.get("Valor"))
        # Only count overdue amount in KPI for period parcels when competência matches,
        # but list all overdue students in filtered unidade.
        comp = _parse_month(r.get("Competência") or r.get("Competencia"))
        if comp == periodo:
            vencido += valor
        key = str(r.get("ID cadastro") or _full_name(r))
        bucket = inad_map.setdefault(
            key,
            {"nome": _full_name(r), "unidade": r.get("Unidade") or "—", "qtd": 0, "valor": 0.0},
        )
        bucket["qtd"] += 1
        bucket["valor"] += valor

    valores_ticket = [_num(r.get("Valor")) for r in pag_periodo if _num(r.get("Valor")) > 0]
    ticket = (sum(valores_ticket) / len(valores_ticket)) if valores_ticket else 0.0
    taxa = int(round((recebido / previsto) * 100)) if previsto else 0

    contratos_pendentes = sum(1 for r in ativos if not _truthy_flag(r.get("Contrato ciente")))
    autorizacoes_pendentes = sum(1 for r in ativos if not _truthy_flag(r.get("Uso de imagem")))

    # Charts
    tempo_counter: Counter[str] = Counter()
    for r in cadastros_f:
        label = _parse_month(r.get("Data/Hora") or r.get("Data"))
        if label:
            tempo_counter[label] += 1
    tempo_labels = sorted(tempo_counter.keys())[-8:]
    tempo_values = [tempo_counter[k] for k in tempo_labels]

    unidade_counter: Counter[str] = Counter(
        str(r.get("Unidade") or "—").strip() or "—" for r in ativos
    )
    unidade_labels = list(unidade_counter.keys()) or list(UNIDADE_ABAS)
    unidade_values = [unidade_counter.get(u, 0) for u in unidade_labels]

    pagas = sum(1 for r in pag_periodo if _is_pago(r.get("Status")))
    pend_qtd = sum(1 for r in pag_periodo if _is_pendente(r.get("Status")))
    venc_qtd = 0
    for r in pag_periodo:
        if _is_pendente(r.get("Status")):
            venc = _parse_date(r.get("Vencimento"))
            if venc and venc < today:
                venc_qtd += 1
                pend_qtd -= 1
    status_labels = ["Pagas", "Pendentes", "Vencidas"]
    status_values = [pagas, max(pend_qtd, 0), venc_qtd]

    idade_order = ["Até 6", "7–9", "10–12", "13–15", "16+", "Sem idade"]
    idade_counter: Counter[str] = Counter(_age_band(r.get("Idade")) for r in ativos)
    idade_labels = [b for b in idade_order if idade_counter.get(b)]
    idade_values = [idade_counter[b] for b in idade_labels]

    turma_counter: Counter[str] = Counter(
        str(r.get("Turma") or "Sem turma").strip() or "Sem turma" for r in ativos
    )
    turma_items = turma_counter.most_common(8)

    forma_counter: Counter[str] = Counter()
    for r in cadastros_f:
        forma = str(r.get("Forma de pagamento") or r.get("Periodicidade") or "Outros").strip() or "Outros"
        forma_counter[forma] += 1
    forma_items = forma_counter.most_common(6)

    por_unidade: dict[str, dict[str, Any]] = {}
    for r in pag_periodo:
        if not _is_pago(r.get("Status")):
            continue
        u = str(r.get("Unidade") or "—").strip() or "—"
        b = por_unidade.setdefault(u, {"unidade": u, "qtd": 0, "valor": 0.0})
        b["qtd"] += 1
        b["valor"] += _num(r.get("Valor"))

    periodos = sorted(
        {
            _parse_month(r.get("Competência") or r.get("Competencia") or r.get("Data/Hora") or r.get("Data"))
            for r in (pagamentos + cadastro_rows)
        }
        | {periodo, today.strftime("%Y-%m")}
    )
    periodos = [p for p in periodos if p]
    periodos = sorted(periodos, reverse=True)[:18]

    inad_list = sorted(inad_map.values(), key=lambda x: x["valor"], reverse=True)[:20]

    message = "Painel gerencial com dados ao vivo da planilha."
    if not pagamentos and not cadastro_rows:
        sa = _sa_email()
        sheet_id = (os.getenv("GOOGLE_SHEETS_ID") or "").strip()
        share_hint = (
            f" Confira se a planilha compartilhada é exatamente a do ID {sheet_id} "
            f"(URL: docs.google.com/spreadsheets/d/{sheet_id}/edit) com {sa} como Editor/Leitor."
            if sa and sheet_id
            else " Compartilhe a planilha com o e-mail da service account e confira GOOGLE_SHEETS_ID."
        )
        err_txt = " | ".join(_SHEET_ERRORS[:2]) if _SHEET_ERRORS else "nenhuma linha lida nas abas Pagamentos/unidades."
        message = f"Conectado, mas sem dados da planilha: {err_txt}.{share_hint}"

    return {
        "mode": "live",
        "message": message,
        "filtros": {"periodo": periodo, "unidade": unidade},
        "periodos": periodos or [periodo],
        "unidades": list(UNIDADE_ABAS),
        "sheet_errors": list(_SHEET_ERRORS),
        "sheet_counts": {
            "pagamentos": len(pagamentos),
            "cadastros": len(cadastro_rows),
        },
        "kpis": {
            "alunos_ativos": len(ativos),
            "novos_cadastros": len(novos),
            "recebido": recebido,
            "pendente": pendente,
            "vencido": vencido,
            "previsto": previsto,
            "parcelas": len(pag_periodo),
            "inadimplentes": len(inad_map),
            "ticket_medio": ticket,
            "taxa_recebimento": taxa,
            "contratos_pendentes": contratos_pendentes,
            "autorizacoes_pendentes": autorizacoes_pendentes,
        },
        "por_unidade": list(por_unidade.values()),
        "inadimplentes": inad_list,
        "charts": {
            "tempo": {"labels": tempo_labels, "values": tempo_values},
            "unidade": {"labels": unidade_labels, "values": unidade_values},
            "status": {"labels": status_labels, "values": status_values},
            "idade": {"labels": idade_labels, "values": idade_values},
            "turma": {"labels": [k for k, _ in turma_items], "values": [v for _, v in turma_items]},
            "forma": {"labels": [k for k, _ in forma_items], "values": [v for _, v in forma_items]},
        },
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


@app.route("/api/sheets-status", methods=["GET"])
@login_required
def api_sheets_status():
    global _SHEET_ERRORS
    _SHEET_ERRORS = []
    return jsonify(_probe_sheets())


@app.route("/", defaults={"path": ""}, methods=["GET"])
@app.route("/<path:path>", methods=["GET"])
@login_required
def entry(path: str = ""):
    full = (request.path or "/").rstrip("/") or "/"
    if full.endswith("/health") or path.endswith("health"):
        return health()
    if full.endswith("/api/sheets-status") or path.endswith("sheets-status"):
        return api_sheets_status()
    if full.endswith("/api/summary") or path.endswith("summary"):
        return api_summary()
    if full.endswith("/logout") or path.endswith("logout"):
        return logout()
    if full.endswith("/login") or path.endswith("login"):
        return login()
    return _page()
