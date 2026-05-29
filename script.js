// ============================================================
// CONFIGURAÇÃO - Google Apps Script URL
// ============================================================
// INSTRUÇÕES:
// 1. Crie uma planilha no Google Sheets
// 2. Vá em Extensões > Apps Script
// 3. Cole o código do arquivo "google-apps-script.js" 
// 4. Implante como aplicativo web (acesso: qualquer pessoa)
// 5. Copie a URL gerada e cole abaixo:

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIZHasyTBPEgo2HwJOPT7-pFm1icRNBLFGIoHDdRAkeddQZ207DLv4aU4rGoQ_d6uj/exec';

// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cadastroForm');
    const successMessage = document.getElementById('successMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Máscara de telefone
    const telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        if (value.length > 6) {
            value = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7)}`;
        } else if (value.length > 2) {
            value = `(${value.slice(0,2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }
        e.target.value = value;
    });

    // Mostrar/esconder campo "Especifique o local" da missa
    const localMissaRadios = document.querySelectorAll('input[name="localMissa"]');
    const localMissaOutroGroup = document.getElementById('localMissaOutroGroup');
    const localMissaOutroInput = document.getElementById('localMissaOutro');

    localMissaRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'Capela' || this.value === 'Praça' || this.value === 'Outro') {
                localMissaOutroGroup.style.display = 'flex';
                localMissaOutroInput.required = true;
            } else {
                localMissaOutroGroup.style.display = 'none';
                localMissaOutroInput.required = false;
                localMissaOutroInput.value = '';
            }
        });
    });

    // Submit do formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validação básica
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Coletar dados
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Adicionar timestamp
        data.timestamp = new Date().toLocaleString('pt-BR');

        // Verificar se a URL foi configurada
        if (GOOGLE_SCRIPT_URL === 'COLE_SUA_URL_AQUI') {
            alert('⚠️ Configure a URL do Google Apps Script no arquivo script.js antes de usar o formulário.');
            return;
        }

        // Mostrar loading
        loadingOverlay.style.display = 'flex';

        // Enviar para Google Sheets
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(() => {
            // Sucesso
            loadingOverlay.style.display = 'none';
            form.style.display = 'none';
            successMessage.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch(error => {
            loadingOverlay.style.display = 'none';
            alert('Erro ao enviar o formulário. Tente novamente.');
            console.error('Erro:', error);
        });
    });
});
