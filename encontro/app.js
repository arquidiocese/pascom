// ============================================================
const SCRIPT_URL = 'https://script.google.com/a/macros/tvtem.com/s/AKfycbyCFi0sRGh348Tc0HpP9CVYQNBxrrXk_RlqEb7luKRSOjXzRsaNhiJf6aL4cVFvqLVN/exec';
const SENHA_APP = '16727';
// ============================================================

// === CRONOGRAMA ===
const CRONOGRAMA = {
'2026-07-03': { titulo: 'Sexta - 03/07', atividades: [
{inicio:'19:00',fim:'19:30',atividade:'Abertura do Encontro na Vigilia',resp:''},
{inicio:'19:30',fim:'20:00',atividade:'Recebimento dos Jovens',resp:'Visitacao'},
{inicio:'20:00',fim:'20:10',atividade:'Inicio do Encontro na Igreja',resp:'Padre Natal'},
{inicio:'20:10',fim:'20:30',atividade:'Capela (Como e Grande)',resp:'Jovens'},
{inicio:'20:30',fim:'20:50',atividade:'Salao - Apresentacao Equipe de Sala',resp:'Equipe de Sala'},
{inicio:'20:50',fim:'21:10',atividade:'Lanche',resp:'Copa'},
{inicio:'21:10',fim:'22:40',atividade:'1a Palestra - SENTIDO DA VIDA',resp:'Marco Antonio'},
{inicio:'22:45',fim:'23:05',atividade:'TEATRO - A Cadeira Vazia',resp:'Teatro'},
{inicio:'23:05',fim:'23:30',atividade:'CAPELA - Filme de vida',resp:'Marco Antonio'},
{inicio:'23:30',fim:'23:45',atividade:'Oracao da Noite',resp:'Jovens'},
{inicio:'23:45',fim:'23:59',atividade:'Lanche',resp:'Copa'}
]},
'2026-07-04': { titulo: 'Sabado - 04/07', atividades: [
{inicio:'07:15',fim:'08:00',atividade:'Despertar',resp:'Equipe de sala'},
{inicio:'08:00',fim:'08:20',atividade:'Cafe',resp:'Copa'},
{inicio:'08:20',fim:'08:40',atividade:'Oracao da manha - Quem e Deus',resp:'Jovens'},
{inicio:'08:40',fim:'09:40',atividade:'2a Pregacao - AMIZADE',resp:'Lucas Watanabe'},
{inicio:'09:40',fim:'09:55',atividade:'Lanche',resp:'COPA'},
{inicio:'09:55',fim:'10:10',atividade:'Animacao + Agua e Banheiro',resp:'Animacrist'},
{inicio:'10:10',fim:'11:10',atividade:'1o circulo - O AMOR DE DEUS',resp:'Pos encontro'},
{inicio:'11:10',fim:'12:10',atividade:'3a Pregacao - AFETIVIDADE E SEXUALIDADE',resp:'Delys e Augusto'},
{inicio:'12:10',fim:'12:30',atividade:'Capela Mulher Gravida',resp:'Joao coxinha'},
{inicio:'12:30',fim:'13:15',atividade:'Almoco',resp:'Copa / Cozinha'},
{inicio:'13:15',fim:'13:30',atividade:'Animacao / RAP',resp:'Animacrist'},
{inicio:'13:30',fim:'14:30',atividade:'4a Pregacao - Testemunho de Vida - Drogas',resp:'Vagner'},
{inicio:'14:30',fim:'14:40',atividade:'Intervalo agua e banheiro',resp:''},
{inicio:'14:40',fim:'16:20',atividade:'5a Pregacao - PAIS E FILHOS',resp:'Marco e Carol'},
{inicio:'16:20',fim:'16:40',atividade:'Pai - Mensagem',resp:'Marco e Carol'},
{inicio:'16:40',fim:'17:10',atividade:'ESCREVER Cartas para os pais',resp:'Marco e Carol'},
{inicio:'17:10',fim:'17:25',atividade:'INTERVALO - CAFE',resp:'Copa'},
{inicio:'17:25',fim:'18:40',atividade:'6a Pregacao - MARIA, MAE DE JESUS',resp:'Fran - GOUF'},
{inicio:'18:40',fim:'19:40',atividade:'Banho de Encontristas',resp:'Equipe de Sala'},
{inicio:'19:40',fim:'20:30',atividade:'Jantar de Nossa Senhora',resp:'COPA'},
{inicio:'20:50',fim:'21:25',atividade:'Balada Crist',resp:'Animacrist'},
{inicio:'21:25',fim:'22:35',atividade:'Teatro - Tentacoes / 7a Pregacao',resp:'Teatro'},
{inicio:'22:35',fim:'22:50',atividade:'Procissao de Velas',resp:''},
{inicio:'22:50',fim:'23:59',atividade:'Deserto - Exposicao do Santissimo',resp:'Wesley'},
{inicio:'00:00',fim:'00:20',atividade:'Lanche',resp:''}
]},
'2026-07-05': { titulo: 'Domingo - 05/07', atividades: [
{inicio:'07:20',fim:'07:50',atividade:'Despertar',resp:'Equipe de sala'},
{inicio:'07:50',fim:'08:30',atividade:'Cafe',resp:'Copa'},
{inicio:'08:30',fim:'08:45',atividade:'Oracao da manha',resp:'Jovens'},
{inicio:'08:45',fim:'09:00',atividade:'Animacao Plenario',resp:'Animacrist'},
{inicio:'09:00',fim:'10:00',atividade:'Pregacao Igreja e fe',resp:'Edson'},
{inicio:'10:00',fim:'10:15',atividade:'Testemunho dos jovens',resp:''},
{inicio:'10:15',fim:'11:10',atividade:'Apresentacao das equipes',resp:''},
{inicio:'11:10',fim:'12:00',atividade:'Almoco',resp:'Copa / Cozinha'},
{inicio:'12:00',fim:'12:15',atividade:'Flashmob',resp:'Teatro + Animacrist'},
{inicio:'12:15',fim:'12:30',atividade:'Momento de oracao',resp:'Animacrist'},
{inicio:'12:30',fim:'13:40',atividade:'Pregacao Cristo Jovem',resp:''},
{inicio:'13:40',fim:'14:00',atividade:'Entrega Cartas',resp:'Visitacao'},
{inicio:'14:00',fim:'14:15',atividade:'Capela como e grande',resp:'Joao Coxinha'},
{inicio:'14:15',fim:'15:00',atividade:'Organizacao fila',resp:''},
{inicio:'15:00',fim:'16:30',atividade:'Missa encerramento',resp:''}
]}
};

// === Estado ===
let fichas = JSON.parse(localStorage.getItem('fichas_encontro') || '[]');
let confirmacoes = JSON.parse(localStorage.getItem('confirmacoes_encontro') || '{}');
let paginaAtual = 'painel';
let intervalRelogio = null;
let intervalCrono = null;
let alertasAtivos = new Set();
let sincronizando = false;


// === Login ===
function verificarLogin() {
    if (sessionStorage.getItem('logado') === 'sim') { mostrarApp(); return; }
    document.getElementById('tela-login').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('btn-login').addEventListener('click', tentarLogin);
    document.getElementById('input-senha').addEventListener('keypress', (e) => { if (e.key === 'Enter') tentarLogin(); });
}
function tentarLogin() {
    if (document.getElementById('input-senha').value === SENHA_APP) {
        sessionStorage.setItem('logado', 'sim'); mostrarApp();
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

// === Sync ===
async function carregarDoServidor() {
    if (paginaAtual === 'cadastro') return;
    try {
        const resp = await fetch(SCRIPT_URL + '?action=getFichas');
        if (resp.ok) {
            const dados = await resp.json();
            if (dados.fichas) { fichas = dados.fichas; localStorage.setItem('fichas_encontro', JSON.stringify(fichas)); }
            if (dados.confirmacoes) { confirmacoes = dados.confirmacoes; localStorage.setItem('confirmacoes_encontro', JSON.stringify(confirmacoes)); }
        }
    } catch(e) {}
}
async function salvarNoServidor() {
    localStorage.setItem('fichas_encontro', JSON.stringify(fichas));
    localStorage.setItem('confirmacoes_encontro', JSON.stringify(confirmacoes));
    if (sincronizando) return;
    sincronizando = true;
    try {
        await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'salvarFichas', fichas, confirmacoes }) });
    } catch(e) {}
    sincronizando = false;
}

// === Confirmacoes ===
function getChaveConfirmacao(fichaId, medNome, horario) { return new Date().toISOString().slice(0,10) + '_' + fichaId + '_' + medNome + '_' + horario; }
function confirmarMedicamento(fichaId, medNome, horario) { confirmacoes[getChaveConfirmacao(fichaId,medNome,horario)] = new Date().toISOString(); salvarNoServidor(); }
function foiConfirmado(fichaId, medNome, horario) { return !!confirmacoes[getChaveConfirmacao(fichaId,medNome,horario)]; }
function limparConfirmacoesAntigas() {
    const hoje = new Date().toISOString().slice(0,10);
    let mudou = false;
    Object.keys(confirmacoes).forEach(k => { if (!k.startsWith(hoje)) { delete confirmacoes[k]; mudou = true; } });
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
    setInterval(carregarDoServidor, 15000);
    limparConfirmacoesAntigas();
    setInterval(atualizarRelogioHeader, 1000);
    atualizarRelogioHeader();
    renderizar();
}
function atualizarRelogioHeader() {
    const agora = new Date();
    const el = document.getElementById('relogio-header');
    if (el) el.textContent = agora.getHours().toString().padStart(2,'0') + ':' + agora.getMinutes().toString().padStart(2,'0') + ':' + agora.getSeconds().toString().padStart(2,'0');
    const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const d = document.getElementById('data-header');
    if (d) d.textContent = dias[agora.getDay()] + ', ' + agora.getDate() + ' ' + meses[agora.getMonth()];
}
function renderizar() {
    clearInterval(intervalRelogio);
    clearInterval(intervalCrono);
    const app = document.getElementById('app');
    switch (paginaAtual) {
        case 'painel': renderPainel(app); break;
        case 'cronograma': renderCronograma(app); break;
        case 'cadastro': renderCadastro(app); break;
        case 'fichas': renderFichas(app); break;
        case 'historico': renderHistorico(app); break;
    }
}
function salvarFichas() { salvarNoServidor(); }
function diffMinutos(h1, h2) { const [a,b]=h1.split(':').map(Number); const [c,d]=h2.split(':').map(Number); return (a*60+b)-(c*60+d); }


// === PAINEL DE ALERTAS ===
function renderPainel(container) {
    container.innerHTML = '<div class="painel-layout"><div class="painel-medicamentos"><div class="alertas-titulo">Alertas de Medicamentos</div><div id="lista-alertas"></div></div><div class="painel-cronograma"><h3 style="color:#00d4ff;text-align:center;margin-bottom:0.4rem;">Programacao</h3><div id="crono-lateral" class="crono-scroll"></div></div></div>';
    atualizarPainel();
    intervalRelogio = setInterval(atualizarPainel, 30000);
    atualizarCronoLateral();
    intervalCrono = setInterval(atualizarCronoLateral, 60000);
}

function atualizarCronoLateral() {
    const el = document.getElementById('crono-lateral');
    if (!el) return;
    const agora = new Date();
    const hojeKey = agora.toISOString().slice(0,10);
    const horaAtual = agora.getHours().toString().padStart(2,'0') + ':' + agora.getMinutes().toString().padStart(2,'0');
    const dia = CRONOGRAMA[hojeKey];
    if (!dia) { el.innerHTML = '<p style="color:#aaa;text-align:center;">Sem programacao hoje</p>'; return; }

    let html = '';
    dia.atividades.forEach(atv => {
        let classe = 'crono-item';
        let extra = '';
        if (horaAtual >= atv.inicio && horaAtual < atv.fim) {
            classe += ' crono-atual';
            // Cronometro regressivo
            const [fh,fm] = atv.fim.split(':').map(Number);
            const restante = (fh*60+fm) - (agora.getHours()*60+agora.getMinutes());
            extra = '<div class="crono-countdown">Falta ' + restante + ' min</div>';
        } else if (horaAtual >= atv.fim) {
            classe += ' crono-passado crono-hide';
        }
        html += '<div class="' + classe + '"><div class="crono-hora"><strong>' + atv.inicio + '</strong></div><div class="crono-info"><div class="crono-atividade">' + atv.atividade + '</div>' + (atv.resp ? '<div class="crono-resp">' + atv.resp + '</div>' : '') + extra + '</div></div>';
    });
    html = '<button class="btn-ver-passados" onclick="document.querySelectorAll(\'.crono-hide\').forEach(e=>e.classList.toggle(\'crono-hide\'))">Ver anteriores</button>' + html;
    el.innerHTML = html;
    const atual = el.querySelector('.crono-atual');
    if (atual) atual.scrollIntoView({behavior:'smooth',block:'start'});
}

function atualizarPainel() {
    const listaEl = document.getElementById('lista-alertas');
    if (!listaEl) return;
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2,'0');
    const minutos = agora.getMinutes().toString().padStart(2,'0');
    const horaAtual = horas + ':' + minutos;
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
                    let classe = 'alerta-card', status = '', btn = '';
                    if (confirmado) { classe += ' confirmado'; status = 'Tomado!'; }
                    else if (diff < 0) { classe += ' proximo'; status = 'Em ' + Math.abs(diff) + ' min'; }
                    else if (diff <= 5) { classe += ' agora'; status = 'AGORA!'; tocarAlerta(ficha.nome+med.nome+horario); }
                    else { classe += ' atrasado'; status = diff + ' min atrasado!'; }
                    if (!confirmado) btn = '<button class="btn-confirmar" onclick="confirmarMedicamento(\'' + ficha.id + '\',\'' + med.nome + '\',\'' + horario + '\')">Confirmar</button>';
                    alertasHtml += '<div class="' + classe + '"><div class="alerta-info"><h3>' + ficha.nome + '</h3><p>' + med.nome + ' - ' + (med.dosagem||'') + '</p></div><div style="text-align:right;"><strong>' + horario + '</strong><br><small>' + status + '</small><br>' + btn + '</div></div>';
                }
            });
        });
    });
    if (!temAlerta) alertasHtml = '<p class="sem-alertas">Nenhum medicamento pendente no momento</p>';

    // Proximos
    let proximos = [];
    fichas.forEach(ficha => {
        if (!ficha.medicamentos) return;
        ficha.medicamentos.forEach(med => {
            if (!med.horarios) return;
            med.horarios.forEach(horario => {
                const diff = diffMinutos(horaAtual, horario);
                if (diff < -15 && !foiConfirmado(ficha.id, med.nome, horario))
                    proximos.push({ficha:ficha.nome, med:med.nome, dosagem:med.dosagem, horario, diff});
            });
        });
    });
    proximos.sort((a,b) => { const [h1,m1]=a.horario.split(':').map(Number); const [h2,m2]=b.horario.split(':').map(Number); return (h1*60+m1)-(h2*60+m2); });
    if (proximos.length > 0) {
        alertasHtml += '<h3 style="color:#aaa;margin-top:1.5rem;margin-bottom:0.8rem;text-align:center;">Proximos medicamentos</h3>';
        proximos.forEach(p => { alertasHtml += '<div class="alerta-card ok"><div class="alerta-info"><h3>' + p.ficha + '</h3><p>' + p.med + ' - ' + (p.dosagem||'') + '</p></div><div><strong>' + p.horario + '</strong><br><small>Em ' + Math.abs(p.diff) + ' min</small></div></div>'; });
    }
    listaEl.innerHTML = alertasHtml;
}

function tocarAlerta(chave) {
    if (alertasAtivos.has(chave)) return;
    alertasAtivos.add(chave);
    try { const ctx = new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=800; g.gain.value=0.3; o.start(); setTimeout(()=>{o.stop();ctx.close();},500); } catch(e){}
    setTimeout(() => alertasAtivos.delete(chave), 60000);
}


// === CRONOGRAMA (pagina completa) ===
function renderCronograma(container) {
    const agora = new Date();
    const hojeKey = agora.toISOString().slice(0,10);
    let tabsHtml = '<div class="filtros-btns" style="margin-bottom:1rem;justify-content:center;">';
    Object.entries(CRONOGRAMA).forEach(([data, dia]) => {
        tabsHtml += '<button class="btn btn-secondary filtro-btn ' + (data===hojeKey?'active':'') + '" data-dia="' + data + '">' + dia.titulo.split(' - ')[0] + '</button>';
    });
    tabsHtml += '</div>';
    container.innerHTML = '<div class="fichas-container"><h2>Cronograma do Encontro</h2>' + tabsHtml + '<div id="cronograma-conteudo"></div></div>';
    const diaInicial = CRONOGRAMA[hojeKey] ? hojeKey : Object.keys(CRONOGRAMA)[0];
    renderDiaCronograma(diaInicial);
    intervalCrono = setInterval(() => renderDiaCronograma(document.querySelector('[data-dia].active')?.dataset.dia || diaInicial), 60000);
    document.querySelectorAll('[data-dia]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-dia]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderDiaCronograma(btn.dataset.dia);
        });
    });
}
function renderDiaCronograma(dataKey) {
    const dia = CRONOGRAMA[dataKey]; if (!dia) return;
    const el = document.getElementById('cronograma-conteudo');
    const agora = new Date();
    const hojeKey = agora.toISOString().slice(0,10);
    const horaAtual = agora.getHours().toString().padStart(2,'0') + ':' + agora.getMinutes().toString().padStart(2,'0');
    const ehHoje = dataKey === hojeKey;
    let html = '<h3 style="text-align:center;color:#00d4ff;margin-bottom:1rem;">' + dia.titulo + '</h3>';
    dia.atividades.forEach(atv => {
        let classe = 'crono-item', extra = '';
        if (ehHoje && horaAtual >= atv.inicio && horaAtual < atv.fim) {
            classe += ' crono-atual';
            const [fh,fm] = atv.fim.split(':').map(Number);
            const restante = (fh*60+fm) - (agora.getHours()*60+agora.getMinutes());
            extra = '<div class="crono-countdown">Falta ' + restante + ' min para terminar</div>';
        } else if (ehHoje && horaAtual >= atv.fim) { classe += ' crono-passado'; }
        html += '<div class="' + classe + '"><div class="crono-hora"><strong>' + atv.inicio + '</strong><small>' + atv.fim + '</small></div><div class="crono-info"><div class="crono-atividade">' + atv.atividade + (classe.includes('atual')?' <span class="crono-badge">AGORA</span>':'') + '</div>' + (atv.resp?'<div class="crono-resp">'+atv.resp+'</div>':'') + extra + '</div></div>';
    });
    el.innerHTML = html;
    if (ehHoje) { setTimeout(()=>{ const a=document.querySelector('.crono-atual'); if(a) a.scrollIntoView({behavior:'smooth',block:'center'}); },100); }
}


// === Medicamentos (listas) ===
const MEDICAMENTOS_PADRAO = ['Paracetamol','Dipirona','Ibuprofeno','Nimesulida','Diclofenaco','Amoxicilina','Azitromicina','Cefalexina','Metronidazol','Loratadina','Desloratadina','Allegra','Polaramine','Hixizine','Dexametasona','Prednisolona','Prednisona','Berotec','Aerolin','Salbutamol (bombinha)','Budesonida','Clenil','Omeprazol','Pantoprazol','Ranitidina','Domperidona','Plasil','Buscopan','Luftal','Lactulose','Floratil','Ritalina','Concerta','Venvanse','Rivotril','Diazepam','Clonazepam','Sertralina','Fluoxetina','Risperidona','Carbamazepina','Valproato','Fenobarbital','Topiramato','Insulina','Metformina','Losartana','Enalapril','Captopril','Atenolol','Propranolol','Furosemida','Levotiroxina','Puran T4','Vitamina D','Vitamina C','Complexo B','Sulfato ferroso','Acido folico','Melatonina','Dramin','Vonau','Tylenol','Novalgina','Dorflex','Neosaldina','Cataflam','Voltaren','Antialergico','Antibiotico','Anti-inflamatorio'];
function getMedicamentosPersonalizados() { return JSON.parse(localStorage.getItem('medicamentos_custom')||'[]'); }
function salvarMedicamentoCustom(n) { const c=getMedicamentosPersonalizados(); if(!c.includes(n)&&!MEDICAMENTOS_PADRAO.includes(n)){c.push(n);localStorage.setItem('medicamentos_custom',JSON.stringify(c));} }
function getTodosMedicamentos() { return [...MEDICAMENTOS_PADRAO,...getMedicamentosPersonalizados()]; }

const ALERGIAS_PADRAO = ['Dipirona','Penicilina','Ibuprofeno','AAS','Amendoim','Frutos do mar','Leite/Lactose','Ovo','Gluten','Picada de inseto'];
const RESTRICOES_PADRAO = ['Vegetariano','Vegano','Intolerante a lactose','Celiaco (sem gluten)','Diabetico (sem acucar)','Sem carne vermelha','Sem carne de porco'];
function getAlergiasPersonalizadas(){return JSON.parse(localStorage.getItem('alergias_custom')||'[]');}
function getRestricoesPersonalizadas(){return JSON.parse(localStorage.getItem('restricoes_custom')||'[]');}
function salvarAlergiaCustom(n){const c=getAlergiasPersonalizadas();if(!c.includes(n)&&!ALERGIAS_PADRAO.includes(n)){c.push(n);localStorage.setItem('alergias_custom',JSON.stringify(c));}}
function salvarRestricaoCustom(n){const c=getRestricoesPersonalizadas();if(!c.includes(n)&&!RESTRICOES_PADRAO.includes(n)){c.push(n);localStorage.setItem('restricoes_custom',JSON.stringify(c));}}
function renderCheckboxGroup(pad,cust,sel){const t=[...pad,...cust];const s=sel?sel.split(',').map(x=>x.trim()).filter(Boolean):[];let h='<div class="checkbox-group">';t.forEach(o=>{h+='<label class="checkbox-item"><input type="checkbox" value="'+o+'" '+(s.includes(o)?'checked':'')+'><span>'+o+'</span></label>';});return h+'</div>';}


// === CADASTRO ===
function renderCadastro(container, fichaEditando) {
    const f = fichaEditando || {};
    const meds = f.medicamentos || [];
    container.innerHTML = '<div class="form-container"><h2>' + (fichaEditando?'Editar':'Cadastrar') + ' Ficha</h2><form id="form-ficha"><div class="form-row"><div class="form-group"><label>Nome Completo *</label><input type="text" id="nome" value="' + (f.nome||'') + '" required></div><div class="form-group"><label>Idade</label><input type="number" id="idade" value="' + (f.idade||'') + '" min="1" max="99"></div></div><div class="form-row"><div class="form-group"><label>Telefone de Emergencia</label><input type="tel" id="telefone" value="' + (f.telefone||'') + '"></div><div class="form-group"><label>Responsavel</label><input type="text" id="responsavel" value="' + (f.responsavel||'') + '"></div></div><div class="form-group"><label>Alergias</label><div id="alergias-checks">' + renderCheckboxGroup(ALERGIAS_PADRAO,getAlergiasPersonalizadas(),f.alergias) + '</div><div class="outros-input"><input type="text" id="alergia-outra" placeholder="Outra alergia..."><button type="button" class="btn btn-secondary btn-add-outro" id="btn-add-alergia">+</button></div></div><div class="form-group"><label>Restricoes Alimentares</label><div id="restricoes-checks">' + renderCheckboxGroup(RESTRICOES_PADRAO,getRestricoesPersonalizadas(),f.restricoes) + '</div><div class="outros-input"><input type="text" id="restricao-outra" placeholder="Outra restricao..."><button type="button" class="btn btn-secondary btn-add-outro" id="btn-add-restricao">+</button></div></div><div class="form-group"><label>Observacoes Medicas</label><textarea id="observacoes" placeholder="Ex: Asma, diabetes...">' + (f.observacoes||'') + '</textarea></div><h3 style="color:#00d4ff;margin:1.5rem 0 1rem;">Medicamentos</h3><div id="medicamentos-container"></div><button type="button" class="btn btn-secondary" id="btn-add-med" style="margin-bottom:1.5rem;">+ Adicionar Medicamento</button><div style="text-align:center;"><button type="submit" class="btn btn-primary">' + (fichaEditando?'Salvar Alteracoes':'Cadastrar Ficha') + '</button></div></form></div>';
    const mc = document.getElementById('medicamentos-container');
    meds.forEach((med,i) => adicionarMedicamentoUI(mc,med,i));
    document.getElementById('btn-add-med').addEventListener('click', () => adicionarMedicamentoUI(mc,{},mc.children.length));
    document.getElementById('btn-add-alergia').addEventListener('click', () => { const i=document.getElementById('alergia-outra'); const n=i.value.trim(); if(n){salvarAlergiaCustom(n);const c=document.getElementById('alergias-checks').querySelector('.checkbox-group');const l=document.createElement('label');l.className='checkbox-item';l.innerHTML='<input type="checkbox" value="'+n+'" checked><span>'+n+'</span>';c.appendChild(l);i.value='';} });
    document.getElementById('btn-add-restricao').addEventListener('click', () => { const i=document.getElementById('restricao-outra'); const n=i.value.trim(); if(n){salvarRestricaoCustom(n);const c=document.getElementById('restricoes-checks').querySelector('.checkbox-group');const l=document.createElement('label');l.className='checkbox-item';l.innerHTML='<input type="checkbox" value="'+n+'" checked><span>'+n+'</span>';c.appendChild(l);i.value='';} });
    document.getElementById('form-ficha').addEventListener('submit', (e) => { e.preventDefault(); salvarFicha(fichaEditando?fichaEditando.id:null); });
}
function adicionarMedicamentoUI(container, med, index) {
    const div = document.createElement('div'); div.className = 'medicamento-item';
    div.innerHTML = '<button type="button" class="remover-med" onclick="this.parentElement.remove()">X</button><div class="form-row"><div class="form-group" style="position:relative;"><label>Medicamento</label><input type="text" class="med-nome" value="'+(med.nome||'')+'" placeholder="Digite para buscar..." autocomplete="off"><div class="autocomplete-list"></div></div><div class="form-group"><label>Dosagem</label><input type="text" class="med-dosagem" value="'+(med.dosagem||'')+'" placeholder="Ex: 500mg"></div></div><div class="form-group"><label>Horarios (separados por virgula)</label><input type="text" class="med-horarios" value="'+((med.horarios||[]).join(', '))+'" placeholder="Ex: 08:00, 14:00, 20:00"></div><div class="form-group"><label>Observacoes</label><input type="text" class="med-obs" value="'+(med.observacoes||'')+'" placeholder="Ex: Tomar com agua..."></div>';
    container.appendChild(div);
    const input = div.querySelector('.med-nome'), lista = div.querySelector('.autocomplete-list');
    input.addEventListener('focus', () => mostrarSugestoes(input,lista,''));
    input.addEventListener('input', () => mostrarSugestoes(input,lista,input.value));
    input.addEventListener('blur', () => { setTimeout(()=>{lista.innerHTML='';lista.style.display='none';},200); });
}
function mostrarSugestoes(input,lista,termo) {
    const todos = getTodosMedicamentos();
    const f = termo ? todos.filter(m=>m.toLowerCase().includes(termo.toLowerCase())) : todos.slice(0,15);
    if (!f.length) { lista.innerHTML=''; lista.style.display='none'; return; }
    lista.style.display='block';
    lista.innerHTML = f.slice(0,10).map(m=>'<div class="autocomplete-item" onmousedown="event.preventDefault()" onclick="this.parentElement.previousElementSibling.value=\''+m+'\';this.parentElement.style.display=\'none\';this.parentElement.innerHTML=\'\';">'+m+'</div>').join('');
}
function salvarFicha(editId) {
    const nome = document.getElementById('nome').value.trim();
    if (!nome) { alert('Nome e obrigatorio!'); return; }
    const alergias = Array.from(document.querySelectorAll('#alergias-checks input:checked')).map(c=>c.value).join(', ');
    const restricoes = Array.from(document.querySelectorAll('#restricoes-checks input:checked')).map(c=>c.value).join(', ');
    const medicamentos = [];
    document.querySelectorAll('.medicamento-item').forEach(item => {
        const mn=item.querySelector('.med-nome').value.trim(), d=item.querySelector('.med-dosagem').value.trim(), hs=item.querySelector('.med-horarios').value.trim(), ob=item.querySelector('.med-obs').value.trim();
        if(mn){const horarios=hs.split(',').map(h=>h.trim()).filter(h=>/^\d{2}:\d{2}$/.test(h));medicamentos.push({nome:mn,dosagem:d,horarios,observacoes:ob});salvarMedicamentoCustom(mn);}
    });
    const ficha = {id:editId||Date.now().toString(),nome,idade:document.getElementById('idade').value,telefone:document.getElementById('telefone').value.trim(),responsavel:document.getElementById('responsavel').value.trim(),alergias,restricoes,observacoes:document.getElementById('observacoes').value.trim(),medicamentos};
    if(editId){const i=fichas.findIndex(f=>f.id===editId);if(i!==-1)fichas[i]=ficha;}else{fichas.push(ficha);}
    salvarFichas(); alert(editId?'Ficha atualizada!':'Ficha cadastrada!');
    paginaAtual='fichas'; document.querySelectorAll('.nav-btn').forEach(b=>{b.classList.toggle('active',b.dataset.page==='fichas');}); renderizar();
}


// === FICHAS ===
function renderFichas(container) {
    const fichasOrd = [...fichas].sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'));
    container.innerHTML = '<div class="fichas-container"><h2>Fichas Cadastradas ('+fichas.length+')</h2><div class="filtros-container"><input type="text" class="busca-input" id="busca" placeholder="Buscar por nome ou alergia..."><div class="filtros-btns"><button class="btn btn-secondary filtro-btn active" data-filtro="todos">Todos</button><button class="btn btn-secondary filtro-btn" data-filtro="alergias">Com Alergias</button><button class="btn btn-secondary filtro-btn" data-filtro="restricoes">Com Restricoes</button><button class="btn btn-secondary filtro-btn" data-filtro="medicamentos">Com Medicamentos</button></div></div><div id="resumo-alergias"></div><div id="lista-fichas"></div></div>';
    renderResumoAlergias(); renderListaFichas(fichasOrd);
    let filtroAtual='todos';
    document.getElementById('busca').addEventListener('input',(e)=>aplicarFiltros(e.target.value,filtroAtual));
    document.querySelectorAll('.filtro-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.filtro-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');filtroAtual=btn.dataset.filtro;aplicarFiltros(document.getElementById('busca').value,filtroAtual);});});
}
function aplicarFiltros(termo,filtro){let f=[...fichas].sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'));if(termo){const t=termo.toLowerCase();f=f.filter(x=>x.nome.toLowerCase().includes(t)||(x.alergias&&x.alergias.toLowerCase().includes(t))||(x.restricoes&&x.restricoes.toLowerCase().includes(t)));}if(filtro==='alergias')f=f.filter(x=>x.alergias&&x.alergias.trim());else if(filtro==='restricoes')f=f.filter(x=>x.restricoes&&x.restricoes.trim());else if(filtro==='medicamentos')f=f.filter(x=>x.medicamentos&&x.medicamentos.length>0);renderListaFichas(f);}
function renderResumoAlergias(){const el=document.getElementById('resumo-alergias');const ac={},rc={};fichas.forEach(f=>{if(f.alergias)f.alergias.split(',').forEach(a=>{const n=a.trim();if(n)ac[n]=(ac[n]||0)+1;});if(f.restricoes)f.restricoes.split(',').forEach(r=>{const n=r.trim();if(n)rc[n]=(rc[n]||0)+1;});});if(!Object.keys(ac).length&&!Object.keys(rc).length){el.innerHTML='';return;}let h='<div class="resumo-card"><div style="text-align:right;margin-bottom:0.5rem;"><button class="btn btn-secondary" style="font-size:0.75rem;padding:0.3rem 0.6rem;" onclick="exportarAlergias()">Exportar Lista</button></div>';if(Object.keys(ac).length){h+='<div class="resumo-secao"><h4 style="color:#ff6b6b;">Alergias no grupo</h4><div class="resumo-tags">';Object.entries(ac).sort((a,b)=>b[1]-a[1]).forEach(([n,q])=>{h+='<span class="tag tag-alergia">'+n+' ('+q+')</span>';});h+='</div></div>';}if(Object.keys(rc).length){h+='<div class="resumo-secao"><h4 style="color:#f39c12;">Restricoes alimentares</h4><div class="resumo-tags">';Object.entries(rc).sort((a,b)=>b[1]-a[1]).forEach(([n,q])=>{h+='<span class="tag tag-restricao">'+n+' ('+q+')</span>';});h+='</div></div>';}el.innerHTML=h+'</div>';}
function renderListaFichas(lista){const el=document.getElementById('lista-fichas');if(!el)return;if(!lista.length){el.innerHTML='<p class="sem-fichas">Nenhuma ficha encontrada.</p>';return;}el.innerHTML=lista.map(f=>'<div class="ficha-card"><h3>'+f.nome+'</h3><div class="info-row">'+(f.idade?'<span>Idade: '+f.idade+'</span>':'')+(f.telefone?'<span><a href="tel:'+f.telefone+'" class="btn-ligar">Tel: '+f.telefone+'</a></span>':'')+(f.responsavel?'<span>Resp: '+f.responsavel+'</span>':'')+'</div>'+(f.alergias?'<p class="alergias"><strong>Alergias:</strong> '+f.alergias+'</p>':'')+(f.restricoes?'<p style="color:#f39c12;font-size:0.9rem;"><strong>Restricoes:</strong> '+f.restricoes+'</p>':'')+(f.observacoes?'<p style="color:#aaa;font-size:0.9rem;"><strong>Obs:</strong> '+f.observacoes+'</p>':'')+renderMedicamentosFicha(f.medicamentos)+'<div class="acoes">'+(f.telefone?'<a href="tel:'+f.telefone+'" class="btn btn-secondary" style="text-decoration:none;">Ligar</a>':'')+'<button class="btn btn-secondary" onclick="editarFicha(\''+f.id+'\')">Editar</button><button class="btn btn-danger" onclick="excluirFicha(\''+f.id+'\')">Excluir</button></div></div>').join('');}
function renderMedicamentosFicha(meds){if(!meds||!meds.length)return '';return '<div class="medicamentos-lista"><strong style="font-size:0.9rem;">Medicamentos:</strong>'+meds.map(m=>'<div class="med-item"><span>'+m.nome+(m.dosagem?' ('+m.dosagem+')':'')+'</span><span>'+(m.horarios?m.horarios.join(', '):'')+'</span></div>').join('')+'</div>';}
function editarFicha(id){const f=fichas.find(x=>x.id===id);if(!f)return;paginaAtual='cadastro';document.querySelectorAll('.nav-btn').forEach(b=>{b.classList.toggle('active',b.dataset.page==='cadastro');});renderCadastro(document.getElementById('app'),f);}
function excluirFicha(id){if(!confirm('Excluir esta ficha?'))return;fichas=fichas.filter(f=>f.id!==id);salvarFichas();renderFichas(document.getElementById('app'));}


// === HISTORICO ===
function renderHistorico(container){
    const hoje=new Date().toISOString().slice(0,10);
    let todosMeds=[];
    fichas.forEach(ficha=>{if(!ficha.medicamentos)return;ficha.medicamentos.forEach(med=>{if(!med.horarios)return;med.horarios.forEach(horario=>{todosMeds.push({nome:ficha.nome,medicamento:med.nome,dosagem:med.dosagem||'',horario,confirmado:foiConfirmado(ficha.id,med.nome,horario),fichaId:ficha.id});});});});
    todosMeds.sort((a,b)=>{const[h1,m1]=a.horario.split(':').map(Number);const[h2,m2]=b.horario.split(':').map(Number);return(h1*60+m1)-(h2*60+m2);});
    const porHorario={};todosMeds.forEach(m=>{if(!porHorario[m.horario])porHorario[m.horario]=[];porHorario[m.horario].push(m);});
    let html='<div class="fichas-container"><h2>Horario Geral de Medicamentos</h2><p style="text-align:center;color:#aaa;margin-bottom:1rem;">'+hoje.split('-').reverse().join('/')+' - '+todosMeds.length+' doses</p>';
    if(!todosMeds.length) html+='<p class="sem-fichas">Nenhum medicamento cadastrado.</p>';
    else Object.entries(porHorario).forEach(([horario,meds])=>{html+='<div class="ficha-card" style="padding:1rem;margin-bottom:0.8rem;"><h3 style="color:#00d4ff;margin-bottom:0.5rem;">'+horario+'</h3>';meds.forEach(m=>{html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:0.3rem 0;border-bottom:1px solid #0f3460;"><div><strong>'+m.nome+'</strong> <span style="color:#aaa;font-size:0.85rem;">- '+m.medicamento+' '+(m.dosagem?'('+m.dosagem+')':'')+'</span></div><span style="color:'+(m.confirmado?'#27ae60':'#e74c3c')+';font-size:0.8rem;font-weight:bold;">'+(m.confirmado?'Tomado':'Pendente')+'</span></div>';});html+='</div>';});
    html+='<div style="margin-top:2rem;text-align:center;"><button class="btn btn-primary" onclick="exportarPDF()">Exportar Fichas</button> <button class="btn btn-secondary" onclick="exportarAlergias()">Exportar Alergias</button></div></div>';
    container.innerHTML=html;
}

// === EXPORTAR ===
function exportarPDF(){const fo=[...fichas].sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'));const w=window.open('','_blank');w.document.write('<html><head><title>Fichas Adolecrist</title><style>body{font-family:Arial;padding:20px;font-size:12px}h1{text-align:center}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:11px}th{background:#f0f0f0}.alerta{color:#c00;font-weight:bold}@media print{.no-print{display:none}}</style></head><body><h1>Fichas do Encontro - Adolecrist</h1><p style="text-align:center">'+fo.length+' participantes | '+new Date().toLocaleString('pt-BR')+'</p><button class="no-print" onclick="window.print()">Imprimir</button>'+fo.map(f=>'<div style="border:1px solid #ccc;padding:10px;margin:10px 0;border-radius:8px;page-break-inside:avoid"><h3 style="margin:0;color:#1a4a8a">'+f.nome+'</h3><div style="color:#666;font-size:11px">'+(f.idade?'Idade:'+f.idade+' | ':'')+(f.telefone?'Tel:'+f.telefone+' | ':'')+(f.responsavel?'Resp:'+f.responsavel:'')+'</div>'+(f.alergias?'<div class="alerta">ALERGIAS: '+f.alergias+'</div>':'')+(f.restricoes?'<div style="color:#f80">Restricoes: '+f.restricoes+'</div>':'')+(f.medicamentos&&f.medicamentos.length?f.medicamentos.map(m=>'<div style="background:#f0f0f0;padding:4px 8px;margin:2px 0;border-radius:4px;font-size:11px">'+m.nome+' '+(m.dosagem||'')+' - '+(m.horarios?m.horarios.join(', '):'')+'</div>').join(''):'')+'</div>').join('')+'</body></html>');w.document.close();}
function exportarAlergias(){const fo=[...fichas].sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'));const ca=fo.filter(f=>f.alergias&&f.alergias.trim());const cr=fo.filter(f=>f.restricoes&&f.restricoes.trim());const cm=fo.filter(f=>f.medicamentos&&f.medicamentos.length);const w=window.open('','_blank');w.document.write('<html><head><title>Alergias e Restricoes</title><style>body{font-family:Arial;padding:20px;font-size:12px}h1{text-align:center}h2{color:#c00;border-bottom:2px solid #c00;padding-bottom:5px}h3{color:#f80;border-bottom:2px solid #f80;padding-bottom:5px}h4{color:#28a;border-bottom:2px solid #28a;padding-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:11px}th{background:#f0f0f0}.al{color:#c00;font-weight:bold}@media print{.no-print{display:none}}</style></head><body><h1>Alergias, Restricoes e Medicamentos</h1><p style="text-align:center">'+fichas.length+' participantes | '+new Date().toLocaleString('pt-BR')+'</p><button class="no-print" onclick="window.print()">Imprimir</button><h2>ALERGIAS ('+ca.length+')</h2>'+(ca.length?'<table><tr><th>Nome</th><th>Idade</th><th>Alergias</th><th>Tel</th></tr>'+ca.map(f=>'<tr><td>'+f.nome+'</td><td>'+(f.idade||'-')+'</td><td class="al">'+f.alergias+'</td><td>'+(f.telefone||'-')+'</td></tr>').join('')+'</table>':'<p>Nenhuma.</p>')+'<h3>RESTRICOES ('+cr.length+')</h3>'+(cr.length?'<table><tr><th>Nome</th><th>Idade</th><th>Restricoes</th></tr>'+cr.map(f=>'<tr><td>'+f.nome+'</td><td>'+(f.idade||'-')+'</td><td>'+f.restricoes+'</td></tr>').join('')+'</table>':'<p>Nenhuma.</p>')+'<h4>MEDICAMENTOS ('+cm.length+')</h4>'+(cm.length?'<table><tr><th>Nome</th><th>Medicamento</th><th>Dosagem</th><th>Horarios</th></tr>'+cm.map(f=>f.medicamentos.map((m,i)=>'<tr>'+(i===0?'<td rowspan="'+f.medicamentos.length+'">'+f.nome+'</td>':'')+'<td>'+m.nome+'</td><td>'+(m.dosagem||'-')+'</td><td>'+(m.horarios?m.horarios.join(', '):'-')+'</td></tr>').join('')).join('')+'</table>':'<p>Nenhum.</p>')+'</body></html>');w.document.close();}

// === Iniciar ===
verificarLogin();