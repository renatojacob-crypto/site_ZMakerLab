// ====== CARREGAR CONFIGURAÇÃO ======
const API = window.API_CONFIG;

// ====== FUNÇÃO PARA FAZER REQUISIÇÕES ======
async function callAPI(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
    }
    return response;
}

// ====== FUNÇÕES DE CRUD (usando URLs específicas) ======
async function getEscolas() {
    const response = await callAPI(API.getEscolas, 'GET');
    return await response.json();
}

async function createEscola(dados) {
    const response = await callAPI(API.postEscola, 'POST', dados);
    return await response.json();
}

async function getAgendamentos() {
    const response = await callAPI(API.getAgendamentos, 'GET');
    return await response.json();
}

async function createAgendamento(dados) {
    const response = await callAPI(API.postAgendamento, 'POST', dados);
    return await response.json();
}

async function getAcoes() {
    const response = await callAPI(API.getAcoes, 'GET');
    return await response.json();
}

async function createAcao(dados) {
    const response = await callAPI(API.postAcao, 'POST', dados);
    return await response.json();
}

async function gerarRelatorio(filtros) {
    const response = await callAPI(API.postRelatorio, 'POST', filtros);
    return response; // Retorna a resposta completa (para blob)
}

// ====== FUNÇÃO PARA BUSCAR CEP (VIA CEP API) ======
async function buscarCEP(cep) {
    try {
        cep = cep.replace(/\D/g, '');
        if (cep.length !== 8) {
            alert('CEP deve ter 8 dígitos.');
            return null;
        }
        const btn = document.getElementById('buscar-cep');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Buscando...';
        btn.disabled = true;

        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        btn.innerHTML = originalText;
        btn.disabled = false;

        if (data.erro) {
            alert('CEP não encontrado.');
            return null;
        }
        return data;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        alert('Erro ao buscar CEP. Verifique sua conexão.');
        return null;
    }
}

// ====== AUTO PREENCHER ENDEREÇO ======
async function preencherEndereco(cep) {
    const dados = await buscarCEP(cep);
    if (!dados) return;
    document.getElementById('escola-endereco').value = dados.logradouro || '';
    document.getElementById('escola-bairro').value = dados.bairro || '';
    document.getElementById('escola-cidade').value = dados.localidade || '';
    document.getElementById('escola-uf').value = dados.uf || '';
    document.getElementById('escola-complemento').focus();
}

// ====== EVENTOS DO CEP ======
document.getElementById('buscar-cep').addEventListener('click', () => {
    const cep = document.getElementById('escola-cep').value;
    preencherEndereco(cep);
});

let timeoutId = null;
document.getElementById('escola-cep').addEventListener('input', function() {
    const cep = this.value.replace(/\D/g, '');
    if (cep.length === 8) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            preencherEndereco(cep);
        }, 500);
    }
});

// ====== INICIALIZAR DADOS (via API) ======
async function initData() {
    try {
        const [escolas, agendamentos, acoes] = await Promise.all([
            getEscolas(),
            getAgendamentos(),
            getAcoes()
        ]);
        DB.escolas = escolas || [];
        DB.agendamentos = agendamentos || [];
        DB.acoes = acoes || [];
        console.log('Dados carregados da API.');
    } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
        // Fallback para localStorage
        if (localStorage.getItem('zmaker_db')) {
            const saved = JSON.parse(localStorage.getItem('zmaker_db'));
            DB.escolas = saved.escolas || [];
            DB.agendamentos = saved.agendamentos || [];
            DB.acoes = saved.acoes || [];
            DB._id = saved._id || 1;
            console.warn('Usando dados do localStorage (fallback).');
        } else {
            initMockData();
        }
    }
    atualizarSelects();
    renderEscolas();
    renderAgendamentos();
    renderAcoes();
    atualizarDashboard();
}

// ====== DADOS MOCK (fallback) ======
function initMockData() {
    DB.escolas = [{
        id: 1,
        cnpj: '12.345.678/0001-90',
        razao: 'Escola Modelo Ltda',
        fantasia: 'EM Modelo',
        cep: '01001000',
        endereco: 'Praça da Sé',
        complemento: 'Sala 3',
        bairro: 'Sé',
        cidade: 'São Paulo',
        uf: 'SP',
        tipoZmaker: 'Full',
        origem: 'Comercial',
        bonificacao: 'Venda',
        contatoNome: 'Carlos Silva',
        contatoCargo: 'Diretor',
        contatoEmail: 'carlos@escola.com',
        contatoTelefone: '(11) 99999-9999'
    }];
    DB.agendamentos = [{
        id: 1,
        escolaId: 1,
        tipoEvento: 'Formação Inicial/Continuada',
        data: '2026-08-15',
        hora: '14:00',
        responsavel: 'Orientador',
        respNome: 'João Oliveira',
        respEmail: 'joao@zmaker.com',
        respTelefone: '(11) 97777-7777',
        contatoNome: 'Ana Beatriz',
        contatoCargo: 'Coordenadora',
        contatoEmail: 'ana@escola.com',
        contatoTelefone: '(11) 98888-8888'
    }];
    DB.acoes = [{
        id: 1,
        agendamentoId: 1,
        escolaId: 1,
        tipo: 'Presencial',
        descricao: 'Formação inicial com os professores.',
        fotos: ['foto1.jpg', 'foto2.jpg'],
        dataRegistro: '2026-08-16'
    }];
    DB._id = 3;
    persistDB();
}

function persistDB() {
    localStorage.setItem('zmaker_db', JSON.stringify(DB));
}

// ====== HELPERS ======
const DB = {
    escolas: [],
    agendamentos: [],
    acoes: [],
    _id: 1
};

function getEscolaById(id) {
    return DB.escolas.find(e => e.id === Number(id));
}

function getAgendamentoById(id) {
    return DB.agendamentos.find(a => a.id === Number(id));
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
        <th>Endereço</th><th>Bairro</th><th>Cidade/UF</th>
        <th>Contato</th><th>ZMaker</th>
    </tr></thead><tbody>`;
    DB.escolas.forEach(e => {
        html += `<tr>
            <td>${e.cnpj}</td>
            <td>${e.razao}</td>
            <td>${e.fantasia}</td>
            <td>${e.endereco}, ${e.cep}</td>
            <td>${e.bairro}</td>
            <td>${e.cidade}/${e.uf}</td>
            <td>${e.contatoNome}</td>
            <td>${e.tipoZmaker}</td>
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
        <th>Escola</th><th>Tipo</th><th>Data/Hora</th>
        <th>Responsável</th><th>Contato</th><th>Ações</th>
    </tr></thead><tbody>`;
    DB.agendamentos.forEach(a => {
        const escola = getEscolaById(a.escolaId);
        const nomeEscola = escola ? escola.fantasia : 'N/E';
        html += `<tr>
            <td>${nomeEscola}</td>
            <td>${a.tipoEvento}</td>
            <td>${a.data} ${a.hora}</td>
            <td>${a.responsavel} - ${a.respNome}</td>
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
        <th>Escola</th><th>Tipo</th><th>Responsável</th><th>Data</th><th>Descrição</th><th>Fotos</th>
    </tr></thead><tbody>`;
    DB.acoes.forEach(ac => {
        const agendamento = getAgendamentoById(ac.agendamentoId);
        const escola = getEscolaById(ac.escolaId);
        const nomeEscola = escola ? escola.fantasia : 'N/E';
        const responsavel = agendamento ? `${agendamento.responsavel} - ${agendamento.respNome}` : 'N/I';
        html += `<tr>
            <td>${nomeEscola}</td>
            <td>${ac.tipo}</td>
            <td>${responsavel}</td>
            <td>${ac.dataRegistro || '—'}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ac.descricao || '—'}</td>
            <td>${ac.fotos ? ac.fotos.length : 0} foto(s)</td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ====== FORMULÁRIOS (com chamadas à API) ======
// Escola
document.getElementById('form-escola').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = {
        cnpj: document.getElementById('escola-cnpj').value,
        razao: document.getElementById('escola-razao').value,
        fantasia: document.getElementById('escola-fantasia').value,
        cep: document.getElementById('escola-cep').value.replace(/\D/g, ''),
        endereco: document.getElementById('escola-endereco').value,
        complemento: document.getElementById('escola-complemento').value,
        bairro: document.getElementById('escola-bairro').value,
        cidade: document.getElementById('escola-cidade').value,
        uf: document.getElementById('escola-uf').value,
        tipoZmaker: document.getElementById('escola-tipo-zmaker').value,
        origem: document.getElementById('escola-origem').value,
        bonificacao: document.getElementById('escola-bonificacao').value,
        contatoNome: document.getElementById('escola-contato-nome').value,
        contatoCargo: document.getElementById('escola-contato-cargo').value,
        contatoEmail: document.getElementById('escola-contato-email').value,
        contatoTelefone: document.getElementById('escola-contato-telefone').value
    };
    try {
        await createEscola(dados);
        await initData();
        document.getElementById('form-escola').reset();
        alert('Escola salva!');
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar escola. Verifique a conexão com o Power Automate.');
        // Fallback local
        const nova = { id: DB._id++, ...dados };
        DB.escolas.push(nova);
        persistDB();
        atualizarSelects();
        renderEscolas();
        alert('Escola salva localmente (fallback).');
    }
});

// Agendamento
document.getElementById('form-agendamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const escolaId = Number(document.getElementById('agendamento-escola').value);
    if (!escolaId) { alert('Selecione uma escola.'); return; }
    const dados = {
        escolaId: escolaId,
        tipoEvento: document.getElementById('agendamento-tipo-evento').value,
        data: document.getElementById('agendamento-data').value,
        hora: document.getElementById('agendamento-hora').value,
        responsavel: document.getElementById('agendamento-responsavel').value,
        respNome: document.getElementById('agendamento-resp-nome').value,
        respEmail: document.getElementById('agendamento-resp-email').value,
        respTelefone: document.getElementById('agendamento-resp-telefone').value,
        contatoNome: document.getElementById('agendamento-contato-nome').value,
        contatoCargo: document.getElementById('agendamento-contato-cargo').value,
        contatoEmail: document.getElementById('agendamento-contato-email').value,
        contatoTelefone: document.getElementById('agendamento-contato-telefone').value
    };
    try {
        await createAgendamento(dados);
        await initData();
        document.getElementById('form-agendamento').reset();
        alert('Agendamento criado!');
    } catch (error) {
        console.error(error);
        alert('Erro ao criar agendamento. Verifique a conexão.');
        const novo = { id: DB._id++, ...dados };
        DB.agendamentos.push(novo);
        persistDB();
        atualizarSelects();
        renderAgendamentos();
        alert('Agendamento salvo localmente (fallback).');
    }
});

// Ação
document.getElementById('form-acao').addEventListener('submit', async (e) => {
    e.preventDefault();
    const agendamentoId = Number(document.getElementById('acao-agendamento').value);
    const agendamento = getAgendamentoById(agendamentoId);
    if (!agendamento) { alert('Selecione um agendamento válido.'); return; }
    
    const fotosInput = document.getElementById('acao-fotos');
    const fotos = Array.from(fotosInput.files).map(f => f.name);
    
    const dados = {
        agendamentoId: agendamentoId,
        escolaId: agendamento.escolaId,
        tipo: document.getElementById('acao-tipo').value,
        descricao: document.getElementById('acao-descricao').value,
        fotos: fotos
    };
    try {
        await createAcao(dados);
        await initData();
        document.getElementById('form-acao').reset();
        document.getElementById('foto-count').textContent = '0 arquivo(s)';
        alert('Ação registrada!');
    } catch (error) {
        console.error(error);
        alert('Erro ao registrar ação. Verifique a conexão.');
        const novaAcao = { id: DB._id++, ...dados, dataRegistro: new Date().toISOString().split('T')[0] };
        DB.acoes.push(novaAcao);
        persistDB();
        renderAcoes();
        alert('Ação salva localmente (fallback).');
    }
});

// ====== ATUALIZAR SELECTS ======
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
    const selAcao = document.getElementById('acao-agendamento');
    if (selAcao) {
        const currentVal = selAcao.value;
        selAcao.innerHTML = '<option value="">Selecione o agendamento</option>';
        DB.agendamentos.forEach(a => {
            const escola = getEscolaById(a.escolaId);
            const nome = escola ? escola.fantasia : 'N/E';
            selAcao.innerHTML += `<option value="${a.id}">${nome} - ${a.tipoEvento} (${a.data}) - ${a.respNome}</option>`;
        });
        if (currentVal) selAcao.value = currentVal;
    }
}

// ====== CARREGAR AÇÃO A PARTIR DO AGENDAMENTO ======
window.carregarAcaoParaAgendamento = function(id) {
    const sel = document.getElementById('acao-agendamento');
    sel.value = id;
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
    
    document.getElementById('total-acoes').textContent = acoesFiltradas.length;
    const formacao = acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.agendamentoId);
        return ag && ag.tipoEvento === 'Formação Inicial/Continuada';
    }).length;
    document.getElementById('total-formacao').textContent = formacao;
    const montagem = acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.agendamentoId);
        return ag && ag.tipoEvento === 'Montagem de Equipamentos';
    }).length;
    document.getElementById('total-montagem').textContent = montagem;
    const reunioes = acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.agendamentoId);
        return ag && ag.tipoEvento && ag.tipoEvento.includes('Reunião');
    }).length;
    document.getElementById('total-reunioes').textContent = reunioes;
    
    const tipos = ['Remota', 'Presencial'];
    const counts = tipos.map(t => acoesFiltradas.filter(a => a.tipo === t).length);
    if (chartTipo) chartTipo.destroy();
    chartTipo = new Chart(document.getElementById('chart-acoes-tipo'), {
        type: 'bar',
        data: { labels: tipos, datasets: [{ label: 'Ações', data: counts, backgroundColor: ['#3b82f6', '#0f3b5e'] }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
    
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

// ====== RELATÓRIO ======
document.getElementById('gerar-relatorio').addEventListener('click', async () => {
    const escolaId = document.getElementById('relatorio-escola').value;
    const dataInicio = document.getElementById('relatorio-data-inicio').value;
    const dataFim = document.getElementById('relatorio-data-fim').value;

    const filtros = {};
    if (escolaId) filtros.escolaId = Number(escolaId);
    if (dataInicio) filtros.dataInicio = dataInicio;
    if (dataFim) filtros.dataFim = dataFim;

    try {
        const response = await gerarRelatorio(filtros);
        if (!response.ok) throw new Error('Erro ao gerar relatório');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Relatorio_Acoes.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar relatório. Verifique a conexão com o Power Automate.');
        // Fallback local
        const acoes = DB.acoes.filter(a => {
            let match = true;
            if (escolaId) match = match && a.escolaId === Number(escolaId);
            if (dataInicio) match = match && a.dataRegistro >= dataInicio;
            if (dataFim) match = match && a.dataRegistro <= dataFim;
            return match;
        });
        const preview = document.getElementById('preview-relatorio');
        if (!acoes.length) {
            preview.innerHTML = '<p>Nenhuma ação encontrada para os filtros.</p>';
            return;
        }
        let html = '<h3>Relatório de Ações (fallback)</h3><table><thead><tr><th>Escola</th><th>Tipo</th><th>Responsável</th><th>Data</th><th>Descrição</th></tr></thead><tbody>';
        acoes.forEach(a => {
            const escola = getEscolaById(a.escolaId);
            const ag = getAgendamentoById(a.agendamentoId);
            const responsavel = ag ? `${ag.responsavel} - ${ag.respNome}` : 'N/I';
            html += `<tr><td>${escola ? escola.fantasia : 'N/E'}</td><td>${a.tipo}</td><td>${responsavel}</td><td>${a.dataRegistro}</td><td>${a.descricao || '—'}</td></tr>`;
        });
        html += '</tbody></table><p><em>Relatório gerado localmente (fallback) em ' + new Date().toLocaleString() + '</em></p>';
        preview.innerHTML = html;
        alert('Relatório gerado localmente (fallback).');
    }
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
            atualizarSelects();
        }
    });
});

// ====== EVENTO FOTOS ======
document.getElementById('acao-fotos').addEventListener('change', function() {
    document.getElementById('foto-count').textContent = this.files.length + ' arquivo(s)';
});

// ====== INICIALIZAÇÃO ======
initData();

// Eventos de filtro do dashboard
document.getElementById('aplicar-filtros-dash').addEventListener('click', atualizarDashboard);
document.querySelectorAll('#dashboard-escola, #dashboard-data-inicio, #dashboard-data-fim').forEach(el => {
    el.addEventListener('change', atualizarDashboard);
});