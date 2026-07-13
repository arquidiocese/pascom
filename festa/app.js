// ========== DADOS EM LOCALSTORAGE ==========
const STORAGE_KEY = 'arraia_financeiro';

function carregarDados() {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (dados) return JSON.parse(dados);
    return {
        barracas: { vendas: [], gastos: [] },
        doces: { vendas: [], gastos: [] },
        bebidas: { vendas: [], gastos: [] },
        kids: { vendas: [], gastos: [] },
        infraestrutura: [],
        patrocinadores: []
    };
}

function salvarDados(dados) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

let dados = carregarDados();

// ========== NAVEGAÇÃO ==========
document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('sec-' + btn.dataset.section).classList.add('active');
    });
});

// ========== LANÇAR VENDA ==========
function lancarVenda(secao) {
    const selectId = {
        barracas: 'prodBarraca',
        doces: 'prodDoces',
        bebidas: 'prodBebidas',
        kids: 'prodKids'
    }[secao];
    const qtdId = {
        barracas: 'qtdBarraca',
        doces: 'qtdDoces',
        bebidas: 'qtdBebidas',
        kids: 'qtdKids'
    }[secao];

    const select = document.getElementById(selectId);
    const qtdInput = document.getElementById(qtdId);
    const produto = select.value;
    const preco = parseFloat(select.selectedOptions[0].dataset.preco);
    const qtd = parseInt(qtdInput.value) || 1;

    if (!produto || isNaN(preco) || qtd < 1) return;

    dados[secao].vendas.push({
        id: Date.now(),
        produto,
        preco,
        qtd,
        total: preco * qtd
    });

    salvarDados(dados);
    qtdInput.value = 1;
    renderizarSecao(secao);
    atualizarResumoGeral();
    renderizarDashboard();
}

// ========== LANÇAR GASTO ==========
function lancarGasto(secao) {
    const descId = {
        barracas: 'descGastoBarraca',
        doces: 'descGastoDoces',
        bebidas: 'descGastoBebidas',
        kids: 'descGastoKids'
    }[secao];
    const valorId = {
        barracas: 'valorGastoBarraca',
        doces: 'valorGastoDoces',
        bebidas: 'valorGastoBebidas',
        kids: 'valorGastoKids'
    }[secao];

    const descInput = document.getElementById(descId);
    const valorInput = document.getElementById(valorId);
    const desc = descInput.value.trim();
    const valor = parseFloat(valorInput.value);

    if (!desc || isNaN(valor) || valor <= 0) return;

    dados[secao].gastos.push({ id: Date.now(), desc, valor });
    salvarDados(dados);
    descInput.value = '';
    valorInput.value = '';
    renderizarSecao(secao);
    atualizarResumoGeral();
    renderizarDashboard();
}

// ========== INFRAESTRUTURA ==========
function lancarInfra() {
    const desc = document.getElementById('descInfra').value.trim();
    const valor = parseFloat(document.getElementById('valorInfra').value);
    if (!desc || isNaN(valor) || valor <= 0) return;

    dados.infraestrutura.push({ id: Date.now(), desc, valor });
    salvarDados(dados);
    document.getElementById('descInfra').value = '';
    document.getElementById('valorInfra').value = '';
    renderizarInfra();
    atualizarResumoGeral();
    renderizarDashboard();
}

function removerInfra(id) {
    dados.infraestrutura = dados.infraestrutura.filter(i => i.id !== id);
    salvarDados(dados);
    renderizarInfra();
    atualizarResumoGeral();
    renderizarDashboard();
}

function renderizarInfra() {
    const tbody = document.querySelector('#tabelaInfra tbody');
    const total = dados.infraestrutura.reduce((s, i) => s + i.valor, 0);
    tbody.innerHTML = dados.infraestrutura.map(i => `
        <tr>
            <td>${i.desc}</td>
            <td>R$ ${i.valor.toFixed(2)}</td>
            <td><button class="btn-delete" onclick="removerInfra(${i.id})">X</button></td>
        </tr>
    `).join('');
    document.getElementById('resumoInfra').innerHTML = `
        <div class="item negativo"><span>Total Infraestrutura</span><strong>R$ ${total.toFixed(2)}</strong></div>
    `;
}

// ========== PATROCINADORES ==========
function lancarPatrocinio() {
    const nome = document.getElementById('nomePatrocinador').value.trim();
    const valor = parseFloat(document.getElementById('valorPatrocinio').value);
    if (!nome || isNaN(valor) || valor <= 0) return;

    dados.patrocinadores.push({ id: Date.now(), nome, valor });
    salvarDados(dados);
    document.getElementById('nomePatrocinador').value = '';
    document.getElementById('valorPatrocinio').value = '';
    renderizarPatrocinadores();
    atualizarResumoGeral();
    renderizarDashboard();
}

function removerPatrocinio(id) {
    dados.patrocinadores = dados.patrocinadores.filter(p => p.id !== id);
    salvarDados(dados);
    renderizarPatrocinadores();
    atualizarResumoGeral();
    renderizarDashboard();
}

function renderizarPatrocinadores() {
    const tbody = document.querySelector('#tabelaPatrocinadores tbody');
    const total = dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    tbody.innerHTML = dados.patrocinadores.map(p => `
        <tr>
            <td>${p.nome}</td>
            <td>R$ ${p.valor.toFixed(2)}</td>
            <td><button class="btn-delete" onclick="removerPatrocinio(${p.id})">X</button></td>
        </tr>
    `).join('');
    document.getElementById('resumoPatrocinadores').innerHTML = `
        <div class="item positivo"><span>Total Patrocínios</span><strong>R$ ${total.toFixed(2)}</strong></div>
    `;
}

// ========== RENDERIZAR SEÇÃO DE BARRACA ==========
function removerVenda(secao, id) {
    dados[secao].vendas = dados[secao].vendas.filter(v => v.id !== id);
    salvarDados(dados);
    renderizarSecao(secao);
    atualizarResumoGeral();
    renderizarDashboard();
}

function removerGasto(secao, id) {
    dados[secao].gastos = dados[secao].gastos.filter(g => g.id !== id);
    salvarDados(dados);
    renderizarSecao(secao);
    atualizarResumoGeral();
    renderizarDashboard();
}

function renderizarSecao(secao) {
    const nomeTabela = {
        barracas: 'Barracas',
        doces: 'Doces',
        bebidas: 'Bebidas',
        kids: 'Kids'
    }[secao];

    const tbodyVendas = document.querySelector(`#tabelaVendas${nomeTabela} tbody`);
    const tbodyGastos = document.querySelector(`#tabelaGastos${nomeTabela} tbody`);

    const totalVendas = dados[secao].vendas.reduce((s, v) => s + v.total, 0);
    const totalGastos = dados[secao].gastos.reduce((s, g) => s + g.valor, 0);
    const resultado = totalVendas - totalGastos;

    tbodyVendas.innerHTML = dados[secao].vendas.map(v => `
        <tr>
            <td>${v.produto}</td>
            <td>${v.qtd}</td>
            <td>R$ ${v.preco.toFixed(2)}</td>
            <td>R$ ${v.total.toFixed(2)}</td>
            <td><button class="btn-delete" onclick="removerVenda('${secao}', ${v.id})">X</button></td>
        </tr>
    `).join('');

    tbodyGastos.innerHTML = dados[secao].gastos.map(g => `
        <tr>
            <td>${g.desc}</td>
            <td>R$ ${g.valor.toFixed(2)}</td>
            <td><button class="btn-delete" onclick="removerGasto('${secao}', ${g.id})">X</button></td>
        </tr>
    `).join('');

    const resumoId = `resumo${nomeTabela}`;
    const classeRes = resultado >= 0 ? 'positivo' : 'negativo';
    document.getElementById(resumoId).innerHTML = `
        <div class="item positivo"><span>Vendas</span><strong>R$ ${totalVendas.toFixed(2)}</strong></div>
        <div class="item negativo"><span>Gastos</span><strong>R$ ${totalGastos.toFixed(2)}</strong></div>
        <div class="item ${classeRes}"><span>Resultado</span><strong>R$ ${resultado.toFixed(2)}</strong></div>
    `;
}

// ========== RESUMO GERAL ==========
function atualizarResumoGeral() {
    let totalReceita = 0;
    let totalGastos = 0;

    ['barracas', 'doces', 'bebidas', 'kids'].forEach(secao => {
        totalReceita += dados[secao].vendas.reduce((s, v) => s + v.total, 0);
        totalGastos += dados[secao].gastos.reduce((s, g) => s + g.valor, 0);
    });

    // Patrocinadores entram como receita
    totalReceita += dados.patrocinadores.reduce((s, p) => s + p.valor, 0);

    // Infraestrutura entra como gasto
    totalGastos += dados.infraestrutura.reduce((s, i) => s + i.valor, 0);

    const saldo = totalReceita - totalGastos;

    document.getElementById('receitaTotal').textContent = `R$ ${totalReceita.toFixed(2)}`;
    document.getElementById('gastoTotal').textContent = `R$ ${totalGastos.toFixed(2)}`;
    document.getElementById('saldoFinal').textContent = `R$ ${saldo.toFixed(2)}`;

    const saldoEl = document.getElementById('saldoFinal');
    saldoEl.style.color = saldo >= 0 ? '#4caf50' : '#f44336';
}

// ========== DASHBOARD ==========
function renderizarDashboard() {
    const container = document.getElementById('dashboardCards');
    const secoes = [
        { key: 'barracas', nome: 'Barracas (Salgados)' },
        { key: 'doces', nome: 'Doces e Sobremesas' },
        { key: 'bebidas', nome: 'Bar (Bebidas)' },
        { key: 'kids', nome: 'Espaço Kids / Bingos' }
    ];

    let html = '';
    secoes.forEach(s => {
        const vendas = dados[s.key].vendas.reduce((sum, v) => sum + v.total, 0);
        const gastos = dados[s.key].gastos.reduce((sum, g) => sum + g.valor, 0);
        const resultado = vendas - gastos;
        const classe = resultado >= 0 ? 'positivo' : 'negativo';
        html += `
            <div class="dash-card">
                <h4>${s.nome}</h4>
                <div class="valores">
                    <span class="v-receita">Vendas: R$ ${vendas.toFixed(2)}</span>
                    <span class="v-gasto">Gastos: R$ ${gastos.toFixed(2)}</span>
                </div>
                <div class="resultado ${classe}">R$ ${resultado.toFixed(2)}</div>
            </div>
        `;
    });

    // Card Infraestrutura
    const totalInfra = dados.infraestrutura.reduce((s, i) => s + i.valor, 0);
    html += `
        <div class="dash-card">
            <h4>Infraestrutura</h4>
            <div class="valores">
                <span class="v-gasto">Custos: R$ ${totalInfra.toFixed(2)}</span>
            </div>
            <div class="resultado negativo">- R$ ${totalInfra.toFixed(2)}</div>
        </div>
    `;

    // Card Patrocinadores
    const totalPatr = dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    html += `
        <div class="dash-card">
            <h4>Patrocinadores</h4>
            <div class="valores">
                <span class="v-receita">Entrada: R$ ${totalPatr.toFixed(2)}</span>
            </div>
            <div class="resultado positivo">+ R$ ${totalPatr.toFixed(2)}</div>
        </div>
    `;

    container.innerHTML = html;
}

// ========== INICIALIZAÇÃO ==========
function init() {
    ['barracas', 'doces', 'bebidas', 'kids'].forEach(renderizarSecao);
    renderizarInfra();
    renderizarPatrocinadores();
    atualizarResumoGeral();
    renderizarDashboard();
}

init();
