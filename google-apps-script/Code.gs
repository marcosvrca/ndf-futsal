/**
 * Cole este código em: Planilha → Extensões → Apps Script
 *
 * Depois: Implantar → Nova implantação → Tipo: App da Web
 * - Executar como: Eu
 * - Quem tem acesso: Qualquer pessoa
 * Copie a URL da implantação e cole em config.js → GOOGLE_SCRIPT_URL
 */

var ABA = "Cadastros";

function ensureSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA);
  if (!sheet) {
    sheet = ss.insertSheet(ABA);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Data/Hora",
      "Nome",
      "Sobrenome",
      "CPF",
      "E-mail",
      "Periodicidade",
      "Valor",
      "Status pagamento",
    ]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    var sheet = ensureSheet_();
    sheet.appendRow([
      new Date(),
      data.nome || "",
      data.sobrenome || "",
      data.cpf || "",
      data.email || "",
      data.periodicidade || "",
      data.valor || "",
      data.status_pagamento || "Pendente",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      message: "Endpoint NDF Futsal ativo. Use POST para cadastrar.",
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
