// ============================================================
// GOOGLE APPS SCRIPT - 1o Encontro das Caritas Subregional
// ============================================================
// Cole este codigo no Apps Script da planilha.
// Implante como Aplicativo Web (qualquer pessoa pode acessar).
// ============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    if (sheet.getLastRow() === 0) {
      var headers = [
        'Formulario',
        'Timestamp',
        'Nome Completo',
        'Data Nascimento',
        'Telefone/WhatsApp',
        'Cidade',
        'Diocese/Arquidiocese',
        'Paroquia',
        'Comunidade',
        'Cargo/Funcao',
        'Cargo (Outro)',
        'Tempo de Atuacao',
        'Areas de Atuacao',
        'Restricao Alimentar',
        'Qual Restricao',
        'Acessibilidade',
        'Qual Necessidade',
        'Expectativas',
        'Temas Sugeridos',
        'Observacoes',
        'Status Pagamento'
      ];
      sheet.appendRow(headers);
      var hr = sheet.getRange(1, 1, 1, headers.length);
      hr.setFontWeight('bold');
      hr.setBackground('#C41E3A');
      hr.setFontColor('#FFFFFF');
    }

    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var fieldValues = {
      'Formulario': 'caritas',
      'Timestamp': data.timestamp || new Date().toLocaleString('pt-BR'),
      'Nome Completo': data.nomeCompleto || '',
      'Data Nascimento': data.dataNascimento || '',
      'Telefone/WhatsApp': data.telefone || '',
      'Cidade': data.cidade || '',
      'Diocese/Arquidiocese': data.diocese || '',
      'Paroquia': data.paroquia || '',
      'Comunidade': data.comunidade || '',
      'Cargo/Funcao': data.cargoFuncao || '',
      'Cargo (Outro)': data.cargoOutro || '',
      'Tempo de Atuacao': data.tempoAtuacao || '',
      'Areas de Atuacao': data.areasAtuacao || '',
      'Restricao Alimentar': data.restricaoAlimentar || '',
      'Qual Restricao': data.restricaoDetalhe || '',
      'Acessibilidade': data.acessibilidade || '',
      'Qual Necessidade': data.acessibilidadeDetalhe || '',
      'Expectativas': data.expectativas || '',
      'Temas Sugeridos': data.temasSugeridos || '',
      'Observacoes': data.observacoes || '',
      'Status Pagamento': ''
    };

    var row = [];
    for (var h = 0; h < currentHeaders.length; h++) {
      row.push(fieldValues[currentHeaders[h]] !== undefined ? fieldValues[currentHeaders[h]] : '');
    }
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({result:'success'})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({result:'error',message:error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var params = e ? e.parameter : {};

  // Retornar todas as inscricoes (filtra apenas "caritas")
  if (params.action === 'getAll') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    var headers = data[0];
    var result = [];
    var formularioIdx = -1;
    for (var fi = 0; fi < headers.length; fi++) { if (headers[fi] === 'Formulario') { formularioIdx = fi; break; } }

    var fieldMap = {
      'Formulario':'formulario',
      'Timestamp':'timestamp',
      'Nome Completo':'nomeCompleto',
      'Data Nascimento':'dataNascimento',
      'Telefone/WhatsApp':'telefone',
      'Cidade':'cidade',
      'Diocese/Arquidiocese':'diocese',
      'Paroquia':'paroquia',
      'Comunidade':'comunidade',
      'Cargo/Funcao':'cargoFuncao',
      'Cargo (Outro)':'cargoOutro',
      'Tempo de Atuacao':'tempoAtuacao',
      'Areas de Atuacao':'areasAtuacao',
      'Restricao Alimentar':'restricaoAlimentar',
      'Qual Restricao':'restricaoDetalhe',
      'Acessibilidade':'acessibilidade',
      'Qual Necessidade':'acessibilidadeDetalhe',
      'Expectativas':'expectativas',
      'Temas Sugeridos':'temasSugeridos',
      'Observacoes':'observacoes',
      'Status Pagamento':'statusPagamento'
    };

    for (var i = 1; i < data.length; i++) {
      if (formularioIdx >= 0 && data[i][formularioIdx] !== 'caritas') continue;
      var row = {};
      for (var j = 0; j < headers.length; j++) { row[fieldMap[headers[j]] || headers[j]] = data[i][j] || ''; }
      row.rowIndex = i + 1;
      result.push(row);
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  // Consulta de inscricao (para pagamento)
  if (params.action === 'consulta' && params.nome && params.telefone) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({found:false})).setMimeType(ContentService.MimeType.JSON);

    var headers = data[0];
    var idx = {nome:-1,tel:-1,form:-1,status:-1,cidade:-1,diocese:-1,paroquia:-1,cargo:-1,ts:-1};
    for (var ci = 0; ci < headers.length; ci++) {
      if (headers[ci]==='Nome Completo') idx.nome=ci;
      if (headers[ci]==='Telefone/WhatsApp') idx.tel=ci;
      if (headers[ci]==='Formulario') idx.form=ci;
      if (headers[ci]==='Status Pagamento') idx.status=ci;
      if (headers[ci]==='Cidade') idx.cidade=ci;
      if (headers[ci]==='Diocese/Arquidiocese') idx.diocese=ci;
      if (headers[ci]==='Paroquia') idx.paroquia=ci;
      if (headers[ci]==='Cargo/Funcao') idx.cargo=ci;
      if (headers[ci]==='Timestamp') idx.ts=ci;
    }

    var nomeBusca = params.nome.trim().toLowerCase();
    var telBusca = params.telefone.replace(/\D/g, '');

    for (var i = 1; i < data.length; i++) {
      if (idx.form >= 0 && data[i][idx.form] !== 'caritas') continue;
      var n = (data[i][idx.nome]||'').toString().trim().toLowerCase();
      var t = (data[i][idx.tel]||'').toString().replace(/\D/g, '');
      if (n === nomeBusca && t === telBusca) {
        var statusPag = idx.status>=0 ? (data[i][idx.status]||'').toString().trim() : '';
        return ContentService.createTextOutput(JSON.stringify({
          found: true,
          nome: data[i][idx.nome]||'',
          cidade: idx.cidade>=0?(data[i][idx.cidade]||''):'',
          diocese: idx.diocese>=0?(data[i][idx.diocese]||''):'',
          paroquia: idx.paroquia>=0?(data[i][idx.paroquia]||''):'',
          cargo: idx.cargo>=0?(data[i][idx.cargo]||''):'',
          dataInscricao: idx.ts>=0?(data[i][idx.ts]||''):'',
          statusPagamento: statusPag || 'Aguardando pagamento'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({found:false})).setMimeType(ContentService.MimeType.JSON);
  }

  // Confirmar pagamento
  if (params.action === 'confirmarPagamento' && params.row) {
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var rowNum = parseInt(params.row);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var statusCol = -1;
      for (var si = 0; si < headers.length; si++) { if (headers[si]==='Status Pagamento') { statusCol=si+1; break; } }
      if (statusCol === -1) { statusCol = sheet.getLastColumn()+1; sheet.getRange(1,statusCol).setValue('Status Pagamento'); }
      if (rowNum > 1 && rowNum <= sheet.getLastRow()) {
        sheet.getRange(rowNum, statusCol).setValue('Confirmado');
        return ContentService.createTextOutput(JSON.stringify({result:'success'})).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({result:'error',message:'Linha invalida'})).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({result:'error',message:error.toString()})).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Excluir linha
  if (params.action === 'delete' && params.row) {
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var rowNum = parseInt(params.row);
      if (rowNum > 1 && rowNum <= sheet.getLastRow()) {
        sheet.deleteRow(rowNum);
        return ContentService.createTextOutput(JSON.stringify({result:'success'})).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({result:'error',message:'Linha invalida'})).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({result:'error',message:error.toString()})).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput('Funcionando!').setMimeType(ContentService.MimeType.TEXT);
}
