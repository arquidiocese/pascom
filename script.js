// ============================================================
// CONFIGURACAO - Google Apps Script URL
// ============================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIZHasyTBPEgo2HwJOPT7-pFm1icRNBLFGIoHDdRAkeddQZ207DLv4aU4rGoQ_d6uj/exec';
// ============================================================

// Funcao de consulta de inscricao (global)
function consultarInscricao() {
    var nome = document.getElementById('consultaNome').value.trim();
    var telefone = document.getElementById('consultaTelefone').value.trim();
    var erro = document.getElementById('consultaErro');
    var loading = document.getElementById('consultaLoading');

    erro.style.display = 'none';

    if (!nome || !telefone) {
        erro.textContent = 'Preencha o nome completo e o telefone.';
        erro.style.display = 'block';
        return;
    }

    loading.style.display = 'block';

    fetch(GOOGLE_SCRIPT_URL + '?action=consulta&nome=' + encodeURIComponent(nome) + '&telefone=' + encodeURIComponent(telefone))
        .then(function(response) { return response.json(); })
        .then(function(result) {
            loading.style.display = 'none';
            if (result.found) {
                document.getElementById('consultaBox').style.display = 'none';
                document.querySelector('.comunicado').style.display = 'none';
                document.getElementById('inscricaoForm').style.display = 'none';

                var successDiv = document.getElementById('successMessage');
                var pago = result.statusPagamento === 'Confirmado';

                var html = '<div class="success-icon">' + (pago ? '&#10003;' : '&#128179;') + '</div>';
                html += '<h3>Ol\u00e1, ' + result.nome + '!</h3>';

                // Resumo da inscricao
                html += '<div class="inscricao-resumo">';
                html += '<h4>Resumo da sua inscri\u00e7\u00e3o</h4>';
                if (result.dataInscricao) html += '<p><strong>Data da inscri\u00e7\u00e3o:</strong> ' + result.dataInscricao + '</p>';
                if (result.cidade) html += '<p><strong>Cidade:</strong> ' + result.cidade + '</p>';
                if (result.diocese) html += '<p><strong>Diocese:</strong> ' + result.diocese + '</p>';
                if (result.paroquia) html += '<p><strong>Par\u00f3quia:</strong> ' + result.paroquia + '</p>';
                if (result.cargo) html += '<p><strong>Cargo/Fun\u00e7\u00e3o:</strong> ' + result.cargo + '</p>';
                html += '</div>';

                // Status do pagamento
                if (pago) {
                    html += '<div class="status-pago">';
                    html += '<span class="status-icon">&#10003;</span>';
                    html += '<span>Pagamento confirmado!</span>';
                    html += '</div>';
                    html += '<p>Sua inscri\u00e7\u00e3o est\u00e1 completa. Nos vemos no encontro!</p>';
                } else {
                    html += '<div class="status-aguardando">';
                    html += '<span class="status-icon">&#9202;</span>';
                    html += '<span>Aguardando pagamento</span>';
                    html += '</div>';
                    html += '<div class="pagamento-box">';
                    html += '<h4>Taxa de inscri\u00e7\u00e3o: R$ 35,00</h4>';
                    html += '<p>Para confirmar sua participa\u00e7\u00e3o, efetue o pagamento clicando no bot\u00e3o abaixo:</p>';
                    html += '<a href="https://pag.ae/81WWPmv7M" target="_blank" class="btn-pagamento">Pagar R$ 35,00 via PagBank</a>';
                    html += '<p class="pagamento-obs">Aceita Pix, cart\u00e3o de cr\u00e9dito, d\u00e9bito e boleto.</p>';
                    html += '</div>';
                }

                html += '<p><em>\u201cUnidos no amor, a servi\u00e7o da vida!\u201d</em></p>';

                successDiv.innerHTML = html;
                successDiv.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                erro.textContent = 'Inscri\u00e7\u00e3o n\u00e3o encontrada. Verifique os dados ou fa\u00e7a sua inscri\u00e7\u00e3o abaixo.';
                erro.style.display = 'block';
            }
        })
        .catch(function(error) {
            loading.style.display = 'none';
            erro.textContent = 'Erro ao buscar. Tente novamente.';
            erro.style.display = 'block';
            console.error('Erro:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('inscricaoForm');
    var successMessage = document.getElementById('successMessage');
    var loadingOverlay = document.getElementById('loadingOverlay');

    // ============================================================
    // MASCARAS DE INPUT
    // ============================================================

    // Mascara de telefone
    var telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function(e) {
        var value = e.target.value.replace(/\D/g, '');
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

    // ============================================================
    // CAMPOS CONDICIONAIS
    // ============================================================

    // Mostrar/esconder campo "Outro cargo"
    var cargoSelect = document.getElementById('cargoFuncao');
    var cargoOutroGroup = document.getElementById('cargoOutroGroup');
    var cargoOutroInput = document.getElementById('cargoOutro');

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
    var restricaoRadios = document.querySelectorAll('input[name="restricaoAlimentar"]');
    var restricaoDetalheGroup = document.getElementById('restricaoDetalheGroup');

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
    var acessibilidadeRadios = document.querySelectorAll('input[name="acessibilidade"]');
    var acessibilidadeDetalheGroup = document.getElementById('acessibilidadeDetalheGroup');

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

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        var formData = new FormData(form);
        var data = {};

        formData.forEach(function(value, key) {
            data[key] = value;
        });

        data.timestamp = new Date().toLocaleString('pt-BR');

        loadingOverlay.style.display = 'flex';

        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(function() {
            loadingOverlay.style.display = 'none';
            form.style.display = 'none';
            document.querySelector('.comunicado').style.display = 'none';
            document.getElementById('consultaBox').style.display = 'none';
            successMessage.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch(function(error) {
            loadingOverlay.style.display = 'none';
            alert('Erro ao enviar a inscri\u00e7\u00e3o. Tente novamente.');
            console.error('Erro:', error);
        });
    });
});
