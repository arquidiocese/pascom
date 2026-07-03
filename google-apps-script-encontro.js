// ============================================================
// GOOGLE APPS SCRIPT - FICHAS DO ENCONTRO ADOLECRIST
// ============================================================
//
// COMO CONFIGURAR:
//
// 1. Crie uma nova Planilha Google (ou use uma existente)
//
// 2. Va em Extensoes > Apps Script
//
// 3. Apague o conteudo e cole TODO este codigo
//
// 4. Clique em "Implantar" > "Nova implantacao"
//    - Tipo: "App da Web"
//    - Executar como: "Eu"
//    - Quem tem acesso: "Qualquer pessoa"
//    - Clique em "Implantar"
//
// 5. Copie a URL gerada e cole no arquivo app.js na variavel SCRIPT_URL
//
// 6. Faca o push para o GitHub e pronto!
//
// OBS: A planilha tera 2 abas:
//   - "Fichas" com os dados JSON das fichas
//   - "Confirmacoes" com as confirmacoes de medicamentos do dia
//
// ============================================================

function doGet(e) {
  var params = e ? e.parameter : {};

  if (params.action === 'getFichas') {
    return getFichas();
  }

  return ContentService
    .createTextOutput('App Fichas Encontro Adolecrist funcionando!')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'salvarFichas') {
      return salvarFichas(data.fichas, data.confirmacoes);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: 'Acao desconhecida' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getFichas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Aba Fichas
  var fichasSheet = ss.getSheetByName('Fichas');
  if (!fichasSheet) {
    fichasSheet = ss.insertSheet('Fichas');
    fichasSheet.getRange('A1').setValue('[]');
  }

  // Aba Confirmacoes
  var confSheet = ss.getSheetByName('Confirmacoes');
  if (!confSheet) {
    confSheet = ss.insertSheet('Confirmacoes');
    confSheet.getRange('A1').setValue('{}');
  }

  var fichasJson = fichasSheet.getRange('A1').getValue() || '[]';
  var confJson = confSheet.getRange('A1').getValue() || '{}';

  var fichas = [];
  var confirmacoes = {};

  try { fichas = JSON.parse(fichasJson); } catch(e) { fichas = []; }
  try { confirmacoes = JSON.parse(confJson); } catch(e) { confirmacoes = {}; }

  return ContentService
    .createTextOutput(JSON.stringify({ fichas: fichas, confirmacoes: confirmacoes }))
    .setMimeType(ContentService.MimeType.JSON);
}

function salvarFichas(fichas, confirmacoes) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Aba Fichas
  var fichasSheet = ss.getSheetByName('Fichas');
  if (!fichasSheet) {
    fichasSheet = ss.insertSheet('Fichas');
  }
  fichasSheet.getRange('A1').setValue(JSON.stringify(fichas));

  // Aba Confirmacoes
  var confSheet = ss.getSheetByName('Confirmacoes');
  if (!confSheet) {
    confSheet = ss.insertSheet('Confirmacoes');
  }
  confSheet.getRange('A1').setValue(JSON.stringify(confirmacoes));

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}