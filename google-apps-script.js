// ============================================================
// CODIGO PARA O GOOGLE APPS SCRIPT
// ============================================================
//
// COMO CONFIGURAR:
//
// 1. Acesse o Apps Script da sua planilha existente
//    (Extensoes > Apps Script)
//
// 2. Apague todo o conteudo e cole TODO este codigo
//
// 3. Clique em "Implantar" > "Gerenciar implantacoes"
//    - Edite a implantacao existente OU crie uma nova
//    - Clique em "Implantar"
//
// 4. Se criou nova implantacao, copie a nova URL e atualize
//    nos arquivos script.js e respostas.html
//
// OBS: Os dados antigos (Corpus Christi) permanecem na planilha.
//      O novo formulario adiciona uma coluna "Formulario" com
//      o valor "caritas" para diferenciar. A pagina de respostas
//      filtra apenas os registros com esse marcador.
//
// ============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Verificar se ja tem cabecalho com a coluna "Formulario"
    var lastCol = sheet.getLastColumn();
    var hasFormularioCol = false;
    var formularioColIndex = -1;

    if (sheet.getLastRow() > 0) {
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      for (var i = 0; i < headers.length; i++) {
        if (headers[i] === 'Formulario') {
          hasFormularioCol = true;
          formularioColIndex = i;
          break;
        }
      }
    }

    // Se a planilha estiver vazia, criar cabecalhos completos
    if (sheet.getLastRow() === 0) {
      var newHeaders = [
        'Formulario',
        'Timestamp',
        'Nome Completo',
        'CPF',
        'Data Nascimento',
        'Telefone/WhatsApp',
        'E-mail',
        'Cidade',
        'Paroquia',
        'Forania',
        'Diocese/Arquidiocese',
        'Comunidade',
        'Cargo/Funcao',
        'Cargo (Outro)',
        'Tempo de Atuacao',
        'Areas de Atuacao',
        'Forma de Participacao',
        'Necessita Transporte',
        'Restricao Alimentar',
        'Qual Restricao',
        'Acessibilidade',
        'Qual Necessidade',
        'Expectativas',
        'Temas Sugeridos',
        'Observacoes'
      ];
      sheet.appendRow(newHeaders);

      var headerRange = sheet.getRange(1, 1, 1, newHeaders.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#C41E3A');
      headerRange.setFontColor('#FFFFFF');
      hasFormularioCol = true;
      formularioColIndex = 0;
    }

    // Se ja tem dados antigos mas nao tem coluna "Formulario", adicioná-la
    if (!hasFormularioCol && sheet.getLastRow() > 0) {
      var newColIndex = lastCol + 1;
      sheet.getRange(1, newColIndex).setValue('Formulario');
      sheet.getRange(1, newColIndex).setFontWeight('bold');
      formularioColIndex = newColIndex - 1;
    }

    // Montar linha com dados do novo formulario
    // Encontrar as posicoes das colunas pelo cabecalho
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Mapeamento campo -> valor
    var fieldValues = {
      'Formulario': 'caritas',
      'Timestamp': data.timestamp || new Date().toLocaleString('pt-BR'),
      'Nome Completo': data.nomeCompleto || '',
      'CPF': data.cpf || '',
      'Data Nascimento': data.dataNascimento || '',
      'Telefone/WhatsApp': data.telefone || '',
      'E-mail': data.email || '',
      'Cidade': data.cidade || '',
      'Paroquia': data.paroquia || '',
      'Forania': data.forania || '',
      'Diocese/Arquidiocese': data.diocese || '',
      'Comunidade': data.comunidade || '',
      'Cargo/Funcao': data.cargoFuncao || '',
      'Cargo (Outro)': data.cargoOutro || '',
      'Tempo de Atuacao': data.tempoAtuacao || '',
      'Areas de Atuacao': data.areasAtuacao || '',
      'Forma de Participacao': data.formaParticipacao || '',
      'Necessita Transporte': data.transporte || '',
      'Restricao Alimentar': data.restricaoAlimentar || '',
      'Qual Restricao': data.restricaoDetalhe || '',
      'Acessibilidade': data.acessibilidade || '',
      'Qual Necessidade': data.acessibilidadeDetalhe || '',
      'Expectativas': data.expectativas || '',
      'Temas Sugeridos': data.temasSugeridos || '',
      'Observacoes': data.observacoes || ''
    };

    // Verificar e adicionar colunas que nao existem
    var colsToAdd = [];
    var colMap = {};
    for (var c = 0; c < currentHeaders.length; c++) {
      colMap[currentHeaders[c]] = c;
    }

    var allFields = Object.keys(fieldValues);
    for (var f = 0; f < allFields.length; f++) {
      if (!(allFields[f] in colMap)) {
        colsToAdd.push(allFields[f]);
      }
    }

    // Adicionar colunas novas ao cabecalho se necessario
    if (colsToAdd.length > 0) {
      var startCol = sheet.getLastColumn() + 1;
      for (var a = 0; a < colsToAdd.length; a++) {
        sheet.getRange(1, startCol + a).setValue(colsToAdd[a]);
        sheet.getRange(1, startCol + a).setFontWeight('bold');
        colMap[colsToAdd[a]] = startCol + a - 1;
      }
    }

    // Recarregar cabecalhos apos possiveis alteracoes
    currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Montar a linha na ordem correta
    var row = [];
    for (var h = 0; h < currentHeaders.length; h++) {
      var headerName = currentHeaders[h];
      if (headerName in fieldValues) {
        row.push(fieldValues[headerName]);
      } else {
        row.push('');
      }
    }

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var params = e ? e.parameter : {};

  // Se pedir todas as inscricoes (filtra apenas "caritas")
  if (params.action === 'getAll') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = data[0];
    var result = [];

    // Encontrar indice da coluna "Formulario"
    var formularioIdx = -1;
    for (var fi = 0; fi < headers.length; fi++) {
      if (headers[fi] === 'Formulario') {
        formularioIdx = fi;
        break;
      }
    }

    // Mapear nomes das colunas para os campos do formulario
    var fieldMap = {
      'Formulario': 'formulario',
      'Timestamp': 'timestamp',
      'Nome Completo': 'nomeCompleto',
      'CPF': 'cpf',
      'Data Nascimento': 'dataNascimento',
      'Telefone/WhatsApp': 'telefone',
      'E-mail': 'email',
      'Cidade': 'cidade',
      'Paroquia': 'paroquia',
      'Forania': 'forania',
      'Diocese/Arquidiocese': 'diocese',
      'Comunidade': 'comunidade',
      'Cargo/Funcao': 'cargoFuncao',
      'Cargo (Outro)': 'cargoOutro',
      'Tempo de Atuacao': 'tempoAtuacao',
      'Areas de Atuacao': 'areasAtuacao',
      'Forma de Participacao': 'formaParticipacao',
      'Necessita Transporte': 'transporte',
      'Restricao Alimentar': 'restricaoAlimentar',
      'Qual Restricao': 'restricaoDetalhe',
      'Acessibilidade': 'acessibilidade',
      'Qual Necessidade': 'acessibilidadeDetalhe',
      'Expectativas': 'expectativas',
      'Temas Sugeridos': 'temasSugeridos',
      'Observacoes': 'observacoes',
      'Status Pagamento': 'statusPagamento'
    };

    for (var i = 1; i < data.length; i++) {
      // Filtrar: so retorna registros com formulario = "caritas"
      if (formularioIdx >= 0 && data[i][formularioIdx] !== 'caritas') {
        continue;
      }

      var row = {};
      for (var j = 0; j < headers.length; j++) {
        var fieldName = fieldMap[headers[j]] || headers[j];
        row[fieldName] = data[i][j] || '';
      }
      row.rowIndex = i + 1;
      result.push(row);
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Se pedir consulta de inscricao (para pagamento)
  if (params.action === 'consulta' && params.nome && params.telefone) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ found: false }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = data[0];

    // Encontrar indices das colunas
    var nomeIdx = -1;
    var telefoneIdx = -1;
    var formularioIdx = -1;
    var statusPagIdx = -1;
    var cidadeIdx = -1;
    var dioceseIdx = -1;
    var paroquiaIdx = -1;
    var cargoIdx = -1;
    var timestampIdx = -1;

    for (var ci = 0; ci < headers.length; ci++) {
      if (headers[ci] === 'Nome Completo') nomeIdx = ci;
      if (headers[ci] === 'Telefone/WhatsApp') telefoneIdx = ci;
      if (headers[ci] === 'Formulario') formularioIdx = ci;
      if (headers[ci] === 'Status Pagamento') statusPagIdx = ci;
      if (headers[ci] === 'Cidade') cidadeIdx = ci;
      if (headers[ci] === 'Diocese/Arquidiocese') dioceseIdx = ci;
      if (headers[ci] === 'Paroquia') paroquiaIdx = ci;
      if (headers[ci] === 'Cargo/Funcao') cargoIdx = ci;
      if (headers[ci] === 'Timestamp') timestampIdx = ci;
    }

    // Se nao existe coluna Status Pagamento, criar
    if (statusPagIdx === -1) {
      var newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue('Status Pagamento');
      sheet.getRange(1, newCol).setFontWeight('bold');
      statusPagIdx = newCol - 1;
    }

    var nomeBusca = params.nome.trim().toLowerCase();
    var telBusca = params.telefone.replace(/\D/g, '');

    for (var i = 1; i < data.length; i++) {
      // Filtrar apenas registros "caritas"
      if (formularioIdx >= 0 && data[i][formularioIdx] !== 'caritas') continue;

      var nomeRegistro = (data[i][nomeIdx] || '').toString().trim().toLowerCase();
      var telRegistro = (data[i][telefoneIdx] || '').toString().replace(/\D/g, '');

      if (nomeRegistro === nomeBusca && telRegistro === telBusca) {
        var statusPag = (data[i][statusPagIdx] || '').toString().trim();
        return ContentService
          .createTextOutput(JSON.stringify({
            found: true,
            nome: data[i][nomeIdx] || '',
            cidade: cidadeIdx >= 0 ? (data[i][cidadeIdx] || '') : '',
            diocese: dioceseIdx >= 0 ? (data[i][dioceseIdx] || '') : '',
            paroquia: paroquiaIdx >= 0 ? (data[i][paroquiaIdx] || '') : '',
            cargo: cargoIdx >= 0 ? (data[i][cargoIdx] || '') : '',
            dataInscricao: timestampIdx >= 0 ? (data[i][timestampIdx] || '') : '',
            statusPagamento: statusPag || 'Aguardando pagamento'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ found: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Se pedir para confirmar pagamento
  if (params.action === 'confirmarPagamento' && params.row) {
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var rowNum = parseInt(params.row);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

      // Encontrar coluna Status Pagamento
      var statusColIdx = -1;
      for (var si = 0; si < headers.length; si++) {
        if (headers[si] === 'Status Pagamento') {
          statusColIdx = si + 1;
          break;
        }
      }

      // Se nao existe, criar a coluna
      if (statusColIdx === -1) {
        statusColIdx = sheet.getLastColumn() + 1;
        sheet.getRange(1, statusColIdx).setValue('Status Pagamento');
        sheet.getRange(1, statusColIdx).setFontWeight('bold');
      }

      if (rowNum > 1 && rowNum <= sheet.getLastRow()) {
        sheet.getRange(rowNum, statusColIdx).setValue('Confirmado');
        return ContentService
          .createTextOutput(JSON.stringify({ result: 'success' }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({ result: 'error', message: 'Linha invalida' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Se pedir para excluir uma linha
  if (params.action === 'delete' && params.row) {
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var rowNum = parseInt(params.row);
      if (rowNum > 1 && rowNum <= sheet.getLastRow()) {
        sheet.deleteRow(rowNum);
        return ContentService
          .createTextOutput(JSON.stringify({ result: 'success' }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({ result: 'error', message: 'Linha invalida' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput('Formulario de inscricao - 1o Encontro das Caritas Subregional esta funcionando!')
    .setMimeType(ContentService.MimeType.TEXT);
}
