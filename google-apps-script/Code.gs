/**
 * Cole/atualize este código em: Planilha → Extensões → Apps Script
 *
 * IMPORTANTE ao atualizar:
 * Implantar → Gerenciar implantações → ✏️ editar → Nova versão → Implantar
 * (assim a URL /exec NÃO muda)
 *
 * Depois rode setupPlanilha() uma vez (▶) para criar/atualizar abas e cabeçalhos.
 *
 * Abas por unidade (cadastros) — APENAS estas três:
 *  - COOP Futsal
 *  - COOP/FLAPALMAS
 *  - Monteiro Lobato Futsal
 *
 * setupPlanilha() cria essas abas e remove abas legadas de unidade
 * (ex.: "COOP Itacoarauto Futsal", "COOP Flapalmas", "COOP/Fla Palmas").
 *
 * Abas de controle:
 *  - Pagamentos (lançamentos + formatação)
 *  - Resumo (dashboard: totais por forma / unidade / status)
 *  - MesAtual / Horarios
 *
 * Após colar: rode setupPlanilha() e (opcional) recarregue a planilha
 * para ver o menu "TUDO SOBRE FUTSAL EM UM SÓ LUGAR!".
 *
 * Quem tem acesso: Qualquer pessoa | Executar como: Eu
 */

var ABA_PAGAMENTOS = "Pagamentos";
var ABA_RESUMO = "Resumo";
var ABA_MES = "MesAtual";
var ABA_HORARIOS = "Horarios";

var UNIDADE_ABAS = [
  "COOP Futsal",
  "COOP/FLAPALMAS",
  "Monteiro Lobato Futsal",
];

/** Abas antigas de unidade a remover no setup (não apaga Pagamentos/Resumo/etc.). */
var UNIDADE_ABAS_LEGADO = [
  "COOP Itacoarauto Futsal",
  "COOP Flapalmas",
  "COOP/Fla Palmas",
  "COOP/Taquaralto Futsal",
  "COOP Taquaralto Futsal",
  "COOP Futsal ",
];

/** Paleta visual da planilha (cabeçalhos / destaques). */
var COR_HEADER_BG = "#0F3D2E";
var COR_HEADER_FG = "#FFFFFF";
var COR_ACCENT = "#C4A35A";
var COR_BAND = "#F3F6F4";
var COR_PENDENTE = "#FFF3CD";
var COR_PAGO = "#D1E7DD";
var COR_ISENTO = "#CFE2FF";
var COR_CANCELADO = "#F8D7DA";

var MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * Cabeçalhos das abas por unidade.
 * Colunas novas ficam no FINAL para não deslocar dados já gravados.
 *
 * Extras (no final, para não deslocar dados antigos):
 * Telefone | Data de nascimento | Idade | Plano ID | Forma de pagamento |
 * Nome do aluno | CPF/RG do aluno | Contrato PDF
 *
 * Rode setupPlanilha() após colar este código para atualizar a linha 1.
 */
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
  // --- colunas extras ---
  "Telefone",
  "Data de nascimento",
  "Idade",
  "Plano ID",
  "Forma de pagamento",
  "Nome do aluno",
  "CPF/RG do aluno",
  "Contrato PDF",
];

// Nome simples (sem "!") — mais fácil de achar no Drive da conta do Apps Script
var PASTA_CONTRATOS = "Contratos NDF Futsal";

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
    message: "Endpoint TUDO SOBRE FUTSAL EM UM SÓ LUGAR! ativo. Use POST para cadastrar.",
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
      contrato_pdf_url: result.contrato_pdf_url || "",
    });
  } catch (err) {
    // Mensagem real (ex.: falha Drive/PDF) — sem engolir o motivo
    Logger.log("doPost erro: " + err);
    return json_({
      success: false,
      message: String(err && err.message ? err.message : err),
    });
  }
}

/** Rode uma vez no editor (▶) para criar/atualizar abas, formatação e resumo. */
function setupPlanilha() {
  for (var i = 0; i < UNIDADE_ABAS.length; i++) {
    ensureUnidadeSheet_(UNIDADE_ABAS[i]);
  }
  cleanupUnidadeSheetsLegadas_();
  ensurePagamentos_();
  ensureResumo_();
  ensureMesAtual_();
  ensureHorarios_();
  // Cria a pasta de contratos no Drive já no setup (não espera o 1º cadastro)
  try {
    getOrCreateFolder_(PASTA_CONTRATOS);
  } catch (err) {
    Logger.log("Falha ao criar pasta de contratos: " + err);
  }
}

/**
 * Remove abas de unidade antigas/erradas. Mantém UNIDADE_ABAS + abas de controle.
 * Não apaga abas desconhecidas fora da lista de legado (segurança).
 */
function cleanupUnidadeSheetsLegadas_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keep = {};
  var i;
  for (i = 0; i < UNIDADE_ABAS.length; i++) keep[UNIDADE_ABAS[i]] = true;
  keep[ABA_PAGAMENTOS] = true;
  keep[ABA_RESUMO] = true;
  keep[ABA_MES] = true;
  keep[ABA_HORARIOS] = true;

  var sheets = ss.getSheets();
  for (i = sheets.length - 1; i >= 0; i--) {
    var name = sheets[i].getName();
    if (keep[name]) continue;
    if (UNIDADE_ABAS_LEGADO.indexOf(name) < 0) continue;
    // Precisa sobrar pelo menos 1 aba na planilha
    if (ss.getSheets().length <= 1) continue;
    ss.deleteSheet(sheets[i]);
  }
}

/** Menu na planilha: Formatar Pagamentos / Atualizar Resumo. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("TUDO SOBRE FUTSAL EM UM SÓ LUGAR!")
    .addItem("Formatar aba Pagamentos", "formatarPagamentosMenu")
    .addItem("Atualizar aba Resumo", "atualizarResumoMenu")
    .addItem("Setup completo (abas + visual)", "setupPlanilha")
    .addToUi();
}

function formatarPagamentosMenu() {
  ensurePagamentos_();
  SpreadsheetApp.getActiveSpreadsheet().toast("Aba Pagamentos formatada.", "TUDO SOBRE FUTSAL EM UM SÓ LUGAR!", 5);
}

function atualizarResumoMenu() {
  ensureResumo_();
  SpreadsheetApp.getActiveSpreadsheet().toast("Aba Resumo atualizada.", "TUDO SOBRE FUTSAL EM UM SÓ LUGAR!", 5);
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
  styleHeaderRow_(sheet, width);
  sheet.setFrozenRows(1);
}

function styleHeaderRow_(sheet, width) {
  var header = sheet.getRange(1, 1, 1, width);
  header
    .setFontWeight("bold")
    .setFontColor(COR_HEADER_FG)
    .setBackground(COR_HEADER_BG)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 32);
}

function ensureUnidadeSheet_(nomeAba) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nomeAba);
  if (!sheet) sheet = ss.insertSheet(nomeAba);
  ensureHeaders_(sheet, CADASTROS_HEADERS);
  formatCadastroSheet_(sheet);
  return sheet;
}

function resolveUnidadeAba_(data) {
  var aba = String(data.aba || data.unidade_nome || "").trim();
  if (UNIDADE_ABAS.indexOf(aba) >= 0) return aba;
  // Alias do nome antigo da aba
  if (aba === "COOP/Fla Palmas") return "COOP/FLAPALMAS";

  var id = String(data.unidade_id || "").trim().toLowerCase();
  if (id === "coop" || id === "copp" || id === "copy" || id === "taquaralto") {
    return "COOP Futsal";
  }
  if (id === "flapalmas" || id === "fla-palmas") return "COOP/FLAPALMAS";
  if (id === "monteiro-lobato" || id === "monteiro") return "Monteiro Lobato Futsal";

  throw new Error("Unidade inválida ou não informada. Selecione a unidade na home.");
}

function ensurePagamentos_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_PAGAMENTOS);
  if (!sheet) sheet = ss.insertSheet(ABA_PAGAMENTOS);

  ensureHeaders_(sheet, PAGAMENTOS_HEADERS);
  formatPagamentosSheet_(sheet);
  return sheet;
}

/**
 * Apresentação da aba Pagamentos — não altera colunas nem dados gravados.
 */
function formatPagamentosSheet_(sheet) {
  var width = PAGAMENTOS_HEADERS.length;
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var lastCol = width;

  styleHeaderRow_(sheet, width);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // Larguras (mesma ordem de PAGAMENTOS_HEADERS)
  var widths = [110, 180, 100, 90, 60, 120, 120, 120, 200, 130, 80, 100, 110, 100, 100, 280, 140, 120, 110, 160];
  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }

  if (lastRow >= 2) {
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol);
    data.setVerticalAlignment("middle");
    data.setFontFamily("Arial");
    data.setFontSize(10);

    // Moeda na coluna Valor (L = 12)
    sheet.getRange(2, 12, lastRow - 1, 1).setNumberFormat('"R$"#,##0.00');
    // Datas
    sheet.getRange(2, 13, lastRow - 1, 1).setNumberFormat("dd/MM/yyyy");
    sheet.getRange(2, 15, lastRow - 1, 1).setNumberFormat("dd/MM/yyyy");

    // Faixas alternadas
    try {
      var banding = sheet.getRange(1, 1, lastRow, lastCol).getBandings();
      for (var b = 0; b < banding.length; b++) banding[b].remove();
    } catch (e) {
      /* ignore */
    }
    sheet
      .getRange(1, 1, lastRow, lastCol)
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
      .setHeaderRowColor(COR_HEADER_BG)
      .setFirstRowColor("#FFFFFF")
      .setSecondRowColor(COR_BAND);

    // Filtro na tabela
    if (sheet.getFilter()) sheet.getFilter().remove();
    sheet.getRange(1, 1, lastRow, lastCol).createFilter();
  }

  // Validação de Status
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pendente", "Pago", "Isento", "Cancelado"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("N2:N3000").setDataValidation(rule);

  // Cores por status (condicional)
  sheet.clearConditionalFormatRules();
  var statusRange = sheet.getRange("N2:N3000");
  var rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Pendente")
      .setBackground(COR_PENDENTE)
      .setRanges([statusRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Pago")
      .setBackground(COR_PAGO)
      .setRanges([statusRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Isento")
      .setBackground(COR_ISENTO)
      .setRanges([statusRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Cancelado")
      .setBackground(COR_CANCELADO)
      .setRanges([statusRange])
      .build(),
  ];
  sheet.setConditionalFormatRules(rules);

  sheet.setTabColor(COR_HEADER_BG);
  return sheet;
}

function formatCadastroSheet_(sheet) {
  var width = CADASTROS_HEADERS.length;
  styleHeaderRow_(sheet, width);
  sheet.setFrozenRows(1);
  var widths = [
    90, 140, 180, 120, 120, 120, 180, 200, 120, 70, 100, 100, 110, 110, 90, 140, 120, 110, 180,
    120, 130, 60, 90, 120, 160, 130, 220,
  ];
  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(2, 11, lastRow - 1, 2).setNumberFormat('"R$"#,##0.00');
  }
  sheet.setTabColor(COR_ACCENT);
}

/**
 * Dashboard simples: totais por status, unidade e forma de pagamento.
 * Lê só a aba Pagamentos — não muda o que o POST grava.
 */
function ensureResumo_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_RESUMO);
  if (!sheet) sheet = ss.insertSheet(ABA_RESUMO, 0);
  sheet.clear();
  sheet.setTabColor(COR_ACCENT);

  // Título
  sheet.getRange("A1:F1").merge();
  sheet
    .getRange("A1")
    .setValue("Resumo financeiro — TUDO SOBRE FUTSAL EM UM SÓ LUGAR!")
    .setFontWeight("bold")
    .setFontSize(18)
    .setFontColor(COR_HEADER_BG);
  sheet.getRange("A2").setValue("Atualizado em:");
  sheet.getRange("B2").setFormula("=NOW()").setNumberFormat("dd/MM/yyyy HH:mm");
  sheet.getRange("A3").setValue("Fonte: aba Pagamentos (todas as unidades). Filtros e status editáveis lá.");

  // KPIs
  sheet.getRange("A5").setValue("Indicadores").setFontWeight("bold").setFontSize(13).setFontColor(COR_HEADER_FG).setBackground(COR_HEADER_BG);
  sheet.getRange("A5:B5").merge();
  sheet.getRange("A6").setValue("Parcelas (linhas)");
  sheet.getRange("B6").setFormula('=COUNTA(Pagamentos!A2:A)');
  sheet.getRange("A7").setValue("Valor total");
  sheet.getRange("B7").setFormula('=IFERROR(SUM(Pagamentos!L2:L);0)').setNumberFormat('"R$"#,##0.00');
  sheet.getRange("A8").setValue("Pendente");
  sheet.getRange("B8").setFormula('=IFERROR(SUMIF(Pagamentos!N:N;"Pendente";Pagamentos!L:L);0)').setNumberFormat('"R$"#,##0.00').setBackground(COR_PENDENTE);
  sheet.getRange("A9").setValue("Pago");
  sheet.getRange("B9").setFormula('=IFERROR(SUMIF(Pagamentos!N:N;"Pago";Pagamentos!L:L);0)').setNumberFormat('"R$"#,##0.00').setBackground(COR_PAGO);
  sheet.getRange("A10").setValue("Isento");
  sheet.getRange("B10").setFormula('=IFERROR(SUMIF(Pagamentos!N:N;"Isento";Pagamentos!L:L);0)').setNumberFormat('"R$"#,##0.00').setBackground(COR_ISENTO);
  sheet.getRange("A11").setValue("Cancelado");
  sheet.getRange("B11").setFormula('=IFERROR(SUMIF(Pagamentos!N:N;"Cancelado";Pagamentos!L:L);0)').setNumberFormat('"R$"#,##0.00').setBackground(COR_CANCELADO);

  // Por forma de pagamento (coluna Periodicidade = J)
  sheet.getRange("A13").setValue("Por forma de pagamento").setFontWeight("bold").setFontSize(13).setFontColor(COR_HEADER_FG).setBackground(COR_HEADER_BG);
  sheet.getRange("A13:C13").merge();
  sheet.getRange("A14:C14").setValues([["Forma", "Qtd parcelas", "Valor"]]).setFontWeight("bold").setBackground(COR_BAND);
  sheet.getRange("A15").setValue("À vista");
  sheet.getRange("B15").setFormula('=COUNTIF(Pagamentos!J:J;"Anual à vista")');
  sheet.getRange("C15").setFormula('=IFERROR(SUMIF(Pagamentos!J:J;"Anual à vista";Pagamentos!L:L);0)');
  sheet.getRange("A16").setValue("5x");
  sheet.getRange("B16").setFormula('=COUNTIF(Pagamentos!J:J;"Anual 5x")');
  sheet.getRange("C16").setFormula('=IFERROR(SUMIF(Pagamentos!J:J;"Anual 5x";Pagamentos!L:L);0)');
  sheet.getRange("A17").setValue("8x");
  sheet.getRange("B17").setFormula('=COUNTIF(Pagamentos!J:J;"Anual 8x")');
  sheet.getRange("C17").setFormula('=IFERROR(SUMIF(Pagamentos!J:J;"Anual 8x";Pagamentos!L:L);0)');
  sheet.getRange("A18").setValue("10x");
  sheet.getRange("B18").setFormula('=COUNTIF(Pagamentos!J:J;"Anual 10x")');
  sheet.getRange("C18").setFormula('=IFERROR(SUMIF(Pagamentos!J:J;"Anual 10x";Pagamentos!L:L);0)');
  sheet.getRange("A19").setValue("11x");
  sheet.getRange("B19").setFormula('=COUNTIF(Pagamentos!J:J;"Anual 11x")');
  sheet.getRange("C19").setFormula('=IFERROR(SUMIF(Pagamentos!J:J;"Anual 11x";Pagamentos!L:L);0)');
  sheet.getRange("A20").setValue("Mensal");
  sheet.getRange("B20").setFormula('=COUNTIF(Pagamentos!J:J;"Mensal")');
  sheet.getRange("C20").setFormula('=IFERROR(SUMIF(Pagamentos!J:J;"Mensal";Pagamentos!L:L);0)');
  sheet.getRange("A21").setValue("Outros / legado");
  sheet.getRange("B21").setFormula(
    '=IFERROR(COUNTA(Pagamentos!J2:J)-B15-B16-B17-B18-B19-B20;0)'
  );
  sheet.getRange("C21").setFormula(
    '=IFERROR(SUM(Pagamentos!L2:L)-C15-C16-C17-C18-C19-C20;0)'
  );
  sheet.getRange("C15:C21").setNumberFormat('"R$"#,##0.00');

  // Dinâmico: tudo que existir em Periodicidade
  sheet.getRange("A23").setValue("Todas as periodicidades (automático)").setFontWeight("bold").setFontSize(13).setFontColor(COR_HEADER_FG).setBackground(COR_HEADER_BG);
  sheet.getRange("A23:C23").merge();
  sheet.getRange("A24").setFormula(
    '=IFERROR(QUERY(Pagamentos!J:L;"select J, count(J), sum(L) where J is not null and J <> \'\' group by J label J \'Forma\', count(J) \'Qtd\', sum(L) \'Valor\'";1);"Sem dados em Pagamentos")'
  );

  // Por unidade
  sheet.getRange("E5").setValue("Por unidade").setFontWeight("bold").setFontSize(13).setFontColor(COR_HEADER_FG).setBackground(COR_HEADER_BG);
  sheet.getRange("E5:G5").merge();
  sheet.getRange("E6").setFormula(
    '=IFERROR(QUERY(Pagamentos!B:L;"select B, count(B), sum(L) where B is not null and B <> \'\' group by B label B \'Unidade\', count(B) \'Qtd\', sum(L) \'Valor\'";1);"Sem dados")'
  );

  // Por status x valor do mês corrente
  sheet.getRange("E13").setValue("Competência do mês atual").setFontWeight("bold").setFontSize(13).setFontColor(COR_HEADER_FG).setBackground(COR_HEADER_BG);
  sheet.getRange("E13:G13").merge();
  sheet.getRange("E14").setValue("Competência:");
  sheet.getRange("F14").setFormula('=TEXT(TODAY();"yyyy-MM")');
  sheet.getRange("E15").setValue("Valor no mês");
  sheet.getRange("F15").setFormula('=IFERROR(SUMIF(Pagamentos!C:C;F14;Pagamentos!L:L);0)').setNumberFormat('"R$"#,##0.00');
  sheet.getRange("E16").setValue("Pendentes no mês");
  sheet.getRange("F16").setFormula(
    '=IFERROR(SUMIFS(Pagamentos!L:L;Pagamentos!C:C;F14;Pagamentos!N:N;"Pendente");0)'
  ).setNumberFormat('"R$"#,##0.00').setBackground(COR_PENDENTE);

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 24);
  sheet.setColumnWidth(5, 160);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidth(7, 120);
  sheet.setRowHeight(1, 36);

  return sheet;
}

function ensureMesAtual_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_MES);
  if (!sheet) sheet = ss.insertSheet(ABA_MES);

  sheet.clear();
  sheet.setTabColor("#4A7C59");
  sheet.getRange("A1:L1").merge();
  sheet
    .getRange("A1")
    .setValue("Painel do mês atual")
    .setFontWeight("bold")
    .setFontSize(16)
    .setFontColor(COR_HEADER_FG)
    .setBackground(COR_HEADER_BG);
  sheet.setRowHeight(1, 34);
  sheet.getRange("A2").setValue("Competência de referência:");
  sheet.getRange("B2").setFormula('=TEXT(TODAY();"yyyy-MM")').setFontWeight("bold");
  sheet.getRange("A3").setValue("Pendentes e lançamentos da aba Pagamentos (todas as unidades).");

  sheet.getRange("A5").setValue("Pendentes neste mês").setFontWeight("bold").setFontColor(COR_HEADER_FG).setBackground(COR_HEADER_BG);
  sheet.getRange("A5:L5").merge();
  sheet.getRange("A6").setFormula(
    '=IFERROR(QUERY(Pagamentos!A:T; "select B,C,F,G,H,K,L,M,N,Q,R,S,T where C = \'"&B2&"\' and N = \'Pendente\' order by F"; 1); "Nenhum pendente (ou aguarde o 1º cadastro)")'
  );

  sheet.getRange("A18").setValue("Todos deste mês").setFontWeight("bold").setFontColor(COR_HEADER_FG).setBackground(COR_HEADER_BG);
  sheet.getRange("A18:L18").merge();
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
    "Cada unidade tem a própria aba de cadastros. Use os filtros nas abas COOP Futsal, COOP/FLAPALMAS e Monteiro Lobato Futsal."
  );
  sheet.getRange("A4").setValue("Abas de cadastro").setFontWeight("bold");
  for (var i = 0; i < UNIDADE_ABAS.length; i++) {
    sheet.getRange(5 + i, 1).setValue(UNIDADE_ABAS[i]);
  }

  // Grade oficial COOP/FLAPALMAS (Segunda e Quarta — 906 Sul)
  sheet.getRange("A9").setValue("COOP/FLAPALMAS — horários").setFontWeight("bold");
  sheet.getRange("A10").setValue("Unidade");
  sheet.getRange("B10").setValue("Dias");
  sheet.getRange("C10").setValue("Horário");
  sheet.getRange("D10").setValue("Turma");
  sheet.getRange("E10").setValue("Local");
  sheet.getRange(10, 1, 1, 5)
    .setFontWeight("bold")
    .setFontColor(COR_HEADER_FG)
    .setBackground(COR_HEADER_BG);
  var flapalmasHorarios = [
    ["COOP/FLAPALMAS", "Segunda e Quarta", "14:00 às 15:00", "SUB8 e SUB9", "906 Sul"],
    ["COOP/FLAPALMAS", "Segunda e Quarta", "15:00 às 16:00", "SUB10", "906 Sul"],
    ["COOP/FLAPALMAS", "Segunda e Quarta", "16:00 às 17:20", "SUB11 e SUB12", "906 Sul"],
  ];
  sheet.getRange(11, 1, flapalmasHorarios.length, 5).setValues(flapalmasHorarios);

  sheet.getRange("A15").setValue("Pagamentos consolidados").setFontWeight("bold");
  sheet.getRange("A16").setValue("A aba Pagamentos reúne todas as unidades, com a coluna Unidade.");
  sheet.setTabColor(COR_ACCENT);
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
  if (data.meses !== undefined && data.meses !== "") {
    return Math.max(1, parseInt(data.meses, 10) || 1);
  }
  var id = String(data.plano_id || "").toLowerCase();
  if (id === "mensal" || id === "1x") return 1;
  var m = parseInt(String(id).replace(/\D/g, ""), 10);
  return m > 0 ? m : 1;
}

function toNumber_(value) {
  if (value === undefined || value === null || value === "") return NaN;
  if (typeof value === "number") return value;
  var bruto = String(value).replace(/[^\d,.-]/g, "");
  // "1.680,00" (pt-BR) ou "1680.00" / "1680"
  if (bruto.indexOf(",") >= 0) {
    bruto = bruto.replace(/\./g, "").replace(",", ".");
  }
  return Number(bruto);
}

function valorParcela_(data, meses) {
  var direta = toNumber_(data.valor_mensal !== undefined && data.valor_mensal !== ""
    ? data.valor_mensal
    : data.valor_parcela);
  if (!isNaN(direta)) return direta;

  var total = toNumber_(data.valor_total !== undefined && data.valor_total !== ""
    ? data.valor_total
    : data.valor);
  if (!isNaN(total) && meses > 0) return total / meses;
  return 0;
}

function valorTotal_(data, vParcela, meses) {
  var total = toNumber_(data.valor_total);
  if (!isNaN(total)) return total;
  return vParcela * meses;
}

/**
 * Forma de pagamento legível e estável entre unidades.
 * Ex.: "Mensal" | "À vista" | "5x" | "12x"
 */
function formaPagamento_(data, meses) {
  if (data.forma_pagamento) return String(data.forma_pagamento);
  var tipo = String(data.tipo_plano || "").toLowerCase();
  var id = String(data.plano_id || "").toLowerCase();
  if (tipo === "mensal" || id === "mensal") return "Mensal";
  if (meses === 1 || id === "1x") return "À vista";
  return meses + "x";
}

/**
 * Salva o PDF do contrato (base64) no Google Drive e devolve o link.
 * FALHA COM THROW — o cadastro NÃO deve gravar "ciente/assinado" sem PDF no Drive.
 * Possíveis falhas: base64 vazio/inválido, pasta Drive, decode, createFile, quota.
 */
function salvarContratoPdf_(data, cadastroId, unidadeNome) {
  var b64 = data.contrato_pdf_base64 || data.contrato_pdf || "";
  if (!b64) {
    throw new Error(
      "PDF do contrato ausente (contrato_pdf_base64 vazio). Gere o PDF no site e envie de novo."
    );
  }

  // Aceita data-URL ou base64 puro; remove espaços/quebras
  b64 = String(b64)
    .replace(/^data:application\/pdf;base64,/i, "")
    .replace(/\s+/g, "");

  if (!b64 || b64.length < 64) {
    throw new Error(
      "PDF do contrato inválido ou muito curto (base64 length=" + b64.length + ")."
    );
  }

  var pasta;
  try {
    pasta = getOrCreateFolder_(PASTA_CONTRATOS);
  } catch (folderErr) {
    throw new Error(
      "Falha ao acessar/criar pasta Drive \"" + PASTA_CONTRATOS + "\": " + String(folderErr)
    );
  }

  var aluno = String(data.aluno_nome || data.nome || "aluno")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  var nomeArquivo =
    (cadastroId || "CAD") +
    " - " +
    String(unidadeNome || "Unidade").replace(/[\\/:*?"<>|]+/g, "-") +
    " - " +
    aluno +
    ".pdf";

  var bytes;
  try {
    bytes = Utilities.base64Decode(b64);
  } catch (decodeErr) {
    throw new Error("Falha ao decodificar PDF (base64Decode): " + String(decodeErr));
  }

  var blob;
  try {
    blob = Utilities.newBlob(bytes, MimeType.PDF, nomeArquivo);
  } catch (blobErr) {
    throw new Error("Falha ao criar blob PDF: " + String(blobErr));
  }

  var file;
  try {
    file = pasta.createFile(blob);
  } catch (createErr) {
    throw new Error(
      "Falha ao salvar PDF no Drive (createFile): " + String(createErr)
    );
  }

  // Compartilhamento é opcional — não pode impedir o save do arquivo
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    Logger.log("Aviso sharing PDF: " + shareErr);
  }

  var url = file.getUrl();
  if (!url) {
    throw new Error("PDF criado no Drive mas getUrl() retornou vazio.");
  }
  return url;
}

function getOrCreateFolder_(nome) {
  var pastas = DriveApp.getFoldersByName(nome);
  if (pastas.hasNext()) return pastas.next();
  var criada = DriveApp.createFolder(nome);
  Logger.log("Pasta de contratos criada: " + criada.getUrl());
  return criada;
}

function idadeFromNascimento_(raw) {
  if (!raw) return "";
  var s = String(raw).trim();
  var d = null;
  // ISO yyyy-mm-dd
  var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  } else {
    // dd/mm/yyyy
    var br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (br) d = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  }
  if (!d || isNaN(d.getTime())) return "";
  var hoje = new Date();
  var idade = hoje.getFullYear() - d.getFullYear();
  var m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--;
  return idade >= 0 ? idade : "";
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
  var planoId = data.plano_id || "";
  var planoLabel = data.plano_label || data.periodicidade || "Mensal";
  var meses = mesesDoPlano_(data);
  var forma = formaPagamento_(data, meses);
  var periodicidade = data.periodicidade || forma;
  var vParcela = valorParcela_(data, meses);
  var vTotal = valorTotal_(data, vParcela, meses);
  var id = nextCadastroId_(cadSheet);
  // "Contrato ciente" só vira Sim depois do PDF salvo no Drive (abaixo).
  var ciente = "Não";
  var local = data.local || "";
  var dias = data.dias || "";
  var horario = data.horario || "";
  var turma = data.turma || "";
  var telefone = data.telefone || data.phone || data.celular || "";
  var alunoNome = data.aluno_nome || data.nome_aluno || "";
  var nascimento = data.data_nascimento || data.nascimento || data.aluno_nascimento || data.birthdate || "";
  var alunoCpf = data.aluno_cpf || data.cpf_aluno || data.aluno_rg || data.rg_aluno || "";
  var idade = data.idade !== undefined && data.idade !== ""
    ? data.idade
    : idadeFromNascimento_(nascimento);

  // PDF no Drive ANTES de gravar o cadastro como ciente/assinado.
  // Se falhar, lança erro → doPost success:false → nada é gravado → usuário pode retentar.
  var contratoUrl = salvarContratoPdf_(data, id, unidadeNome);
  // Só marca "Sim" depois do PDF salvo com sucesso
  ciente = "Sim";

  var obsBase = forma === "Mensal"
    ? "Mensalidade do mês (" + planoLabel + ")"
    : forma === "À vista"
      ? "Pagamento à vista (" + planoLabel + ")"
      : "Gerado automaticamente (" + planoLabel + " · " + forma + ")";
  var obsHorario = [turma, horario, local].filter(Boolean).join(" · ");
  var observacao = obsHorario ? obsBase + " | " + obsHorario : obsBase;

  // Ordem = CADASTROS_HEADERS
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
    telefone,
    nascimento,
    idade,
    planoId,
    forma,
    alunoNome,
    alunoCpf,
    contratoUrl,
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
    // setValues(startRow, startCol, numRows, numColumns) via getRange 4-args
    var start = pagSheet.getLastRow() + 1;
    pagSheet.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
    // Reaplica visual (faixas, filtro, moeda) incluindo as linhas novas
    formatPagamentosSheet_(pagSheet);
  }

  return {
    id: id,
    parcelas: meses,
    unidade: unidadeNome,
    aba: unidadeNome,
    forma_pagamento: forma,
    valor_total: vTotal,
    valor_parcela: vParcela,
    contrato_pdf_url: contratoUrl,
  };
}
