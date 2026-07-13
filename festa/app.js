// ===== CONFIGURAÇÃO =====
const BARRACAS = [
    'fazendinha', 'cachorro-quente', 'kafta', 'pernil', 'pastel',
    'batata-frita', 'doces', 'bar', 'chopp', 'kids', 'bingo', 'artesanato'
];

const NOMES_BARRACAS = {
    'fazendinha': '🌽 Fazendinha',
    'cachorro-quente': '🌭 Cachorro Quente',
    'kafta': '🥙 Kafta',
    'pernil': '🥪 Lanche de Pernil',
    'pastel': '🥟 Pastel',
    'batata-frita': '🍟 Batata Frita',
    'doces': '🍬 Doces',
    'bar': '🍺 Bar',
    'chopp': '🍻 Chopp',
    'kids': '🎠 Espaço Kids',
    'bingo': '🎯 Bingo/Leilão',
    'artesanato': '🎨 Artesanato'
};

const DIAS_FESTA = {
    1: '10/Jul (Qui)',
    2: '11/Jul (Sex)',
    3: '17/Jul (Qui)',
    4: '18/Jul (Sex)'
};

// ===== STORAGE =====
const STORAGE_KEY = 'arraia_financeiro_v4';
let filtro = 'todos';
let filtroDespesa = 'todos';

function carregarDados() {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) return JSON.parse(d);
    const dados = { despesas: [], patrocinadores: [] };
    BARRACAS.forEach(b => { dados[b] = { vendas: [] }; });
    return dados;
}

function salvarDados(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

let dados = carregarDados();

// ===== NAVEGAÇÃO =====
document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('sec-' + btn.dataset.section).classList.add('active');
    });
});

// ===== SELETOR DE DIA (só filtra vendas) =====
document.querySelectorAll('.dia-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.dia-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtro = btn.dataset.dia === 'todos' ? 'todos' : parseInt(btn.dataset.dia);
        renderizarTudo();
    });
});

// ===== LANÇAR VENDA (barracas com select) =====
function lancarVenda(barraca) {
    const select = document.getElementById('prod-' + barraca);
    const qtdInput = document.getElementById('qtd-' + barraca);
    const produto = select.value;
    const preco = parseFloat(select.selectedOptions[0].dataset.preco);
    const qtd = parseInt(qtdInput.value) || 1;
    if (!produto || isNaN(preco) || qtd < 1) return;

    const dia = filtro === 'todos' ? 1 : filtro;
    dados[barraca].vendas.push({
        id: Date.now(), dia, produto, preco, qtd, total: preco * qtd
    });
    salvarDados(dados);
    qtdInput.value = 1;
    renderizarTudo();
}

// ===== LANÇAR VENDA ARTESANATO (preço livre) =====
function lancarVendaArtesanato() {
    const descInput = document.getElementById('descVenda-artesanato');
    const precoInput = document.getElementById('precoVenda-artesanato');
    const qtdInput = document.getElementById('qtd-artesanato');
    const produto = descInput.value.trim();
    const preco = parseFloat(precoInput.value);
    const qtd = parseInt(qtdInput.value) || 1;
    if (!produto || isNaN(preco) || preco <= 0 || qtd < 1) return;

    const dia = filtro === 'todos' ? 1 : filtro;
    dados['artesanato'].vendas.push({
        id: Date.now(), dia, produto, preco, qtd, total: preco * qtd
    });
    salvarDados(dados);
    descInput.value = ''; precoInput.value = ''; qtdInput.value = 1;
    renderizarTudo();
}

// ===== LANÇAR VENDA LEILÃO (preço livre) =====
function lancarVendaLeilao() {
    const descInput = document.getElementById('descVenda-bingo');
    const precoInput = document.getElementById('precoVenda-bingo');
    const qtdInput = document.getElementById('qtdLeilao-bingo');
    const produto = descInput.value.trim();
    const preco = parseFloat(precoInput.value);
    const qtd = parseInt(qtdInput.value) || 1;
    if (!produto || isNaN(preco) || preco <= 0 || qtd < 1) return;

    const dia = filtro === 'todos' ? 1 : filtro;
    dados['bingo'].vendas.push({
        id: Date.now(), dia, produto, preco, qtd, total: preco * qtd
    });
    salvarDados(dados);
    descInput.value = ''; precoInput.value = ''; qtdInput.value = 1;
    renderizarTudo();
}

// ===== DESPESAS (independente de dia) =====
function lancarDespesa() {
    const categoria = document.getElementById('categoriaDespesa').value;
    const desc = document.getElementById('descDespesa').value.trim();
    const qtd = parseFloat(document.getElementById('qtdDespesa').value) || 1;
    const unidade = document.getElementById('unidadeDespesa').value;
    const valor = parseFloat(document.getElementById('valorDespesa').value);
    const local = document.getElementById('localDespesa').value.trim();
    const obs = document.getElementById('obsDespesa').value.trim();
    const destino = document.getElementById('destinoDespesa').value;
    const doacao = document.getElementById('doacaoDespesa').checked;
    const pagarDepois = document.getElementById('pagarDespesa').checked;

    if (!desc || isNaN(valor) || valor <= 0) return;

    dados.despesas.push({
        id: Date.now(), categoria, desc, qtd, unidade, valor, local, obs, destino, doacao, pago: !pagarDepois
    });
    salvarDados(dados);
    document.getElementById('descDespesa').value = '';
    document.getElementById('qtdDespesa').value = '1';
    document.getElementById('valorDespesa').value = '';
    document.getElementById('localDespesa').value = '';
    document.getElementById('obsDespesa').value = '';
    document.getElementById('doacaoDespesa').checked = false;
    document.getElementById('pagarDespesa').checked = false;
    renderizarTudo();
}

function removerDespesa(id) {
    dados.despesas = dados.despesas.filter(d => d.id !== id);
    salvarDados(dados); renderizarTudo();
}

function togglePagoDespesa(id) {
    const item = dados.despesas.find(d => d.id === id);
    if (item) { item.pago = !item.pago; salvarDados(dados); renderizarTudo(); }
}

const FILTRO_GRUPOS = {
    alimentos: ['Carnes','Pães e Massas','Verduras e Legumes','Temperos e Condimentos','Laticínios','Bebidas (compra)','Doces e Ingredientes','Óleos e Gorduras','Outros Alimentos'],
    infraestrutura: ['Barracas e Tendas','Mesas e Cadeiras','Iluminação','Energia / Gerador','Palco','Banheiros Químicos'],
    equipamentos: ['Som e Música','Refrigeração','Fogão / Chapa / Fritadeira','Chopeira','Outros Equipamentos'],
    operacional: ['Segurança','Descartáveis','Limpeza','Gás','Carvão / Lenha','Embalagens'],
    divulgacao: ['Decoração','Divulgação / Marketing','Impressos'],
    servicos: ['Transporte / Frete','Pessoal / Mão de obra','Taxas e Licenças','Seguros','Outros']
};

function filtrarDespesas(tipo) {
    filtroDespesa = tipo;
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.filtro-btn[data-filtro="${tipo}"]`);
    if (btn) btn.classList.add('active');
    renderizarDespesas();
}

function renderizarDespesas() {
    let lista = dados.despesas;
    if (filtroDespesa === 'doacao') {
        lista = lista.filter(d => d.doacao);
    } else if (filtroDespesa === 'pendente') {
        lista = lista.filter(d => !d.pago);
    } else if (filtroDespesa !== 'todos') {
        const grupo = FILTRO_GRUPOS[filtroDespesa];
        if (grupo) {
            lista = lista.filter(d => grupo.includes(d.categoria));
        }
    }

    const tbody = document.querySelector('#tabelaDespesas tbody');
    tbody.innerHTML = lista.map(d => {
        const nomeDestino = d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino] || d.destino);
        const qtdStr = d.qtd && d.unidade ? `${d.qtd} ${d.unidade}` : '-';
        const localStr = d.local || '-';
        return `
        <tr>
            <td><span class="badge-categoria">${d.categoria}</span></td>
            <td>${d.desc}${d.obs ? '<br><small style="opacity:0.6">' + d.obs + '</small>' : ''}</td>
            <td>${qtdStr}</td>
            <td>${nomeDestino}</td>
            <td>R$ ${d.valor.toFixed(2)}</td>
            <td>${localStr}</td>
            <td><span class="${d.doacao ? 'badge-doacao' : 'badge-compra'}">${d.doacao ? '🎁 Doação' : 'Compra'}</span></td>
            <td><span class="${d.pago ? 'badge-pago' : 'badge-pendente'}" onclick="togglePagoDespesa(${d.id})">${d.pago ? 'Pago' : 'Pendente'}</span></td>
            <td><button class="btn-delete" onclick="removerDespesa(${d.id})">X</button></td>
        </tr>`;
    }).join('');

    // Resumo despesas
    const total = dados.despesas.reduce((s, d) => s + d.valor, 0);
    const totalDoacoes = dados.despesas.filter(d => d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalCompras = total - totalDoacoes;
    const totalPago = dados.despesas.filter(d => d.pago && !d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalPendente = dados.despesas.filter(d => !d.pago && !d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalItens = dados.despesas.length;

    document.getElementById('resumoDespesas').innerHTML = `
        <div class="item negativo"><span>Total Despesas</span><strong>R$ ${total.toFixed(2)}</strong></div>
        <div class="item doacao"><span>🎁 Doações</span><strong>R$ ${totalDoacoes.toFixed(2)}</strong></div>
        <div class="item negativo"><span>Compras</span><strong>R$ ${totalCompras.toFixed(2)}</strong></div>
        <div class="item positivo"><span>Pago</span><strong>R$ ${totalPago.toFixed(2)}</strong></div>
        <div class="item negativo"><span>Pendente</span><strong>R$ ${totalPendente.toFixed(2)}</strong></div>
        <div class="item neutro"><span>Itens Lanç.</span><strong>${totalItens}</strong></div>
    `;
}

// ===== PATROCINADORES =====
function lancarPatrocinio() {
    const nome = document.getElementById('nomePatrocinador').value.trim();
    const valor = parseFloat(document.getElementById('valorPatrocinio').value);
    const obs = document.getElementById('obsPatrocinio').value.trim();
    const recebido = document.getElementById('recebidoPatrocinio').checked;
    if (!nome || isNaN(valor) || valor <= 0) return;

    dados.patrocinadores.push({ id: Date.now(), nome, valor, obs, recebido });
    salvarDados(dados);
    document.getElementById('nomePatrocinador').value = '';
    document.getElementById('valorPatrocinio').value = '';
    document.getElementById('obsPatrocinio').value = '';
    document.getElementById('recebidoPatrocinio').checked = false;
    renderizarTudo();
}

function removerPatrocinio(id) {
    dados.patrocinadores = dados.patrocinadores.filter(p => p.id !== id);
    salvarDados(dados); renderizarTudo();
}

function toggleRecebido(id) {
    const item = dados.patrocinadores.find(p => p.id === id);
    if (item) { item.recebido = !item.recebido; salvarDados(dados); renderizarTudo(); }
}

function renderizarPatrocinadores() {
    const tbody = document.querySelector('#tabelaPatrocinadores tbody');
    const total = dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    const recebido = dados.patrocinadores.filter(p => p.recebido).reduce((s, p) => s + p.valor, 0);
    const pendente = total - recebido;

    tbody.innerHTML = dados.patrocinadores.map(p => `
        <tr>
            <td>${p.nome}</td>
            <td>R$ ${p.valor.toFixed(2)}</td>
            <td>${p.obs || '-'}</td>
            <td><span class="${p.recebido ? 'badge-pago' : 'badge-pendente'}" onclick="toggleRecebido(${p.id})">${p.recebido ? 'Recebido' : 'Pendente'}</span></td>
            <td><button class="btn-delete" onclick="removerPatrocinio(${p.id})">X</button></td>
        </tr>
    `).join('');

    document.getElementById('resumoPatrocinadores').innerHTML = `
        <div class="item positivo"><span>Total</span><strong>R$ ${total.toFixed(2)}</strong></div>
        <div class="item positivo"><span>Recebido</span><strong>R$ ${recebido.toFixed(2)}</strong></div>
        <div class="item negativo"><span>Pendente</span><strong>R$ ${pendente.toFixed(2)}</strong></div>
    `;
}

// ===== RENDERIZAR BARRACA (só vendas) =====
function removerVenda(barraca, id) {
    dados[barraca].vendas = dados[barraca].vendas.filter(v => v.id !== id);
    salvarDados(dados); renderizarTudo();
}

function renderizarBarraca(barraca) {
    const tb = document.querySelector('#tblVendas-' + barraca + ' tbody');
    if (!tb) return;

    const vendas = filtro === 'todos' ? dados[barraca].vendas : dados[barraca].vendas.filter(v => v.dia === filtro);
    const totalVendas = vendas.reduce((s, v) => s + v.total, 0);
    const totalItens = vendas.reduce((s, v) => s + v.qtd, 0);

    // Despesas vinculadas a esta barraca
    const despesasBarraca = dados.despesas.filter(d => d.destino === barraca);
    const totalDespesas = despesasBarraca.filter(d => !d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalDoacoes = despesasBarraca.filter(d => d.doacao).reduce((s, d) => s + d.valor, 0);
    const resultado = totalVendas - totalDespesas;

    tb.innerHTML = vendas.map(v => `
        <tr>
            <td><span class="badge-dia">${DIAS_FESTA[v.dia]}</span></td>
            <td>${v.produto}</td>
            <td>${v.qtd}</td>
            <td>R$ ${v.preco.toFixed(2)}</td>
            <td>R$ ${v.total.toFixed(2)}</td>
            <td><button class="btn-delete" onclick="removerVenda('${barraca}', ${v.id})">X</button></td>
        </tr>
    `).join('');

    const cls = resultado >= 0 ? 'positivo' : 'negativo';
    const lbl = filtro === 'todos' ? '' : ` (${DIAS_FESTA[filtro]})`;
    document.getElementById('resumo-' + barraca).innerHTML = `
        <div class="item positivo"><span>Vendas${lbl}</span><strong>R$ ${totalVendas.toFixed(2)}</strong></div>
        <div class="item neutro"><span>Itens Vendidos</span><strong>${totalItens}</strong></div>
        <div class="item negativo"><span>Despesas</span><strong>R$ ${totalDespesas.toFixed(2)}</strong></div>
        <div class="item doacao"><span>🎁 Doações</span><strong>R$ ${totalDoacoes.toFixed(2)}</strong></div>
        <div class="item ${cls}"><span>Resultado</span><strong>R$ ${resultado.toFixed(2)}</strong></div>
    `;
}

// ===== RESUMO GERAL =====
function atualizarResumoGeral() {
    let totalVendas = 0;
    let totalItens = 0;
    BARRACAS.forEach(b => {
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        totalVendas += vendas.reduce((s, v) => s + v.total, 0);
        totalItens += vendas.reduce((s, v) => s + v.qtd, 0);
    });

    const totalPatrocinadores = dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    const totalDespesasCompra = dados.despesas.filter(d => !d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalDoacoes = dados.despesas.filter(d => d.doacao).reduce((s, d) => s + d.valor, 0);

    const receita = totalVendas + totalPatrocinadores;
    const saldo = receita - totalDespesasCompra;

    document.getElementById('receitaTotal').textContent = `R$ ${receita.toFixed(2)}`;
    document.getElementById('receitaDetalhe').textContent = `Vendas: R$ ${totalVendas.toFixed(2)} | Patrocínios: R$ ${totalPatrocinadores.toFixed(2)}`;
    document.getElementById('gastoTotal').textContent = `R$ ${totalDespesasCompra.toFixed(2)}`;
    document.getElementById('gastoDetalhe').textContent = `Doações recebidas: R$ ${totalDoacoes.toFixed(2)} (não conta como gasto)`;

    const saldoEl = document.getElementById('saldoFinal');
    saldoEl.textContent = `R$ ${saldo.toFixed(2)}`;
    saldoEl.style.color = saldo >= 0 ? '#66bb6a' : '#ef5350';
    document.getElementById('saldoDetalhe').textContent = `${totalItens} itens vendidos no total`;
}

// ===== DASHBOARD =====
function renderizarDashboard() {
    const container = document.getElementById('dashboardCards');
    let html = '';

    BARRACAS.forEach(b => {
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        const tVendas = vendas.reduce((s, v) => s + v.total, 0);
        const tItens = vendas.reduce((s, v) => s + v.qtd, 0);
        const despB = dados.despesas.filter(d => d.destino === b && !d.doacao);
        const tDesp = despB.reduce((s, d) => s + d.valor, 0);
        const resultado = tVendas - tDesp;
        const cls = resultado >= 0 ? 'positivo' : 'negativo';

        html += `
            <div class="dash-card">
                <h4>${NOMES_BARRACAS[b]}</h4>
                <div class="valores">
                    <span class="v-receita">Vendas: R$ ${tVendas.toFixed(2)}</span>
                    <span class="v-gasto">Desp: R$ ${tDesp.toFixed(2)}</span>
                </div>
                <div class="resultado ${cls}">R$ ${resultado.toFixed(2)}</div>
                <div class="itens-info">${tItens} itens vendidos</div>
            </div>
        `;
    });

    // Card despesas gerais (sem barraca vinculada)
    const despGeral = dados.despesas.filter(d => d.destino === 'geral' && !d.doacao);
    const tDespGeral = despGeral.reduce((s, d) => s + d.valor, 0);
    const tDoacoes = dados.despesas.filter(d => d.doacao).reduce((s, d) => s + d.valor, 0);
    html += `
        <div class="dash-card">
            <h4>💰 Despesas Gerais</h4>
            <div class="valores">
                <span class="v-gasto">Compras gerais: R$ ${tDespGeral.toFixed(2)}</span>
                <span class="v-receita">Doações: R$ ${tDoacoes.toFixed(2)}</span>
            </div>
            <div class="resultado negativo">- R$ ${tDespGeral.toFixed(2)}</div>
        </div>
    `;

    // Card patrocinadores
    const tPatr = dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    const patrPend = dados.patrocinadores.filter(p => !p.recebido).reduce((s, p) => s + p.valor, 0);
    html += `
        <div class="dash-card">
            <h4>🤝 Patrocinadores</h4>
            <div class="valores">
                <span class="v-receita">Total: R$ ${tPatr.toFixed(2)}</span>
                <span class="v-gasto">Pendente: R$ ${patrPend.toFixed(2)}</span>
            </div>
            <div class="resultado positivo">+ R$ ${tPatr.toFixed(2)}</div>
        </div>
    `;

    container.innerHTML = html;
}

// ===== GRÁFICOS =====
let chartBarracas = null;
let chartDias = null;

function renderizarGraficos() {
    const labels = BARRACAS.map(b => NOMES_BARRACAS[b].replace(/^.{2}/, ''));
    const vendasData = BARRACAS.map(b => {
        const v = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(x => x.dia === filtro);
        return v.reduce((s, x) => s + x.total, 0);
    });
    const despData = BARRACAS.map(b => {
        return dados.despesas.filter(d => d.destino === b && !d.doacao).reduce((s, d) => s + d.valor, 0);
    });

    const ctxB = document.getElementById('graficoBarracas');
    if (chartBarracas) chartBarracas.destroy();
    chartBarracas = new Chart(ctxB, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Vendas', data: vendasData, backgroundColor: 'rgba(102,187,106,0.7)', borderColor: '#66bb6a', borderWidth: 1 },
                { label: 'Despesas', data: despData, backgroundColor: 'rgba(239,83,80,0.7)', borderColor: '#ef5350', borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#f5deb3' } } },
            scales: {
                x: { ticks: { color: '#f5deb3', font: { size: 9 } }, grid: { color: 'rgba(245,222,179,0.08)' } },
                y: { ticks: { color: '#f5deb3' }, grid: { color: 'rgba(245,222,179,0.08)' } }
            }
        }
    });

    // Por dia
    const diasLabels = Object.values(DIAS_FESTA);
    const vendasDia = [1,2,3,4].map(d => {
        let t = 0;
        BARRACAS.forEach(b => { t += dados[b].vendas.filter(v => v.dia === d).reduce((s, v) => s + v.total, 0); });
        return t;
    });

    const ctxD = document.getElementById('graficoDias');
    if (chartDias) chartDias.destroy();
    chartDias = new Chart(ctxD, {
        type: 'bar',
        data: {
            labels: diasLabels,
            datasets: [
                { label: 'Vendas', data: vendasDia, backgroundColor: ['rgba(229,57,53,0.7)','rgba(255,179,0,0.7)','rgba(67,160,71,0.7)','rgba(30,136,229,0.7)'], borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#f5deb3' } } },
            scales: {
                x: { ticks: { color: '#f5deb3' }, grid: { color: 'rgba(245,222,179,0.08)' } },
                y: { ticks: { color: '#f5deb3' }, grid: { color: 'rgba(245,222,179,0.08)' } }
            }
        }
    });
}

// ===== RANKING =====
function renderizarRanking() {
    const container = document.getElementById('rankingProdutos');
    const prodMap = {};

    BARRACAS.forEach(b => {
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        vendas.forEach(v => {
            const key = v.produto + '|' + b;
            if (!prodMap[key]) prodMap[key] = { nome: v.produto, barraca: b, qtd: 0, valor: 0 };
            prodMap[key].qtd += v.qtd;
            prodMap[key].valor += v.total;
        });
    });

    const ranking = Object.values(prodMap).sort((a, b) => b.qtd - a.qtd).slice(0, 15);

    if (ranking.length === 0) {
        container.innerHTML = '<p style="text-align:center;opacity:0.5;padding:20px;">Nenhuma venda registrada ainda</p>';
        return;
    }

    container.innerHTML = ranking.map((item, i) => {
        let posClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
        return `
            <div class="ranking-item">
                <span class="ranking-pos ${posClass}">${i + 1}°</span>
                <span class="ranking-nome">${item.nome}<br><span class="ranking-barraca">${NOMES_BARRACAS[item.barraca]}</span></span>
                <span class="ranking-qtd">${item.qtd} un.</span>
                <span class="ranking-valor">R$ ${item.valor.toFixed(2)}</span>
            </div>
        `;
    }).join('');
}

// ===== EXPORTAR CSV =====
function exportarCSV() {
    let csv = 'Tipo;Barraca;Dia;Categoria;Descricao;Qtd;Valor Unit;Total;Obs;Doacao;Status\n';

    BARRACAS.forEach(b => {
        dados[b].vendas.forEach(v => {
            csv += `Venda;${NOMES_BARRACAS[b]};${DIAS_FESTA[v.dia]};;${v.produto};${v.qtd};${v.preco.toFixed(2)};${v.total.toFixed(2)};;;\n`;
        });
    });

    dados.despesas.forEach(d => {
        const dest = d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino] || d.destino);
        csv += `Despesa;${dest};;${d.categoria};${d.desc};;${d.valor.toFixed(2)};${d.valor.toFixed(2)};${d.obs || ''};${d.doacao ? 'Sim' : 'Não'};${d.pago ? 'Pago' : 'Pendente'}\n`;
    });

    dados.patrocinadores.forEach(p => {
        csv += `Patrocinio;;;Patrocinio;${p.nome};;${p.valor.toFixed(2)};${p.valor.toFixed(2)};${p.obs || ''};;${p.recebido ? 'Recebido' : 'Pendente'}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'financeiro_arraia_basilica_2025.csv';
    link.click();
}

// ===== BACKUP =====
function exportarJSON() {
    const exportData = {
        versao: '4.0',
        evento: 'Arraiá da Basílica 2025',
        datas: ['10/07/2025', '11/07/2025', '17/07/2025', '18/07/2025'],
        exportadoEm: new Date().toISOString(),
        dados: dados
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup_arraia_basilica_2025.json';
    link.click();
}

function importarJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importado = JSON.parse(e.target.result);
            // Suporta formato direto ou com envelope
            const novoDados = importado.dados || importado;
            if (novoDados && typeof novoDados === 'object') {
                dados = novoDados;
                salvarDados(dados);
                renderizarTudo();
                alert('Backup restaurado com sucesso!');
            }
        } catch (err) {
            alert('Erro ao importar. Verifique se o arquivo é um backup válido.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ===== RENDERIZAR TUDO =====
function renderizarTudo() {
    BARRACAS.forEach(renderizarBarraca);
    renderizarDespesas();
    renderizarPatrocinadores();
    atualizarResumoGeral();
    renderizarDashboard();
    renderizarGraficos();
    renderizarRanking();
}

// ===== INIT =====
renderizarTudo();
