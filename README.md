# Formulário Corpus Christi - Arquidiocese

Formulário para coleta de informações das atividades de Corpus Christi nas paróquias.

## Como publicar (100% gratuito)

### Passo 1: Configurar o Google Sheets (banco de dados)

1. Acesse [Google Sheets](https://sheets.google.com) e crie uma nova planilha
2. Dê o nome: **"Corpus Christi - Respostas"**
3. Vá em **Extensões > Apps Script**
4. Apague o conteúdo padrão e cole todo o código do arquivo `google-apps-script.js`
5. Clique em **Implantar > Nova implantação**
   - Tipo: **Aplicativo da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Clique em **Implantar** e autorize o acesso
7. **Copie a URL** gerada

### Passo 2: Configurar o formulário

1. Abra o arquivo `script.js`
2. Na linha que tem `COLE_SUA_URL_AQUI`, substitua pela URL copiada no passo anterior

### Passo 3: Publicar no GitHub Pages (hospedagem gratuita)

1. Crie uma conta no [GitHub](https://github.com) (se não tiver)
2. Crie um novo repositório (ex: `corpus-christi`)
3. Faça upload dos arquivos: `index.html`, `style.css`, `script.js`
4. Vá em **Settings > Pages**
5. Em "Source", selecione **main** e clique em **Save**
6. Aguarde alguns minutos e o site estará no ar em: `https://seuusuario.github.io/corpus-christi`

## Como exportar os dados

- Na planilha do Google Sheets, vá em **Arquivo > Fazer download > CSV (.csv)** ou **Excel (.xlsx)**
- Todos os dados estarão organizados em colunas

## Estrutura dos arquivos

```
├── index.html              → Página do formulário
├── style.css               → Estilos visuais
├── script.js               → Lógica de envio (configurar URL aqui)
├── google-apps-script.js   → Código para colar no Google Apps Script
└── README.md               → Este arquivo de instruções
```

## Campos coletados

1. **Identificação**: Paróquia, responsável, cidade, telefone, forania, email
2. **Programação Litúrgica**: Horários, local, adoração
3. **Procissão**: Horário, trajeto, locais
4. **Enfeites/Tapetes**: Confecção, materiais, comunidades
5. **Ações Especiais**: Novidades, apresentações
6. **Divulgação**: Autorização, links
7. **Registro Fotográfico**: Envio de fotos
8. **Informações Adicionais**: Observações gerais
