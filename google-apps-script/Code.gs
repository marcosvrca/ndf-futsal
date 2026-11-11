/**
 * Cole/atualize este código em: Planilha → Extensões → Apps Script
 *
 * IMPORTANTE ao atualizar:
 * Implantar → Gerenciar implantações → ✏️ editar → Nova versão → Implantar
 * (assim a URL /exec NÃO muda)
 *
 * Quem tem acesso: Qualquer pessoa | Executar como: Eu
 */

var ABA_CADASTROS = "Cadastros";
var ABA_PAGAMENTOS = "Pagamentos";
var ABA_MES = "MesAtual";

var MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function doGet() {
  return json_({
    ok: true,
    message: "Endpoint NDF Futsal ativo. Use POST para cadastrar.",
  });
}

function doPost(e) {
  try {
    var data = parseBody_(e);
    var result = registrarInscricao_(data);
    return json_({ success: true, cadastro_id: result.id, parcelas: result.parcelas });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

/** Rode uma vez no editor (▶) para criar abas/cabeçalhos sem esperar um envio. */
function setupPlanilha() {
  ensureCadastros_();
  ensurePagamentos_();
  ensureMesAtual_();
}

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  if (e && e.parameter) return e.parameter;
  return {};
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function ensureCadastros_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_CADASTROS);
  if (!sheet) sheet = ss.insertSheet(ABA_CADASTROS);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "ID",
      "Data/Hora",
      "Nome",
      "Sobrenome",
      "CPF",
      "E-mail",
      "Plano",
      "Periodicidade",
      "Meses",
      "Valor total",
      "Valor parcela",
      "Contrato ciente",
      "Uso de imagem",
      "Status",
      "Local",
      "Dias",
      "Horário",
      "Turma",
    ]);
    sheet.getRange(1, 1, 1, 18).setFontWeight("bold");
    sheet.setFrozenRows(1);
  } else {
    ensureCadastrosExtraHeaders_(sheet);
  }
  return sheet;
}

function ensureCadastrosExtraHeaders_(sheet) {
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 18)).getValues()[0];
  var extras = ["Local", "Dias", "Horário", "Turma"];
  for (var i = 0; i < extras.length; i++) {
    var col = 15 + i;
    if (!headers[col - 1] || String(headers[col - 1]).trim() === "") {
      sheet.getRange(1, col).setValue(extras[i]).setFontWeight("bold");
    }
  }
}

function ensurePagamentos_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_PAGAMENTOS);
  if (!sheet) sheet = ss.insertSheet(ABA_PAGAMENTOS);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "ID cadastro",
      "Competência",
      "Mês",
      "Ano",
      "Nome",
      "Sobrenome",
      "CPF",
      "E-mail",
      "Periodicidade",
      "Parcela",
      "Valor",
      "Vencimento",
      "Status",
      "Pago em",
      "Observação",
    ]);
    sheet.getRange(1, 1, 1, 15).setFontWeight("bold");
    sheet.setFrozenRows(1);

    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Pendente", "Pago", "Isento", "Cancelado"], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange("M2:M2000").setDataValidation(rule);
  }
  return sheet;
}

function ensureMesAtual_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_MES);
  if (!sheet) sheet = ss.insertSheet(ABA_MES);

  sheet.clear();
  sheet.getRange("A1").setValue("Painel do mês atual").setFontWeight("bold").setFontSize(14);
  sheet.getRange("A2").setValue("Competência de referência:");
  sheet.getRange("B2").setFormula('=TEXT(TODAY();"yyyy-MM")');
  sheet.getRange("A3").setValue("Atualize o filtro da aba Pagamentos por Competência, ou use a lista abaixo.");
  sheet.getRange("A5").setValue("Pendentes neste mês").setFontWeight("bold");
  sheet.getRange("A6").setFormula(
    '=IFERROR(QUERY(Pagamentos!A:O; "select B,E,F,G,J,K,L,M where B = \'"&B2&"\' and M = \'Pendente\' order by E"; 1); "Nenhum pendente (ou aguarde o 1º cadastro)")'
  );
  sheet.getRange("A18").setValue("Todos deste mês").setFontWeight("bold");
  sheet.getRange("A19").setFormula(
    '=IFERROR(QUERY(Pagamentos!A:O; "select B,E,F,G,J,K,L,M where B = \'"&B2&"\' order by E"; 1); "Sem registros neste mês")'
  );
  return sheet;
}

function nextCadastroId_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return "CAD-1";
  var prev = String(sheet.getRange(last, 1).getValue() || "");
  var num = parseInt(prev.replace(/\D/g, ""), 10);
  if (isNaN(num)) num = last - 1;
  return "CAD-" + (num + 1);
}

function mesesDoPlano_(data) {
  if (data.meses) return Math.max(1, parseInt(data.meses, 10) || 1);
  return 1;
}

function valorParcela_(data, meses) {
  if (data.valor_mensal !== undefined && data.valor_mensal !== "") {
    return Number(data.valor_mensal);
  }
  var bruto = String(data.valor || "").replace(/[^\d,.-]/g, "").replace(".", "").replace(",", ".");
  var total = Number(bruto);
  if (!isNaN(total) && meses > 0) return total / meses;
  return 0;
}

function addMonths_(date, months) {
  var d = new Date(date.getTime());
  var day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  var lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

function competencia_(date) {
  var y = date.getFullYear();
  var m = ("0" + (date.getMonth() + 1)).slice(-2);
  return y + "-" + m;
}

function registrarInscricao_(data) {
  var cadSheet = ensureCadastros_();
  var pagSheet = ensurePagamentos_();
  ensureMesAtual_();

  var agora = new Date();
  var periodicidade = data.periodicidade || data.plano_label || "Mensal";
  var planoLabel = data.plano_label || periodicidade;
  var meses = mesesDoPlano_(data);
  var vParcela = valorParcela_(data, meses);
  var vTotal = data.valor_total !== undefined && data.valor_total !== ""
    ? Number(data.valor_total)
    : vParcela * meses;
  var id = nextCadastroId_(cadSheet);
  var ciente = data.contrato_ciente === true || data.contrato_ciente === "true" || data.contrato_ciente === "Sim"
    ? "Sim"
    : "Não";

  cadSheet.appendRow([
    id,
    agora,
    data.nome || "",
    data.sobrenome || "",
    data.cpf || "",
    data.email || "",
    planoLabel,
    periodicidade,
    meses,
    vTotal,
    vParcela,
    ciente,
    data.uso_imagem || "",
    data.status_pagamento || "Pendente",
    data.local || "",
    data.dias || "",
    data.horario || "",
    data.turma || "",
  ]);

  var rows = [];
  for (var i = 0; i < meses; i++) {
    var ref = addMonths_(agora, i);
    var venc = new Date(ref.getFullYear(), ref.getMonth(), 10);
    rows.push([
      id,
      competencia_(ref),
      MESES_PT[ref.getMonth()],
      ref.getFullYear(),
      data.nome || "",
      data.sobrenome || "",
      data.cpf || "",
      data.email || "",
      periodicidade,
      i + 1 + "/" + meses,
      vParcela,
      venc,
      "Pendente",
      "",
      meses > 1
        ? "Gerado automaticamente (" + planoLabel + ")"
        : data.tipo_plano === "mensal"
          ? "Mensalidade do mês"
          : "Pagamento à vista / mensal",
    ]);
  }

  if (rows.length) {
    pagSheet.getRange(pagSheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return { id: id, parcelas: meses };
}
