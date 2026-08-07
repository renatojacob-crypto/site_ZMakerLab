// app.js
// ====== SIMULADOR DE BANCO DE DADOS (Excel Online / Power Automate) ======
// Em produção, substitua por chamadas HTTP para Power Automate / API

const DB = {
    escolas: [],
    agendamentos: [],
    acoes: [],
    _id: 1
};

// Carregar dados mockados para demonstração
function initMockData() {
    if (localStorage.getItem('zmaker_db')) {
        const saved = JSON.parse(localStorage.getItem('zmaker_db'));
        DB.escolas = saved.escolas || [];
        DB.agendamentos = saved.agendamentos || [];
        DB.acoes = saved.acoes || [];
        DB._id = saved._id || 1;
        return;
    }
    // Dados iniciais
    DB.escolas.push({
        id: 1,
        cnpj: '12.345.678/0001-90',
        razao: 'Escola Modelo Ltda',
        fantasia: 'EM Modelo',
        endereco: 'Av. Principal, 100',
        complemento: 'Sala 3',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        cpf: '123.456.789-00',
        tipoZmaker: 'Full',
        origem: 'Comercial',
        bonificacao: 'Venda',
        contatoNome: 'Carlos Silva',
        contatoCargo: 'Diretor',
        contatoEmail: 'carlos@escola.com',
        contatoTelefone: '(11) 99999-9999'
    });
    DB.agendamentos.push({
        id: 1,
        escolaId: 1,
        tipoEvento: 'Formação Inicial/Continuada',
        data: '2026-08-15',
        hora: '14:00',
        contatoNome: 'Ana Beatriz',
        contatoCargo: 'Coordenadora',
        contatoEmail: 'ana@escola.com',
        contatoTelefone: '(11) 98888-8888'
    });
    DB.acoes.push({
        id: 1,
        agendamentoId: 1,
        escolaId: 1,
        tipo: 'Presencial',
        responsavel: 'Orientador',
        respNome: 'João Oliveira',
        respEmail: 'joao@zmaker.com',
        respTelefone: '(11) 97777-7777',
        descricao: 'Formação inicial com os professores.',
        fotos: ['foto1.jpg', 'foto2.jpg'],
        dataRegistro: '2026-08-16'
    });
    DB._id = 3;
    persistDB();
}

function persistDB() {
    localStorage.setItem('zmaker_db', JSON.stringify(DB));
}

// ====== HELPERS ======
function getEscolaById(id) {
    return DB.escolas.find(e => e.id === Number(id));
}

function getEscolasOptions() {
    return DB.escolas.map(e => `<option value="${e.id}">${e.fantasia} (${e.cidade})</option>`).join('');
}

function renderEscolas() {
    const container = document.getElementById('lista-escolas');
    if (!DB.escolas.length) {
        container.innerHTML = '<p>Nenhuma escola cadastrada.</p>';
        return;
    }
    let html = `<table><thead><tr>
        <th>CNPJ</th><th>Razão Social</th><th>Fantasia</th>
        <th>Cidade/UF</th><th>Contato</th><th>ZMaker</th><th>Origem</th>
    </tr></thead><tbody>`;
    DB.escolas.forEach(e => {
        html += `<tr>
            <td>${e.cnpj}</td><td>${e.razao}</td><td>${e.fantasia}</td>
            <td>${e.cidade}/${e.uf}</td>
            <td>${e.contatoNome}</td>
            <td>${e.tipoZmaker}</td>
            <td>${e.origem}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderAgendamentos() {
    const container = document.getElementById('lista-agendamentos');
    if (!DB.agendamentos.length) {
        container.innerHTML = '<p>Nenhum agendamento.</p>';
        return;
    }
    let html = `<table><thead><tr>
        <th>Escola</th><th>Tipo</th><th>Data/Hora</th><th>Contato</th><th>Ações</th>
    </tr></thead><tbody>`;
    DB.agendamentos.forEach(a => {
        const escola = getEscolaById(a.escolaId);
        const nomeEscola = escola ? escola.fantasia : 'N/E';
        html += `<tr>
            <td>${nomeEscola}</td><td>${a.tipoEvento}</td>
            <td>${a.data} ${a.hora}</td>
            <td>${a.contatoNome || '—'}</td>
            <td><button class="btn-primary" style="padding:4px 12px;font-size:0.8rem;" onclick="carregarAcaoParaAgendamento(${a.id})">Registrar Ação</button></td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderAcoes() {
    const container = document.getElementById('lista-acoes');
    if (!DB.acoes.length) {
        container.innerHTML = '<p>Nenhuma ação registrada.</p>';
        return;
    }
    let html = `<table><thead><tr>
        <th>Escola</th><th>Tipo</th><th>Responsável</th><th>Data</th><th>Fotos</th>
    </tr></thead><tbody>`;
    DB.acoes.forEach(ac => {
        const escola = getEscolaById(ac.escolaId);
        const nomeEscola = escola ? escola.fantasia : 'N/E';
        html += `<tr>
            <td>${nomeEscola}</td><td>${ac.tipo}</td>
            <td>${ac.respNome}</td>
            <td>${ac.dataRegistro || ac.data || '—'}</td>
            <td>${ac.fotos ? ac.fotos.length : 0} foto(s)</td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ====== FORMULÁRIOS ======
// Escola
document.getElementById('form-escola').addEventListener('submit', (e) => {
    e.preventDefault();
    const nova = {
        id: DB._id++,
        cnpj: document.getElementById('escola-cnpj').value,
        razao: document.getElementById('escola-razao').value,
        fantasia: document.getElementById('escola-fantasia').value,
        endereco: document.getElementById('escola-endereco').value,
        complemento: document.getElementById('escola-complemento').value,
        bairro: document.getElementById('escola-bairro').value,
        cidade: document.getElementById('escola-cidade').value,
        uf: document.getElementById('escola-uf').value,
        cpf: document.getElementById('escola-cpf').value,
        tipoZmaker: document.getElementById('escola-tipo-zmaker').value,
        origem: document.getElementById('escola-origem').value,
        bonificacao: document.getElementById('escola-bonificacao').value,
        contatoNome: document.getElementById('escola-contato-nome').value,
        contatoCargo: document.getElementById('escola-contato-cargo').value,
        contatoEmail: document.getElementById('escola-contato-email').value,
        contatoTelefone: document.getElementById('escola-contato-telefone').value
    };
    DB.escolas.push(nova);
    persistDB();
    atualizarSelects();
    renderEscolas();
    document.getElementById('form-escola').reset();
    alert('Escola salva!');
});

// Agendamento
document.getElementById('form-agendamento').addEventListener('submit', (e) => {
    e.preventDefault();
    const escolaId = Number(document.getElementById('agendamento-escola').value);
    if (!escolaId) { alert('Selecione uma escola.'); return; }
    const novo = {
        id: DB._id++,
        escolaId: escolaId,
        tipoEvento: document.getElementById('agendamento-tipo-evento').value,
        data: document.getElementById('agendamento-data').value,
        hora: document.getElementById('agendamento-hora').value,
        contatoNome: document.getElementById('agendamento-contato-nome').value,
        contatoCargo: document.getElementById('agendamento-contato-cargo').value,
        contatoEmail: document.getElementById('agendamento-contato-email').value,
        contatoTelefone: document.getElementById('agendamento-contato-telefone').value
    };
    DB.agendamentos.push(novo);
    persistDB();
    atualizarSelects();
    renderAgendamentos();
    document.getElementById('form-agendamento').reset();
    alert('Agendamento criado!');
});

// Ação
document.getElementById('form-acao').addEventListener('submit', (e) => {
    e.preventDefault();
    const agendamentoId = Number(document.getElementById('acao-agendamento').value);
    const agendamento = DB.agendamentos.find(a => a.id === agendamentoId);
    if (!agendamento) { alert('Selecione um agendamento válido.'); return; }
    
    const fotosInput = document.getElementById('acao-fotos');
    const fotos = Array.from(fotosInput.files).map(f => f.name);
    
    const novaAcao = {
        id: DB._id++,
        agendamentoId: agendamentoId,
        escolaId: agendamento.escolaId,
        tipo: document.getElementById('acao-tipo').value,
        responsavel: document.getElementById('acao-responsavel').value,
        respNome: document.getElementById('acao-resp-nome').value,
        respEmail: document.getElementById('acao-resp-email').value,
        respTelefone: document.getElementById('acao-resp-telefone').value,
        descricao: document.getElementById('acao-descricao').value,
        fotos: fotos,
        dataRegistro: new Date().toISOString().split('T')[0]
    };
    DB.acoes.push(novaAcao);
    persistDB();
    renderAcoes();
    document.getElementById('form-acao').reset();
    document.getElementById('foto-count').textContent = '0 arquivo(s)';
    alert('Ação registrada!');
});

// Atualizar selects
function atualizarSelects() {
    const selects = ['agendamento-escola', 'dashboard-escola', 'relatorio-escola'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            const currentVal = sel.value;
            sel.innerHTML = '<option value="">Selecione</option>' + getEscolasOptions();
            if (currentVal) sel.value = currentVal;
        }
    });
    // Select de agendamentos para ação
    const selAcao = document.getElementById('acao-agendamento');
    if (selAcao) {
        const currentVal = selAcao.value;
        selAcao.innerHTML = '<option value="">Selecione o agendamento</option>';
        DB.agendamentos.forEach(a => {
            const escola = getEscolaById(a.escolaId);
            const nome = escola ? escola.fantasia : 'N/E';
            selAcao.innerHTML += `<option value="${a.id}">${nome} - ${a.tipoEvento} (${a.data})</option>`;
        });
        if (currentVal) selAcao.value = currentVal;
    }
}

// Carregar ação a partir de agendamento
window.carregarAcaoParaAgendamento = function(id) {
    const sel = document.getElementById('acao-agendamento');
    sel.value = id;
    // Mudar para aba Ações
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-acoes').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="acoes"]').classList.add('active');
};

// ====== DASHBOARD ======
let chartTipo = null, chartEscola = null;

function atualizarDashboard() {
    const escolaFiltro = document.getElementById('dashboard-escola').value;
    const dataInicio = document.getElementById('dashboard-data-inicio').value;
    const dataFim = document.getElementById('dashboard-data-fim').value;
    
    let acoesFiltradas = [...DB.acoes];
    if (escolaFiltro) {
        acoesFiltradas = acoesFiltradas.filter(a => a.escolaId === Number(escolaFiltro));
    }
    if (dataInicio) {
        acoesFiltradas = acoesFiltradas.filter(a => a.dataRegistro >= dataInicio);
    }
    if (dataFim) {
        acoesFiltradas = acoesFiltradas.filter(a => a.dataRegistro <= dataFim);
    }
    
    // Totais
    document.getElementById('total-acoes').textContent = acoesFiltradas.length;
    const formacao = acoesFiltradas.filter(a => {
        const ag = DB.agendamentos.find(ag => ag.id === a.agendamentoId);
        return ag && ag.tipoEvento === 'Formação Inicial/Continuada';
    }).length;
    document.getElementById('total-formacao').textContent = formacao;
    const montagem = acoesFiltradas.filter(a => {
        const ag = DB.agendamentos.find(ag => ag.id === a.agendamentoId);
        return ag && ag.tipoEvento === 'Montagem de Equipamentos';
    }).length;
    document.getElementById('total-montagem').textContent = montagem;
    const reunioes = acoesFiltradas.filter(a => {
        const ag = DB.agendamentos.find(ag => ag.id === a.agendamentoId);
        return ag && ag.tipoEvento && ag.tipoEvento.includes('Reunião');
    }).length;
    document.getElementById('total-reunioes').textContent = reunioes;
    
    // Gráfico por tipo de ação
    const tipos = ['Remota', 'Presencial'];
    const counts = tipos.map(t => acoesFiltradas.filter(a => a.tipo === t).length);
    if (chartTipo) chartTipo.destroy();
    chartTipo = new Chart(document.getElementById('chart-acoes-tipo'), {
        type: 'bar',
        data: { labels: tipos, datasets: [{ label: 'Ações', data: counts, backgroundColor: ['#3b82f6', '#0f3b5e'] }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
    
    // Gráfico por escola
    const escolasIds = [...new Set(acoesFiltradas.map(a => a.escolaId))];
    const escolasNomes = escolasIds.map(id => {
        const e = getEscolaById(id);
        return e ? e.fantasia : 'N/E';
    });
    const contagens = escolasIds.map(id => acoesFiltradas.filter(a => a.escolaId === id).length);
    if (chartEscola) chartEscola.destroy();
    chartEscola = new Chart(document.getElementById('chart-acoes-escola'), {
        type: 'pie',
        data: { labels: escolasNomes, datasets: [{ data: contagens, backgroundColor: ['#3b82f6', '#0f3b5e', '#64748b', '#94a3b8', '#cbd5e1'] }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

// ====== RELATÓRIO (simulação PDF) ======
document.getElementById('gerar-relatorio').addEventListener('click', () => {
    const escolaId = document.getElementById('relatorio-escola').value;
    const dataInicio = document.getElementById('relatorio-data-inicio').value;
    const dataFim = document.getElementById('relatorio-data-fim').value;
    
    let acoes = [...DB.acoes];
    if (escolaId) acoes = acoes.filter(a => a.escolaId === Number(escolaId));
    if (dataInicio) acoes = acoes.filter(a => a.dataRegistro >= dataInicio);
    if (dataFim) acoes = acoes.filter(a => a.dataRegistro <= dataFim);
    
    const preview = document.getElementById('preview-relatorio');
    if (!acoes.length) {
        preview.innerHTML = '<p>Nenhuma ação encontrada para os filtros.</p>';
        return;
    }
    let html = '<h3>Relatório de Ações</h3><table><thead><tr><th>Escola</th><th>Tipo</th><th>Responsável</th><th>Data</th></tr></thead><tbody>';
    acoes.forEach(a => {
        const escola = getEscolaById(a.escolaId);
        html += `<tr><td>${escola ? escola.fantasia : 'N/E'}</td><td>${a.tipo}</td><td>${a.respNome}</td><td>${a.dataRegistro}</td></tr>`;
    });
    html += '</tbody></table><p><em>Relatório gerado em ' + new Date().toLocaleString() + '</em></p>';
    preview.innerHTML = html;
    alert('PDF simulado. Em produção, integre com Power Automate para enviar por e-mail.');
});

// ====== NAVEGAÇÃO ======
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        const tabId = 'tab-' + btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');
        if (btn.dataset.tab === 'dashboard') atualizarDashboard();
        if (btn.dataset.tab === 'relatorios') {
            // popular selects
            atualizarSelects();
        }
    });
});

// ====== EVENTO FOTOS ======
document.getElementById('acao-fotos').addEventListener('change', function() {
    document.getElementById('foto-count').textContent = this.files.length + ' arquivo(s)';
});

// ====== INICIALIZAÇÃO ======
initMockData();
atualizarSelects();
renderEscolas();
renderAgendamentos();
renderAcoes();
atualizarDashboard();

// Eventos de filtro do dashboard
document.getElementById('aplicar-filtros-dash').addEventListener('click', atualizarDashboard);
document.querySelectorAll('#dashboard-escola, #dashboard-data-inicio, #dashboard-data-fim').forEach(el => {
    el.addEventListener('change', atualizarDashboard);
});