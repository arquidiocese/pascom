// ===== CONFIGURAÇÃO DAS BARRACAS =====
const BARRACAS = [
    'fazendinha', 'cachorro-quente', 'pernil', 'pastel',
    'batata-frita', 'doces', 'bar', 'chopp', 'kids', 'artesanato'
];

const NOMES_BARRACAS = {
    'fazendinha': '🌽 Fazendinha',
    'cachorro-quente': '🌭 Cachorro Quente',
    'pernil': '🥪 Lanche de Pernil',
    'pastel': '🥟 Pastel',
    'batata-frita': '🍟 Batata Frita',
    'doces': '🍬 Doces',
    'bar': '🍺 Bar',
    'chopp': '🍻 Chopp',
    'kids': '🎠 Espaço Kids',
    'artesanato': '🎨 Artesanato'
};

// ===== LOCALSTORAGE =====
const STORAGE_KEY = 'arraia_financeiro_v3';
let filtro = 'todos';

function carregarDados() {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) return JSON.parse(d);
    const dados = { infraestrutura: [], patrocinadores: [] };
    BARRACAS.forEach(b => { dados[b] = { vendas: [], gastos: [] }; });
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

// ===== SELETOR DE DIA =====
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

// ===== LANÇAR VENDA ARTESANATO (preço variável) =====
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
    descInput.value = '';
    precoInput.value = '';
    qtdInput.value = 1;
    renderizarTudo();
}

// ===== LANÇAR GASTO =====
function lancarGasto(barraca) {
    const descInput = document.getElementById('descGasto-' + barraca);
    const valorInput = document.getElementById('valorGasto-' + barraca);
    const obsInput = document.getElementById('obsGasto-' + barraca);
    const pagarInput = document.getElementById('pagar-' + barraca);
    const desc = descInput.value.trim();
    const valor = parseFloat(valorInput.value);
    const obs = obsInput ? obsInput.value.trim() : '';
    const pagarDepois = pagarInput.checked;
    if (!desc || isNaN(valor) || valor <= 0) return;

    const dia = filtro === 'todos' ? 1 : filtro;
    dados[barraca].gastos.push({
        id: Date.now(), dia, desc, valor, obs, pago: !pagarDepois
    });
    salvarDados(dados);
    descInput.value = '';
    valorInput.value = '';
    if (obsInput) obsInput.value = '';
    pagarInput.checked = false;
    renderizarTudo();
}

// ===== INFRAESTRUTURA =====
function lancarInfra() {
    const desc = document.getElementById('descInfra').value.trim();
    const valor = parseFloat(document.getElementById('valorInfra').value);
    const obs = document.getElementById('obsInfra').value.trim();
    const pagarDepois = document.getElementById('pagarInfra').checked;
    if (!desc || isNaN(valor) || valor <= 0) return;

    dados.infraestrutura.push({ id: Date.now(), desc, valor, obs, pago: !pagarDepois });
    salvarDados(dados);
    document.getElementById('descInfra').value = '';
    document.getElementById('valorInfra').value = '';
    document.getElementById('obsInfra').value = '';
    document.getElementById('pagarInfra').checked = false;
    renderizarTudo();
}

function removerInfra(id) {
    dados.infraestrutura = dados.infraestrutura.filter(i => i.id !== id);
    salvarDados(dados); renderizarTudo();
}

function togglePagoInfra(id) {
    const item = dados.infraestrutura.find(i => i.id === id);
    if (item) { item.pago = !item.pago; salvarDados(dados); renderizarTudo(); }
}

function renderizarInfra() {
    const tbody = document.querySelector('#tabelaInfra tbody');
    const total = dados.infraestrutura.reduce((s, i) => s + i.valor, 0);
    const pago = dados.infraestrutura.filter(i => i.pago).reduce((s, i) => s + i.valor, 0);
    const pendente = total - pago;

    tbody.innerHTML = dados.infraestrutura.map(i => `
        <tr>
            <td>${i.desc}</td>
            <td>R$ ${i.valor.toFixed(2)}</td>
            <td>${i.obs || '-'}</td>
            <td><span class="${i.pago ? 'badge-pago' : 'badge-pendente'}" onclick="togglePagoInfra(${i.id})">${i.pago ? 'Pago' : 'Pendente'}</span></td>
            <td><button class="btn-delete" onclick="removerInfra(${i.id})">X</button></td>
        </tr>
    `).join('');

    document.getElementById('resumoInfra').innerHTML = `
        <div class="item negativo"><span>Total</span><strong>R$ ${total.toFixed(2)}</strong></div>
        <div class="item positivo"><span>Pago</span><strong>R$ ${pago.toFixed(2)}</strong></div>
        <div class="item negativo"><span>Pendente</span><strong>R$ ${pendente.toFixed(2)}</strong></div>
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

// ===== RENDERIZAR SEÇÃO DE BARRACA =====
function removerVenda(barraca, id) {
    dados[barraca].vendas = dados[barraca].vendas.filter(v => v.id !== id);
    salvarDados(dados); renderizarTudo();
}

function removerGasto(barraca, id) {
    dados[barraca].gastos = dados[barraca].gastos.filter(g => g.id !== id);
    salvarDados(dados); renderizarTudo();
}

function togglePagoGasto(barraca, id) {
    const item = dados[barraca].gastos.find(g => g.id === id);
    if (item) { item.pago = !item.pago; salvarDados(dados); renderizarTudo(); }
}

function renderizarBarraca(barraca) {
    const tbVendas = document.querySelector('#tblVendas-' + barraca + ' tbody');
    const tbGastos = document.querySelector('#tblGastos-' + barraca + ' tbody');
    if (!tbVendas || !tbGastos) return;

    const vendas = filtro === 'todos' ? dados[barraca].vendas : dados[barraca].vendas.filter(v => v.dia === filtro);
    const gastos = filtro === 'todos' ? dados[barraca].gastos : dados[barraca].gastos.filter(g => g.dia === filtro);

    const totalVendas = vendas.reduce((s, v) => s + v.total, 0);
    const totalItens = vendas.reduce((s, v) => s + v.qtd, 0);
    const totalGastos = gastos.reduce((s, g) => s + g.valor, 0);
    const resultado = totalVendas - totalGastos;

    tbVendas.innerHTML = vendas.map(v => `
        <tr>
            <td><span class="badge-dia">Dia ${v.dia}</span></td>
            <td>${v.produto}</td>
            <td>${v.qtd}</td>
            <td>R$ ${v.preco.toFixed(2)}</td>
            <td>R$ ${v.total.toFixed(2)}</td>
            <td><button class="btn-delete" onclick="removerVenda('${barraca}', ${v.id})">X</button></td>
        </tr>
    `).join('');

    tbGastos.innerHTML = gastos.map(g => `
        <tr>
            <td><span class="badge-dia">Dia ${g.dia}</span></td>
            <td>${g.desc}</td>
            <td>R$ ${g.valor.toFixed(2)}</td>
            <td>${g.obs || '-'}</td>
            <td><span class="${g.pago ? 'badge-pago' : 'badge-pendente'}" onclick="togglePagoGasto('${barraca}', ${g.id})">${g.pago ? 'Pago' : 'Pendente'}</span></td>
            <td><button class="btn-delete" onclick="removerGasto('${barraca}', ${g.id})">X</button></td>
        </tr>
    `).join('');

    const lbl = filtro === 'todos' ? '' : ` (Dia ${filtro})`;
    const cls = resultado >= 0 ? 'positivo' : 'negativo';
    document.getElementById('resumo-' + barraca).innerHTML = `
        <div class="item positivo"><span>Vendas${lbl}</span><strong>R$ ${totalVendas.toFixed(2)}</strong></div>
        <div class="item"><span>Itens Vendidos</span><strong style="color:var(--cor-palha)">${totalItens}</strong></div>
        <div class="item negativo"><span>Gastos${lbl}</span><strong>R$ ${totalGastos.toFixed(2)}</strong></div>
        <div class="item ${cls}"><span>Resultado</span><strong>R$ ${resultado.toFixed(2)}</strong></div>
    `;
}

// ===== RESUMO GERAL =====
function atualizarResumoGeral() {
    let totalReceita = 0;
    let totalGastos = 0;

    BARRACAS.forEach(b => {
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        const gastos = filtro === 'todos' ? dados[b].gastos : dados[b].gastos.filter(g => g.dia === filtro);
        totalReceita += vendas.reduce((s, v) => s + v.total, 0);
        totalGastos += gastos.reduce((s, g) => s + g.valor, 0);
    });

    totalReceita += dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    totalGastos += dados.infraestrutura.reduce((s, i) => s + i.valor, 0);

    const saldo = totalReceita - totalGastos;
    document.getElementById('receitaTotal').textContent = `R$ ${totalReceita.toFixed(2)}`;
    document.getElementById('gastoTotal').textContent = `R$ ${totalGastos.toFixed(2)}`;
    const saldoEl = document.getElementById('saldoFinal');
    saldoEl.textContent = `R$ ${saldo.toFixed(2)}`;
    saldoEl.style.color = saldo >= 0 ? '#66bb6a' : '#ef5350';
}

// ===== DASHBOARD =====
function renderizarDashboard() {
    const container = document.getElementById('dashboardCards');
    let html = '';

    BARRACAS.forEach(b => {
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        const gastos = filtro === 'todos' ? dados[b].gastos : dados[b].gastos.filter(g => g.dia === filtro);
        const tVendas = vendas.reduce((s, v) => s + v.total, 0);
        const tGastos = gastos.reduce((s, g) => s + g.valor, 0);
        const tItens = vendas.reduce((s, v) => s + v.qtd, 0);
        const resultado = tVendas - tGastos;
        const cls = resultado >= 0 ? 'positivo' : 'negativo';

        html += `
            <div class="dash-card">
                <h4>${NOMES_BARRACAS[b]}</h4>
                <div class="valores">
                    <span class="v-receita">Vendas: R$ ${tVendas.toFixed(2)}</span>
                    <span class="v-gasto">Gastos: R$ ${tGastos.toFixed(2)}</span>
                </div>
                <div class="resultado ${cls}">R$ ${resultado.toFixed(2)}</div>
                <div class="itens-vendidos">${tItens} itens vendidos</div>
            </div>
        `;
    });

    // Infra
    const tInfra = dados.infraestrutura.reduce((s, i) => s + i.valor, 0);
    const infraPend = dados.infraestrutura.filter(i => !i.pago).reduce((s, i) => s + i.valor, 0);
    html += `
        <div class="dash-card">
            <h4>🏗️ Infraestrutura</h4>
            <div class="valores">
                <span class="v-gasto">Total: R$ ${tInfra.toFixed(2)}</span>
                <span class="v-gasto">Pendente: R$ ${infraPend.toFixed(2)}</span>
            </div>
            <div class="resultado negativo">- R$ ${tInfra.toFixed(2)}</div>
        </div>
    `;

    // Patrocinadores
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
    // Gráfico por barraca
    const labels = BARRACAS.map(b => NOMES_BARRACAS[b].replace(/^.{2}/, ''));
    const vendasData = BARRACAS.map(b => {
        const v = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(x => x.dia === filtro);
        return v.reduce((s, x) => s + x.total, 0);
    });
    const gastosData = BARRACAS.map(b => {
        const g = filtro === 'todos' ? dados[b].gastos : dados[b].gastos.filter(x => x.dia === filtro);
        return g.reduce((s, x) => s + x.valor, 0);
    });

    const ctxBarracas = document.getElementById('graficoBarracas');
    if (chartBarracas) chartBarracas.destroy();
    chartBarracas = new Chart(ctxBarracas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Vendas', data: vendasData, backgroundColor: 'rgba(102, 187, 106, 0.7)', borderColor: '#66bb6a', borderWidth: 1 },
                { label: 'Gastos', data: gastosData, backgroundColor: 'rgba(239, 83, 80, 0.7)', borderColor: '#ef5350', borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#f5deb3' } } },
            scales: {
                x: { ticks: { color: '#f5deb3', font: { size: 10 } }, grid: { color: 'rgba(245,222,179,0.1)' } },
                y: { ticks: { color: '#f5deb3' }, grid: { color: 'rgba(245,222,179,0.1)' } }
            }
        }
    });

    // Gráfico por dia
    const diasLabels = ['Dia 1 (Sex)', 'Dia 2 (Sáb)', 'Dia 3 (Dom)', 'Dia 4 (Seg)'];
    const vendasDia = [1, 2, 3, 4].map(d => {
        let total = 0;
        BARRACAS.forEach(b => { total += dados[b].vendas.filter(v => v.dia === d).reduce((s, v) => s + v.total, 0); });
        return total;
    });
    const gastosDia = [1, 2, 3, 4].map(d => {
        let total = 0;
        BARRACAS.forEach(b => { total += dados[b].gastos.filter(g => g.dia === d).reduce((s, g) => s + g.valor, 0); });
        return total;
    });

    const ctxDias = document.getElementById('graficoDias');
    if (chartDias) chartDias.destroy();
    chartDias = new Chart(ctxDias, {
        type: 'bar',
        data: {
            labels: diasLabels,
            datasets: [
                { label: 'Vendas', data: vendasDia, backgroundColor: 'rgba(102, 187, 106, 0.7)', borderColor: '#66bb6a', borderWidth: 1 },
                { label: 'Gastos', data: gastosDia, backgroundColor: 'rgba(239, 83, 80, 0.7)', borderColor: '#ef5350', borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#f5deb3' } } },
            scales: {
                x: { ticks: { color: '#f5deb3' }, grid: { color: 'rgba(245,222,179,0.1)' } },
                y: { ticks: { color: '#f5deb3' }, grid: { color: 'rgba(245,222,179,0.1)' } }
            }
        }
    });
}

// ===== RANKING DE PRODUTOS =====
function renderizarRanking() {
    const container = document.getElementById('rankingProdutos');
    const produtosMap = {};

    BARRACAS.forEach(b => {
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        vendas.forEach(v => {
            const key = v.produto;
            if (!produtosMap[key]) produtosMap[key] = { qtd: 0, valor: 0 };
            produtosMap[key].qtd += v.qtd;
            produtosMap[key].valor += v.total;
        });
    });

    const ranking = Object.entries(produtosMap)
        .map(([nome, d]) => ({ nome, qtd: d.qtd, valor: d.valor }))
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 15);

    if (ranking.length === 0) {
        container.innerHTML = '<p style="text-align:center;opacity:0.5;padding:20px;">Nenhuma venda registrada ainda</p>';
        return;
    }

    container.innerHTML = ranking.map((item, i) => {
        let posClass = '';
        if (i === 0) posClass = 'top1';
        else if (i === 1) posClass = 'top2';
        else if (i === 2) posClass = 'top3';
        return `
            <div class="ranking-item">
                <span class="ranking-pos ${posClass}">${i + 1}°</span>
                <span class="ranking-nome">${item.nome}</span>
                <span class="ranking-qtd">${item.qtd} un.</span>
                <span class="ranking-valor">R$ ${item.valor.toFixed(2)}</span>
            </div>
        `;
    }).join('');
}

// ===== EXPORTAR CSV =====
function exportarCSV() {
    let csv = 'Barraca;Dia;Tipo;Produto/Descricao;Qtd;Valor Unit;Total;Obs;Status\n';

    BARRACAS.forEach(b => {
        dados[b].vendas.forEach(v => {
            csv += `${NOMES_BARRACAS[b]};Dia ${v.dia};Venda;${v.produto};${v.qtd};${v.preco.toFixed(2)};${v.total.toFixed(2)};;\n`;
        });
        dados[b].gastos.forEach(g => {
            csv += `${NOMES_BARRACAS[b]};Dia ${g.dia};Gasto;${g.desc};;${g.valor.toFixed(2)};${g.valor.toFixed(2)};${g.obs || ''};${g.pago ? 'Pago' : 'Pendente'}\n`;
        });
    });

    dados.infraestrutura.forEach(i => {
        csv += `Infraestrutura;;Gasto;${i.desc};;${i.valor.toFixed(2)};${i.valor.toFixed(2)};${i.obs || ''};${i.pago ? 'Pago' : 'Pendente'}\n`;
    });

    dados.patrocinadores.forEach(p => {
        csv += `Patrocinador;;Receita;${p.nome};;${p.valor.toFixed(2)};${p.valor.toFixed(2)};${p.obs || ''};${p.recebido ? 'Recebido' : 'Pendente'}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'financeiro_arraia_basilica.csv';
    link.click();
}

// ===== BACKUP JSON =====
function exportarJSON() {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup_arraia_basilica.json';
    link.click();
}

function importarJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importado = JSON.parse(e.target.result);
            if (importado && typeof importado === 'object') {
                dados = importado;
                salvarDados(dados);
                renderizarTudo();
                alert('Backup restaurado com sucesso!');
            }
        } catch (err) {
            alert('Erro ao importar arquivo. Verifique se é um backup válido.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ===== RENDERIZAR TUDO =====
function renderizarTudo() {
    BARRACAS.forEach(renderizarBarraca);
    renderizarInfra();
    renderizarPatrocinadores();
    atualizarResumoGeral();
    renderizarDashboard();
    renderizarGraficos();
    renderizarRanking();
}

// ===== INIT =====
renderizarTudo();
