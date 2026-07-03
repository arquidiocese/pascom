// ============================================================
// CONFIGURACAO - Coloque aqui a URL do Google Apps Script
// ============================================================
const SCRIPT_URL = 'https://script.google.com/a/macros/tvtem.com/s/AKfycbyCFi0sRGh348Tc0HpP9CVYQNBxrrXk_RlqEb7luKRSOjXzRsaNhiJf6aL4cVFvqLVN/exec';
// ============================================================

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
    if (SCRIPT_URL === 'COLE_AQUI_A_URL_DO_GOOGLE_APPS_SCRIPT') {
        console.log('Apps Script nao configurado, usando localStorage');
        return;
    }
    mostrarStatus('Sincronizando...', 'sincronizando');
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
            mostrarStatus('Sincronizado', 'online');
            renderizar();
        }
    } catch(e) {
        mostrarStatus('Offline - usando dados locais', 'offline');
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

// Carregar dados ao iniciar
carregarDoServidor();

// Sincronizar a cada 10 segundos
setInterval(carregarDoServidor, 10000);


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

// Limpar confirmacoes de dias anteriores
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
limparConfirmacoesAntigas();

// === Navegacao ===
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        paginaAtual = btn.dataset.page;
        renderizar();
    });
});

function renderizar() {
    clearInterval(intervalRelogio);
    const app = document.getElementById('app');
    switch (paginaAtual) {
        case 'painel': renderPainel(app); break;
        case 'cadastro': renderCadastro(app); break;
        case 'fichas': renderFichas(app); break;
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

    // Verificar alertas
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
        const proximo = getProximoMedicamento(horaAtual);
        if (proximo) {
            alertasHtml += `
                <div class="alerta-card ok" style="margin-top:1rem;">
                    <div class="alerta-info">
                        <h3>${proximo.ficha}</h3>
                        <p>${proximo.med} - ${proximo.dosagem || ''}</p>
                    </div>
                    <div>
                        <strong>${proximo.horario}</strong><br>
                        <small>Proximo</small>
                    </div>
                </div>
            `;
        }
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
                    proximo = {
                        ficha: ficha.nome,
                        med: med.nome,
                        dosagem: med.dosagem,
                        horario: horario
                    };
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
                    <textarea id="alergias" placeholder="Ex: Dipirona, Amendoim, Lactose...">${f.alergias || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Restricoes Alimentares</label>
                    <textarea id="restricoes" placeholder="Ex: Vegetariano, intolerante a lactose...">${f.restricoes || ''}</textarea>
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
            <div class="form-group">
                <label>Nome do Medicamento</label>
                <input type="text" class="med-nome" value="${med.nome || ''}" placeholder="Ex: Paracetamol">
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
}


function salvarFicha(editId) {
    const nome = document.getElementById('nome').value.trim();
    if (!nome) { alert('Nome e obrigatorio!'); return; }

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
        }
    });

    const ficha = {
        id: editId || Date.now().toString(),
        nome,
        idade: document.getElementById('idade').value,
        telefone: document.getElementById('telefone').value.trim(),
        responsavel: document.getElementById('responsavel').value.trim(),
        alergias: document.getElementById('alergias').value.trim(),
        restricoes: document.getElementById('restricoes').value.trim(),
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
    container.innerHTML = `
        <div class="fichas-container">
            <h2>Fichas Cadastradas (${fichas.length})</h2>
            <input type="text" class="busca-input" id="busca" 
                   placeholder="Buscar por nome ou alergia...">
            <div id="lista-fichas"></div>
        </div>
    `;

    renderListaFichas(fichas);

    document.getElementById('busca').addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const filtradas = fichas.filter(f =>
            f.nome.toLowerCase().includes(termo) ||
            (f.alergias && f.alergias.toLowerCase().includes(termo))
        );
        renderListaFichas(filtradas);
    });
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
                ${f.telefone ? `<span>Tel: ${f.telefone}</span>` : ''}
                ${f.responsavel ? `<span>Resp: ${f.responsavel}</span>` : ''}
            </div>
            ${f.alergias ? `<p class="alergias"><strong>Alergias:</strong> ${f.alergias}</p>` : ''}
            ${f.restricoes ? `<p style="color:#f39c12;font-size:0.9rem;"><strong>Restricoes:</strong> ${f.restricoes}</p>` : ''}
            ${f.observacoes ? `<p style="color:#aaa;font-size:0.9rem;"><strong>Obs Medicas:</strong> ${f.observacoes}</p>` : ''}
            ${renderMedicamentosFicha(f.medicamentos)}
            <div class="acoes">
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

// === Iniciar ===
renderizar();