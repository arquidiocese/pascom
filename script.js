// ============================================================
// CONFIGURACAO - Google Apps Script URL
// ============================================================
// Use a mesma URL do Google Apps Script implantado
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYfh3w4aC6lvA5zgnGzw8EXJrpqyrrlw-E3CNCFhNp5zrLyweAKHovdbOz7yzkZ8XF/exec';
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('inscricaoForm');
    const successMessage = document.getElementById('successMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // ============================================================
    // MASCARAS DE INPUT
    // ============================================================

    // Mascara de telefone
    const telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 6) {
            value = '(' + value.slice(0,2) + ') ' + value.slice(2,7) + '-' + value.slice(7);
        } else if (value.length > 2) {
            value = '(' + value.slice(0,2) + ') ' + value.slice(2);
        } else if (value.length > 0) {
            value = '(' + value;
        }
        e.target.value = value;
    });

    // Mascara de CPF
    const cpfInput = document.getElementById('cpf');
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 9) {
            value = value.slice(0,3) + '.' + value.slice(3,6) + '.' + value.slice(6,9) + '-' + value.slice(9);
        } else if (value.length > 6) {
            value = value.slice(0,3) + '.' + value.slice(3,6) + '.' + value.slice(6);
        } else if (value.length > 3) {
            value = value.slice(0,3) + '.' + value.slice(3);
        }
        e.target.value = value;
    });

    // ============================================================
    // CAMPOS CONDICIONAIS
    // ============================================================

    // Mostrar/esconder campo "Outro cargo"
    const cargoSelect = document.getElementById('cargoFuncao');
    const cargoOutroGroup = document.getElementById('cargoOutroGroup');
    const cargoOutroInput = document.getElementById('cargoOutro');

    cargoSelect.addEventListener('change', function() {
        if (this.value === 'Outro') {
            cargoOutroGroup.style.display = 'flex';
            cargoOutroInput.required = true;
        } else {
            cargoOutroGroup.style.display = 'none';
            cargoOutroInput.required = false;
            cargoOutroInput.value = '';
        }
    });

    // Mostrar/esconder campo "Restricao alimentar"
    const restricaoRadios = document.querySelectorAll('input[name="restricaoAlimentar"]');
    const restricaoDetalheGroup = document.getElementById('restricaoDetalheGroup');

    restricaoRadios.forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.value === 'Sim') {
                restricaoDetalheGroup.style.display = 'flex';
            } else {
                restricaoDetalheGroup.style.display = 'none';
                document.getElementById('restricaoDetalhe').value = '';
            }
        });
    });

    // Mostrar/esconder campo "Acessibilidade"
    const acessibilidadeRadios = document.querySelectorAll('input[name="acessibilidade"]');
    const acessibilidadeDetalheGroup = document.getElementById('acessibilidadeDetalheGroup');

    acessibilidadeRadios.forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.value === 'Sim') {
                acessibilidadeDetalheGroup.style.display = 'flex';
            } else {
                acessibilidadeDetalheGroup.style.display = 'none';
                document.getElementById('acessibilidadeDetalhe').value = '';
            }
        });
    });

    // ============================================================
    // SUBMIT DO FORMULARIO
    // ============================================================

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validacao basica
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Coletar dados
        var formData = new FormData(form);
        var data = {};

        formData.forEach(function(value, key) {
            data[key] = value;
        });

        // Adicionar timestamp
        data.timestamp = new Date().toLocaleString('pt-BR');

        // Verificar se a URL foi configurada
        if (GOOGLE_SCRIPT_URL === 'COLE_SUA_URL_AQUI') {
            alert('Configure a URL do Google Apps Script no arquivo script.js antes de usar o formulario.');
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
        .then(function() {
            // Sucesso
            loadingOverlay.style.display = 'none';
            form.style.display = 'none';
            document.querySelector('.comunicado').style.display = 'none';
            successMessage.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch(function(error) {
            loadingOverlay.style.display = 'none';
            alert('Erro ao enviar a inscricao. Tente novamente.');
            console.error('Erro:', error);
        });
    });
});
