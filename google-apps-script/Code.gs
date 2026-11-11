/**
 * Cole/atualize este código em: Planilha → Extensões → Apps Script
 *
 * IMPORTANTE ao atualizar:
 * Implantar → Gerenciar implantações → ✏️ editar → Nova versão → Implantar
 * (assim a URL /exec NÃO muda)
 *
 * Depois rode setupPlanilha() uma vez (▶) para criar/atualizar abas e cabeçalhos.
 *
 * Abas por unidade (cadastros):
 *  - COPP Futsal
 *  - Fla Palmas Futsal
 *  - Monteiro Lobato Futsal
 *
 * Quem tem acesso: Qualquer pessoa | Executar como: Eu
 */

var ABA_PAGAMENTOS = "Pagamentos";
var ABA_MES = "MesAtual";
var ABA_HORARIOS = "Horarios";

var UNIDADE_ABAS = [
  "COPP Futsal",
  "Fla Palmas Futsal",
  "Monteiro Lobato Futsal",
];

var MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

var CADASTROS_HEADERS = [
  "ID",
  "Data/Hora",
  "Unidade",
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
];

var PAGAMENTOS_HEADERS = [
  "ID cadastro",
  "Unidade",
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
  "Local",
  "Dias",
  "Horário",
  "Turma",
];

function doGet() {
  return json_({
    ok: true,
    message: "Endpoint NDF Futsal ativo. Use POST para cadastrar.",
    unidades: UNIDADE_ABAS,
  });
}

function doPost(e) {
  try {
    var data = parseBody_(e);
    var result = registrarInscricao_(data);
    return json_({
      success: true,
      cadastro_id: result.id,
      parcelas: result.parcelas,
      unidade: result.unidade,
      aba: result.aba,
    });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

/** Rode uma vez no editor (▶) para criar/atualizar abas e cabeçalhos. */
function setupPlanilha() {
  for (var i = 0; i < UNIDADE_ABAS.length; i++) {
    ensureUnidadeSheet_(UNIDADE_ABAS[i]);
  }
  ensurePagamentos_();
  ensureMesAtual_();
  ensureHorarios_();
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

function ensureHeaders_(sheet, headers) {
  var width = headers.length;
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    for (var i = 0; i < width; i++) {
      sheet.getRange(1, i + 1).setValue(headers[i]);
    }
  }
  sheet.getRange(1, 1, 1, width).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function ensureUnidadeSheet_(nomeAba) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nomeAba);
  if (!sheet) sheet = ss.insertSheet(nomeAba);
  ensureHeaders_(sheet, CADASTROS_HEADERS);
  return sheet;
}

function resolveUnidadeAba_(data) {
  var aba = String(data.aba || data.unidade_nome || "").trim();
  if (UNIDADE_ABAS.indexOf(aba) >= 0) return aba;

  var id = String(data.unidade_id || "").trim().toLowerCase();
  if (id === "copp" || id === "copy") return "COPP Futsal";
  if (id === "flapalmas" || id === "fla-palmas") return "Fla Palmas Futsal";
  if (id === "monteiro-lobato" || id === "monteiro") return "Monteiro Lobato Futsal";

  throw new Error("Unidade inválida ou não informada. Selecione a unidade na home.");
}

function ensurePagamentos_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_PAGAMENTOS);
  if (!sheet) sheet = ss.insertSheet(ABA_PAGAMENTOS);

  ensureHeaders_(sheet, PAGAMENTOS_HEADERS);

  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pendente", "Pago", "Isento", "Cancelado"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("N2:N2000").setDataValidation(rule);
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
  sheet.getRange("A3").setValue("Pendentes e totais da aba Pagamentos (todas as unidades).");
  sheet.getRange("A5").setValue("Pendentes neste mês").setFontWeight("bold");
  sheet.getRange("A6").setFormula(
    '=IFERROR(QUERY(Pagamentos!A:T; "select B,C,F,G,H,K,L,M,N,Q,R,S,T where C = \'"&B2&"\' and N = \'Pendente\' order by F"; 1); "Nenhum pendente (ou aguarde o 1º cadastro)")'
  );
  sheet.getRange("A18").setValue("Todos deste mês").setFontWeight("bold");
  sheet.getRange("A19").setFormula(
    '=IFERROR(QUERY(Pagamentos!A:T; "select B,C,F,G,H,K,L,M,N,Q,R,S,T where C = \'"&B2&"\' order by F"; 1); "Sem registros neste mês")'
  );
  return sheet;
}

function ensureHorarios_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_HORARIOS);
  if (!sheet) sheet = ss.insertSheet(ABA_HORARIOS);

  sheet.clear();
  sheet.getRange("A1").setValue("Controle de horários por unidade").setFontWeight("bold").setFontSize(14);
  sheet.getRange("A2").setValue(
    "Cada unidade tem a própria aba de cadastros. Use os filtros nas abas COPP Futsal, Fla Palmas Futsal e Monteiro Lobato Futsal."
  );
  sheet.getRange("A4").setValue("Abas de cadastro").setFontWeight("bold");
  for (var i = 0; i < UNIDADE_ABAS.length; i++) {
    sheet.getRange(5 + i, 1).setValue(UNIDADE_ABAS[i]);
  }
  sheet.getRange("A9").setValue("Pagamentos consolidados").setFontWeight("bold");
  sheet.getRange("A10").setValue("A aba Pagamentos reúne todas as unidades, com a coluna Unidade.");
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
  var unidadeNome = resolveUnidadeAba_(data);
  var cadSheet = ensureUnidadeSheet_(unidadeNome);
  var pagSheet = ensurePagamentos_();
  ensureMesAtual_();
  ensureHorarios_();

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
  var local = data.local || "";
  var dias = data.dias || "";
  var horario = data.horario || "";
  var turma = data.turma || "";
  var obsBase = meses > 1
    ? "Gerado automaticamente (" + planoLabel + ")"
    : data.tipo_plano === "mensal"
      ? "Mensalidade do mês"
      : "Pagamento à vista / mensal";
  var obsHorario = [turma, horario, local].filter(Boolean).join(" · ");
  var observacao = obsHorario ? obsBase + " | " + obsHorario : obsBase;

  cadSheet.appendRow([
    id,
    agora,
    unidadeNome,
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
    local,
    dias,
    horario,
    turma,
  ]);

  var rows = [];
  for (var i = 0; i < meses; i++) {
    var ref = addMonths_(agora, i);
    var venc = new Date(ref.getFullYear(), ref.getMonth(), 10);
    rows.push([
      id,
      unidadeNome,
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
      observacao,
      local,
      dias,
      horario,
      turma,
    ]);
  }

  if (rows.length) {
    pagSheet.getRange(pagSheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return { id: id, parcelas: meses, unidade: unidadeNome, aba: unidadeNome };
}
