"""Leitura da planilha Google Sheets (service account)."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any

UNIDADE_ABAS = (
    "COOP Futsal",
    "COOP/FLAPALMAS",
    "Monteiro Lobato Futsal",
)


def _credentials():
    from google.oauth2.service_account import Credentials

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ]
    raw = (os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") or "").strip()
    if raw:
        info = json.loads(raw)
        return Credentials.from_service_account_info(info, scopes=scopes)

    path = (os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE") or "").strip()
    if path and os.path.isfile(path):
        return Credentials.from_service_account_file(path, scopes=scopes)

    return None


def configured() -> bool:
    sheet_id = (os.getenv("GOOGLE_SHEETS_ID") or "").strip()
    return bool(sheet_id and _credentials())


@lru_cache(maxsize=1)
def _gc():
    import gspread

    creds = _credentials()
    if not creds:
        raise RuntimeError("Service account não configurada.")
    return gspread.authorize(creds)


def _open():
    sheet_id = (os.getenv("GOOGLE_SHEETS_ID") or "").strip()
    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEETS_ID ausente.")
    return _gc().open_by_key(sheet_id)


def _safe_records(title: str) -> list[dict[str, Any]]:
    try:
        ws = _open().worksheet(title)
        return ws.get_all_records()
    except Exception:
        return []


def _safe_values(title: str) -> list[list[Any]]:
    try:
        ws = _open().worksheet(title)
        return ws.get_all_values()
    except Exception:
        return []


def demo_payload() -> dict[str, Any]:
    """Dados de demonstração quando as credenciais ainda não existem."""
    return {
        "mode": "demo",
        "message": "Configure GOOGLE_SHEETS_ID + service account para ler a planilha real.",
        "kpis": {
            "parcelas": 42,
            "valor_total": 18480.0,
            "pendente": 9200.0,
            "pago": 8200.0,
            "isento": 680.0,
            "cancelado": 400.0,
        },
        "por_unidade": [
            {"unidade": "COOP Futsal", "qtd": 14, "valor": 6160.0},
            {"unidade": "COOP/FLAPALMAS", "qtd": 16, "valor": 7040.0},
            {"unidade": "Monteiro Lobato Futsal", "qtd": 12, "valor": 5280.0},
        ],
        "cadastros_por_unidade": {
            "COOP Futsal": 8,
            "COOP/FLAPALMAS": 9,
            "Monteiro Lobato Futsal": 6,
        },
        "pagamentos_recentes": [
            {
                "unidade": "COOP Futsal",
                "nome": "Ana Silva",
                "competencia": "2026-11",
                "valor": 200.0,
                "status": "Pendente",
            },
            {
                "unidade": "COOP/FLAPALMAS",
                "nome": "Bruno Costa",
                "competencia": "2026-11",
                "valor": 255.0,
                "status": "Pago",
            },
            {
                "unidade": "Monteiro Lobato Futsal",
                "nome": "Carla Dias",
                "competencia": "2026-11",
                "valor": 160.0,
                "status": "Pendente",
            },
        ],
        "resumo_linhas": [],
    }


def _num(value: Any) -> float:
    if value is None or value == "":
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    text = text.replace("R$", "").replace(" ", "")
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return 0.0


def load_dashboard() -> dict[str, Any]:
    if not configured():
        return demo_payload()

    resumo_name = os.getenv("SHEET_RESUMO", "Resumo")
    pag_name = os.getenv("SHEET_PAGAMENTOS", "Pagamentos")

    resumo_values = _safe_values(resumo_name)
    pagamentos = _safe_records(pag_name)

    kpis = {
        "parcelas": 0,
        "valor_total": 0.0,
        "pendente": 0.0,
        "pago": 0.0,
        "isento": 0.0,
        "cancelado": 0.0,
    }

    # Resumo tab layout from Code.gs: labels in col A, values in col B (rows ~6-11)
    label_map = {
        "Parcelas (linhas)": "parcelas",
        "Valor total": "valor_total",
        "Pendente": "pendente",
        "Pago": "pago",
        "Isento": "isento",
        "Cancelado": "cancelado",
    }
    for row in resumo_values:
        if len(row) < 2:
            continue
        key = label_map.get(str(row[0]).strip())
        if key:
            kpis[key] = _num(row[1]) if key != "parcelas" else int(_num(row[1]))

    if not kpis["parcelas"] and pagamentos:
        kpis["parcelas"] = len(pagamentos)
        kpis["valor_total"] = sum(_num(r.get("Valor")) for r in pagamentos)
        for r in pagamentos:
            status = str(r.get("Status") or "").strip().lower()
            valor = _num(r.get("Valor"))
            if status == "pendente":
                kpis["pendente"] += valor
            elif status == "pago":
                kpis["pago"] += valor
            elif status == "isento":
                kpis["isento"] += valor
            elif status == "cancelado":
                kpis["cancelado"] += valor

    por_unidade: dict[str, dict[str, Any]] = {}
    for r in pagamentos:
        unidade = str(r.get("Unidade") or "—").strip() or "—"
        bucket = por_unidade.setdefault(unidade, {"unidade": unidade, "qtd": 0, "valor": 0.0})
        bucket["qtd"] += 1
        bucket["valor"] += _num(r.get("Valor"))

    cadastros_por_unidade: dict[str, int] = {}
    for aba in UNIDADE_ABAS:
        rows = _safe_records(aba)
        cadastros_por_unidade[aba] = len(rows)

    recentes = []
    for r in reversed(pagamentos[-12:]):
        recentes.append(
            {
                "unidade": r.get("Unidade") or "—",
                "nome": f"{r.get('Nome') or ''} {r.get('Sobrenome') or ''}".strip() or "—",
                "competencia": r.get("Competência") or r.get("Competencia") or "—",
                "valor": _num(r.get("Valor")),
                "status": r.get("Status") or "—",
            }
        )
    recentes.reverse()

    return {
        "mode": "live",
        "message": "Dados ao vivo da planilha (abas Resumo, Pagamentos e unidades).",
        "kpis": kpis,
        "por_unidade": list(por_unidade.values()),
        "cadastros_por_unidade": cadastros_por_unidade,
        "pagamentos_recentes": list(reversed(recentes))[:12],
        "resumo_linhas": resumo_values[:40],
    }
