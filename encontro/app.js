// ============================================================
// CONFIGURACAO - URL do Google Apps Script
// ============================================================
const SCRIPT_URL = 'https://script.google.com/a/macros/tvtem.com/s/AKfycbyCFi0sRGh348Tc0HpP9CVYQNBxrrXk_RlqEb7luKRSOjXzRsaNhiJf6aL4cVFvqLVN/exec';
const SENHA_APP = '16727';
// ============================================================

// === Login ===
function verificarLogin() {
    if (sessionStorage.getItem('logado') === 'sim') {
        mostrarApp();
        return;
    }
    document.getElementById('tela-login').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';

    document.getElementById('btn-login').addEventListener('click', tentarLogin);
    document.getElementById('input-senha').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') tentarLogin();
    });
}

function tentarLogin() {
    const senha = document.getElementById('input-senha').value;
    if (senha === SENHA_APP) {
        sessionStorage.setItem('logado', 'sim');
        mostrarApp();
    } else {
        document.getElementById('login-erro').style.display = 'block';
        document.getElementById('input-senha').value = '';
    }
}

function mostrarApp() {
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    iniciarApp();
}

// === Estado da Aplicacao ===
let fichas = JSON.parse(localStorage.getItem('fichas_encontro') || '[]');
let confirmacoes = JSON.parse(localStorage.getItem('confirmacoes_encontro') || '{}');
let paginaAtual = 'painel';
let intervalRelogio = null;
let alertasAtivos = new Set();
let sincronizando = false;

// === Sincronizacao com Google Sheets ===
function mostrarStatus(msg, tipo) {
    const el = document.getElementById('status-sync');
    el.textContent = msg;
    el.className = 'status-sync ' + tipo;
    if (tipo === 'online') {
        setTimeout(() => { el.style.display = 'none'; }, 2000);
    }
}

async function carregarDoServidor() {
    if (SCRIPT_URL === 'COLE_AQUI_A_URL_DO_GOOGLE_APPS_SCRIPT') return;
    // Nao sincronizar se estiver no cadastro ou fichas (para nao apagar interacoes)
    if (paginaAtual === 'cadastro') return;
    try {
        const resp = await fetch(SCRIPT_URL + '?action=getFichas');
        if (resp.ok) {
            const dados = await resp.json();
            if (dados.fichas) {
                fichas = dados.fichas;
                localStorage.setItem('fichas_encontro', JSON.stringify(fichas));
            }
            if (dados.confirmacoes) {
                confirmacoes = dados.confirmacoes;
                localStorage.setItem('confirmacoes_encontro', JSON.stringify(confirmacoes));
            }
            // So renderizar se estiver no painel (unica tela que precisa atualizar em tempo real)
            if (paginaAtual === 'painel') {
                // Nao chamar renderizar() para nao resetar o relogio, so atualizar dados
            }
        }
    } catch(e) {
        // silencioso
    }
}

async function salvarNoServidor() {
    localStorage.setItem('fichas_encontro', JSON.stringify(fichas));
    localStorage.setItem('confirmacoes_encontro', JSON.stringify(confirmacoes));

    if (SCRIPT_URL === 'COLE_AQUI_A_URL_DO_GOOGLE_APPS_SCRIPT') return;
    if (sincronizando) return;
    sincronizando = true;
    mostrarStatus('Salvando...', 'sincronizando');
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'salvarFichas', fichas, confirmacoes })
        });
        mostrarStatus('Salvo', 'online');
    } catch(e) {
        mostrarStatus('Erro ao salvar - dados locais ok', 'offline');
    }
    sincronizando = false;
}

// Carregar dados ao iniciar e sincronizar (chamado por iniciarApp)

// === Confirmacoes ===
function getChaveConfirmacao(fichaId, medNome, horario) {
    const hoje = new Date().toISOString().slice(0, 10);
    return `${hoje}_${fichaId}_${medNome}_${horario}`;
}

function confirmarMedicamento(fichaId, medNome, horario) {
    const chave = getChaveConfirmacao(fichaId, medNome, horario);
    confirmacoes[chave] = new Date().toISOString();
    salvarNoServidor();
}

function foiConfirmado(fichaId, medNome, horario) {
    const chave = getChaveConfirmacao(fichaId, medNome, horario);
    return !!confirmacoes[chave];
}

function limparConfirmacoesAntigas() {
    const hoje = new Date().toISOString().slice(0, 10);
    let mudou = false;
    Object.keys(confirmacoes).forEach(chave => {
        if (!chave.startsWith(hoje)) {
            delete confirmacoes[chave];
            mudou = true;
        }
    });
    if (mudou) salvarNoServidor();
}

// === Navegacao ===
function iniciarApp() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            paginaAtual = btn.dataset.page;
            renderizar();
        });
    });
    carregarDoServidor();
    setInterval(carregarDoServidor, 10000);
    limparConfirmacoesAntigas();
    renderizar();
}

function renderizar() {
    clearInterval(intervalRelogio);
    const app = document.getElementById('app');
    switch (paginaAtual) {
        case 'painel': renderPainel(app); break;
        case 'cadastro': renderCadastro(app); break;
        case 'fichas': renderFichas(app); break;
        case 'historico': renderHistorico(app); break;
    }
}

function salvarFichas() {
    salvarNoServidor();
}

// === PAINEL DE ALERTAS ===
function renderPainel(container) {
    container.innerHTML = `
        <div class="painel-container">
            <div class="relogio" id="relogio"></div>
            <div class="data-atual" id="data-atual"></div>
            <div class="alertas-titulo">Alertas de Medicamentos</div>
            <div id="lista-alertas"></div>
        </div>
    `;
    atualizarRelogio();
    intervalRelogio = setInterval(atualizarRelogio, 1000);
}

function atualizarRelogio() {
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');

    const relogioEl = document.getElementById('relogio');
    const dataEl = document.getElementById('data-atual');
    const listaEl = document.getElementById('lista-alertas');

    if (!relogioEl) return;

    relogioEl.textContent = `${horas}:${minutos}:${segundos}`;

    const dias = ['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado'];
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    dataEl.textContent = `${dias[agora.getDay()]}, ${agora.getDate()} de ${meses[agora.getMonth()]} de ${agora.getFullYear()}`;

    const horaAtual = `${horas}:${minutos}`;
    let alertasHtml = '';
    let temAlerta = false;

    fichas.forEach(ficha => {
        if (!ficha.medicamentos) return;
        ficha.medicamentos.forEach(med => {
            if (!med.horarios) return;
            med.horarios.forEach(horario => {
                const diff = diffMinutos(horaAtual, horario);
                const confirmado = foiConfirmado(ficha.id, med.nome, horario);

                if (diff >= -15 && (diff <= 5 || (!confirmado && diff <= 60))) {
                    temAlerta = true;
                    let classe = 'alerta-card';
                    let status = '';
                    let btnConfirmar = '';

                    if (confirmado) {
                        classe += ' confirmado';
                        status = 'Tomado!';
                    } else if (diff < 0) {
                        classe += ' proximo';
                        status = `Em ${Math.abs(diff)} min`;
                    } else if (diff >= 0 && diff <= 5) {
                        classe += ' agora';
                        status = 'AGORA!';
                        tocarAlerta(ficha.nome + med.nome + horario);
                    } else {
                        classe += ' atrasado';
                        status = `${diff} min atrasado!`;
                    }

                    if (!confirmado) {
                        btnConfirmar = `<button class="btn-confirmar" onclick="confirmarMedicamento('${ficha.id}','${med.nome}','${horario}')">Confirmar</button>`;
                    }

                    alertasHtml += `
                        <div class="${classe}">
                            <div class="alerta-info">
                                <h3>${ficha.nome}</h3>
                                <p>${med.nome} - ${med.dosagem || ''}</p>
                            </div>
                            <div style="text-align:right;">
                                <strong>${horario}</strong><br>
                                <small>${status}</small><br>
                                ${btnConfirmar}
                            </div>
                        </div>
                    `;
                }
            });
        });
    });

    if (!temAlerta) {
        alertasHtml = '<p class="sem-alertas">Nenhum medicamento pendente no momento</p>';
    }

    // Mostrar todos os medicamentos do dia (proximos)
    let proximosHtml = '';
    let proximosLista = [];
    fichas.forEach(ficha => {
        if (!ficha.medicamentos) return;
        ficha.medicamentos.forEach(med => {
            if (!med.horarios) return;
            med.horarios.forEach(horario => {
                const diff = diffMinutos(horaAtual, horario);
                const confirmado = foiConfirmado(ficha.id, med.nome, horario);
                // Mostrar medicamentos futuros que nao estao no alerta
                if (diff < -15 && !confirmado) {
                    proximosLista.push({ ficha: ficha.nome, med: med.nome, dosagem: med.dosagem, horario, diff });
                }
            });
        });
    });

    // Ordenar por horario
    proximosLista.sort((a, b) => {
        const [h1, m1] = a.horario.split(':').map(Number);
        const [h2, m2] = b.horario.split(':').map(Number);
        return (h1 * 60 + m1) - (h2 * 60 + m2);
    });

    if (proximosLista.length > 0) {
        alertasHtml += '<h3 style="color:#aaa; margin-top:1.5rem; margin-bottom:0.8rem; text-align:center;">Proximos medicamentos</h3>';
        proximosLista.forEach(p => {
            alertasHtml += `
                <div class="alerta-card ok">
                    <div class="alerta-info">
                        <h3>${p.ficha}</h3>
                        <p>${p.med} - ${p.dosagem || ''}</p>
                    </div>
                    <div>
                        <strong>${p.horario}</strong><br>
                        <small>Em ${Math.abs(p.diff)} min</small>
                    </div>
                </div>
            `;
        });
    }

    if (listaEl) listaEl.innerHTML = alertasHtml;
}

function diffMinutos(horaAtual, horario) {
    const [h1, m1] = horaAtual.split(':').map(Number);
    const [h2, m2] = horario.split(':').map(Number);
    return (h1 * 60 + m1) - (h2 * 60 + m2);
}

function getProximoMedicamento(horaAtual) {
    let proximo = null;
    let menorDiff = Infinity;
    fichas.forEach(ficha => {
        if (!ficha.medicamentos) return;
        ficha.medicamentos.forEach(med => {
            if (!med.horarios) return;
            med.horarios.forEach(horario => {
                const diff = diffMinutos(horario, horaAtual);
                if (diff > 0 && diff < menorDiff && !foiConfirmado(ficha.id, med.nome, horario)) {
                    menorDiff = diff;
                    proximo = { ficha: ficha.nome, med: med.nome, dosagem: med.dosagem, horario };
                }
            });
        });
    });
    return proximo;
}

function tocarAlerta(chave) {
    if (alertasAtivos.has(chave)) return;
    alertasAtivos.add(chave);
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, 500);
    } catch(e) {}
    setTimeout(() => alertasAtivos.delete(chave), 60000);
}


// === Opcoes de Medicamentos (aprende novos) ===
const MEDICAMENTOS_PADRAO = [
    'Paracetamol', 'Dipirona', 'Ibuprofeno', 'Nimesulida', 'Diclofenaco',
    'Amoxicilina', 'Azitromicina', 'Cefalexina', 'Metronidazol',
    'Loratadina', 'Desloratadina', 'Allegra', 'Polaramine', 'Hixizine',
    'Dexametasona', 'Prednisolona', 'Prednisona', 'Berotec', 'Aerolin',
    'Salbutamol (bombinha)', 'Budesonida', 'Clenil',
    'Omeprazol', 'Pantoprazol', 'Ranitidina', 'Domperidona', 'Plasil',
    'Buscopan', 'Luftal', 'Lactulose', 'Floratil',
    'Ritalina', 'Concerta', 'Venvanse',
    'Rivotril', 'Diazepam', 'Clonazepam', 'Sertralina', 'Fluoxetina',
    'Risperidona', 'Carbamazepina', 'Valproato', 'Fenobarbital', 'Topiramato',
    'Insulina', 'Metformina', 'Glibenclamida',
    'Losartana', 'Enalapril', 'Captopril', 'Atenolol', 'Propranolol',
    'Amiodarona', 'Furosemida', 'Hidroclorotiazida',
    'Levotiroxina', 'Puran T4',
    'Vitamina D', 'Vitamina C', 'Complexo B', 'Sulfato ferroso', 'Acido folico',
    'Melatonina', 'Pasalix', 'Maracugina',
    'Dramin', 'Vonau', 'Ondansetrona',
    'Benzetacil', 'Decadron', 'Tylenol', 'Novalgina', 'Dorflex',
    'Neosaldina', 'Torsilax', 'Cimegripe', 'Resfenol',
    'Cataflam', 'Voltaren', 'Tandrilax', 'Miosan',
    'Antialergico', 'Antibiotico', 'Anti-inflamatorio', 'Analgesico'
];

function getMedicamentosPersonalizados() {
    return JSON.parse(localStorage.getItem('medicamentos_custom') || '[]');
}
function salvarMedicamentoCustom(novo) {
    const custom = getMedicamentosPersonalizados();
    if (!custom.includes(novo) && !MEDICAMENTOS_PADRAO.includes(novo)) {
        custom.push(novo);
        localStorage.setItem('medicamentos_custom', JSON.stringify(custom));
    }
}
function getTodosMedicamentos() {
    return [...MEDICAMENTOS_PADRAO, ...getMedicamentosPersonalizados()];
}

// === Opcoes de Alergias e Restricoes (aprende novas) ===
const ALERGIAS_PADRAO = ['Dipirona', 'Penicilina', 'Ibuprofeno', 'AAS', 'Amendoim', 'Frutos do mar', 'Leite/Lactose', 'Ovo', 'Gluten', 'Picada de inseto'];
const RESTRICOES_PADRAO = ['Vegetariano', 'Vegano', 'Intolerante a lactose', 'Celiaco (sem gluten)', 'Diabetico (sem acucar)', 'Sem carne vermelha', 'Sem carne de porco'];

function getAlergiasPersonalizadas() {
    return JSON.parse(localStorage.getItem('alergias_custom') || '[]');
}
function getRestricoesPersonalizadas() {
    return JSON.parse(localStorage.getItem('restricoes_custom') || '[]');
}
function salvarAlergiaCustom(nova) {
    const custom = getAlergiasPersonalizadas();
    if (!custom.includes(nova) && !ALERGIAS_PADRAO.includes(nova)) {
        custom.push(nova);
        localStorage.setItem('alergias_custom', JSON.stringify(custom));
    }
}
function salvarRestricaoCustom(nova) {
    const custom = getRestricoesPersonalizadas();
    if (!custom.includes(nova) && !RESTRICOES_PADRAO.includes(nova)) {
        custom.push(nova);
        localStorage.setItem('restricoes_custom', JSON.stringify(custom));
    }
}

function renderCheckboxGroup(opcoesPadrao, opcoesCustom, selecionadas) {
    const todas = [...opcoesPadrao, ...opcoesCustom];
    const selArray = selecionadas ? selecionadas.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    let html = '<div class="checkbox-group">';
    todas.forEach(opcao => {
        const checked = selArray.includes(opcao) ? 'checked' : '';
        html += `<label class="checkbox-item"><input type="checkbox" value="${opcao}" ${checked}><span>${opcao}</span></label>`;
    });
    html += '</div>';
    return html;
}

// === CADASTRO DE FICHA ===
function renderCadastro(container, fichaEditando = null) {
    const f = fichaEditando || {};
    const meds = f.medicamentos || [];
    
    container.innerHTML = `
        <div class="form-container">
            <h2>${fichaEditando ? 'Editar' : 'Cadastrar'} Ficha</h2>
            <form id="form-ficha">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome Completo *</label>
                        <input type="text" id="nome" value="${f.nome || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Idade</label>
                        <input type="number" id="idade" value="${f.idade || ''}" min="1" max="99">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Telefone de Emergencia</label>
                        <input type="tel" id="telefone" value="${f.telefone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Responsavel</label>
                        <input type="text" id="responsavel" value="${f.responsavel || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Alergias</label>
                    <div id="alergias-checks">
                        ${renderCheckboxGroup(ALERGIAS_PADRAO, getAlergiasPersonalizadas(), f.alergias)}
                    </div>
                    <div class="outros-input">
                        <input type="text" id="alergia-outra" placeholder="Outra alergia...">
                        <button type="button" class="btn btn-secondary btn-add-outro" id="btn-add-alergia">+</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>Restricoes Alimentares</label>
                    <div id="restricoes-checks">
                        ${renderCheckboxGroup(RESTRICOES_PADRAO, getRestricoesPersonalizadas(), f.restricoes)}
                    </div>
                    <div class="outros-input">
                        <input type="text" id="restricao-outra" placeholder="Outra restricao...">
                        <button type="button" class="btn btn-secondary btn-add-outro" id="btn-add-restricao">+</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>Observacoes Medicas</label>
                    <textarea id="observacoes" placeholder="Ex: Asma, diabetes, convulsoes...">${f.observacoes || ''}</textarea>
                </div>

                <h3 style="color:#00d4ff; margin: 1.5rem 0 1rem;">Medicamentos</h3>
                <div id="medicamentos-container"></div>
                <button type="button" class="btn btn-secondary" id="btn-add-med" style="margin-bottom:1.5rem;">
                    + Adicionar Medicamento
                </button>

                <div style="text-align:center;">
                    <button type="submit" class="btn btn-primary">
                        ${fichaEditando ? 'Salvar Alteracoes' : 'Cadastrar Ficha'}
                    </button>
                </div>
            </form>
        </div>
    `;

    const medContainer = document.getElementById('medicamentos-container');
    meds.forEach((med, i) => adicionarMedicamentoUI(medContainer, med, i));

    document.getElementById('btn-add-med').addEventListener('click', () => {
        adicionarMedicamentoUI(medContainer, {}, medContainer.children.length);
    });

    // Botao adicionar nova alergia
    document.getElementById('btn-add-alergia').addEventListener('click', () => {
        const input = document.getElementById('alergia-outra');
        const nova = input.value.trim();
        if (nova) {
            salvarAlergiaCustom(nova);
            const container = document.getElementById('alergias-checks').querySelector('.checkbox-group');
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            label.innerHTML = `<input type="checkbox" value="${nova}" checked><span>${nova}</span>`;
            container.appendChild(label);
            input.value = '';
        }
    });

    // Botao adicionar nova restricao
    document.getElementById('btn-add-restricao').addEventListener('click', () => {
        const input = document.getElementById('restricao-outra');
        const nova = input.value.trim();
        if (nova) {
            salvarRestricaoCustom(nova);
            const container = document.getElementById('restricoes-checks').querySelector('.checkbox-group');
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            label.innerHTML = `<input type="checkbox" value="${nova}" checked><span>${nova}</span>`;
            container.appendChild(label);
            input.value = '';
        }
    });

    document.getElementById('form-ficha').addEventListener('submit', (e) => {
        e.preventDefault();
        salvarFicha(fichaEditando ? fichaEditando.id : null);
    });
}

function adicionarMedicamentoUI(container, med, index) {
    const div = document.createElement('div');
    div.className = 'medicamento-item';
    div.innerHTML = `
        <button type="button" class="remover-med" onclick="this.parentElement.remove()">X</button>
        <div class="form-row">
            <div class="form-group" style="position:relative;">
                <label>Nome do Medicamento</label>
                <input type="text" class="med-nome" value="${med.nome || ''}" placeholder="Digite para buscar..." autocomplete="off">
                <div class="autocomplete-list"></div>
            </div>
            <div class="form-group">
                <label>Dosagem</label>
                <input type="text" class="med-dosagem" value="${med.dosagem || ''}" placeholder="Ex: 500mg">
            </div>
        </div>
        <div class="form-group">
            <label>Horarios (separados por virgula)</label>
            <input type="text" class="med-horarios" value="${(med.horarios || []).join(', ')}" 
                   placeholder="Ex: 08:00, 14:00, 20:00">
        </div>
        <div class="form-group">
            <label>Observacoes do medicamento</label>
            <input type="text" class="med-obs" value="${med.observacoes || ''}" 
                   placeholder="Ex: Tomar com agua, apos refeicao...">
        </div>
    `;
    container.appendChild(div);

    // Autocomplete para o campo de medicamento
    const input = div.querySelector('.med-nome');
    const lista = div.querySelector('.autocomplete-list');

    input.addEventListener('focus', () => mostrarSugestoes(input, lista, ''));
    input.addEventListener('input', () => mostrarSugestoes(input, lista, input.value));
    input.addEventListener('blur', () => {
        setTimeout(() => { lista.innerHTML = ''; lista.style.display = 'none'; }, 200);
    });
}

function mostrarSugestoes(input, lista, termo) {
    const todos = getTodosMedicamentos();
    const filtrados = termo
        ? todos.filter(m => m.toLowerCase().includes(termo.toLowerCase()))
        : todos.slice(0, 15); // Mostra 15 primeiros se nao digitou nada

    if (filtrados.length === 0) {
        lista.innerHTML = '';
        lista.style.display = 'none';
        return;
    }

    lista.style.display = 'block';
    lista.innerHTML = filtrados.slice(0, 10).map(m =>
        `<div class="autocomplete-item" onmousedown="event.preventDefault()" onclick="this.parentElement.previousElementSibling.value='${m}'; this.parentElement.style.display='none'; this.parentElement.innerHTML='';">${m}</div>`
    ).join('');
}

function salvarFicha(editId) {
    const nome = document.getElementById('nome').value.trim();
    if (!nome) { alert('Nome e obrigatorio!'); return; }

    // Coletar alergias dos checkboxes
    const alergiasChecks = document.querySelectorAll('#alergias-checks input[type="checkbox"]:checked');
    const alergias = Array.from(alergiasChecks).map(cb => cb.value).join(', ');

    // Coletar restricoes dos checkboxes
    const restricoesChecks = document.querySelectorAll('#restricoes-checks input[type="checkbox"]:checked');
    const restricoes = Array.from(restricoesChecks).map(cb => cb.value).join(', ');

    const medItems = document.querySelectorAll('.medicamento-item');
    const medicamentos = [];
    medItems.forEach(item => {
        const medNome = item.querySelector('.med-nome').value.trim();
        const dosagem = item.querySelector('.med-dosagem').value.trim();
        const horariosStr = item.querySelector('.med-horarios').value.trim();
        const obs = item.querySelector('.med-obs').value.trim();

        if (medNome) {
            const horarios = horariosStr
                .split(',')
                .map(h => h.trim())
                .filter(h => /^\d{2}:\d{2}$/.test(h));
            medicamentos.push({ nome: medNome, dosagem, horarios, observacoes: obs });
            // Salvar medicamento na lista para proximos cadastros
            salvarMedicamentoCustom(medNome);
        }
    });

    const ficha = {
        id: editId || Date.now().toString(),
        nome,
        idade: document.getElementById('idade').value,
        telefone: document.getElementById('telefone').value.trim(),
        responsavel: document.getElementById('responsavel').value.trim(),
        alergias,
        restricoes,
        observacoes: document.getElementById('observacoes').value.trim(),
        medicamentos
    };

    if (editId) {
        const idx = fichas.findIndex(f => f.id === editId);
        if (idx !== -1) fichas[idx] = ficha;
    } else {
        fichas.push(ficha);
    }

    salvarFichas();
    alert(editId ? 'Ficha atualizada!' : 'Ficha cadastrada com sucesso!');
    paginaAtual = 'fichas';
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.page === 'fichas');
    });
    renderizar();
}


// === LISTAGEM DE FICHAS ===
function renderFichas(container) {
    // Ordenar por nome alfabeticamente
    const fichasOrdenadas = [...fichas].sort((a, b) => 
        (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
    );

    container.innerHTML = `
        <div class="fichas-container">
            <h2>Fichas Cadastradas (${fichas.length})</h2>
            <div class="filtros-container">
                <input type="text" class="busca-input" id="busca" 
                       placeholder="Buscar por nome ou alergia...">
                <div class="filtros-btns">
                    <button class="btn btn-secondary filtro-btn active" data-filtro="todos">Todos</button>
                    <button class="btn btn-secondary filtro-btn" data-filtro="alergias">Com Alergias</button>
                    <button class="btn btn-secondary filtro-btn" data-filtro="restricoes">Com Restricoes</button>
                    <button class="btn btn-secondary filtro-btn" data-filtro="medicamentos">Com Medicamentos</button>
                </div>
            </div>
            <div id="resumo-alergias"></div>
            <div id="lista-fichas"></div>
        </div>
    `;

    renderResumoAlergias();
    renderListaFichas(fichasOrdenadas);

    let filtroAtual = 'todos';

    document.getElementById('busca').addEventListener('input', (e) => {
        aplicarFiltros(e.target.value, filtroAtual);
    });

    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroAtual = btn.dataset.filtro;
            aplicarFiltros(document.getElementById('busca').value, filtroAtual);
        });
    });
}

function aplicarFiltros(termo, filtro) {
    let filtradas = [...fichas].sort((a, b) => 
        (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
    );

    if (termo) {
        const t = termo.toLowerCase();
        filtradas = filtradas.filter(f =>
            f.nome.toLowerCase().includes(t) ||
            (f.alergias && f.alergias.toLowerCase().includes(t)) ||
            (f.restricoes && f.restricoes.toLowerCase().includes(t))
        );
    }

    if (filtro === 'alergias') {
        filtradas = filtradas.filter(f => f.alergias && f.alergias.trim());
    } else if (filtro === 'restricoes') {
        filtradas = filtradas.filter(f => f.restricoes && f.restricoes.trim());
    } else if (filtro === 'medicamentos') {
        filtradas = filtradas.filter(f => f.medicamentos && f.medicamentos.length > 0);
    }

    renderListaFichas(filtradas);
}

function renderResumoAlergias() {
    const el = document.getElementById('resumo-alergias');
    
    // Contar alergias
    const alergiaCount = {};
    const restricaoCount = {};
    fichas.forEach(f => {
        if (f.alergias) {
            f.alergias.split(',').forEach(a => {
                const nome = a.trim();
                if (nome) alergiaCount[nome] = (alergiaCount[nome] || 0) + 1;
            });
        }
        if (f.restricoes) {
            f.restricoes.split(',').forEach(r => {
                const nome = r.trim();
                if (nome) restricaoCount[nome] = (restricaoCount[nome] || 0) + 1;
            });
        }
    });

    const temAlergias = Object.keys(alergiaCount).length > 0;
    const temRestricoes = Object.keys(restricaoCount).length > 0;

    if (!temAlergias && !temRestricoes) {
        el.innerHTML = '';
        return;
    }

    let html = '<div class="resumo-card">';
    html += '<div style="text-align:right; margin-bottom:0.5rem;"><button class="btn btn-secondary" style="font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="exportarAlergias()">Exportar Lista</button></div>';
    
    if (temAlergias) {
        const alergias = Object.entries(alergiaCount).sort((a, b) => b[1] - a[1]);
        html += '<div class="resumo-secao"><h4 style="color:#ff6b6b;">Alergias no grupo</h4><div class="resumo-tags">';
        alergias.forEach(([nome, qtd]) => {
            html += `<span class="tag tag-alergia">${nome} (${qtd})</span>`;
        });
        html += '</div></div>';
    }

    if (temRestricoes) {
        const restricoes = Object.entries(restricaoCount).sort((a, b) => b[1] - a[1]);
        html += '<div class="resumo-secao"><h4 style="color:#f39c12;">Restricoes alimentares no grupo</h4><div class="resumo-tags">';
        restricoes.forEach(([nome, qtd]) => {
            html += `<span class="tag tag-restricao">${nome} (${qtd})</span>`;
        });
        html += '</div></div>';
    }

    html += '</div>';
    el.innerHTML = html;
}

function renderListaFichas(lista) {
    const el = document.getElementById('lista-fichas');
    if (!el) return;

    if (lista.length === 0) {
        el.innerHTML = '<p class="sem-fichas">Nenhuma ficha encontrada.</p>';
        return;
    }

    el.innerHTML = lista.map(f => `
        <div class="ficha-card">
            <h3>${f.nome}</h3>
            <div class="info-row">
                ${f.idade ? `<span>Idade: ${f.idade}</span>` : ''}
                ${f.telefone ? `<span><a href="tel:${f.telefone}" class="btn-ligar">Tel: ${f.telefone}</a></span>` : ''}
                ${f.responsavel ? `<span>Resp: ${f.responsavel}</span>` : ''}
            </div>
            ${f.alergias ? `<p class="alergias"><strong>Alergias:</strong> ${f.alergias}</p>` : ''}
            ${f.restricoes ? `<p style="color:#f39c12;font-size:0.9rem;"><strong>Restricoes:</strong> ${f.restricoes}</p>` : ''}
            ${f.observacoes ? `<p style="color:#aaa;font-size:0.9rem;"><strong>Obs Medicas:</strong> ${f.observacoes}</p>` : ''}
            ${renderMedicamentosFicha(f.medicamentos)}
            <div class="acoes">
                ${f.telefone ? `<a href="tel:${f.telefone}" class="btn btn-secondary" style="text-decoration:none;">Ligar</a>` : ''}
                <button class="btn btn-secondary" onclick="editarFicha('${f.id}')">Editar</button>
                <button class="btn btn-danger" onclick="excluirFicha('${f.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function renderMedicamentosFicha(meds) {
    if (!meds || meds.length === 0) return '';
    return `
        <div class="medicamentos-lista">
            <strong style="font-size:0.9rem;">Medicamentos:</strong>
            ${meds.map(m => `
                <div class="med-item">
                    <span>${m.nome} ${m.dosagem ? '(' + m.dosagem + ')' : ''}</span>
                    <span>${m.horarios ? m.horarios.join(', ') : 'Sem horario'}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function editarFicha(id) {
    const ficha = fichas.find(f => f.id === id);
    if (!ficha) return;
    paginaAtual = 'cadastro';
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.page === 'cadastro');
    });
    renderCadastro(document.getElementById('app'), ficha);
}

function excluirFicha(id) {
    if (!confirm('Tem certeza que deseja excluir esta ficha?')) return;
    fichas = fichas.filter(f => f.id !== id);
    salvarFichas();
    renderFichas(document.getElementById('app'));
}

// === HISTORICO DE CONFIRMACOES E HORARIO GERAL ===
function renderHistorico(container) {
    const hoje = new Date().toISOString().slice(0, 10);
    
    // Montar horario geral de todos os medicamentos do dia
    let todosMeds = [];
    fichas.forEach(ficha => {
        if (!ficha.medicamentos) return;
        ficha.medicamentos.forEach(med => {
            if (!med.horarios) return;
            med.horarios.forEach(horario => {
                const confirmado = foiConfirmado(ficha.id, med.nome, horario);
                todosMeds.push({
                    nome: ficha.nome,
                    medicamento: med.nome,
                    dosagem: med.dosagem || '',
                    horario,
                    confirmado,
                    fichaId: ficha.id
                });
            });
        });
    });

    // Ordenar por horario
    todosMeds.sort((a, b) => {
        const [h1, m1] = a.horario.split(':').map(Number);
        const [h2, m2] = b.horario.split(':').map(Number);
        return (h1 * 60 + m1) - (h2 * 60 + m2);
    });

    // Agrupar por horario
    const porHorario = {};
    todosMeds.forEach(m => {
        if (!porHorario[m.horario]) porHorario[m.horario] = [];
        porHorario[m.horario].push(m);
    });

    // Confirmacoes do dia (sem duplicatas)
    const confirmHoje = [];
    const chavesVistas = new Set();
    Object.entries(confirmacoes).forEach(([chave, hora]) => {
        if (!chave.startsWith(hoje)) return;
        if (chavesVistas.has(chave)) return;
        chavesVistas.add(chave);
        const partes = chave.substring(hoje.length + 1);
        const idx1 = partes.indexOf('_');
        const idx2 = partes.lastIndexOf('_');
        const fichaId = partes.substring(0, idx1);
        const medNome = partes.substring(idx1 + 1, idx2);
        const horario = partes.substring(idx2 + 1);
        const ficha = fichas.find(f => f.id === fichaId);
        confirmHoje.push({
            nome: ficha ? ficha.nome : 'Desconhecido',
            medicamento: medNome,
            horario,
            confirmadoEm: new Date(hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
    });
    confirmHoje.sort((a, b) => a.horario.localeCompare(b.horario));

    container.innerHTML = `
        <div class="fichas-container">
            <h2>Horario Geral de Medicamentos</h2>
            <p style="text-align:center; color:#aaa; margin-bottom:1rem;">${hoje.split('-').reverse().join('/')} - ${todosMeds.length} doses no dia</p>
            
            ${Object.keys(porHorario).length === 0 
                ? '<p class="sem-fichas">Nenhum medicamento cadastrado.</p>'
                : Object.entries(porHorario).map(([horario, meds]) => `
                    <div class="ficha-card" style="padding:1rem; margin-bottom:0.8rem;">
                        <h3 style="color:#00d4ff; margin-bottom:0.5rem;">${horario}</h3>
                        ${meds.map(m => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.3rem 0; border-bottom:1px solid #0f3460;">
                                <div>
                                    <strong>${m.nome}</strong>
                                    <span style="color:#aaa; font-size:0.85rem;"> - ${m.medicamento} ${m.dosagem ? '(' + m.dosagem + ')' : ''}</span>
                                </div>
                                <span style="color:${m.confirmado ? '#27ae60' : '#e74c3c'}; font-size:0.8rem; font-weight:bold;">
                                    ${m.confirmado ? 'Tomado' : 'Pendente'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                `).join('')
            }

            <h2 style="margin-top:2rem;">Confirmacoes de Hoje</h2>
            ${confirmHoje.length === 0 
                ? '<p class="sem-fichas">Nenhum medicamento confirmado hoje.</p>'
                : confirmHoje.map(c => `
                    <div class="ficha-card" style="padding:0.8rem; margin-bottom:0.5rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong>${c.nome}</strong><br>
                                <span style="color:#aaa; font-size:0.85rem;">${c.medicamento} - Horario: ${c.horario}</span>
                            </div>
                            <div style="text-align:right;">
                                <span style="color:#27ae60; font-weight:bold;">Confirmado</span><br>
                                <span style="color:#aaa; font-size:0.8rem;">as ${c.confirmadoEm}</span>
                            </div>
                        </div>
                    </div>
                `).join('')
            }

            <div style="margin-top:2rem; text-align:center;">
                <button class="btn btn-primary" onclick="exportarPDF()">Exportar Fichas</button>
                <button class="btn btn-secondary" onclick="exportarAlergias()" style="margin-left:0.5rem;">Exportar Alergias</button>
            </div>
        </div>
    `;
}

// === EXPORTAR / IMPRIMIR ===
function exportarPDF() {
    const fichasOrdenadas = [...fichas].sort((a, b) => 
        (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
    );

    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Fichas do Encontro - Adolecrist</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { text-align: center; color: #333; }
            .ficha { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 8px; page-break-inside: avoid; }
            .ficha h3 { margin: 0 0 5px 0; color: #1a4a8a; }
            .info { color: #666; font-size: 11px; }
            .alergias { color: #e74c3c; font-weight: bold; }
            .restricoes { color: #f39c12; }
            .med { background: #f0f0f0; padding: 4px 8px; margin: 2px 0; border-radius: 4px; font-size: 11px; }
            .telefone { color: #27ae60; font-weight: bold; }
            @media print { .no-print { display: none; } }
        </style></head><body>
        <h1>Fichas do Encontro - Adolecrist</h1>
        <p style="text-align:center; color:#666;">Total: ${fichasOrdenadas.length} participantes | Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <button class="no-print" onclick="window.print()" style="padding:10px 20px; margin:10px auto; display:block; cursor:pointer;">Imprimir</button>
        ${fichasOrdenadas.map(f => `
            <div class="ficha">
                <h3>${f.nome}</h3>
                <div class="info">
                    ${f.idade ? `Idade: ${f.idade} | ` : ''}
                    ${f.telefone ? `<span class="telefone">Tel: ${f.telefone}</span> | ` : ''}
                    ${f.responsavel ? `Resp: ${f.responsavel}` : ''}
                </div>
                ${f.alergias ? `<div class="alergias">ALERGIAS: ${f.alergias}</div>` : ''}
                ${f.restricoes ? `<div class="restricoes">Restricoes: ${f.restricoes}</div>` : ''}
                ${f.observacoes ? `<div class="info">Obs: ${f.observacoes}</div>` : ''}
                ${f.medicamentos && f.medicamentos.length > 0 ? 
                    f.medicamentos.map(m => `<div class="med">${m.nome} ${m.dosagem || ''} - ${m.horarios ? m.horarios.join(', ') : 'Sem horario'}</div>`).join('') 
                    : ''}
            </div>
        `).join('')}
        </body></html>
    `);
    win.document.close();
}

// === EXPORTAR ALERGIAS E RESTRICOES ===
function exportarAlergias() {
    const fichasOrdenadas = [...fichas].sort((a, b) => 
        (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
    );

    const comAlergias = fichasOrdenadas.filter(f => f.alergias && f.alergias.trim());
    const comRestricoes = fichasOrdenadas.filter(f => f.restricoes && f.restricoes.trim());
    const comMedicamentos = fichasOrdenadas.filter(f => f.medicamentos && f.medicamentos.length > 0);

    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Alergias e Restricoes - Adolecrist</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { text-align: center; color: #333; font-size: 18px; }
            h2 { color: #c0392b; border-bottom: 2px solid #c0392b; padding-bottom: 5px; margin-top: 20px; font-size: 14px; }
            h3 { color: #f39c12; border-bottom: 2px solid #f39c12; padding-bottom: 5px; margin-top: 20px; font-size: 14px; }
            h4 { color: #2980b9; border-bottom: 2px solid #2980b9; padding-bottom: 5px; margin-top: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 11px; }
            th { background: #f0f0f0; font-weight: bold; }
            .alerta { color: #c0392b; font-weight: bold; }
            @media print { .no-print { display: none; } }
        </style></head><body>
        <h1>Adolecrist - Encontro<br>Alergias, Restricoes e Medicamentos</h1>
        <p style="text-align:center; color:#666;">Total: ${fichas.length} participantes | Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <button class="no-print" onclick="window.print()" style="padding:10px 20px; margin:10px auto; display:block; cursor:pointer; font-size:14px;">Imprimir / Salvar PDF</button>

        <h2>ALERGIAS (${comAlergias.length} participantes)</h2>
        ${comAlergias.length > 0 ? `
        <table>
            <tr><th>Nome</th><th>Idade</th><th>Alergias</th><th>Tel. Emergencia</th></tr>
            ${comAlergias.map(f => `
                <tr>
                    <td>${f.nome}</td>
                    <td>${f.idade || '-'}</td>
                    <td class="alerta">${f.alergias}</td>
                    <td>${f.telefone || '-'}</td>
                </tr>
            `).join('')}
        </table>` : '<p>Nenhum participante com alergias.</p>'}

        <h3>RESTRICOES ALIMENTARES (${comRestricoes.length} participantes)</h3>
        ${comRestricoes.length > 0 ? `
        <table>
            <tr><th>Nome</th><th>Idade</th><th>Restricoes</th></tr>
            ${comRestricoes.map(f => `
                <tr>
                    <td>${f.nome}</td>
                    <td>${f.idade || '-'}</td>
                    <td>${f.restricoes}</td>
                </tr>
            `).join('')}
        </table>` : '<p>Nenhum participante com restricoes.</p>'}

        <h4>MEDICAMENTOS (${comMedicamentos.length} participantes)</h4>
        ${comMedicamentos.length > 0 ? `
        <table>
            <tr><th>Nome</th><th>Medicamento</th><th>Dosagem</th><th>Horarios</th><th>Obs</th></tr>
            ${comMedicamentos.map(f => 
                f.medicamentos.map((m, i) => `
                    <tr>
                        ${i === 0 ? `<td rowspan="${f.medicamentos.length}">${f.nome}</td>` : ''}
                        <td>${m.nome}</td>
                        <td>${m.dosagem || '-'}</td>
                        <td>${m.horarios ? m.horarios.join(', ') : '-'}</td>
                        <td>${m.observacoes || '-'}</td>
                    </tr>
                `).join('')
            ).join('')}
        </table>` : '<p>Nenhum participante com medicamentos.</p>'}

        </body></html>
    `);
    win.document.close();
}

// === Iniciar ===
verificarLogin();