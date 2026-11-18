"""
Opcional (só local): espelho Streamlit do mesmo resumo.

  pip install streamlit
  streamlit run streamlit_app.py

No Vercel free tier usamos Flask (`app.py`) — Streamlit precisa de processo persistente.
"""

from __future__ import annotations

import streamlit as st

from sheets_client import load_dashboard


st.set_page_config(page_title="NDF Futsal · Dashboard", page_icon="⚽", layout="wide")
st.markdown(
    """
    <style>
      .stApp { background: linear-gradient(180deg, #f7faf8, #eef5f0); }
      h1, h2, h3 { color: #0F3D2E !important; }
    </style>
    """,
    unsafe_allow_html=True,
)

data = load_dashboard()
st.title("TUDO SOBRE FUTSAL")
st.caption(data["message"])
st.info("Modo " + data["mode"].upper())

k = data["kpis"]
c1, c2, c3, c4 = st.columns(4)
c1.metric("Parcelas", k["parcelas"])
c2.metric("Valor total", f"R$ {k['valor_total']:,.2f}")
c3.metric("Pendente", f"R$ {k['pendente']:,.2f}")
c4.metric("Pago", f"R$ {k['pago']:,.2f}")

left, right = st.columns(2)
with left:
    st.subheader("Cadastros por unidade")
    st.table(
        [{"Unidade": u, "Cadastros": q} for u, q in data["cadastros_por_unidade"].items()]
    )
with right:
    st.subheader("Pagamentos por unidade")
    st.table(data["por_unidade"])

st.subheader("Pagamentos recentes")
st.table(data["pagamentos_recentes"])
