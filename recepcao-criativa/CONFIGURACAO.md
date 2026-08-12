# Configuração do Google Sheets como Backend

## Passo a Passo Completo

---

## 1. Criar a Planilha no Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com) e crie uma nova planilha
2. Renomeie a planilha para: **Inscritos - Recepção Criativa**
3. Na **Linha 1** (cabeçalho), coloque exatamente estas colunas:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Nome | Funcao | Diocese | Cidade | Paroquia | Telefone | DataInscricao |

4. Salve a planilha

---

## 2. Criar o Google Apps Script

1. Na planilha, vá em **Extensões > Apps Script**
2. Apague todo o código existente
3. Cole o código abaixo:

```javascript
// =============================================
// GOOGLE APPS SCRIPT - Recepção Criativa
// =============================================

function doGet(e) {
  var acao = e.parameter.acao;

  if (acao === 'listar') {
    return listarInscritos();
  }

  return ContentService.createTextOutput(JSON.stringify({ erro: 'Ação inválida' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var dados;
  try {
    dados = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ erro: 'Dados inválidos' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var acao = dados.acao;

  if (acao === 'inserir') {
    return inserirInscrito(dados);
  } else if (acao === 'editar') {
    return editarInscrito(dados);
  } else if (acao === 'excluir') {
    return excluirInscrito(dados);
  }

  return ContentService.createTextOutput(JSON.stringify({ erro: 'Ação inválida' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function listarInscritos() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var dados = planilha.getDataRange().getValues();
  var inscritos = [];

  // Pula a linha 1 (cabeçalho)
  for (var i = 1; i < dados.length; i++) {
    if (dados[i][0]) { // Se tem nome, é válido
      inscritos.push({
        _linha: i + 1, // Número da linha na planilha (1-indexed)
        nome: dados[i][0],
        vocacao: dados[i][1],
        diocese: dados[i][2],
        cidade: dados[i][3],
        paroquia: dados[i][4],
        telefone: dados[i][5],
        dataInscricao: dados[i][6]
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(inscritos))
    .setMimeType(ContentService.MimeType.JSON);
}

function inserirInscrito(dados) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  planilha.appendRow([
    dados.nome,
    dados.vocacao,
    dados.diocese,
    dados.cidade,
    dados.paroquia || '',
    dados.telefone,
    dados.dataInscricao || new Date().toLocaleString('pt-BR')
  ]);

  return ContentService.createTextOutput(JSON.stringify({ sucesso: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function editarInscrito(dados) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var linha = dados.linha;

  if (linha < 2) return ContentService.createTextOutput(JSON.stringify({ erro: 'Linha inválida' }))
    .setMimeType(ContentService.MimeType.JSON);

  planilha.getRange(linha, 1).setValue(dados.nome);
  planilha.getRange(linha, 2).setValue(dados.vocacao);
  planilha.getRange(linha, 3).setValue(dados.diocese);
  planilha.getRange(linha, 4).setValue(dados.cidade);
  planilha.getRange(linha, 5).setValue(dados.paroquia || '');
  planilha.getRange(linha, 6).setValue(dados.telefone);

  return ContentService.createTextOutput(JSON.stringify({ sucesso: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function excluirInscrito(dados) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var linha = dados.linha;

  if (linha < 2) return ContentService.createTextOutput(JSON.stringify({ erro: 'Linha inválida' }))
    .setMimeType(ContentService.MimeType.JSON);

  planilha.deleteRow(linha);

  return ContentService.createTextOutput(JSON.stringify({ sucesso: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Salve o projeto (Ctrl+S) com o nome: **Recepção Criativa API**

---

## 3. Publicar como Web App

1. No Apps Script, clique em **Implantar > Nova implantação**
2. Clique na engrenagem ao lado de "Selecione o tipo" e escolha **App da Web**
3. Configure:
   - **Descrição:** Recepção Criativa API
   - **Executar como:** Eu (seu email)
   - **Quem pode acessar:** **Qualquer pessoa**
4. Clique em **Implantar**
5. Autorize o acesso quando solicitado (clique em "Avançado" > "Ir para Recepção Criativa API")
6. **COPIE A URL** que será exibida (algo como: `https://script.google.com/macros/s/XXXXX/exec`)

---

## 4. Colar a URL no Site

Abra os dois arquivos e cole a URL no lugar indicado:

### index.html (linha do início do script):
```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/SUA-URL-AQUI/exec';
```

### inscritos.html (linha do início do script):
```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/SUA-URL-AQUI/exec';
```

---

## 5. Testar

1. Abra o `index.html` no navegador
2. Preencha o formulário e clique em "Realizar Inscrição"
3. Verifique se os dados apareceram na planilha do Google Sheets
4. Abra `inscritos.html`, faça login com a senha `Pascom123456`
5. Confirme que a lista mostra os inscritos

---

## Dúvidas Frequentes

### Se fizer alterações no Apps Script:
- Vá em **Implantar > Gerenciar implantações**
- Clique no lápis (editar)
- Em "Versão", selecione **Nova versão**
- Clique em **Implantar**
- A URL permanece a mesma!

### Se der erro de CORS:
- Certifique-se de que selecionou "Qualquer pessoa" no acesso
- Verifique se a URL está correta (termina em `/exec`)

### Se os dados não aparecem na lista de inscritos:
- A URL precisa ser a mesma nos dois arquivos
- Verifique se a planilha tem os cabeçalhos corretos na linha 1

---

## Resumo da Arquitetura

```
[Usuário preenche formulário]
        |
        v
[index.html] --POST--> [Google Apps Script] --> [Google Sheets]
                                                       |
[inscritos.html] --GET--> [Google Apps Script] <-------+
        |
        v
[Exibe lista de todos os inscritos]
```

Agora TODAS as inscrições vão para um lugar central (Google Sheets),
independente de qual computador ou celular a pessoa usou para se inscrever!
