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

// ===== FORMATAÇÃO BRASILEIRA =====
function fmt(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function R$(valor) {
    return 'R$ ' + fmt(valor);
}

// Produtos por barraca (para caixa rápido)
const PRODUTOS_BARRACA = {
    'fazendinha': [{nome:'Milho Cozido',preco:10},{nome:'Pipoca',preco:5},{nome:'Pamonha',preco:20},{nome:'Curau',preco:15},{nome:'Quentão',preco:12},{nome:'Vinho Quente',preco:17},{nome:'Chocolate Quente',preco:15}],
    'cachorro-quente': [{nome:'Cachorro Quente',preco:17}],
    'kafta': [{nome:'Kafta',preco:17}],
    'pernil': [{nome:'Lanche de Pernil',preco:20}],
    'pastel': [{nome:'Pastel',preco:15}],
    'batata-frita': [{nome:'Batata Frita',preco:15}],
    'doces': [{nome:'Doce 250g',preco:25},{nome:'Doce 500g',preco:35},{nome:'Doces Variados',preco:15},{nome:'Geleia',preco:30},{nome:'Morango no Espeto',preco:25},{nome:'Pudim de Pote',preco:20}],
    'bar': [{nome:'Cerveja',preco:10},{nome:'Refrigerante',preco:8},{nome:'Suco',preco:7},{nome:'Água',preco:5}],
    'chopp': [{nome:'Chopp Ashby Pilsen',preco:10},{nome:'Chopp de Vinho',preco:14},{nome:'Chopp Heineken',preco:14},{nome:'Chopp IPA Session',preco:14}],
    'kids': [{nome:'Espaço Kids',preco:20}],
    'bingo': [{nome:'Bingo Simples',preco:10},{nome:'Bingo Especial',preco:20}],
    'artesanato': []
};

// ===== STORAGE (Firebase + localStorage como fallback) =====
const STORAGE_KEY = 'arraia_financeiro_v4';
let filtro = 'todos';
let filtroDespesa = 'todos';

function dadosVazios() {
    const d = { despesas: [], patrocinadores: [], meta: 0, configBarracas: null, configProdutos: null };
    BARRACAS.forEach(b => { d[b] = { vendas: [] }; });
    return d;
}

// Converte objetos do Firebase de volta para arrays
function normalizarDados(d) {
    if (d.patrocinadores && !Array.isArray(d.patrocinadores)) {
        d.patrocinadores = Object.values(d.patrocinadores);
    }
    if (!d.patrocinadores) d.patrocinadores = [];

    if (d.despesas && !Array.isArray(d.despesas)) {
        d.despesas = Object.values(d.despesas);
    }
    if (!d.despesas) d.despesas = [];

    BARRACAS.forEach(b => {
        if (!d[b]) d[b] = { vendas: [] };
        if (d[b].vendas && !Array.isArray(d[b].vendas)) {
            d[b].vendas = Object.values(d[b].vendas);
        }
        if (!d[b].vendas) d[b].vendas = [];
    });

    if (!d.meta) d.meta = 0;

    // Normalizar config
    if (d.configBarracas && !Array.isArray(d.configBarracas)) {
        d.configBarracas = Object.values(d.configBarracas);
    }
    if (d.configProdutos) {
        Object.keys(d.configProdutos).forEach(key => {
            if (d.configProdutos[key] && !Array.isArray(d.configProdutos[key])) {
                d.configProdutos[key] = Object.values(d.configProdutos[key]);
            }
        });
    }

    return d;
}

function carregarDados() {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) {
        const parsed = JSON.parse(d);
        return normalizarDados(parsed);
    }
    return dadosVazios();
}

function salvarDados(d) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    // Salva no Firebase também
    if (typeof salvarFirebase === 'function') {
        salvarFirebase(d);
    }
}

let dados = carregarDados();

// Ao iniciar, carrega do Firebase (dados mais recentes)
if (typeof carregarFirebase === 'function') {
    carregarFirebase().then(dadosFirebase => {
        if (dadosFirebase) {
            dados = normalizarDados(dadosFirebase);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
            renderizarTudo();
        } else {
            salvarFirebase(dados);
        }
    }).catch(err => console.log('Firebase offline, usando localStorage'));
}

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
    const patrocinadorId = doacao ? (document.getElementById('patrocinadorDespesa').value || '') : '';

    if (!desc || isNaN(valor) || valor <= 0) return;

    dados.despesas.push({
        id: Date.now(), categoria, desc, qtd, unidade, valor, local, obs, destino, doacao, pago: !pagarDepois, patrocinadorId
    });
    salvarDados(dados);
    document.getElementById('descDespesa').value = '';
    document.getElementById('qtdDespesa').value = '1';
    document.getElementById('valorDespesa').value = '';
    document.getElementById('localDespesa').value = '';
    document.getElementById('obsDespesa').value = '';
    document.getElementById('doacaoDespesa').checked = false;
    document.getElementById('pagarDespesa').checked = false;
    document.getElementById('patrocinadorDespesa').style.display = 'none';
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
            <td>R$ ${fmt(d.valor)}</td>
            <td>${localStr}</td>
            <td><span class="${d.doacao ? 'badge-doacao' : 'badge-compra'}">${d.doacao ? '🎁 ' + getNomePatrocinador(d.patrocinadorId) : 'Compra'}</span></td>
            <td><span class="${d.pago ? 'badge-pago' : 'badge-pendente'}" onclick="togglePagoDespesa(${d.id})">${d.pago ? 'Pago' : 'Pendente'}</span></td>
            <td>
                <button class="btn-edit" onclick="editarDespesa(${d.id})">✏️</button>
                <button class="btn-delete" onclick="confirmarExclusao('Excluir esta despesa?', () => removerDespesa(${d.id}))">X</button>
            </td>
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
        <div class="item negativo"><span>Total Despesas</span><strong>${R$(total)}</strong></div>
        <div class="item doacao"><span>🎁 Doações</span><strong>${R$(totalDoacoes)}</strong></div>
        <div class="item negativo"><span>Compras</span><strong>${R$(totalCompras)}</strong></div>
        <div class="item positivo"><span>Pago</span><strong>${R$(totalPago)}</strong></div>
        <div class="item negativo"><span>Pendente</span><strong>${R$(totalPendente)}</strong></div>
        <div class="item neutro"><span>Itens Lanç.</span><strong>${totalItens}</strong></div>
    `;

    // Totalizador por local de compra
    const localEl = document.getElementById('totaisPorLocal');
    if (localEl) {
        const localMap = {};
        dados.despesas.forEach(d => {
            if (d.doacao) return; // não conta doações
            const loc = (d.local && d.local.trim()) ? d.local.trim() : 'Não informado';
            if (!localMap[loc]) localMap[loc] = { valor: 0, qtd: 0 };
            localMap[loc].valor += d.valor;
            localMap[loc].qtd++;
        });
        const locais = Object.entries(localMap).sort((a,b) => b[1].valor - a[1].valor);
        if (locais.length > 0) {
            localEl.innerHTML = locais.map(([loc, v]) => 
                `<div class="ranking-item"><span class="ranking-nome">🏪 ${loc}</span><span class="ranking-qtd">${v.qtd} itens</span><span class="ranking-valor">${R$(v.valor)}</span></div>`
            ).join('');
        } else {
            localEl.innerHTML = '<p style="opacity:0.5;text-align:center;padding:10px">Nenhuma compra registrada</p>';
        }
    }
}

// ===== PATROCINADORES =====
function lancarPatrocinio() {
    const nome = document.getElementById('nomePatrocinador').value.trim();
    const tipo = document.getElementById('tipoPatrocinio').value;
    const valor = parseFloat(document.getElementById('valorPatrocinio').value) || 0;
    const desc = document.getElementById('descPatrocinio').value.trim();
    const barraca = document.getElementById('barracaPatrocinio').value;
    const obs = document.getElementById('obsPatrocinio').value.trim();
    const recebido = document.getElementById('recebidoPatrocinio').checked;
    if (!nome) { alert('Preencha o nome do patrocinador'); return; }

    dados.patrocinadores.push({ id: Date.now(), nome, tipo, valor, desc, barraca, obs, recebido });
    salvarDados(dados);
    document.getElementById('nomePatrocinador').value = '';
    document.getElementById('valorPatrocinio').value = '';
    document.getElementById('descPatrocinio').value = '';
    document.getElementById('barracaPatrocinio').value = '';
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

let ordenacaoPatr = 'alfa';

function getNomePatrocinador(id) {
    if (!id) return 'Doação';
    const p = (dados.patrocinadores || []).find(x => x.id == id);
    return p ? p.nome : 'Doação';
}

function ordenarPatrocinadores(tipo) {
    ordenacaoPatr = tipo;
    document.querySelectorAll('[data-ordpatr]').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-ordpatr="${tipo}"]`);
    if (btn) btn.classList.add('active');
    renderizarPatrocinadores();
}

function togglePatrocinadorDespesa() {
    const check = document.getElementById('doacaoDespesa').checked;
    const select = document.getElementById('patrocinadorDespesa');
    if (check) {
        select.style.display = 'block';
        // Preencher com patrocinadores cadastrados
        const opts = dados.patrocinadores.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        select.innerHTML = '<option value="">Selecione o patrocinador (opcional)...</option>' + opts;
    } else {
        select.style.display = 'none';
    }
}

function renderizarPatrocinadores() {
    const tbody = document.querySelector('#tabelaPatrocinadores tbody');
    const busca = (document.getElementById('buscaPatrocinador')?.value || '').toLowerCase();
    
    let lista = [...(dados.patrocinadores || [])];
    
    // Filtro de busca
    if (busca) {
        lista = lista.filter(p => p.nome.toLowerCase().includes(busca) || (p.desc||'').toLowerCase().includes(busca));
    }
    
    // Ordenação
    if (ordenacaoPatr === 'alfa') lista.sort((a,b) => a.nome.localeCompare(b.nome));
    else if (ordenacaoPatr === 'valor') lista.sort((a,b) => b.valor - a.valor);
    else if (ordenacaoPatr === 'pendente') lista = lista.filter(p => !p.recebido).sort((a,b) => a.nome.localeCompare(b.nome));
    else if (ordenacaoPatr === 'recebido') lista = lista.filter(p => p.recebido).sort((a,b) => a.nome.localeCompare(b.nome));

    // Função para calcular total de doações vinculadas a um patrocinador
    function totalDoacoesPatrocinador(id) {
        return (dados.despesas || []).filter(d => d.doacao && d.patrocinadorId == id).reduce((s, d) => s + d.valor, 0);
    }

    const TIPO_BADGE = { dinheiro: '💵 Dinheiro', servico: '🔧 Serviço', produto: '📦 Produto' };

    tbody.innerHTML = lista.map(p => {
        const tipoBadge = TIPO_BADGE[p.tipo] || '💵 Dinheiro';
        const barracaNome = p.barraca ? (NOMES_BARRACAS[p.barraca] || p.barraca) : '-';
        const descTxt = p.desc || p.obs || '-';
        const doacoesVinculadas = totalDoacoesPatrocinador(p.id);
        const valorTotal = (p.valor || 0) + doacoesVinculadas;
        const valorDisplay = p.valor > 0 && doacoesVinculadas > 0 
            ? `R$ ${fmt(valorTotal)}<br><small style="opacity:0.6">Direto: R$ ${fmt(p.valor)} + Doações: R$ ${fmt(doacoesVinculadas)}</small>`
            : doacoesVinculadas > 0 
                ? `R$ ${fmt(doacoesVinculadas)}<br><small style="opacity:0.6">(via doações)</small>`
                : p.valor > 0 ? `R$ ${fmt(p.valor)}` : '-';
        return `
        <tr>
            <td style="font-weight:700">${p.nome}</td>
            <td><span class="badge-categoria">${tipoBadge}</span></td>
            <td>${descTxt}</td>
            <td>${valorDisplay}</td>
            <td>${barracaNome}</td>
            <td><span class="${p.recebido ? 'badge-pago' : 'badge-pendente'}" onclick="toggleRecebido(${p.id})">${p.recebido ? 'Recebido' : 'Pendente'}</span></td>
            <td>
                <button class="btn-edit" onclick="editarPatrocinio(${p.id})">✏️</button>
                <button class="btn-delete" onclick="confirmarExclusao('Excluir este patrocínio?', () => removerPatrocinio(${p.id}))">X</button>
            </td>
        </tr>`;
    }).join('');

    // Resumo — somar doações vinculadas no total
    const todos = dados.patrocinadores || [];
    const totalDinheiro = todos.filter(p => (p.tipo||'dinheiro') === 'dinheiro').reduce((s,p) => s + (p.valor||0), 0);
    const totalServico = todos.filter(p => p.tipo === 'servico').reduce((s,p) => s + (p.valor||0) + totalDoacoesPatrocinador(p.id), 0);
    const totalProduto = todos.filter(p => p.tipo === 'produto').reduce((s,p) => s + (p.valor||0) + totalDoacoesPatrocinador(p.id), 0);
    const totalGeral = todos.reduce((s,p) => s + (p.valor||0) + totalDoacoesPatrocinador(p.id), 0);
    const recebido = todos.filter(p => p.recebido).reduce((s,p) => s + (p.valor||0) + totalDoacoesPatrocinador(p.id), 0);
    const pendente = totalGeral - recebido;

    document.getElementById('resumoPatrocinadores').innerHTML = `
        <div class="item positivo"><span>Total Geral</span><strong>${R$(totalGeral)}</strong></div>
        <div class="item positivo"><span>💵 Dinheiro</span><strong>${R$(totalDinheiro)}</strong></div>
        <div class="item doacao"><span>🔧 Serviços</span><strong>${R$(totalServico)}</strong></div>
        <div class="item doacao"><span>📦 Produtos</span><strong>${R$(totalProduto)}</strong></div>
        <div class="item positivo"><span>Recebido</span><strong>${R$(recebido)}</strong></div>
        <div class="item negativo"><span>Pendente</span><strong>${R$(pendente)}</strong></div>
        <div class="item neutro"><span>Qtd</span><strong>${todos.length}</strong></div>
    `;

    // Detalhe de doações por patrocinador (expandido abaixo da tabela)
    const detalheEl = document.getElementById('detalhePatrocinadores');
    if (detalheEl) {
        let detHtml = '';
        todos.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(p => {
            const doacoes = (dados.despesas||[]).filter(d => d.doacao && d.patrocinadorId == p.id);
            if (doacoes.length === 0 && !p.desc) return;
            detHtml += `<div class="patr-detalhe-card">
                <div class="patr-detalhe-header">${p.nome} <small>${{dinheiro:'💵',servico:'🔧',produto:'📦'}[p.tipo]||'💵'}</small></div>`;
            if (p.desc) detHtml += `<div class="patr-detalhe-desc">${p.desc}</div>`;
            if (doacoes.length > 0) {
                detHtml += '<div class="patr-detalhe-itens">';
                doacoes.forEach(d => {
                    const dest = d.destino === 'geral' ? '' : ` → ${(NOMES_BARRACAS[d.destino]||'').replace(/^.{2}/,'')}`;
                    detHtml += `<div class="patr-detalhe-item">• ${d.desc}${dest} — <strong>${R$(d.valor)}</strong></div>`;
                });
                const totalDoado = doacoes.reduce((s,d) => s + d.valor, 0);
                detHtml += `<div class="patr-detalhe-total">Total doado: ${R$(totalDoado)}</div>`;
                detHtml += '</div>';
            }
            detHtml += '</div>';
        });
        detalheEl.innerHTML = detHtml || '<p style="opacity:0.5;text-align:center;padding:15px">Nenhuma doação vinculada ainda</p>';
    }
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
    const custoUnit = totalItens > 0 ? totalDespesas / totalItens : 0;

    tb.innerHTML = vendas.map(v => `
        <tr>
            <td><span class="badge-dia">${DIAS_FESTA[v.dia]}</span></td>
            <td>${v.produto}</td>
            <td>${v.qtd}</td>
            <td>R$ ${fmt(v.preco)}</td>
            <td>R$ ${fmt(v.total)}</td>
            <td>
                <button class="btn-edit" onclick="editarVenda('${barraca}', ${v.id})">✏️</button>
                <button class="btn-delete" onclick="confirmarExclusao('Excluir esta venda?', () => removerVenda('${barraca}', ${v.id}))">X</button>
            </td>
        </tr>
    `).join('');

    // Resumo por dia
    let resumoDiaHtml = '<div class="resumo-dias-barraca">';
    [1,2,3,4].forEach(d => {
        const vDia = dados[barraca].vendas.filter(v => v.dia === d);
        const tDia = vDia.reduce((s,v) => s + v.total, 0);
        const iDia = vDia.reduce((s,v) => s + v.qtd, 0);
        if (iDia > 0) resumoDiaHtml += `<span class="resumo-dia-item"><strong>${DIAS_FESTA[d]}</strong>: ${iDia} un = ${R$(tDia)}</span>`;
    });
    resumoDiaHtml += '</div>';

    // Lista de despesas vinculadas
    let despHtml = '';
    if (despesasBarraca.length > 0) {
        despHtml = '<div class="desp-vinculadas"><h4>Despesas desta barraca:</h4><div class="desp-vinc-lista">';
        despHtml += despesasBarraca.map(d => {
            const tipo = d.doacao ? `<span class="badge-doacao">🎁 ${getNomePatrocinador(d.patrocinadorId)}</span>` : '<span class="badge-compra">Compra</span>';
            return `<div class="desp-vinc-item">${tipo} ${d.desc} — <strong>${R$(d.valor)}</strong></div>`;
        }).join('');
        despHtml += '</div></div>';
    }

    const cls = resultado >= 0 ? 'positivo' : 'negativo';
    const lbl = filtro === 'todos' ? '' : ` (${DIAS_FESTA[filtro]})`;
    document.getElementById('resumo-' + barraca).innerHTML = `
        ${resumoDiaHtml}
        <div class="resumo-barraca-inner">
            <div class="item positivo"><span>Vendas${lbl}</span><strong>${R$(totalVendas)}</strong></div>
            <div class="item neutro"><span>Itens</span><strong>${totalItens}</strong></div>
            <div class="item negativo"><span>Custos</span><strong>${R$(totalDespesas)}</strong></div>
            <div class="item doacao"><span>🎁 Doações</span><strong>${R$(totalDoacoes)}</strong></div>
            <div class="item ${cls}"><span>Resultado</span><strong>${R$(resultado)}</strong></div>
            <div class="item neutro"><span>Custo/Item</span><strong>${R$(custoUnit)}</strong></div>
        </div>
        ${despHtml}
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

    const totalPatrocinadores = dados.patrocinadores.filter(p => (p.tipo||'dinheiro') === 'dinheiro').reduce((s, p) => s + p.valor, 0);
    const totalDespesasCompra = dados.despesas.filter(d => !d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalDoacoes = dados.despesas.filter(d => d.doacao).reduce((s, d) => s + d.valor, 0);

    const receita = totalVendas + totalPatrocinadores;
    const saldo = receita - totalDespesasCompra;

    document.getElementById('receitaTotal').textContent = R$(receita);
    document.getElementById('receitaDetalhe').textContent = `Vendas: ${R$(totalVendas)} | Patrocínios: ${R$(totalPatrocinadores)}`;
    document.getElementById('gastoTotal').textContent = R$(totalDespesasCompra);
    document.getElementById('gastoDetalhe').textContent = `Doações recebidas: ${R$(totalDoacoes)} (não conta como gasto)`;

    const saldoEl = document.getElementById('saldoFinal');
    saldoEl.textContent = R$(saldo);
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
                    <span class="v-receita">Vendas: ${R$(tVendas)}</span>
                    <span class="v-gasto">Desp: ${R$(tDesp)}</span>
                </div>
                <div class="resultado ${cls}">${R$(resultado)}</div>
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
                <span class="v-gasto">Compras gerais: ${R$(tDespGeral)}</span>
                <span class="v-receita">Doações: ${R$(tDoacoes)}</span>
            </div>
            <div class="resultado negativo">- ${R$(tDespGeral)}</div>
        </div>
    `;

    // Card patrocinadores
    const tPatr = dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    const patrPend = dados.patrocinadores.filter(p => !p.recebido).reduce((s, p) => s + p.valor, 0);
    html += `
        <div class="dash-card">
            <h4>🤝 Patrocinadores</h4>
            <div class="valores">
                <span class="v-receita">Total: ${R$(tPatr)}</span>
                <span class="v-gasto">Pendente: ${R$(patrPend)}</span>
            </div>
            <div class="resultado positivo">+ ${R$(tPatr)}</div>
        </div>
    `;

    container.innerHTML = html;
}

// ===== GRÁFICOS =====
let chartBarracas = null;
let chartDias = null;
let chartPizza = null;
let chartRecDesp = null;

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

    // Gráfico de Pizza — % por barraca
    const pizzaColors = ['#e53935','#ffb300','#43a047','#1e88e5','#8e24aa','#f4511e','#00897b','#5c6bc0','#d81b60','#6d4c41','#00acc1','#7cb342'];
    const pizzaData = BARRACAS.map(b => {
        const v = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(x => x.dia === filtro);
        return v.reduce((s, x) => s + x.total, 0);
    }).filter((v,i) => v > 0 || false);
    const pizzaLabels = BARRACAS.map((b,i) => ({ nome: (NOMES_BARRACAS[b]||b).replace(/^.{2}/,''), val: filtro === 'todos' ? dados[b].vendas.reduce((s,x)=>s+x.total,0) : dados[b].vendas.filter(x=>x.dia===filtro).reduce((s,x)=>s+x.total,0) })).filter(x => x.val > 0);

    const ctxP = document.getElementById('graficoPizza');
    if (ctxP) {
        if (chartPizza) chartPizza.destroy();
        chartPizza = new Chart(ctxP, {
            type: 'doughnut',
            data: {
                labels: pizzaLabels.map(x => x.nome),
                datasets: [{ data: pizzaLabels.map(x => x.val), backgroundColor: pizzaColors, borderWidth: 2, borderColor: '#1a0f0a' }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#f5deb3', font: { size: 10 } } } }
            }
        });
    }

    // Gráfico Receita vs Despesa
    const totalVendasGeral = BARRACAS.reduce((s,b) => s + dados[b].vendas.reduce((ss,v)=>ss+v.total,0), 0);
    const totalPatrDinheiro = (dados.patrocinadores||[]).filter(p=>(p.tipo||'dinheiro')==='dinheiro').reduce((s,p)=>s+(p.valor||0),0);
    const totalDespGeral = (dados.despesas||[]).filter(d=>!d.doacao).reduce((s,d)=>s+d.valor,0);
    const totalDoacGeral = (dados.despesas||[]).filter(d=>d.doacao).reduce((s,d)=>s+d.valor,0);

    const ctxRD = document.getElementById('graficoReceitaDespesa');
    if (ctxRD) {
        if (chartRecDesp) chartRecDesp.destroy();
        chartRecDesp = new Chart(ctxRD, {
            type: 'doughnut',
            data: {
                labels: ['Vendas', 'Patrocínios $', 'Despesas (compras)', 'Doações recebidas'],
                datasets: [{
                    data: [totalVendasGeral, totalPatrDinheiro, totalDespGeral, totalDoacGeral],
                    backgroundColor: ['#66bb6a','#42a5f5','#ef5350','#ce93d8'],
                    borderWidth: 2, borderColor: '#1a0f0a'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#f5deb3', font: { size: 10 } } } }
            }
        });
    }
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
                <span class="ranking-valor">${R$(item.valor)}</span>
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
    link.download = 'financeiro_arraia_basilica_2026.csv';
    link.click();
}

// ===== BACKUP =====
function exportarJSON() {
    const exportData = {
        versao: '4.0',
        evento: 'Arraiá da Basílica 2026',
        datas: ['10/07/2026', '11/07/2026', '17/07/2026', '18/07/2026'],
        exportadoEm: new Date().toISOString(),
        dados: dados
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup_arraia_basilica_2026.json';
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
    atualizarContador();
    atualizarMeta();
    renderizarComparativo();
    renderizarMargem();
    renderizarResumoDoacoes();
    renderizarUltimosGastos();
}

// ===== MODAL DE EDIÇÃO =====
let edicaoAtual = null; // { tipo: 'venda'|'despesa'|'patrocinio', barraca, id }

function abrirModal(titulo) {
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalOverlay').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    edicaoAtual = null;
}

function editarVenda(barraca, id) {
    const item = dados[barraca].vendas.find(v => v.id === id);
    if (!item) return;
    edicaoAtual = { tipo: 'venda', barraca, id };

    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Produto</label><input type="text" id="editProduto" value="${item.produto}"></div>
        <div class="campo"><label>Quantidade</label><input type="number" id="editQtd" value="${item.qtd}" min="1"></div>
        <div class="campo"><label>Preço Unitário (R$)</label><input type="number" id="editPreco" value="${item.preco}" step="0.01"></div>
        <div class="campo"><label>Dia</label>
            <select id="editDia">
                <option value="1" ${item.dia===1?'selected':''}>10/Jul (Qui)</option>
                <option value="2" ${item.dia===2?'selected':''}>11/Jul (Sex)</option>
                <option value="3" ${item.dia===3?'selected':''}>17/Jul (Qui)</option>
                <option value="4" ${item.dia===4?'selected':''}>18/Jul (Sex)</option>
            </select>
        </div>
    `;
    abrirModal('Editar Venda');
}

function editarDespesa(id) {
    const item = dados.despesas.find(d => d.id === id);
    if (!item) return;
    edicaoAtual = { tipo: 'despesa', id };

    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Descrição</label><input type="text" id="editDesc" value="${item.desc}"></div>
        <div class="campo"><label>Valor (R$)</label><input type="number" id="editValor" value="${item.valor}" step="0.01"></div>
        <div class="campo"><label>Quantidade</label><input type="number" id="editQtd" value="${item.qtd || 1}" min="1"></div>
        <div class="campo"><label>Local da Compra</label><input type="text" id="editLocal" value="${item.local || ''}"></div>
        <div class="campo"><label>Observação</label><input type="text" id="editObs" value="${item.obs || ''}"></div>
    `;
    abrirModal('Editar Despesa');
}

function editarPatrocinio(id) {
    const item = dados.patrocinadores.find(p => p.id === id);
    if (!item) return;
    edicaoAtual = { tipo: 'patrocinio', id };

    const tipoSel = (t) => item.tipo === t ? 'selected' : '';
    const barracaOpts = ['','geral','fazendinha','cachorro-quente','kafta','pernil','pastel','batata-frita','doces','bar','chopp','kids','bingo','artesanato'];
    const barracaLabels = {'':'Sem vínculo','geral':'Geral','fazendinha':'Fazendinha','cachorro-quente':'Cachorro Quente','kafta':'Kafta','pernil':'Pernil','pastel':'Pastel','batata-frita':'Batata Frita','doces':'Doces','bar':'Bar','chopp':'Chopp','kids':'Espaço Kids','bingo':'Bingo/Leilão','artesanato':'Artesanato'};
    const barracaSel = barracaOpts.map(b => `<option value="${b}" ${(item.barraca||'')=== b?'selected':''}>${barracaLabels[b]}</option>`).join('');

    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Patrocinador</label><input type="text" id="editNome" value="${item.nome}"></div>
        <div class="campo"><label>Tipo de Patrocínio</label>
            <select id="editTipo">
                <option value="dinheiro" ${tipoSel('dinheiro')}>💵 Dinheiro</option>
                <option value="servico" ${tipoSel('servico')}>🔧 Serviço</option>
                <option value="produto" ${tipoSel('produto')}>📦 Produto/Material</option>
            </select>
        </div>
        <div class="campo"><label>Valor (R$)</label><input type="number" id="editValor" value="${item.valor}" step="0.01"></div>
        <div class="campo"><label>Descrição (o que fornece)</label><input type="text" id="editDesc" value="${item.desc || ''}"></div>
        <div class="campo"><label>Barraca vinculada</label><select id="editBarraca">${barracaSel}</select></div>
        <div class="campo"><label>Observação</label><input type="text" id="editObs" value="${item.obs || ''}"></div>
    `;
    abrirModal('Editar Patrocínio');
}

function salvarEdicao() {
    if (!edicaoAtual) return;

    if (edicaoAtual.tipo === 'venda') {
        const item = dados[edicaoAtual.barraca].vendas.find(v => v.id === edicaoAtual.id);
        if (item) {
            item.produto = document.getElementById('editProduto').value.trim() || item.produto;
            item.qtd = parseInt(document.getElementById('editQtd').value) || item.qtd;
            item.preco = parseFloat(document.getElementById('editPreco').value) || item.preco;
            item.dia = parseInt(document.getElementById('editDia').value) || item.dia;
            item.total = item.preco * item.qtd;
        }
    } else if (edicaoAtual.tipo === 'despesa') {
        const item = dados.despesas.find(d => d.id === edicaoAtual.id);
        if (item) {
            item.desc = document.getElementById('editDesc').value.trim() || item.desc;
            item.valor = parseFloat(document.getElementById('editValor').value) || item.valor;
            item.qtd = parseFloat(document.getElementById('editQtd').value) || item.qtd;
            item.local = document.getElementById('editLocal').value.trim();
            item.obs = document.getElementById('editObs').value.trim();
        }
    } else if (edicaoAtual.tipo === 'patrocinio') {
        const item = dados.patrocinadores.find(p => p.id === edicaoAtual.id);
        if (item) {
            item.nome = document.getElementById('editNome').value.trim() || item.nome;
            item.tipo = document.getElementById('editTipo').value;
            const novoValor = document.getElementById('editValor').value;
            item.valor = novoValor === '' ? 0 : parseFloat(novoValor);
            item.desc = document.getElementById('editDesc').value.trim();
            item.barraca = document.getElementById('editBarraca').value;
            item.obs = document.getElementById('editObs').value.trim();
        }
    }

    salvarDados(dados);
    fecharModal();
    renderizarTudo();
}

// ===== CONFIRMAÇÃO DE EXCLUSÃO =====
function confirmarExclusao(msg, callback) {
    if (confirm(msg)) callback();
}

// ===== GASTO RÁPIDO =====
function toggleCaixaPatrocinador() {
    const check = document.getElementById('caixaDoacao').checked;
    const row = document.getElementById('caixaPatrocinadorRow');
    if (check) {
        row.style.display = 'flex';
        const select = document.getElementById('caixaPatrocinador');
        const opts = (dados.patrocinadores||[]).map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        select.innerHTML = '<option value="">Selecione quem doou (opcional)...</option>' + opts;
    } else {
        row.style.display = 'none';
    }
}

function gastoRapido() {
    const desc = document.getElementById('caixaDesc').value.trim();
    const valor = parseFloat(document.getElementById('caixaValor').value);
    const destino = document.getElementById('caixaDestino').value;
    const categoria = document.getElementById('caixaCategoria').value;
    const doacao = document.getElementById('caixaDoacao').checked;
    const pagarDepois = document.getElementById('caixaPagar') ? document.getElementById('caixaPagar').checked : false;
    const patrocinadorId = doacao ? (document.getElementById('caixaPatrocinador')?.value || '') : '';

    if (!desc || isNaN(valor) || valor <= 0) return;

    dados.despesas.push({
        id: Date.now(), categoria, desc, qtd: 1, unidade: 'un',
        valor, local: '', obs: '(Lançado rápido)', destino, doacao, pago: !pagarDepois, patrocinadorId
    });
    salvarDados(dados);

    // Feedback
    const fb = document.getElementById('caixaFeedback');
    fb.innerHTML = `<div class="caixa-toast">✅ ${desc} - ${R$(valor)} ${doacao ? '(doação)' : ''}</div>`;
    setTimeout(() => { fb.innerHTML = ''; }, 3000);

    // Limpar
    document.getElementById('caixaDesc').value = '';
    document.getElementById('caixaValor').value = '';
    document.getElementById('caixaDoacao').checked = false;
    if (document.getElementById('caixaPagar')) document.getElementById('caixaPagar').checked = false;
    document.getElementById('caixaPatrocinadorRow').style.display = 'none';

    renderizarUltimosGastos();
    renderizarTudo();
}

function renderizarUltimosGastos() {
    const container = document.getElementById('caixaUltimos');
    if (!container) return;
    const ultimos = (dados.despesas || []).filter(d => d.obs === '(Lançado rápido)').slice(-10).reverse();
    if (ultimos.length === 0) {
        container.innerHTML = '<p style="opacity:0.5;text-align:center;padding:10px;font-size:0.8rem">Nenhum gasto rápido ainda</p>';
        return;
    }
    container.innerHTML = ultimos.map(d => {
        const dest = d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino] || d.destino);
        return `<div class="ranking-item"><span class="ranking-nome">${d.doacao?'🎁':'💰'} ${d.desc}</span><span class="ranking-barraca">${dest}</span><span class="ranking-valor">${R$(d.valor)}</span></div>`;
    }).join('');
}

function renderizarCaixa() { renderizarUltimosGastos(); }

// ===== META =====
function salvarMeta() {
    const meta = parseFloat(document.getElementById('metaValor').value) || 0;
    dados.meta = meta;
    salvarDados(dados);
    atualizarMeta();
}

function atualizarMeta() {
    const meta = dados.meta || 0;
    const metaInput = document.getElementById('metaValor');
    if (metaInput && meta > 0) metaInput.value = meta;
    
    let totalVendas = 0;
    BARRACAS.forEach(b => {
        if (dados[b]) totalVendas += dados[b].vendas.reduce((s,v) => s + v.total, 0);
    });
    
    const metaTexto = document.getElementById('metaTexto');
    const metaProg = document.getElementById('metaProgresso');
    
    if (meta > 0) {
        const pct = Math.min((totalVendas / meta) * 100, 100);
        if (metaTexto) metaTexto.textContent = `${R$(totalVendas)} / ${R$(meta)} (${pct.toFixed(0)}%)`;
        if (metaProg) {
            metaProg.style.width = pct + '%';
            metaProg.style.background = pct >= 100 ? '#66bb6a' : pct >= 70 ? '#ff8f00' : '#ef5350';
        }
    } else {
        if (metaTexto) metaTexto.textContent = '';
        if (metaProg) metaProg.style.width = '0%';
    }
}

// ===== CONTADOR EM TEMPO REAL =====
function atualizarContador() {
    const container = document.getElementById('contadorTopo');
    if (!container) return;
    
    let html = '';
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        const itens = vendas.reduce((s,v) => s + v.qtd, 0);
        if (itens > 0) {
            const nome = NOMES_BARRACAS[b].replace(/^.{2}/, '');
            html += `<span class="contador-item"><strong>${itens}</strong> ${nome}</span>`;
        }
    });
    container.innerHTML = html || '<span class="contador-item" style="opacity:0.5">Nenhuma venda ainda</span>';
}

// ===== COMPARATIVO ENTRE DIAS =====
function renderizarComparativo() {
    const tbody = document.querySelector('#tabelaComparativo tbody');
    if (!tbody) return;
    
    let html = '';
    let totaisDia = [0,0,0,0];
    
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        let row = `<tr><td style="color:var(--cor-amarelo);font-weight:700;font-size:0.8rem">${NOMES_BARRACAS[b]}</td>`;
        let totalBarraca = 0;
        [1,2,3,4].forEach((d,i) => {
            const vd = dados[b].vendas.filter(v => v.dia === d).reduce((s,v) => s + v.total, 0);
            totalBarraca += vd;
            totaisDia[i] += vd;
            row += `<td>R$ ${fmt(vd)}</td>`;
        });
        row += `<td style="font-weight:700;color:#66bb6a">R$ ${fmt(totalBarraca)}</td></tr>`;
        html += row;
    });
    
    // Linha de total
    html += `<tr style="border-top:2px solid var(--cor-amarelo)"><td style="font-weight:800;color:var(--cor-amarelo)">TOTAL</td>`;
    let grandTotal = 0;
    totaisDia.forEach(t => { html += `<td style="font-weight:700">R$ ${fmt(t)}</td>`; grandTotal += t; });
    html += `<td style="font-weight:800;color:#66bb6a">R$ ${fmt(grandTotal)}</td></tr>`;
    
    tbody.innerHTML = html;
}

// ===== MARGEM POR BARRACA =====
function renderizarMargem() {
    const container = document.getElementById('margemBarracas');
    if (!container) return;
    
    let html = '';
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        const vendas = dados[b].vendas.reduce((s,v) => s + v.total, 0);
        const desp = (dados.despesas||[]).filter(d => d.destino === b && !d.doacao).reduce((s,d) => s + d.valor, 0);
        const doac = (dados.despesas||[]).filter(d => d.destino === b && d.doacao).reduce((s,d) => s + d.valor, 0);
        const lucro = vendas - desp;
        const cls = lucro >= 0 ? 'positivo' : 'negativo';
        const pct = vendas > 0 ? ((lucro/vendas)*100).toFixed(0) : 0;
        
        html += `
            <div class="dash-card">
                <h4>${NOMES_BARRACAS[b]}</h4>
                <div class="valores">
                    <span class="v-receita">Vendas: ${R$(vendas)}</span>
                    <span class="v-gasto">Custos: ${R$(desp)}</span>
                </div>
                <div class="resultado ${cls}">Lucro: ${R$(lucro)} (${pct}%)</div>
                ${doac > 0 ? `<div class="itens-info">Doações: ${R$(doac)}</div>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

// ===== RESUMO DE DOAÇÕES =====
function renderizarResumoDoacoes() {
    const container = document.getElementById('resumoDoacoes');
    if (!container) return;
    
    const doacoes = (dados.despesas||[]).filter(d => d.doacao);
    if (doacoes.length === 0) {
        container.innerHTML = '<p style="text-align:center;opacity:0.5;padding:15px">Nenhuma doação registrada</p>';
        return;
    }
    
    const total = doacoes.reduce((s,d) => s + d.valor, 0);
    let html = `<div class="ranking-item" style="border-bottom:2px solid var(--cor-amarelo);margin-bottom:8px"><span class="ranking-nome" style="color:var(--cor-amarelo)">Total em doações: ${R$(total)} (${doacoes.length} itens)</span></div>`;
    
    doacoes.forEach(d => {
        const dest = d.destino === 'geral' ? '' : ` → ${NOMES_BARRACAS[d.destino]||d.destino}`;
        html += `<div class="ranking-item"><span class="ranking-nome">🎁 ${d.desc}${dest}</span><span class="ranking-valor">${R$(d.valor)}</span></div>`;
    });
    container.innerHTML = html;
}

// ===== RELATÓRIO PDF COMPLETO =====
function gerarRelatorioPDF() {
    // Carregar logo antes de gerar
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        // Converter para base64
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const logoBase64 = canvas.toDataURL('image/png');
        gerarPDFComLogo(logoBase64);
    };
    img.onerror = function() {
        // Se não carregar o logo, gera sem
        gerarPDFComLogo(null);
    };
    img.src = 'logo.png';
}

function gerarPDFComLogo(logoBase64) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Helpers
    const center = (text, yy, size) => { doc.setFontSize(size || 12); doc.text(text, pageW / 2, yy, { align: 'center' }); };
    const checkPage = (need) => { if (y + need > 270) { doc.addPage(); addHeaderFooter(); y = 25; } };
    const titulo = (text) => { checkPage(15); doc.setFontSize(14); doc.setTextColor(230, 81, 0); doc.text(text, 14, y); y += 8; doc.setTextColor(0); doc.setFontSize(10); };

    // Cabeçalho e rodapé em todas as páginas
    function addHeaderFooter() {
        const totalPages = doc.internal.getNumberOfPages();
        const pg = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text('Arraiá da Basílica 2026 | Relatório Financeiro', 14, 10);
        doc.text(`Página ${pg}`, pageW - 14, 10, { align: 'right' });
        doc.text('Basílica Menor Nossa Senhora da Conceição Aparecida', pageW / 2, 290, { align: 'center' });
        doc.setTextColor(0);
    }

    // ===== CAPA =====
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', (pageW - 80) / 2, 20, 80, 80);
        y = 110;
    } else {
        y = 50;
    }
    doc.setFontSize(24);
    doc.setTextColor(230, 81, 0);
    center('ARRAIÁ DA BASÍLICA', y, 24);
    doc.setTextColor(0);
    center('Relatório Financeiro Completo', y + 12, 14);
    center('Edição 2026', y + 22, 12);
    center('10 e 11 de Julho | 17 e 18 de Julho', y + 32, 11);
    doc.setFontSize(10);
    center('Basílica Menor Nossa Senhora da Conceição Aparecida', y + 50);
    center('São José do Rio Preto - SP', y + 58);
    center('Gerado em: ' + new Date().toLocaleString('pt-BR'), y + 70);
    doc.addPage();
    addHeaderFooter();
    y = 25;

    // ===== RESUMO EXECUTIVO =====
    titulo('1. RESUMO EXECUTIVO');
    let totalVendas = 0, totalItens = 0;
    BARRACAS.forEach(b => {
        if (dados[b]) {
            totalVendas += dados[b].vendas.reduce((s,v) => s + v.total, 0);
            totalItens += dados[b].vendas.reduce((s,v) => s + v.qtd, 0);
        }
    });
    const patrDinheiro = (dados.patrocinadores||[]).filter(p => (p.tipo||'dinheiro') === 'dinheiro').reduce((s,p) => s + p.valor, 0);
    const patrServico = (dados.patrocinadores||[]).filter(p => p.tipo === 'servico').reduce((s,p) => s + p.valor, 0);
    const patrProduto = (dados.patrocinadores||[]).filter(p => p.tipo === 'produto').reduce((s,p) => s + p.valor, 0);
    const patrTotal = (dados.patrocinadores||[]).reduce((s,p) => s + p.valor, 0);
    const despCompras = (dados.despesas||[]).filter(d => !d.doacao).reduce((s,d) => s + d.valor, 0);
    const despDoacoes = (dados.despesas||[]).filter(d => d.doacao).reduce((s,d) => s + d.valor, 0);
    const receita = totalVendas + patrDinheiro;
    const saldo = receita - despCompras;
    const meta = dados.meta || 0;

    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [230, 81, 0] },
        head: [['Indicador', 'Valor']],
        body: [
            ['Total de Vendas (barracas)', 'R$ ' + fmt(totalVendas)],
            ['Total de Itens Vendidos', totalItens.toString()],
            ['Patrocínios em Dinheiro', 'R$ ' + fmt(patrDinheiro)],
            ['Patrocínios em Serviços (estimado)', 'R$ ' + fmt(patrServico)],
            ['Patrocínios em Produtos (estimado)', 'R$ ' + fmt(patrProduto)],
            ['RECEITA TOTAL (vendas + patrocínios $)', 'R$ ' + fmt(receita)],
            ['Despesas (compras)', 'R$ ' + fmt(despCompras)],
            ['Itens recebidos como doação', 'R$ ' + fmt(despDoacoes)],
            ['SALDO FINAL', 'R$ ' + fmt(saldo)],
            ['Meta de Faturamento', meta > 0 ? 'R$ ' + fmt(meta) + ' (' + Math.min((totalVendas/meta*100),100).toFixed(0) + '%)' : 'Não definida']
        ]
    });
    y = doc.lastAutoTable.finalY + 15;

    // ===== PATROCINADORES =====
    checkPage(30);
    titulo('2. PATROCINADORES');
    const patrs = [...(dados.patrocinadores||[])].sort((a,b) => a.nome.localeCompare(b.nome));
    if (patrs.length > 0) {
        const TIPOS = { dinheiro: '$ Dinheiro', servico: 'Serviço', produto: 'Produto' };
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [21, 101, 192] },
            head: [['Patrocinador', 'Tipo', 'Descrição', 'Valor', 'Barraca', 'Status']],
            body: patrs.map(p => [
                p.nome,
                TIPOS[p.tipo] || 'Dinheiro',
                p.desc || '-',
                'R$ ' + fmt(p.valor),
                p.barraca ? (NOMES_BARRACAS[p.barraca] || p.barraca).replace(/^.{2}/, '') : '-',
                p.recebido ? 'Recebido' : 'Pendente'
            ]),
            columnStyles: { 0: { cellWidth: 35 }, 2: { cellWidth: 35 } }
        });
        y = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(9);
        doc.text(`Total: ${patrs.length} patrocinadores | Dinheiro: R$ ${fmt(patrDinheiro)} | Serviços: R$ ${fmt(patrServico)} | Produtos: R$ ${fmt(patrProduto)}`, 14, y);
        y += 15;
    } else {
        doc.text('Nenhum patrocinador cadastrado.', 14, y); y += 15;
    }

    // ===== VENDAS POR BARRACA =====
    checkPage(30);
    titulo('3. VENDAS POR BARRACA');
    const tabelaBarracas = BARRACAS.filter(b => dados[b] && dados[b].vendas.length > 0).map(b => {
        const v = dados[b].vendas.reduce((s,x) => s + x.total, 0);
        const it = dados[b].vendas.reduce((s,x) => s + x.qtd, 0);
        const desp = (dados.despesas||[]).filter(d => d.destino === b && !d.doacao).reduce((s,d) => s + d.valor, 0);
        const lucro = v - desp;
        return [(NOMES_BARRACAS[b]||b).replace(/^.{2}/,''), it, 'R$ ' + fmt(v), 'R$ ' + fmt(desp), 'R$ ' + fmt(lucro)];
    });
    if (tabelaBarracas.length > 0) {
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [46, 125, 50] },
            head: [['Barraca', 'Itens', 'Vendas', 'Custos', 'Lucro']],
            body: tabelaBarracas
        });
        y = doc.lastAutoTable.finalY + 15;
    }

    // ===== DETALHAMENTO POR PRODUTO =====
    checkPage(30);
    titulo('4. VENDAS DETALHADAS POR PRODUTO');
    BARRACAS.forEach(b => {
        if (!dados[b] || dados[b].vendas.length === 0) return;
        checkPage(20);
        const nome = (NOMES_BARRACAS[b]||b).replace(/^.{2}/,'');
        // Agrupar por produto
        const prodMap = {};
        dados[b].vendas.forEach(v => {
            if (!prodMap[v.produto]) prodMap[v.produto] = { qtd: 0, valor: 0, dias: {1:0,2:0,3:0,4:0} };
            prodMap[v.produto].qtd += v.qtd;
            prodMap[v.produto].valor += v.total;
            prodMap[v.produto].dias[v.dia] = (prodMap[v.produto].dias[v.dia] || 0) + v.qtd;
        });
        const prods = Object.entries(prodMap).map(([n, d]) => [n, d.dias[1], d.dias[2], d.dias[3], d.dias[4], d.qtd, 'R$ ' + fmt(d.valor)]);

        doc.autoTable({
            startY: y, theme: 'striped',
            headStyles: { fillColor: [92, 61, 46] },
            head: [[nome, '10/Jul', '11/Jul', '17/Jul', '18/Jul', 'Total Qt', 'Faturamento']],
            body: prods
        });
        y = doc.lastAutoTable.finalY + 8;
    });

    // ===== COMPARATIVO POR DIA =====
    checkPage(30);
    titulo('5. COMPARATIVO ENTRE DIAS');
    const diasData = [1,2,3,4].map(d => {
        let vendas = 0, itens = 0;
        BARRACAS.forEach(b => {
            if (dados[b]) {
                vendas += dados[b].vendas.filter(v => v.dia === d).reduce((s,v) => s + v.total, 0);
                itens += dados[b].vendas.filter(v => v.dia === d).reduce((s,v) => s + v.qtd, 0);
            }
        });
        return [DIAS_FESTA[d], itens, 'R$ ' + fmt(vendas)];
    });
    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [21, 101, 192] },
        head: [['Dia', 'Itens Vendidos', 'Faturamento']],
        body: diasData
    });
    y = doc.lastAutoTable.finalY + 15;

    // ===== RANKING DE PRODUTOS =====
    checkPage(30);
    titulo('6. RANKING - PRODUTOS MAIS VENDIDOS');
    const rankMap = {};
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        dados[b].vendas.forEach(v => {
            if (!rankMap[v.produto]) rankMap[v.produto] = { qtd: 0, valor: 0, barraca: b };
            rankMap[v.produto].qtd += v.qtd;
            rankMap[v.produto].valor += v.total;
        });
    });
    const ranking = Object.entries(rankMap).map(([n,d]) => ({ nome: n, ...d })).sort((a,b) => b.qtd - a.qtd).slice(0, 20);
    if (ranking.length > 0) {
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [255, 143, 0] },
            head: [['#', 'Produto', 'Barraca', 'Qtd Vendida', 'Faturamento']],
            body: ranking.map((r, i) => [i+1, r.nome, (NOMES_BARRACAS[r.barraca]||'').replace(/^.{2}/,''), r.qtd, 'R$ ' + fmt(r.valor)])
        });
        y = doc.lastAutoTable.finalY + 15;
    }

    // ===== DESPESAS =====
    checkPage(30);
    titulo('7. DESPESAS');
    const despesas = dados.despesas || [];
    if (despesas.length > 0) {
        // Resumo por categoria
        const catMap = {};
        despesas.forEach(d => {
            if (!catMap[d.categoria]) catMap[d.categoria] = { compras: 0, doacoes: 0 };
            if (d.doacao) catMap[d.categoria].doacoes += d.valor;
            else catMap[d.categoria].compras += d.valor;
        });
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [198, 40, 40] },
            head: [['Categoria', 'Compras', 'Doações', 'Total']],
            body: Object.entries(catMap).map(([cat, v]) => [cat, 'R$ ' + fmt(v.compras), 'R$ ' + fmt(v.doacoes), 'R$ ' + fmt(v.compras + v.doacoes)])
        });
        y = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(9);
        doc.text(`Total Compras: R$ ${fmt(despCompras)} | Total Doações: R$ ${fmt(despDoacoes)} | ${despesas.length} itens`, 14, y);
        y += 15;

        // Lista completa
        checkPage(20);
        doc.setFontSize(10); doc.text('Detalhamento:', 14, y); y += 5;
        doc.autoTable({
            startY: y, theme: 'striped', styles: { fontSize: 7 },
            headStyles: { fillColor: [92, 61, 46] },
            head: [['Categoria', 'Descrição', 'Qtd', 'Valor', 'Local', 'Destino', 'Tipo', 'Status']],
            body: despesas.map(d => [
                d.categoria, d.desc, (d.qtd||1) + ' ' + (d.unidade||'un'),
                'R$ ' + fmt(d.valor), d.local || '-',
                d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino]||d.destino||'').replace(/^.{2}/,''),
                d.doacao ? 'Doação' + (d.patrocinadorId ? ' (' + getNomePatrocinador(d.patrocinadorId) + ')' : '') : 'Compra',
                d.pago ? 'Pago' : 'Pendente'
            ])
        });
        y = doc.lastAutoTable.finalY + 15;
    }

    // ===== DOAÇÕES RECEBIDAS =====
    const doacoes = despesas.filter(d => d.doacao);
    if (doacoes.length > 0) {
        checkPage(30);
        titulo('8. DOAÇÕES RECEBIDAS');
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [106, 27, 154] },
            head: [['Item', 'Valor Estimado', 'Patrocinador', 'Barraca']],
            body: doacoes.map(d => [
                d.desc,
                'R$ ' + fmt(d.valor),
                d.patrocinadorId ? getNomePatrocinador(d.patrocinadorId) : '-',
                d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino]||d.destino||'').replace(/^.{2}/,'')
            ])
        });
        y = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(9);
        doc.text(`Total em doações: R$ ${fmt(despDoacoes)} (${doacoes.length} itens)`, 14, y);
        y += 15;
    }

    // ===== RESULTADO FINAL =====
    checkPage(40);
    titulo('9. RESULTADO FINAL');
    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] },
        head: [['', 'Valor']],
        body: [
            ['(+) Vendas nas barracas', 'R$ ' + fmt(totalVendas)],
            ['(+) Patrocínios em dinheiro', 'R$ ' + fmt(patrDinheiro)],
            ['(=) RECEITA TOTAL', 'R$ ' + fmt(receita)],
            ['(-) Despesas (compras)', 'R$ ' + fmt(despCompras)],
            ['(=) SALDO LÍQUIDO', 'R$ ' + fmt(saldo)],
            ['', ''],
            ['Itens vendidos no total', totalItens.toString()],
            ['Barracas ativas', BARRACAS.filter(b => dados[b] && dados[b].vendas.length > 0).length.toString()],
            ['Patrocinadores', (dados.patrocinadores||[]).length.toString()],
            ['Economia com doações', 'R$ ' + fmt(despDoacoes)]
        ]
    });

    // Aplicar cabeçalho/rodapé em todas as páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text('Arraiá da Basílica 2026 | Relatório Financeiro', 14, 10);
        doc.text(`Página ${i} de ${totalPages}`, pageW - 14, 10, { align: 'right' });
        doc.text('Basílica Menor Nossa Senhora da Conceição Aparecida', pageW / 2, 290, { align: 'center' });
        doc.setTextColor(0);
    }

    doc.save('relatorio_arraia_basilica_2026.pdf');
    alert('Relatório PDF gerado com sucesso!');
    registrarAcao('Relatório PDF gerado');
}

// ===== CONFIGURAÇÕES: BARRACAS E PRODUTOS DINÂMICOS =====
function getBarracasConfig() {
    // Se tem config salva, usa ela; senão usa a padrão
    if (dados.configBarracas) return dados.configBarracas;
    return BARRACAS.map(b => ({ id: b, nome: NOMES_BARRACAS[b] }));
}

function getProdutosConfig() {
    if (dados.configProdutos) return dados.configProdutos;
    return PRODUTOS_BARRACA;
}

function adicionarBarraca() {
    const id = document.getElementById('novaBarracaId').value.trim().toLowerCase().replace(/\s+/g, '-');
    const nome = document.getElementById('novaBarracaNome').value.trim();
    if (!id || !nome) { alert('Preencha o ID e o Nome da barraca'); return; }

    // Salvar config
    if (!dados.configBarracas) {
        dados.configBarracas = BARRACAS.map(b => ({ id: b, nome: NOMES_BARRACAS[b] }));
    }
    if (!dados.configProdutos) {
        dados.configProdutos = JSON.parse(JSON.stringify(PRODUTOS_BARRACA));
    }

    // Verificar se já existe
    if (dados.configBarracas.find(b => b.id === id)) { alert('Já existe uma barraca com esse ID'); return; }

    dados.configBarracas.push({ id, nome });
    dados.configProdutos[id] = [];
    if (!dados[id]) dados[id] = { vendas: [] };

    // Atualizar as constantes em memória
    if (!BARRACAS.includes(id)) BARRACAS.push(id);
    NOMES_BARRACAS[id] = nome;
    PRODUTOS_BARRACA[id] = [];

    salvarDados(dados);
    document.getElementById('novaBarracaId').value = '';
    document.getElementById('novaBarracaNome').value = '';
    renderizarConfig();
    alert(`Barraca "${nome}" criada! Recarregue a página para ver no menu.`);
}

function adicionarProduto() {
    const barraca = document.getElementById('configBarracaSelect').value;
    const nome = document.getElementById('novoProdutoNome').value.trim();
    const preco = parseFloat(document.getElementById('novoProdutoPreco').value);
    if (!barraca || !nome || isNaN(preco) || preco <= 0) { alert('Preencha todos os campos'); return; }

    if (!dados.configProdutos) {
        dados.configProdutos = JSON.parse(JSON.stringify(PRODUTOS_BARRACA));
    }
    if (!dados.configProdutos[barraca]) dados.configProdutos[barraca] = [];

    dados.configProdutos[barraca].push({ nome, preco });
    PRODUTOS_BARRACA[barraca] = dados.configProdutos[barraca];

    salvarDados(dados);
    document.getElementById('novoProdutoNome').value = '';
    document.getElementById('novoProdutoPreco').value = '';
    renderizarConfig();
    atualizarSelectsProdutos(barraca);
    alert(`Produto "${nome}" adicionado à barraca!`);
}

function removerProduto(barraca, index) {
    if (!confirm('Remover este produto?')) return;
    if (!dados.configProdutos) {
        dados.configProdutos = JSON.parse(JSON.stringify(PRODUTOS_BARRACA));
    }
    dados.configProdutos[barraca].splice(index, 1);
    PRODUTOS_BARRACA[barraca] = dados.configProdutos[barraca];
    salvarDados(dados);
    renderizarConfig();
    atualizarSelectsProdutos(barraca);
}

function atualizarSelectsProdutos(barraca) {
    // Atualizar o select da barraca na seção de vendas
    const select = document.getElementById('prod-' + barraca);
    if (select) {
        const produtos = dados.configProdutos ? dados.configProdutos[barraca] : PRODUTOS_BARRACA[barraca];
        if (produtos) {
            select.innerHTML = produtos.map(p => 
                `<option value="${p.nome}" data-preco="${p.preco}">${p.nome} - R$ ${fmt(p.preco)}</option>`
            ).join('');
        }
    }
}

function renderizarConfig() {
    // Select de barracas
    const select = document.getElementById('configBarracaSelect');
    const barracas = getBarracasConfig();
    if (select) {
        select.innerHTML = barracas.map(b => `<option value="${b.id}">${b.nome}</option>`).join('');
    }

    // Lista de barracas e produtos
    const container = document.getElementById('listaBarracasProdutos');
    if (!container) return;
    const produtos = getProdutosConfig();

    let html = '';
    barracas.forEach(b => {
        const prods = produtos[b.id] || [];
        html += `<div class="config-barraca">
            <div class="config-barraca-header">${b.nome} <small>(${b.id})</small></div>
            <div class="config-produtos">`;
        if (prods.length === 0) {
            html += '<span style="opacity:0.5;font-size:0.8rem">Preço variável / sem produtos fixos</span>';
        } else {
            prods.forEach((p, i) => {
                html += `<span class="config-produto-item">${p.nome} - R$ ${fmt(p.preco)} <button class="btn-delete" onclick="removerProduto('${b.id}', ${i})">X</button></span>`;
            });
        }
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function limparTodosDados() {
    if (!confirm('ATENÇÃO: Isso vai apagar TODOS os dados (vendas, despesas, patrocinadores). Tem certeza?')) return;
    if (!confirm('Última chance! Realmente quer apagar tudo?')) return;
    dados = dadosVazios();
    salvarDados(dados);
    renderizarTudo();
    alert('Dados limpos com sucesso!');
}

// Carregar config dinâmica ao iniciar
function carregarConfigDinamica() {
    if (dados.configBarracas) {
        dados.configBarracas.forEach(b => {
            if (!BARRACAS.includes(b.id)) BARRACAS.push(b.id);
            NOMES_BARRACAS[b.id] = b.nome;
        });
    }
    if (dados.configProdutos) {
        Object.keys(dados.configProdutos).forEach(b => {
            if (dados.configProdutos[b]) {
                PRODUTOS_BARRACA[b] = Array.isArray(dados.configProdutos[b]) 
                    ? dados.configProdutos[b] 
                    : Object.values(dados.configProdutos[b]);
            }
        });
    }
}

carregarConfigDinamica();

// ===== FIREBASE STATUS =====
let firebaseOnline = false;
let ultimaSync = null;

function atualizarStatusFirebase(online) {
    firebaseOnline = online;
    const el = document.getElementById('firebaseStatus');
    if (el) {
        el.innerHTML = online
            ? '<span class="status-dot online"></span> Online'
            : '<span class="status-dot offline"></span> Offline';
    }
}

function registrarSync() {
    ultimaSync = new Date();
    const texto = ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const syncEl = document.getElementById('lastSync');
    if (syncEl) syncEl.textContent = `Salvo às ${texto}`;
    const footerEl = document.getElementById('footerSync');
    if (footerEl) footerEl.textContent = `Última sincronização: ${texto}`;
}

// Detectar conexão Firebase
if (typeof firebase !== 'undefined' && firebase.database) {
    firebase.database().ref('.info/connected').on('value', snap => {
        atualizarStatusFirebase(snap.val() === true);
    });
}

// Sobrescrever salvarDados para registrar sync
const _salvarDadosOriginal = salvarDados;
salvarDados = function(d) {
    _salvarDadosOriginal(d);
    registrarSync();
};

// ===== HISTÓRICO DE AÇÕES =====
const HISTORICO_KEY = 'arraia_historico';
let historico = JSON.parse(localStorage.getItem(HISTORICO_KEY) || '[]');

function registrarAcao(acao) {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    historico.unshift({ hora, acao, ts: Date.now() });
    if (historico.length > 50) historico = historico.slice(0, 50);
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
    renderizarHistorico();
}

function renderizarHistorico() {
    const el = document.getElementById('historicoLista');
    if (!el) return;
    el.innerHTML = historico.slice(0, 20).map(h =>
        `<div class="historico-item"><span class="hist-hora">${h.hora}</span><span class="hist-acao">${h.acao}</span></div>`
    ).join('') || '<p style="opacity:0.5;font-size:0.8rem">Nenhuma ação ainda</p>';
}

function toggleHistorico() {
    const el = document.getElementById('historicoPainel');
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
        renderizarHistorico();
    }
}

// Interceptar funções para registrar no histórico
const _lancarVendaOriginal = lancarVenda;
lancarVenda = function(barraca) {
    const select = document.getElementById('prod-' + barraca);
    const qtd = document.getElementById('qtd-' + barraca);
    const produto = select ? select.value : '';
    const q = qtd ? qtd.value : 1;
    _lancarVendaOriginal(barraca);
    registrarAcao(`Venda: ${q}x ${produto} → ${(NOMES_BARRACAS[barraca]||barraca).replace(/^.{2}/,'')}`);
};

const _lancarDespesaOriginal = lancarDespesa;
lancarDespesa = function() {
    const desc = document.getElementById('descDespesa').value.trim();
    const valor = document.getElementById('valorDespesa').value;
    _lancarDespesaOriginal();
    if (desc) registrarAcao(`Despesa: ${desc} R$ ${valor}`);
};

const _lancarPatrocinioOriginal = lancarPatrocinio;
lancarPatrocinio = function() {
    const nome = document.getElementById('nomePatrocinador').value.trim();
    _lancarPatrocinioOriginal();
    if (nome) registrarAcao(`Patrocínio: ${nome}`);
};

const _gastoRapidoOriginal = gastoRapido;
gastoRapido = function() {
    const desc = document.getElementById('caixaDesc').value.trim();
    const valor = document.getElementById('caixaValor').value;
    _gastoRapidoOriginal();
    if (desc) registrarAcao(`Gasto rápido: ${desc} R$ ${valor}`);
};

// ===== BUSCA GLOBAL =====
function buscaGlobalFn() {
    const termo = (document.getElementById('buscaGlobal')?.value || '').toLowerCase().trim();
    const container = document.getElementById('buscaResultados');
    if (!container) return;

    if (!termo || termo.length < 2) { container.style.display = 'none'; return; }

    let resultados = [];

    // Buscar em vendas
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        dados[b].vendas.forEach(v => {
            if (v.produto.toLowerCase().includes(termo)) {
                resultados.push({ tipo: 'Venda', texto: `${v.produto} x${v.qtd} = ${R$(v.total)}`, detalhe: (NOMES_BARRACAS[b]||'').replace(/^.{2}/,'') });
            }
        });
    });

    // Buscar em despesas
    (dados.despesas||[]).forEach(d => {
        if (d.desc.toLowerCase().includes(termo) || (d.local||'').toLowerCase().includes(termo) || d.categoria.toLowerCase().includes(termo)) {
            resultados.push({ tipo: d.doacao ? 'Doação' : 'Despesa', texto: `${d.desc} = ${R$(d.valor)}`, detalhe: d.categoria });
        }
    });

    // Buscar em patrocinadores
    (dados.patrocinadores||[]).forEach(p => {
        if (p.nome.toLowerCase().includes(termo) || (p.desc||'').toLowerCase().includes(termo)) {
            resultados.push({ tipo: 'Patrocinador', texto: p.nome, detalhe: p.desc || `${R$(p.valor||0)}` });
        }
    });

    if (resultados.length === 0) {
        container.innerHTML = '<div class="busca-item"><span>Nenhum resultado para "' + termo + '"</span></div>';
    } else {
        container.innerHTML = resultados.slice(0, 15).map(r =>
            `<div class="busca-item"><span>${r.texto} <small style="opacity:0.6">${r.detalhe}</small></span><span class="busca-tipo">${r.tipo}</span></div>`
        ).join('');
    }
    container.style.display = 'block';
}

// Fechar busca ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.status-center') && !e.target.closest('.busca-resultados')) {
        const el = document.getElementById('buscaResultados');
        if (el) el.style.display = 'none';
    }
});

// ===== ATALHOS DE TECLADO =====
document.addEventListener('keydown', (e) => {
    // Ignorar se estiver em input/select/textarea
    if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;

    const atalhos = {
        '1': 'dashboard', '2': 'fazendinha', '3': 'cachorro-quente', '4': 'kafta',
        '5': 'pernil', '6': 'pastel', '7': 'batata-frita', '8': 'doces',
        '9': 'bar', '0': 'chopp', 'd': 'despesas', 'p': 'patrocinadores',
        'g': 'caixa', 'k': 'kids', 'b': 'bingo', 'a': 'artesanato'
    };

    const secao = atalhos[e.key.toLowerCase()];
    if (secao) {
        document.querySelectorAll('.menu-btn').forEach(btn => {
            if (btn.dataset.section === secao) btn.click();
        });
    }
});

// ===== ENCERRAR EDIÇÃO =====
function encerrarEdicao() {
    if (!confirm('Você está prestes a ENCERRAR a edição 2026.\n\nIsso vai:\n1. Gerar um backup automático\n2. Salvar como "edição anterior" para comparativo\n3. Limpar vendas, despesas e patrocínios\n4. Manter configuração de barracas e produtos\n\nTem certeza?')) return;
    if (!confirm('ÚLTIMA CONFIRMAÇÃO: Todos os dados de vendas, despesas e patrocínios serão removidos. O backup será salvo automaticamente no seu computador.\n\nContinuar?')) return;

    // 1. Gerar backup
    exportarJSON();

    // 2. Salvar como edição anterior
    const edicaoAnterior = {
        edicao: '2026',
        encerradoEm: new Date().toISOString(),
        dados: JSON.parse(JSON.stringify(dados))
    };
    localStorage.setItem('arraia_edicao_anterior', JSON.stringify(edicaoAnterior));

    // 3. Limpar dados mantendo config
    const configBarracas = dados.configBarracas;
    const configProdutos = dados.configProdutos;
    dados = dadosVazios();
    dados.configBarracas = configBarracas;
    dados.configProdutos = configProdutos;
    salvarDados(dados);

    alert('Edição 2026 encerrada!\n\nBackup salvo no computador.\nDados limpos para próxima edição.\nA configuração de barracas e produtos foi mantida.');
    renderizarTudo();
    registrarAcao('Edição 2026 encerrada');
}

// ===== COMPARATIVO COM EDIÇÃO ANTERIOR =====
function importarEdicaoAnterior(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importado = JSON.parse(e.target.result);
            const dadosAnt = importado.dados || importado;
            if (dadosAnt && typeof dadosAnt === 'object') {
                const edicaoAnterior = {
                    edicao: importado.evento || importado.edicao || 'Anterior',
                    dados: dadosAnt
                };
                localStorage.setItem('arraia_edicao_anterior', JSON.stringify(edicaoAnterior));
                alert('Edição anterior importada! O comparativo aparecerá no dashboard.');
                renderizarComparativoAnterior();
            }
        } catch (err) {
            alert('Erro ao importar. Verifique se é um backup válido.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function limparEdicaoAnterior() {
    if (!confirm('Remover o comparativo com edição anterior?')) return;
    localStorage.removeItem('arraia_edicao_anterior');
    document.getElementById('comparativoAnterior').style.display = 'none';
    document.getElementById('btnLimparAnterior').style.display = 'none';
    document.getElementById('comparativoStatus').innerHTML = '';
}

function renderizarComparativoAnterior() {
    const stored = localStorage.getItem('arraia_edicao_anterior');
    if (!stored) return;

    const anterior = JSON.parse(stored);
    const dadosAnt = anterior.dados;
    if (!dadosAnt) return;

    // Normalizar dados anteriores
    if (dadosAnt.patrocinadores && !Array.isArray(dadosAnt.patrocinadores)) dadosAnt.patrocinadores = Object.values(dadosAnt.patrocinadores);
    if (dadosAnt.despesas && !Array.isArray(dadosAnt.despesas)) dadosAnt.despesas = Object.values(dadosAnt.despesas);

    // Mostrar no config
    document.getElementById('btnLimparAnterior').style.display = 'inline-block';
    document.getElementById('comparativoStatus').innerHTML = `<p style="color:#66bb6a;font-size:0.85rem;margin-top:10px">✅ Edição "${anterior.edicao}" carregada para comparação</p>`;

    // Calcular totais anteriores
    let vendasAnt = 0, itensAnt = 0;
    BARRACAS.forEach(b => {
        if (dadosAnt[b] && dadosAnt[b].vendas) {
            const v = Array.isArray(dadosAnt[b].vendas) ? dadosAnt[b].vendas : Object.values(dadosAnt[b].vendas);
            vendasAnt += v.reduce((s, x) => s + (x.total || 0), 0);
            itensAnt += v.reduce((s, x) => s + (x.qtd || 0), 0);
        }
    });
    const despAnt = (dadosAnt.despesas || []).filter(d => !d.doacao).reduce((s, d) => s + d.valor, 0);
    const patrAnt = (dadosAnt.patrocinadores || []).filter(p => (p.tipo || 'dinheiro') === 'dinheiro').reduce((s, p) => s + (p.valor || 0), 0);
    const saldoAnt = vendasAnt + patrAnt - despAnt;

    // Calcular totais atuais
    let vendasAtual = 0, itensAtual = 0;
    BARRACAS.forEach(b => {
        if (dados[b]) {
            vendasAtual += dados[b].vendas.reduce((s, v) => s + v.total, 0);
            itensAtual += dados[b].vendas.reduce((s, v) => s + v.qtd, 0);
        }
    });
    const despAtual = (dados.despesas || []).filter(d => !d.doacao).reduce((s, d) => s + d.valor, 0);
    const patrAtual = (dados.patrocinadores || []).filter(p => (p.tipo || 'dinheiro') === 'dinheiro').reduce((s, p) => s + (p.valor || 0), 0);
    const saldoAtual = vendasAtual + patrAtual - despAtual;

    // Comparar
    function compara(atual, anterior) {
        if (anterior === 0) return { pct: atual > 0 ? '+100' : '0', cls: 'positivo', seta: '↑' };
        const diff = ((atual - anterior) / anterior * 100);
        return { pct: (diff >= 0 ? '+' : '') + diff.toFixed(0), cls: diff >= 0 ? 'positivo' : 'negativo', seta: diff >= 0 ? '↑' : '↓' };
    }

    const cVendas = compara(vendasAtual, vendasAnt);
    const cItens = compara(itensAtual, itensAnt);
    const cSaldo = compara(saldoAtual, saldoAnt);

    const container = document.getElementById('comparativoCards');
    const wrap = document.getElementById('comparativoAnterior');
    wrap.style.display = 'block';

    container.innerHTML = `
        <div class="dash-card">
            <h4>Vendas</h4>
            <div class="valores"><span class="v-receita">Atual: ${R$(vendasAtual)}</span><span class="v-gasto">Anterior: ${R$(vendasAnt)}</span></div>
            <div class="resultado ${cVendas.cls}">${cVendas.seta} ${cVendas.pct}%</div>
        </div>
        <div class="dash-card">
            <h4>Itens Vendidos</h4>
            <div class="valores"><span class="v-receita">Atual: ${itensAtual}</span><span class="v-gasto">Anterior: ${itensAnt}</span></div>
            <div class="resultado ${cItens.cls}">${cItens.seta} ${cItens.pct}%</div>
        </div>
        <div class="dash-card">
            <h4>Saldo Final</h4>
            <div class="valores"><span class="v-receita">Atual: ${R$(saldoAtual)}</span><span class="v-gasto">Anterior: ${R$(saldoAnt)}</span></div>
            <div class="resultado ${cSaldo.cls}">${cSaldo.seta} ${cSaldo.pct}%</div>
        </div>
        <div class="dash-card">
            <h4>Despesas</h4>
            <div class="valores"><span class="v-receita">Atual: ${R$(despAtual)}</span><span class="v-gasto">Anterior: ${R$(despAnt)}</span></div>
            <div class="resultado ${compara(despAtual,despAnt).cls}">${compara(despAtual,despAnt).seta} ${compara(despAtual,despAnt).pct}%</div>
        </div>
    `;
}

// ===== INIT =====
renderizarTudo();
if (document.getElementById('caixaGrid')) renderizarCaixa();
renderizarConfig();
renderizarHistorico();
renderizarComparativoAnterior();
atualizarStatusFirebase(false);
