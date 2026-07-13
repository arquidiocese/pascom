// ========== DADOS EM LOCALSTORAGE ==========
const STORAGE_KEY = 'arraia_financeiro_v2';
let diaAtual = 1;
let filtro = 1; // 1-4 ou 'todos'

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

function salvarDados(d) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

let dados = carregarDados();

// ========== NAVEGAÇÃO MENU ==========
document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('sec-' + btn.dataset.section).classList.add('active');
    });
});

// ========== SELETOR DE DIA ==========
document.querySelectorAll('.dia-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.dia-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dia = btn.dataset.dia;
        filtro = dia === 'todos' ? 'todos' : parseInt(dia);
        diaAtual = dia === 'todos' ? 1 : parseInt(dia);
        renderizarTudo();
    });
});

// ========== LANÇAR VENDA ==========
function lancarVenda(secao) {
    const ids = {
        barracas: { select: 'prodBarraca', qtd: 'qtdBarraca' },
        doces: { select: 'prodDoces', qtd: 'qtdDoces' },
        bebidas: { select: 'prodBebidas', qtd: 'qtdBebidas' },
        kids: { select: 'prodKids', qtd: 'qtdKids' }
    };

    const select = document.getElementById(ids[secao].select);
    const qtdInput = document.getElementById(ids[secao].qtd);
    const produto = select.value;
    const preco = parseFloat(select.selectedOptions[0].dataset.preco);
    const qtd = parseInt(qtdInput.value) || 1;

    if (!produto || isNaN(preco) || qtd < 1) return;

    // Usa o dia selecionado (se "todos" estiver selecionado, usa dia 1 como padrão)
    const dia = filtro === 'todos' ? 1 : filtro;

    dados[secao].vendas.push({
        id: Date.now(),
        dia: dia,
        produto,
        preco,
        qtd,
        total: preco * qtd
    });

    salvarDados(dados);
    qtdInput.value = 1;
    renderizarTudo();
}

// ========== LANÇAR GASTO ==========
function lancarGasto(secao) {
    const ids = {
        barracas: { desc: 'descGastoBarraca', valor: 'valorGastoBarraca', pagar: 'pagarBarraca' },
        doces: { desc: 'descGastoDoces', valor: 'valorGastoDoces', pagar: 'pagarDoces' },
        bebidas: { desc: 'descGastoBebidas', valor: 'valorGastoBebidas', pagar: 'pagarBebidas' },
        kids: { desc: 'descGastoKids', valor: 'valorGastoKids', pagar: 'pagarKids' }
    };

    const descInput = document.getElementById(ids[secao].desc);
    const valorInput = document.getElementById(ids[secao].valor);
    const pagarInput = document.getElementById(ids[secao].pagar);
    const desc = descInput.value.trim();
    const valor = parseFloat(valorInput.value);
    const pagarDepois = pagarInput.checked;

    if (!desc || isNaN(valor) || valor <= 0) return;

    const dia = filtro === 'todos' ? 1 : filtro;

    dados[secao].gastos.push({
        id: Date.now(),
        dia: dia,
        desc,
        valor,
        pago: !pagarDepois
    });

    salvarDados(dados);
    descInput.value = '';
    valorInput.value = '';
    pagarInput.checked = false;
    renderizarTudo();
}

// ========== INFRAESTRUTURA ==========
function lancarInfra() {
    const desc = document.getElementById('descInfra').value.trim();
    const valor = parseFloat(document.getElementById('valorInfra').value);
    const pagarDepois = document.getElementById('pagarInfra').checked;
    if (!desc || isNaN(valor) || valor <= 0) return;

    dados.infraestrutura.push({ id: Date.now(), desc, valor, pago: !pagarDepois });
    salvarDados(dados);
    document.getElementById('descInfra').value = '';
    document.getElementById('valorInfra').value = '';
    document.getElementById('pagarInfra').checked = false;
    renderizarTudo();
}

function removerInfra(id) {
    dados.infraestrutura = dados.infraestrutura.filter(i => i.id !== id);
    salvarDados(dados);
    renderizarTudo();
}

function togglePagoInfra(id) {
    const item = dados.infraestrutura.find(i => i.id === id);
    if (item) { item.pago = !item.pago; salvarDados(dados); renderizarTudo(); }
}

function renderizarInfra() {
    const tbody = document.querySelector('#tabelaInfra tbody');
    const total = dados.infraestrutura.reduce((s, i) => s + i.valor, 0);
    const totalPago = dados.infraestrutura.filter(i => i.pago).reduce((s, i) => s + i.valor, 0);
    const totalPendente = total - totalPago;

    tbody.innerHTML = dados.infraestrutura.map(i => `
        <tr>
            <td>${i.desc}</td>
            <td>R$ ${i.valor.toFixed(2)}</td>
            <td><span class="${i.pago ? 'badge-pago' : 'badge-pendente'}" 
                style="cursor:pointer" onclick="togglePagoInfra(${i.id})">${i.pago ? 'Pago' : 'Pendente'}</span></td>
            <td><button class="btn-delete" onclick="removerInfra(${i.id})">X</button></td>
        </tr>
    `).join('');

    document.getElementById('resumoInfra').innerHTML = `
        <div class="item negativo"><span>Total</span><strong>R$ ${total.toFixed(2)}</strong></div>
        <div class="item positivo"><span>Pago</span><strong>R$ ${totalPago.toFixed(2)}</strong></div>
        <div class="item negativo"><span>Pendente</span><strong>R$ ${totalPendente.toFixed(2)}</strong></div>
    `;
}

// ========== PATROCINADORES ==========
function lancarPatrocinio() {
    const nome = document.getElementById('nomePatrocinador').value.trim();
    const valor = parseFloat(document.getElementById('valorPatrocinio').value);
    const recebido = document.getElementById('recebidoPatrocinio').checked;
    if (!nome || isNaN(valor) || valor <= 0) return;

    dados.patrocinadores.push({ id: Date.now(), nome, valor, recebido });
    salvarDados(dados);
    document.getElementById('nomePatrocinador').value = '';
    document.getElementById('valorPatrocinio').value = '';
    document.getElementById('recebidoPatrocinio').checked = false;
    renderizarTudo();
}

function removerPatrocinio(id) {
    dados.patrocinadores = dados.patrocinadores.filter(p => p.id !== id);
    salvarDados(dados);
    renderizarTudo();
}

function toggleRecebido(id) {
    const item = dados.patrocinadores.find(p => p.id === id);
    if (item) { item.recebido = !item.recebido; salvarDados(dados); renderizarTudo(); }
}

function renderizarPatrocinadores() {
    const tbody = document.querySelector('#tabelaPatrocinadores tbody');
    const total = dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    const totalRecebido = dados.patrocinadores.filter(p => p.recebido).reduce((s, p) => s + p.valor, 0);
    const totalPendente = total - totalRecebido;

    tbody.innerHTML = dados.patrocinadores.map(p => `
        <tr>
            <td>${p.nome}</td>
            <td>R$ ${p.valor.toFixed(2)}</td>
            <td><span class="${p.recebido ? 'badge-pago' : 'badge-pendente'}" 
                style="cursor:pointer" onclick="toggleRecebido(${p.id})">${p.recebido ? 'Recebido' : 'Pendente'}</span></td>
            <td><button class="btn-delete" onclick="removerPatrocinio(${p.id})">X</button></td>
        </tr>
    `).join('');

    document.getElementById('resumoPatrocinadores').innerHTML = `
        <div class="item positivo"><span>Total</span><strong>R$ ${total.toFixed(2)}</strong></div>
        <div class="item positivo"><span>Recebido</span><strong>R$ ${totalRecebido.toFixed(2)}</strong></div>
        <div class="item negativo"><span>Pendente</span><strong>R$ ${totalPendente.toFixed(2)}</strong></div>
    `;
}

// ========== RENDERIZAR SEÇÃO ==========
function removerVenda(secao, id) {
    dados[secao].vendas = dados[secao].vendas.filter(v => v.id !== id);
    salvarDados(dados);
    renderizarTudo();
}

function removerGasto(secao, id) {
    dados[secao].gastos = dados[secao].gastos.filter(g => g.id !== id);
    salvarDados(dados);
    renderizarTudo();
}

function togglePagoGasto(secao, id) {
    const item = dados[secao].gastos.find(g => g.id === id);
    if (item) { item.pago = !item.pago; salvarDados(dados); renderizarTudo(); }
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

    // Filtrar por dia
    const vendasFiltradas = filtro === 'todos' 
        ? dados[secao].vendas 
        : dados[secao].vendas.filter(v => v.dia === filtro);

    const gastosFiltrados = filtro === 'todos'
        ? dados[secao].gastos
        : dados[secao].gastos.filter(g => g.dia === filtro);

    const totalVendas = vendasFiltradas.reduce((s, v) => s + v.total, 0);
    const totalGastos = gastosFiltrados.reduce((s, g) => s + g.valor, 0);
    const resultado = totalVendas - totalGastos;

    tbodyVendas.innerHTML = vendasFiltradas.map(v => `
        <tr>
            <td><span class="badge-dia">Dia ${v.dia}</span></td>
            <td>${v.produto}</td>
            <td>${v.qtd}</td>
            <td>R$ ${v.preco.toFixed(2)}</td>
            <td>R$ ${v.total.toFixed(2)}</td>
            <td><button class="btn-delete" onclick="removerVenda('${secao}', ${v.id})">X</button></td>
        </tr>
    `).join('');

    tbodyGastos.innerHTML = gastosFiltrados.map(g => `
        <tr>
            <td><span class="badge-dia">Dia ${g.dia}</span></td>
            <td>${g.desc}</td>
            <td>R$ ${g.valor.toFixed(2)}</td>
            <td><span class="${g.pago ? 'badge-pago' : 'badge-pendente'}" 
                style="cursor:pointer" onclick="togglePagoGasto('${secao}', ${g.id})">${g.pago ? 'Pago' : 'Pendente'}</span></td>
            <td><button class="btn-delete" onclick="removerGasto('${secao}', ${g.id})">X</button></td>
        </tr>
    `).join('');

    const classeRes = resultado >= 0 ? 'positivo' : 'negativo';
    const labelFiltro = filtro === 'todos' ? '(Todos os dias)' : `(Dia ${filtro})`;
    document.getElementById(`resumo${nomeTabela}`).innerHTML = `
        <div class="item positivo"><span>Vendas ${labelFiltro}</span><strong>R$ ${totalVendas.toFixed(2)}</strong></div>
        <div class="item negativo"><span>Gastos ${labelFiltro}</span><strong>R$ ${totalGastos.toFixed(2)}</strong></div>
        <div class="item ${classeRes}"><span>Resultado</span><strong>R$ ${resultado.toFixed(2)}</strong></div>
    `;
}

// ========== RESUMO GERAL ==========
function atualizarResumoGeral() {
    let totalReceita = 0;
    let totalGastos = 0;

    ['barracas', 'doces', 'bebidas', 'kids'].forEach(secao => {
        const vendas = filtro === 'todos' 
            ? dados[secao].vendas 
            : dados[secao].vendas.filter(v => v.dia === filtro);
        const gastos = filtro === 'todos'
            ? dados[secao].gastos
            : dados[secao].gastos.filter(g => g.dia === filtro);

        totalReceita += vendas.reduce((s, v) => s + v.total, 0);
        totalGastos += gastos.reduce((s, g) => s + g.valor, 0);
    });

    // Patrocinadores sempre entram como receita (não tem dia)
    totalReceita += dados.patrocinadores.reduce((s, p) => s + p.valor, 0);

    // Infraestrutura sempre entra como gasto (não tem dia)
    totalGastos += dados.infraestrutura.reduce((s, i) => s + i.valor, 0);

    const saldo = totalReceita - totalGastos;

    document.getElementById('receitaTotal').textContent = `R$ ${totalReceita.toFixed(2)}`;
    document.getElementById('gastoTotal').textContent = `R$ ${totalGastos.toFixed(2)}`;

    const saldoEl = document.getElementById('saldoFinal');
    saldoEl.textContent = `R$ ${saldo.toFixed(2)}`;
    saldoEl.style.color = saldo >= 0 ? '#66bb6a' : '#ef5350';
}

// ========== DASHBOARD ==========
function renderizarDashboard() {
    const container = document.getElementById('dashboardCards');
    const secoes = [
        { key: 'barracas', nome: '🌽 Barracas (Salgados)', icon: '🌽' },
        { key: 'doces', nome: '🍬 Doces e Sobremesas', icon: '🍬' },
        { key: 'bebidas', nome: '🍺 Bar (Bebidas)', icon: '🍺' },
        { key: 'kids', nome: '🎠 Espaço Kids / Bingos', icon: '🎠' }
    ];

    let html = '';
    secoes.forEach(s => {
        const vendasFiltradas = filtro === 'todos' 
            ? dados[s.key].vendas 
            : dados[s.key].vendas.filter(v => v.dia === filtro);
        const gastosFiltrados = filtro === 'todos'
            ? dados[s.key].gastos
            : dados[s.key].gastos.filter(g => g.dia === filtro);

        const vendas = vendasFiltradas.reduce((sum, v) => sum + v.total, 0);
        const gastos = gastosFiltrados.reduce((sum, g) => sum + g.valor, 0);
        const resultado = vendas - gastos;
        const classe = resultado >= 0 ? 'positivo' : 'negativo';

        // Vendas por dia
        let porDiaHtml = '';
        if (filtro === 'todos') {
            porDiaHtml = '<div class="por-dia">';
            for (let d = 1; d <= 4; d++) {
                const vDia = dados[s.key].vendas.filter(v => v.dia === d).reduce((sum, v) => sum + v.total, 0);
                if (vDia > 0) porDiaHtml += `<span>Dia ${d}: R$ ${vDia.toFixed(2)}</span>`;
            }
            porDiaHtml += '</div>';
        }

        html += `
            <div class="dash-card">
                <h4>${s.nome}</h4>
                <div class="valores">
                    <span class="v-receita">Vendas: R$ ${vendas.toFixed(2)}</span>
                    <span class="v-gasto">Gastos: R$ ${gastos.toFixed(2)}</span>
                </div>
                <div class="resultado ${classe}">R$ ${resultado.toFixed(2)}</div>
                ${porDiaHtml}
            </div>
        `;
    });

    // Card Infraestrutura
    const totalInfra = dados.infraestrutura.reduce((s, i) => s + i.valor, 0);
    const infraPendente = dados.infraestrutura.filter(i => !i.pago).reduce((s, i) => s + i.valor, 0);
    html += `
        <div class="dash-card">
            <h4>🏗️ Infraestrutura</h4>
            <div class="valores">
                <span class="v-gasto">Total: R$ ${totalInfra.toFixed(2)}</span>
                <span class="v-gasto">Pendente: R$ ${infraPendente.toFixed(2)}</span>
            </div>
            <div class="resultado negativo">- R$ ${totalInfra.toFixed(2)}</div>
        </div>
    `;

    // Card Patrocinadores
    const totalPatr = dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    const patrPendente = dados.patrocinadores.filter(p => !p.recebido).reduce((s, p) => s + p.valor, 0);
    html += `
        <div class="dash-card">
            <h4>🤝 Patrocinadores</h4>
            <div class="valores">
                <span class="v-receita">Total: R$ ${totalPatr.toFixed(2)}</span>
                <span class="v-gasto">Pendente: R$ ${patrPendente.toFixed(2)}</span>
            </div>
            <div class="resultado positivo">+ R$ ${totalPatr.toFixed(2)}</div>
        </div>
    `;

    container.innerHTML = html;
}

// ========== RENDERIZAR TUDO ==========
function renderizarTudo() {
    ['barracas', 'doces', 'bebidas', 'kids'].forEach(renderizarSecao);
    renderizarInfra();
    renderizarPatrocinadores();
    atualizarResumoGeral();
    renderizarDashboard();
}

// ========== INIT ==========
renderizarTudo();
