// ====== CARREGAR CONFIGURAÇÃO ======
const API = window.API_CONFIG;

// ====== FUNÇÕES DE LOADING ======
function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

// ====== FUNÇÃO PARA FAZER REQUISIÇÕES ======
async function callAPI(url, method = 'GET', data = null) {
    if (!url) return []; // Retorna vazio se a URL não estiver configurada no config.js
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'respond-async=false'
        },
    };
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (response.status === 202) {
        return { success: true, async: true, status: 202 };
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return await response.json();
    } else {
        const text = await response.text();
        if (!text) return { success: true };
        try {
            return JSON.parse(text);
        } catch {
            return { success: true, message: text };
        }
    }
}

// ====== FUNÇÕES DE CRUD (AGORA COM GERENTES E EQUIPE) ======
async function getEscolas() { 
    const res = await callAPI(API.getEscolas, 'GET'); 
    return res.value || (Array.isArray(res) ? res : []); 
}
async function createEscola(dados) { return await callAPI(API.postEscola, 'POST', dados); }

async function getAgendamentos() { 
    const res = await callAPI(API.getAgendamentos, 'GET'); 
    return res.value || (Array.isArray(res) ? res : []); 
}
async function createAgendamento(dados) { return await callAPI(API.postAgendamento, 'POST', dados); }

async function getAcoes() { 
    const res = await callAPI(API.getAcoes, 'GET'); 
    return res.value || (Array.isArray(res) ? res : []); 
}
async function createAcao(dados) { return await callAPI(API.postAcao, 'POST', dados); }

async function getLogistica() {
    try { 
        const res = await callAPI(API.getLogistica, 'GET'); 
        return res.value || (Array.isArray(res) ? res : []); 
    } catch(e) { return []; }
}
async function createLogistica(dados) { return await callAPI(API.postLogistica, 'POST', dados); }

// NOVOS CRUDS - GERENTES E EQUIPE
async function getGerentes() { 
    const res = await callAPI(API.getGerentes, 'GET'); 
    return res.value || (Array.isArray(res) ? res : []); 
}
async function createGerente(dados) { return await callAPI(API.postGerente, 'POST', dados); }

async function getEquipe() { 
    const res = await callAPI(API.getEquipe, 'GET'); 
    return res.value || (Array.isArray(res) ? res : []); 
}
async function createEquipe(dados) { return await callAPI(API.postEquipe, 'POST', dados); }

// ====== CONVERSÃO DE DATAS ======
function excelDateToDate(serial) {
    if (serial === undefined || serial === null || serial === '') return '';
    let val = String(serial).trim();
    if (val.includes('/')) return val.split(' ')[0]; 
    if (val.includes('-')) {
        const partes = val.split('T')[0].split('-');
        if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
        return val;
    }
    if (!isNaN(Number(val))) {
        const epoch = new Date(1899, 11, 30);
        const date = new Date(epoch.getTime() + (Number(val) * 86400000));
        if (isNaN(date.getTime())) return val;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    return val;
}

function excelDateToISO(serial) {
    if (!serial) return '';
    let val = String(serial).trim();
    if (val.includes('-')) return val.split('T')[0];
    if (val.includes('/')) {
        const p = val.split(' ')[0].split('/');
        if (p.length === 3) {
            let p0 = parseInt(p[0], 10), p1 = parseInt(p[1], 10), p2 = p[2].length === 2 ? '20' + p[2] : p[2];
            let dia, mes;
            if (p0 > 12) { dia = String(p0).padStart(2, '0'); mes = String(p1).padStart(2, '0'); } 
            else if (p1 > 12) { mes = String(p0).padStart(2, '0'); dia = String(p1).padStart(2, '0'); } 
            else { dia = String(p0).padStart(2, '0'); mes = String(p1).padStart(2, '0'); }
            return `${p2}-${mes}-${dia}`;
        }
    }
    if (!isNaN(Number(val))) {
        const epoch = new Date(1899, 11, 30);
        const date = new Date(epoch.getTime() + (Number(val) * 86400000));
        if (isNaN(date.getTime())) return val;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    return val;
}

function formatExcelDateTime(dateVal, timeVal) {
    const dataFormatada = excelDateToDate(dateVal);
    let timeValStr = String(timeVal || '').trim();
    if(timeValStr.includes(':')) timeValStr = timeValStr.substring(0,5);
    else if(!isNaN(Number(timeValStr)) && timeValStr !== '') {
        const totalSecs = Math.round(Number(timeValStr.replace(',','.')) * 86400);
        timeValStr = `${String(Math.floor(totalSecs/3600)).padStart(2,'0')}:${String(Math.floor((totalSecs%3600)/60)).padStart(2,'0')}`;
    } else { timeValStr = ''; }
    
    if (dataFormatada && timeValStr) return `${dataFormatada} às ${timeValStr}`;
    if (dataFormatada) return dataFormatada;
    return timeValStr;
}

// ====== BUSCA DE CEP ======
async function buscarCEP(cep) {
    try {
        cep = cep.replace(/\D/g, '');
        if (cep.length !== 8) { alert('CEP deve ter 8 dígitos.'); return null; }
        const btn = document.getElementById('buscar-cep');
        const txt = btn.innerHTML;
        btn.innerHTML = 'Buscando...'; btn.disabled = true;
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        btn.innerHTML = txt; btn.disabled = false;
        if (data.erro) { alert('CEP não encontrado.'); return null; }
        return data;
    } catch (e) { alert('Erro ao buscar CEP.'); return null; }
}

document.getElementById('buscar-cep').addEventListener('click', () => {
    preencherEndereco(document.getElementById('escola-cep').value);
});

async function preencherEndereco(cep) {
    const dados = await buscarCEP(cep);
    if (!dados) return;
    document.getElementById('escola-endereco').value = dados.logradouro || '';
    document.getElementById('escola-bairro').value = dados.bairro || '';
    document.getElementById('escola-cidade').value = dados.localidade || '';
    document.getElementById('escola-uf').value = dados.uf || '';
    document.getElementById('escola-complemento').focus();
}

// ====== BANCO DE DADOS LOCAL ======
const DB = { escolas: [], agendamentos: [], acoes: [], logistica: [], gerentes: [], equipe: [] };

// ====== INICIALIZAR DADOS ======
async function initData() {
    try {
        const [escolas, agendamentos, acoes, logistica, gerentes, equipe] = await Promise.all([
            getEscolas(), getAgendamentos(), getAcoes(), getLogistica(), getGerentes(), getEquipe()
        ]);
        
        DB.escolas = (Array.isArray(escolas) ? escolas : []).map((e, i) => ({ ...e, ID: String(e.ID || e.id || e.idEscola || i + 1).trim() }));
        DB.agendamentos = (Array.isArray(agendamentos) ? agendamentos : []).map((a, i) => ({ ...a, ID: String(a.ID || a.id || i + 1).trim(), EscolaID: String(a.EscolaID || a.escolaID || '').trim() }));
        DB.acoes = (Array.isArray(acoes) ? acoes : []).map((a, i) => ({ ...a, ID: String(a.ID || a.id || i + 1).trim(), AgendamentoID: String(a.AgendamentoID || a.agendamentoID || '').trim(), EscolaID: String(a.EscolaID || a.escolaID || '').trim() }));
        DB.logistica = (Array.isArray(logistica) ? logistica : []).map(l => ({ ...l, EscolaID: String(l.EscolaID || l.escolaID || '').trim() }));
        
        // Novos Arrays
        DB.gerentes = (Array.isArray(gerentes) ? gerentes : []).map((g, i) => ({ ...g, ID: String(g.ID || g.id || i + 1).trim() }));
        DB.equipe = (Array.isArray(equipe) ? equipe : []).map((eq, i) => ({ ...eq, ID: String(eq.ID || eq.id || i + 1).trim() }));
        
        console.log('✅ Dados carregados.');
    } catch (error) { console.error('❌ Erro:', error); }
    
    atualizarSelects();
    renderEscolas();
    renderAgendamentos();
    renderAcoes();
    renderPainelLogistica();
    renderRoteiros();
    renderGerentes();
    renderEquipe();
    atualizarDashboard(); 
}

// ====== HELPERS ======
function getEscolaById(id) {
    if (!id) return null;
    return DB.escolas.find(e => e.ID === String(id).trim() || e.ID.startsWith(String(id).trim()));
}
function getAgendamentoById(id) {
    if (!id) return null;
    return DB.agendamentos.find(a => a.ID === String(id).trim());
}
function getEscolasOptions() {
    if (!DB.escolas.length) return '<option value="">Nenhuma escola cadastrada</option>';
    let optionsHtml = '<option value="">Selecione uma escola...</option>';
    optionsHtml += DB.escolas.map(e => `<option value="${e.ID}">${e.NomeFantasia || e.RazaoSocial || 'Sem nome'} (${e.Cidade || '—'})</option>`).join('');
    return optionsHtml;
}

// ====== RENDERIZAÇÃO DE TABELAS ======
function renderEscolas() {
    const container = document.getElementById('lista-escolas');
    if (!DB.escolas.length) { container.innerHTML = '<p>Nenhuma escola encontrada.</p>'; return; }
    let html = `<table><thead><tr><th>Razão Social</th><th>Fantasia</th><th>Cidade/UF</th><th>ZMaker</th></tr></thead><tbody>`;
    DB.escolas.forEach(e => {
        html += `<tr><td>${e.RazaoSocial || ''}</td><td>${e.NomeFantasia || ''}</td><td>${e.Cidade || ''}/${e.UF || ''}</td><td>${e.TipoZMaker || ''}</td></tr>`;
    });
    container.innerHTML = html + '</tbody></table>';
}

function renderAgendamentos() {
    const container = document.getElementById('lista-agendamentos');
    if (!DB.agendamentos.length) { container.innerHTML = '<p>Nenhum agendamento encontrado.</p>'; return; }
    let html = `<table><thead><tr><th>Escola</th><th>Tipo</th><th>Data/Hora</th><th>Responsável</th><th>Ações</th></tr></thead><tbody>`;
    DB.agendamentos.forEach(a => {
        const esc = getEscolaById(a.EscolaID);
        const jaRegistrado = DB.acoes.some(ac => ac.AgendamentoID === a.ID);
        let btn = jaRegistrado ? `<span style="color:#10b981;font-weight:bold;">✓ Concluído</span>` : `<button class="btn-primary" onclick="carregarAcaoParaAgendamento('${a.ID}')">Registrar Ação</button>`;
        html += `<tr><td>${esc ? esc.NomeFantasia : 'N/E'}</td><td>${a.TipoEvento || ''}</td><td>${formatExcelDateTime(a.Data, a.Hora)}</td><td>${a.RespNome || ''}</td><td>${btn}</td></tr>`;
    });
    container.innerHTML = html + '</tbody></table>';
}

function renderAcoes() {
    const container = document.getElementById('lista-acoes');
    if (!DB.acoes.length) { container.innerHTML = '<p>Nenhuma ação registrada.</p>'; return; }
    let html = `<table><thead><tr><th>Escola</th><th>Tipo</th><th>Data</th><th>Horas</th><th>Descrição</th></tr></thead><tbody>`;
    DB.acoes.forEach(ac => {
        const esc = getEscolaById(ac.EscolaID);
        html += `<tr><td>${esc ? esc.NomeFantasia : 'N/E'}</td><td>${ac.Tipo || ''}</td><td>${excelDateToDate(ac.DataRegistro || ac.Data)}</td><td>${ac.CHAcao || ac.CargaHoraria || 0}h</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ac.Descricao || ''}</td></tr>`;
    });
    container.innerHTML = html + '</tbody></table>';
}

function renderGerentes() {
    const container = document.getElementById('lista-gerentes');
    if (!DB.gerentes.length) { container.innerHTML = '<p>Nenhuma gerente cadastrada.</p>'; return; }
    let html = `<table><thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th></tr></thead><tbody>`;
    DB.gerentes.forEach(g => {
        html += `<tr><td>${g.Nome || g.nome || ''}</td><td>${g.Email || g.email || ''}</td><td>${g.Telefone || g.telefone || ''}</td></tr>`;
    });
    container.innerHTML = html + '</tbody></table>';
}

function renderEquipe() {
    const container = document.getElementById('lista-equipe');
    if (!DB.equipe.length) { container.innerHTML = '<p>Nenhum responsável cadastrado.</p>'; return; }
    let html = `<table><thead><tr><th>Nome</th><th>Cargo</th><th>E-mail</th><th>Telefone</th></tr></thead><tbody>`;
    DB.equipe.forEach(eq => {
        html += `<tr><td>${eq.Nome || eq.nome || ''}</td><td>${eq.Cargo || eq.cargo || ''}</td><td>${eq.Email || eq.email || ''}</td><td>${eq.Telefone || eq.telefone || ''}</td></tr>`;
    });
    container.innerHTML = html + '</tbody></table>';
}

function renderPainelLogistica() {
    const container = document.getElementById('painel-gerencial-logistica');
    const filtroEscola = document.getElementById('filtro-gerencial-escola').value;
    
    let listaMostrar = DB.escolas;
    if (filtroEscola) listaMostrar = DB.escolas.filter(e => e.ID === filtroEscola);
    
    if (!listaMostrar.length) { container.innerHTML = '<p>Nenhuma escola para exibir.</p>'; return; }
    
    let html = `<table><thead><tr>
        <th>Escola</th><th>Tensão</th><th>Faseada</th><th>Status Material</th><th>Adesivação</th><th>Previsão Entrega</th>
    </tr></thead><tbody>`;
    
    listaMostrar.forEach(e => {
        const logsEscola = DB.logistica.filter(l => l.EscolaID === e.ID);
        const log = logsEscola.length > 0 ? logsEscola[logsEscola.length - 1] : null;
        
        const tensao = log ? (log.Tensao || log.tensao || '—') : '—';
        const faseada = log ? (log.Faseada || log.faseada || '—') : '—';
        const material = log ? (log.MaterialEntregue || log.Material || log.material || 'Pendente') : 'Pendente';
        const adesivacao = log ? (log.Adesivacao || log.adesivacao || 'Pendente') : 'Pendente';
        const previsao = log && (log.PrevisaoEntrega || log.previsao) ? excelDateToDate(log.PrevisaoEntrega || log.previsao) : '—';
        
        let badgeMat = `<span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; background: #f1f5f9; color: #475569;">${material}</span>`;
        if(material.includes('Concluído')) badgeMat = `<span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; background: #dcfce7; color: #166534;">${material}</span>`;
        else if(material.includes('Trânsito') || material.includes('Separação')) badgeMat = `<span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; background: #fef9c3; color: #854d0e;">${material}</span>`;

        let badgeAdes = `<span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; background: #f1f5f9; color: #475569;">${adesivacao}</span>`;
        if(adesivacao.includes('Concluído')) badgeAdes = `<span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; background: #dcfce7; color: #166534;">${adesivacao}</span>`;
        else if(adesivacao.includes('Andamento')) badgeAdes = `<span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; background: #fef9c3; color: #854d0e;">${adesivacao}</span>`;

        html += `<tr>
            <td style="font-weight: bold; color:#0f3b5e;">${e.NomeFantasia || 'Sem Nome'}</td>
            <td>${tensao}</td>
            <td>${faseada}</td>
            <td>${badgeMat}</td>
            <td>${badgeAdes}</td>
            <td>${previsao}</td>
        </tr>`;
    });
    
    container.innerHTML = html + '</tbody></table>';
}

// ====== EVENTOS DE AUTO-PREENCHIMENTO (AGORA BASEADO NO BANCO DE DADOS) ======
document.addEventListener('DOMContentLoaded', () => {
    
    // Auto-preenchimento do Responsável Técnico (Equipe)
    const selResponsavel = document.getElementById('agendamento-responsavel');
    if(selResponsavel) {
        selResponsavel.addEventListener('change', (e) => {
            const pessoa = DB.equipe.find(p => p.ID === e.target.value);
            document.getElementById('agendamento-resp-nome').value = pessoa ? (pessoa.Nome || pessoa.nome) : '';
            document.getElementById('agendamento-resp-email').value = pessoa ? (pessoa.Email || pessoa.email) : '';
            document.getElementById('agendamento-resp-telefone').value = pessoa ? (pessoa.Telefone || pessoa.telefone) : '';
        });
    }

    // Auto-preenchimento do e-mail da Gerente quando selecionada na lista
    const selGerenteAgend = document.getElementById('agendamento-gerente');
    if(selGerenteAgend) {
        selGerenteAgend.addEventListener('change', (e) => {
            const gerente = DB.gerentes.find(g => g.ID === e.target.value);
            document.getElementById('agendamento-email-gerente').value = gerente ? (gerente.Email || gerente.email) : '';
        });
    }

    // Auto-selecionar a Gerente automaticamente ao escolher a Escola
    const selEscolaAgend = document.getElementById('agendamento-escola');
    if(selEscolaAgend) {
        selEscolaAgend.addEventListener('change', (e) => {
            const escolaId = e.target.value;
            const escola = getEscolaById(escolaId);
            
            const dropdownGerente = document.getElementById('agendamento-gerente');
            if (escola && (escola.GerenteID || escola.gerenteID)) {
                dropdownGerente.value = String(escola.GerenteID || escola.gerenteID);
            } else {
                dropdownGerente.value = '';
            }
            // Força a atualização da caixinha de e-mail disparando o evento de mudança
            if (dropdownGerente) dropdownGerente.dispatchEvent(new Event('change'));
        });
    }
}); // AQUI estava faltando o fechamento da função!

// ====== NOVOS FORMULÁRIOS: GERENTE E EQUIPE ======
document.getElementById('form-gerente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = {
        Nome: document.getElementById('gerente-nome').value,
        Email: document.getElementById('gerente-email').value,
        Telefone: document.getElementById('gerente-telefone').value
    };
    showLoading();
    try {
        await createGerente(dados);
        await new Promise(r => setTimeout(r, 2000));
        await initData();
        document.getElementById('form-gerente').reset();
        alert('Gerente salva com sucesso!');
    } catch (error) { alert('Erro ao salvar gerente.'); } finally { hideLoading(); }
});

document.getElementById('form-equipe').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = {
        Nome: document.getElementById('equipe-nome').value,
        Email: document.getElementById('equipe-email').value,
        Telefone: document.getElementById('equipe-telefone').value,
        Cargo: document.getElementById('equipe-cargo').value
    };
    showLoading();
    try {
        await createEquipe(dados);
        await new Promise(r => setTimeout(r, 2000));
        await initData();
        document.getElementById('form-equipe').reset();
        alert('Responsável salvo com sucesso!');
    } catch (error) { alert('Erro ao salvar responsável.'); } finally { hideLoading(); }
});

// ====== LÓGICA DO FORMULÁRIO DE LOGÍSTICA ======
document.getElementById('logistica-escola').addEventListener('change', function() {
    const escolaId = this.value;
    const form = document.getElementById('form-logistica');
    if(!escolaId) { form.reset(); return; }

    const logsEscola = DB.logistica.filter(l => l.EscolaID === escolaId);
    if(logsEscola.length > 0) {
        const logInfo = logsEscola[logsEscola.length - 1];
        document.getElementById('log-tensao').value = logInfo.Tensao || logInfo.tensao || '';
        document.getElementById('log-faseada').value = logInfo.Faseada || logInfo.faseada || '';
        document.getElementById('log-adesivacao').value = logInfo.Adesivacao || logInfo.adesivacao || '';
        document.getElementById('log-material').value = logInfo.MaterialEntregue || logInfo.Material || logInfo.material || '';
        document.getElementById('log-previsao').value = excelDateToISO(logInfo.PrevisaoEntrega || logInfo.previsao);
        document.getElementById('log-pedido-fases').value = logInfo.PedidoFases || logInfo.pedidoFases || '';
        document.getElementById('log-pedido-bonificacao').value = logInfo.PedidoBonificacao || logInfo.pedidoBonificacao || '';
    } else {
        document.getElementById('log-tensao').value = '';
        document.getElementById('log-faseada').value = '';
        document.getElementById('log-adesivacao').value = '';
        document.getElementById('log-material').value = '';
        document.getElementById('log-previsao').value = '';
        document.getElementById('log-pedido-fases').value = '';
        document.getElementById('log-pedido-bonificacao').value = '';
    }
});

document.getElementById('form-logistica').addEventListener('submit', async (e) => {
    e.preventDefault();
    const escolaIdValue = document.getElementById('logistica-escola').value;
    if (!escolaIdValue) { alert('Selecione uma escola.'); return; }

    const dados = {
        EscolaID: escolaIdValue,
        Tensao: document.getElementById('log-tensao').value,
        Faseada: document.getElementById('log-faseada').value,
        Adesivacao: document.getElementById('log-adesivacao').value,
        MaterialEntregue: document.getElementById('log-material').value,
        PrevisaoEntrega: document.getElementById('log-previsao').value,
        PedidoFases: document.getElementById('log-pedido-fases').value,
        PedidoBonificacao: document.getElementById('log-pedido-bonificacao').value
    };

    showLoading(); 
    try {
        await createLogistica(dados);
        await new Promise(r => setTimeout(r, 2000));
        await initData();
        alert('Informações de implantação salvas com sucesso!');
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar as informações logísticas.');
    } finally { hideLoading(); }
});

// ====== FORMULÁRIOS RESTANTES ======
document.getElementById('form-escola').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const gerenteId = document.getElementById('escola-gerente').value;
    const gerenteObj = DB.gerentes.find(g => g.ID === gerenteId);
    
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
        GerenteID: gerenteId,
        GerenteNome: gerenteObj ? (gerenteObj.Nome || gerenteObj.nome) : '',
        GerenteEmail: gerenteObj ? (gerenteObj.Email || gerenteObj.email) : '',
        contatoNome: document.getElementById('escola-contato-nome').value,
        contatoCargo: document.getElementById('escola-contato-cargo').value,
        contatoEmail: document.getElementById('escola-contato-email').value,
        contatoTelefone: document.getElementById('escola-contato-telefone').value
    };
    showLoading(); 
    try {
        await createEscola(dados);
        await new Promise(r => setTimeout(r, 2000));
        await initData(); 
        document.getElementById('form-escola').reset();
        alert('Escola salva com sucesso!');
    } catch (error) { alert('Erro ao salvar.'); } finally { hideLoading(); }
});

document.getElementById('form-agendamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const escolaIdValue = document.getElementById('agendamento-escola').value;
    const rawData = document.getElementById('agendamento-data').value; 
    const rawHora = document.getElementById('agendamento-hora').value; 
    
    const escola = getEscolaById(escolaIdValue);
    
    const dados = {
        EscolaID: String(escolaIdValue).trim(), 
        TipoEvento: document.getElementById('agendamento-tipo-evento').value,
        Data: rawData ? rawData.split('T')[0] : '', 
        Hora: rawHora ? rawHora.substring(0, 5) : '',
        Responsavel: document.getElementById('agendamento-responsavel').value,
        RespNome: document.getElementById('agendamento-resp-nome').value,
        RespEmail: document.getElementById('agendamento-resp-email').value,
        RespTelefone: document.getElementById('agendamento-resp-telefone').value,
        ContatoNome: document.getElementById('agendamento-contato-nome').value,
        ContatoCargo: document.getElementById('agendamento-contato-cargo').value,
        ContatoEmail: document.getElementById('agendamento-contato-email').value,
        ContatoTelefone: document.getElementById('agendamento-contato-telefone').value,
        EmailEscola: escola ? escola.ContatoEmail : '',
        EmailGerente: document.getElementById('agendamento-email-gerente').value
    };
    
    showLoading(); 
    try {
        await createAgendamento(dados);
        await new Promise(r => setTimeout(r, 2000));
        await initData(); 
        document.getElementById('form-agendamento').reset();
        alert('Agendamento criado e e-mails enviados para fila!');
    } catch (error) { alert('Erro ao salvar o agendamento.'); } finally { hideLoading(); }
});

// ====== LÓGICA DO CHECKLIST DE HARDWARE ======
document.getElementById('acao-agendamento').addEventListener('change', function() {
    const agId = this.value;
    const ag = getAgendamentoById(agId);
    const areaSetup = document.getElementById('area-setup-hardware');
    
    if (ag && (ag.TipoEvento === 'Montagem de Equipamentos' || ag.tipoEvento === 'Montagem de Equipamentos')) {
        if(areaSetup) areaSetup.style.display = 'block';
    } else {
        if(areaSetup) {
            areaSetup.style.display = 'none';
            document.querySelectorAll('.chk-equipamento').forEach(chk => chk.checked = false);
        }
    }
});

document.getElementById('form-acao').addEventListener('submit', async (e) => {
    e.preventDefault();
    const agendamentoIdValue = document.getElementById('acao-agendamento').value;
    const agendamento = getAgendamentoById(agendamentoIdValue);
    if (!agendamento) { alert('Selecione um agendamento válido.'); return; }
    
    let descricaoFinal = document.getElementById('acao-descricao').value;
    const areaSetup = document.getElementById('area-setup-hardware');
    
    if (areaSetup && areaSetup.style.display === 'block') {
        let presentes = [];
        let ausentes = [];
        
        document.querySelectorAll('.chk-equipamento').forEach(chk => {
            if (chk.checked) presentes.push(chk.value);
            else ausentes.push(chk.value);
        });
        
        descricaoFinal += `\n\n[INVENTÁRIO E SETUP]`;
        descricaoFinal += `\n✅ CONFERIDOS: ${presentes.length > 0 ? presentes.join(', ') : 'Nenhum item marcado.'}`;
        descricaoFinal += `\n❌ PENDENTES/AUSENTES: ${ausentes.length > 0 ? ausentes.join(', ') : 'Nenhuma pendência.'}`;
    }

    showLoading(); 
    try {
        const filePromises = Array.from(document.getElementById('acao-fotos').files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve({ name: file.name, mimeType: file.type, contentBytes: reader.result.split(',')[1] });
                reader.onerror = error => reject(error);
            });
        });
        const fotosBase64 = await Promise.all(filePromises);

        const dados = {
            AgendamentoID: String(agendamentoIdValue).trim(),
            EscolaID: String(agendamento.EscolaID).trim(),
            Tipo: document.getElementById('acao-tipo').value,
            Descricao: descricaoFinal,
            DataRegistro: document.getElementById('acao-data').value,
            CargaHoraria: Number(document.getElementById('acao-horas').value) || 0, 
            Fotos: fotosBase64 
        };

        await createAcao(dados);
        await new Promise(r => setTimeout(r, 2000));
        await initData();
        document.getElementById('form-acao').reset();
        document.getElementById('foto-count').textContent = '0 arquivo(s)';
        
        if(areaSetup) areaSetup.style.display = 'none';
        
        alert('Ação registrada com sucesso!');
    } catch (error) { alert('Erro ao registrar a ação.'); } finally { hideLoading(); }
});

// ====== ATUALIZAR SELECTS ======
function atualizarSelects() {
    const selects = ['agendamento-escola', 'dashboard-escola', 'relatorio-escola', 'logistica-escola', 'filtro-gerencial-escola', 'termo-escola'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            const currentVal = sel.value;
            sel.innerHTML = (id === 'filtro-gerencial-escola' || id === 'dashboard-escola' || id === 'relatorio-escola' || id === 'termo-escola') ? 
                            '<option value="">Todas as Escolas / Selecione...</option>' + getEscolasOptions().replace('<option value="">Selecione uma escola...</option>', '') : 
                            getEscolasOptions();
            if (currentVal) sel.value = currentVal;
        }
    });

    // Puxa as gerentes cadastradas no DB
    const selGerente = document.getElementById('escola-gerente');
    if (selGerente) {
        const currentVal = selGerente.value;
        selGerente.innerHTML = '<option value="">Selecione a Gerente da Conta...</option>';
        DB.gerentes.forEach(g => {
            selGerente.innerHTML += `<option value="${g.ID}">${g.Nome || g.nome}</option>`;
        });
        if (currentVal) selGerente.value = currentVal;
    }

    // Puxa as gerentes para a aba de Agendamentos
    const selGerenteAgend = document.getElementById('agendamento-gerente');
    if (selGerenteAgend) {
        const currentVal = selGerenteAgend.value;
        selGerenteAgend.innerHTML = '<option value="">Selecione a Gerente...</option>';
        DB.gerentes.forEach(g => {
            selGerenteAgend.innerHTML += `<option value="${g.ID}">${g.Nome || g.nome}</option>`;
        });
        if (currentVal) selGerenteAgend.value = currentVal;
    }

    // Puxa a equipe cadastrada no DB
    const selResp = document.getElementById('agendamento-responsavel');
    if (selResp) {
        const currentVal = selResp.value;
        selResp.innerHTML = '<option value="">Selecione o Responsável...</option>';
        DB.equipe.forEach(eq => {
            selResp.innerHTML += `<option value="${eq.ID}">${eq.Nome || eq.nome}</option>`;
        });
        if (currentVal) selResp.value = currentVal;
    }
    
    const selAcao = document.getElementById('acao-agendamento');
    if (selAcao) {
        const currentVal = selAcao.value;
        selAcao.innerHTML = '<option value="">Selecione um agendamento pendente...</option>';
        DB.agendamentos.forEach(a => {
            const jaRegistrado = DB.acoes.some(ac => ac.AgendamentoID === a.ID);
            if (!jaRegistrado) {
                const esc = getEscolaById(a.EscolaID);
                selAcao.innerHTML += `<option value="${a.ID}">${esc ? esc.NomeFantasia : 'N/E'} - ${a.TipoEvento} (${formatExcelDateTime(a.Data, a.Hora)})</option>`;
            }
        });
        if (currentVal) selAcao.value = currentVal;
        selAcao.dispatchEvent(new Event('change'));
    }
}

document.getElementById('filtro-gerencial-escola').addEventListener('change', renderPainelLogistica);

// ====== NAVEGAÇÃO ======
window.carregarAcaoParaAgendamento = function(id) {
    const sel = document.getElementById('acao-agendamento');
    if(!Array.from(sel.options).some(opt => opt.value === id)) { alert('Ação já registrada.'); return; }
    sel.value = id;
    sel.dispatchEvent(new Event('change')); 
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-acoes').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="acoes"]').classList.add('active');
};

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn, .tab-content').forEach(e => e.classList.remove('active'));
        btn.classList.add('active'); document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        if (['relatorios', 'logistica', 'dashboard', 'roteiros', 'termos'].includes(btn.dataset.tab)) {
            atualizarSelects();
        }
    });
});

// ====== DASHBOARD E PROGRESSO ======
let chartTipo = null, chartEscola = null;

function atualizarDashboard() {
    const escolaFiltro = document.getElementById('dashboard-escola').value;
    const dataInicio = document.getElementById('dashboard-data-inicio').value;
    const dataFim = document.getElementById('dashboard-data-fim').value;

    let acoesFiltradas = [...DB.acoes];

    if (escolaFiltro) {
        acoesFiltradas = acoesFiltradas.filter(a => String(a.EscolaID || a.escolaID || a.escolaId) === String(escolaFiltro));
    }
    if (dataInicio) {
        acoesFiltradas = acoesFiltradas.filter(a => excelDateToISO(a.DataRegistro || a.dataRegistro || a.Data || a.data) >= dataInicio);
    }
    if (dataFim) {
        acoesFiltradas = acoesFiltradas.filter(a => {
            const iso = excelDateToISO(a.DataRegistro || a.dataRegistro || a.Data || a.data);
            return iso && iso <= dataFim;
        });
    }

    const somarHoras = (lista) => lista.reduce((acc, curr) => acc + Number(curr.CHAcao || curr.chAcao || curr.CargaHoraria || curr.cargaHoraria || curr.Horas || curr.horas || 0), 0);

    document.getElementById('total-acoes').textContent = somarHoras(acoesFiltradas) + 'h';
    document.getElementById('total-formacao').textContent = somarHoras(acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento || ag.tipoEvento) === 'Formação Inicial/Continuada';
    })) + 'h';
    document.getElementById('total-montagem').textContent = somarHoras(acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento || ag.tipoEvento) === 'Montagem de Equipamentos';
    })) + 'h';
    document.getElementById('total-reunioes').textContent = somarHoras(acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento || ag.tipoEvento || '').includes('Reunião');
    })) + 'h';

    const tipos = ['Remota', 'Presencial'];
    const counts = tipos.map(t => somarHoras(acoesFiltradas.filter(a => (a.Tipo || a.tipo) === t)));
    
    if (chartTipo) chartTipo.destroy();
    chartTipo = new Chart(document.getElementById('chart-acoes-tipo'), {
        type: 'bar',
        data: { labels: tipos, datasets: [{ label: 'Horas', data: counts, backgroundColor: ['#3b82f6', '#0f3b5e'] }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const escolasIds = [...new Set(acoesFiltradas.map(a => String(a.EscolaID || a.escolaID || a.escolaId)))];
    const escolasNomes = escolasIds.map(id => { const e = getEscolaById(id); return e ? (e.NomeFantasia || e.fantasia) : 'N/E'; });
    const contagens = escolasIds.map(id => somarHoras(acoesFiltradas.filter(a => String(a.EscolaID || a.escolaID || a.escolaId) === String(id))));
    
    if (chartEscola) chartEscola.destroy();
    chartEscola = new Chart(document.getElementById('chart-acoes-escola'), {
        type: 'pie',
        data: { labels: escolasNomes, datasets: [{ data: contagens, backgroundColor: ['#3b82f6', '#0f3b5e', '#64748b', '#94a3b8', '#cbd5e1'] }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    renderProgressoImplantacao();
}

function calcularStatusEscola(escolaId) {
    const logs = DB.logistica.filter(l => String(l.EscolaID) === String(escolaId));
    const log = logs.length > 0 ? logs[logs.length - 1] : null; 
    
    const adesivacaoOk = log && log.Adesivacao && log.Adesivacao.includes('Concluído');
    const materialOk = log && log.MaterialEntregue && log.MaterialEntregue.includes('Concluído');
    
    const acoesEscola = DB.acoes.filter(a => String(a.EscolaID) === String(escolaId));
    
    const montagemOk = acoesEscola.some(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento || ag.tipoEvento) === 'Montagem de Equipamentos';
    });
    
    const formacaoOk = acoesEscola.some(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento || ag.tipoEvento) === 'Formação Inicial/Continuada';
    });

    let progresso = 10; 
    let statusAtual = "Aguardando Logística";
    let cor = "#3b82f6"; 
    
    let marcos = 0;
    if (adesivacaoOk) marcos++;
    if (materialOk) marcos++;
    if (montagemOk) marcos++;
    if (formacaoOk) marcos++;

    if (marcos === 1) { progresso = 35; statusAtual = "Logística em Andamento"; }
    if (marcos === 2) { progresso = 60; statusAtual = "Infra e Materiais Entregues"; }
    if (marcos === 3) { progresso = 80; statusAtual = "Equipamentos Montados"; cor = "#f59e0b"; } 
    if (marcos === 4) { progresso = 100; statusAtual = "ZMaker Lab Operando 🚀"; cor = "#10b981"; } 

    return { progresso, statusAtual, cor, adesivacaoOk, materialOk, montagemOk, formacaoOk };
}

function renderProgressoImplantacao() {
    const escolaFiltro = document.getElementById('dashboard-escola').value;
    const container = document.getElementById('lista-progresso-escolas');
    if(!container) return;

    let escolasExibir = DB.escolas;
    if (escolaFiltro) {
        escolasExibir = DB.escolas.filter(e => String(e.ID) === String(escolaFiltro));
    }

    if (escolasExibir.length === 0) {
        container.innerHTML = '<p>Nenhuma escola disponível.</p>';
        return;
    }

    let html = '';
    escolasExibir.forEach(e => {
        const st = calcularStatusEscola(e.ID);
        
        html += `
        <div class="progress-container">
            <div class="progress-header">
                <span>${e.NomeFantasia || e.RazaoSocial || 'Escola'}</span>
                <span style="color: ${st.cor};">${st.progresso}% - ${st.statusAtual}</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${st.progresso}%; background-color: ${st.cor};"></div>
            </div>
            <div class="progress-steps">
                <div class="progress-step completed">Cadastro</div>
                <div class="progress-step ${st.adesivacaoOk ? 'completed' : ''}">Adesivação</div>
                <div class="progress-step ${st.materialOk ? 'completed' : ''}">Materiais</div>
                <div class="progress-step ${st.montagemOk ? 'completed' : ''}">Montagem</div>
                <div class="progress-step ${st.formacaoOk ? 'active-final' : ''}">Operação</div>
            </div>
        </div>
        `;
    });
    container.innerHTML = html;
}

// ====== MÓDULO DE ROTEIROS (LISTA E MAPA) ======
window.escolasPendentesParaMapa = []; 
window.mapaGoogleIniciado = false;    

function renderRoteiros() {
    const container = document.getElementById('painel-roteiros');
    if(!container) return;

    let escolasPendentes = [];

    DB.escolas.forEach(e => {
        const st = calcularStatusEscola(e.ID);
        
        if (st.progresso < 100) {
            let pendencia = "";
            if (!st.materialOk) pendencia = "Aguardando Logística/Material";
            else if (!st.montagemOk) pendencia = "Pendente: Montagem de Equipamentos";
            else if (!st.formacaoOk) pendencia = "Pendente: Formação Inicial";

            const agendamentosAbertos = DB.agendamentos.filter(a => {
                const daEscola = String(a.EscolaID) === String(e.ID);
                const naoRealizado = !DB.acoes.some(ac => ac.AgendamentoID === a.ID);
                return daEscola && naoRealizado;
            });
            
            let agendamentoInfo = '';
            if (agendamentosAbertos.length > 0) {
                const ag = agendamentosAbertos[0];
                agendamentoInfo = `<br><span style="color: #10b981; font-size: 11px;">📅 Agendado: ${ag.TipoEvento} em ${formatExcelDateTime(ag.Data, ag.Hora)}</span>`;
            }

            escolasPendentes.push({ ...e, pendencia, agendamentoInfo, progresso: st.progresso });
        }
    });

    window.escolasPendentesParaMapa = escolasPendentes;

    let mapaRegioes = {};
    escolasPendentes.forEach(e => {
        const uf = e.UF || 'Sem UF';
        const cidade = e.Cidade || 'Sem Cidade';
        if(!mapaRegioes[uf]) mapaRegioes[uf] = {};
        if(!mapaRegioes[uf][cidade]) mapaRegioes[uf][cidade] = [];
        mapaRegioes[uf][cidade].push(e);
    });

    if(Object.keys(mapaRegioes).length === 0) {
        container.innerHTML = '<p style="color: #10b981; font-weight: bold;">✅ Nenhuma escola com pendências no momento!</p>';
        return;
    }

    let html = '';
    Object.keys(mapaRegioes).sort().forEach(uf => {
        html += `<h3 style="color: var(--primary); margin-top: 25px; border-bottom: 2px solid var(--border); padding-bottom: 5px;">📍 Estado: ${uf}</h3>`;
        Object.keys(mapaRegioes[uf]).sort().forEach(cidade => {
            html += `<h4 style="color: var(--secondary); margin-top: 15px; margin-bottom: 10px;">🏙️ ${cidade}</h4>`;
            html += `<table><thead><tr><th>Escola</th><th>Contato da Escola</th><th>Pendência Atual</th><th>Status Geral</th></tr></thead><tbody>`;
            mapaRegioes[uf][cidade].forEach(e => {
                let badgeClass = e.pendencia.includes('Aguardando') ? 'badge-warning' : 'badge-danger';
                if(e.pendencia.includes('Montagem') || e.pendencia.includes('Formação')) badgeClass = 'badge-action';

                html += `<tr>
                    <td style="font-weight: bold; color: #333;">${e.NomeFantasia || e.RazaoSocial}</td>
                    <td>${e.ContatoNome || 'N/I'} <br><small>${e.ContatoTelefone || ''}</small></td>
                    <td><span class="${badgeClass}">${e.pendencia}</span>${e.agendamentoInfo}</td>
                    <td>${e.progresso}%</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        });
    });
    container.innerHTML = html;
}

const btnLista = document.getElementById('btn-visao-lista');
const btnMapa = document.getElementById('btn-visao-mapa');

if(btnLista && btnMapa) {
    btnLista.addEventListener('click', function() {
        document.getElementById('painel-roteiros').style.display = 'block';
        document.getElementById('painel-mapa').style.display = 'none';
        this.classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('btn-visao-mapa').classList.replace('btn-primary', 'btn-secondary');
    });

    btnMapa.addEventListener('click', function() {
        document.getElementById('painel-roteiros').style.display = 'none';
        document.getElementById('painel-mapa').style.display = 'block';
        this.classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('btn-visao-lista').classList.replace('btn-primary', 'btn-secondary');
        
        if (!window.mapaGoogleIniciado) iniciarMapaGoogle();
    });
}

function iniciarMapaGoogle() {
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        alert("O Google Maps não carregou. Verifique a Chave de API no HTML.");
        return;
    }

    const mapaDiv = document.getElementById("mapa-google");
    const map = new google.maps.Map(mapaDiv, {
        zoom: 4, 
        center: { lat: -14.235, lng: -51.925 },
        mapTypeId: 'roadmap'
    });

    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    window.escolasPendentesParaMapa.forEach((escola, index) => {
        setTimeout(() => {
            const enderecoParaBusca = `${escola.Endereco}, ${escola.Cidade} - ${escola.UF}, Brasil`;
            
            geocoder.geocode({ address: enderecoParaBusca }, (results, status) => {
                if (status === "OK") {
                    const latLng = results[0].geometry.location;
                    const marker = new google.maps.Marker({
                        map: map, position: latLng, title: escola.NomeFantasia, animation: google.maps.Animation.DROP
                    });
                    
                    marker.addListener("click", () => {
                        infoWindow.setContent(`
                            <div style="color: #333; padding: 5px;">
                                <h3 style="margin: 0 0 5px 0; color: #0f3b5e; font-size: 14px;">${escola.NomeFantasia}</h3>
                                <p style="margin: 0; font-size: 12px;"><strong>Cidade:</strong> ${escola.Cidade} - ${escola.UF}</p>
                                <p style="margin: 5px 0 0 0; font-size: 12px; color: #ea4335;"><strong>Pendência:</strong> ${escola.pendencia}</p>
                            </div>
                        `);
                        infoWindow.open(map, marker);
                    });

                    bounds.extend(latLng);
                    map.fitBounds(bounds);
                }
            });
        }, index * 350); 
    });

    window.mapaGoogleIniciado = true;
}

// ====== NOVO: GERAR TERMO DE ACEITE (ATUALIZADO PARA ZOOM) ======
document.getElementById('gerar-termo-pdf').addEventListener('click', () => {
    const escolaId = document.getElementById('termo-escola').value;
    if (!escolaId) { alert('Por favor, selecione uma escola.'); return; }
    
    const escola = getEscolaById(escolaId);
    if (!escola) return;

    const logsEscola = DB.logistica.filter(l => String(l.EscolaID) === String(escolaId));
    const logistica = logsEscola.length > 0 ? logsEscola[logsEscola.length - 1] : null;
    const dataLogistica = logistica && logistica.PrevisaoEntrega ? excelDateToDate(logistica.PrevisaoEntrega) : 'Data não informada';
    
    const acoesEscola = DB.acoes.filter(a => String(a.EscolaID) === String(escolaId));
    
    const montagem = acoesEscola.find(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento === 'Montagem de Equipamentos' || ag.tipoEvento === 'Montagem de Equipamentos');
    });
    
    let checklistFormatado = "<em>Inventário de Setup não registrado ou escola não passou por montagem no sistema.</em>";
    let dataMontagem = "Pendente";
    if (montagem) {
        dataMontagem = excelDateToDate(montagem.DataRegistro || montagem.Data);
        if (montagem.Descricao && montagem.Descricao.includes('[INVENTÁRIO E SETUP]')) {
            const partes = montagem.Descricao.split('[INVENTÁRIO E SETUP]');
            checklistFormatado = partes[1].replace(/\n✅/g, '<br><span style="color:green;">✅</span>')
                                          .replace(/\n❌/g, '<br><br><span style="color:red;">❌</span>')
                                          .replace(/\n/g, '<br>');
        }
    }

    const formacao = acoesEscola.find(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento === 'Formação Inicial/Continuada' || ag.tipoEvento === 'Formação Inicial/Continuada');
    });
    const dataFormacao = formacao ? excelDateToDate(formacao.DataRegistro || formacao.Data) : "Pendente";

    const termoHTML = `
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Termo de Aceite - ${escola.NomeFantasia}</title>
        <style>
            body { font-family: 'Arial', sans-serif; margin: 40px 60px; color: #222; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f3b5e; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { max-height: 70px; }
            h1 { color: #0f3b5e; font-size: 18px; text-transform: uppercase; margin: 0; text-align: right; width: 60%; }
            h2 { color: #0f3b5e; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; }
            .dados-escola { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 14px; }
            .dados-escola p { margin: 5px 0; }
            .check-list-caixa { font-size: 13px; border-left: 3px solid #0f3b5e; padding-left: 15px; margin: 15px 0; background: #fafafa; padding-top: 10px; padding-bottom: 10px;}
            .assinaturas { margin-top: 70px; display: flex; justify-content: space-between; }
            .assinatura-box { text-align: center; width: 45%; font-size: 14px; }
            .linha { border-top: 1px solid #000; margin-bottom: 10px; }
            @media print { @page { margin: 1.5cm; } body { margin: 0; } }
        </style></head><body onload="window.print();">
        
        <div class="header">
            <img src="/images/logozmaker.png" class="logo" alt="Logo ZMaker">
            <h1>Termo de Aceite e Entrega<br>ZMaker Lab</h1>
        </div>

        <p style="text-align: justify; font-size: 15px;">
            Pelo presente termo, a <strong>ZOOM Education for Life</strong> formaliza a entrega, montagem técnica e capacitação referente à implantação do espaço <em>ZMaker Lab</em> na instituição de ensino abaixo qualificada.
        </p>

        <div class="dados-escola">
            <p><strong>Instituição:</strong> ${escola.RazaoSocial} (${escola.NomeFantasia})</p>
            <p><strong>CNPJ:</strong> ${escola.CNPJ || 'Não informado'}</p>
            <p><strong>Endereço:</strong> ${escola.Endereco || ''}, ${escola.Bairro || ''} - ${escola.Cidade || ''}/${escola.UF || ''}</p>
            <p><strong>Contato Responsável:</strong> ${escola.ContatoNome || 'Não informado'} / ${escola.ContatoTelefone || ''}</p>
        </div>

        <h2>1. Fases Concluídas</h2>
        <ul style="font-size: 14px;">
            <li><strong>Entrega de Materiais e Logística:</strong> Registrado em ${dataLogistica}.</li>
            <li><strong>Montagem e Configuração Técnica:</strong> Registrado em ${dataMontagem}.</li>
            <li><strong>Formação Inicial Pedagógica:</strong> Registrado em ${dataFormacao}.</li>
        </ul>

        <h2>2. Validação de Inventário e Setup Técnico</h2>
        <div class="check-list-caixa">
            ${checklistFormatado}
        </div>

        <p style="text-align: justify; font-size: 14px; margin-top: 30px;">
            A instituição declara, através da assinatura de seu representante legal ou gestor responsável, que os equipamentos e materiais pedagógicos (incluindo dispositivos programáveis, kits de robótica e ferramentas) foram entregues em perfeito estado de funcionamento e conservação. Declara também que a equipe escolar recebeu a capacitação inicial necessária para a utilização do laboratório e operação do sistema Scratch/ZMaker.
        </p>

        <p style="text-align: right; margin-top: 40px; font-size: 14px;">
            ${escola.Cidade || 'Cidade'}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
        </p>

        <div class="assinaturas">
            <div class="assinatura-box">
                <div class="linha"></div>
                <strong>Responsável Técnico ZOOM Education for Life</strong><br>
                ZMaker Lab Implantação
            </div>
            <div class="assinatura-box">
                <div class="linha"></div>
                <strong>Gestor(a) ou Diretor(a) Escolar</strong><br>
                ${escola.NomeFantasia}
            </div>
        </div>

        </body></html>`;

    const janela = window.open('', '_blank'); janela.document.write(termoHTML); janela.document.close();
});

// ====== GERAR RELATÓRIO PDF (ANALÍTICO) ======
document.getElementById('aplicar-filtros-dash').addEventListener('click', atualizarDashboard);
document.querySelectorAll('#dashboard-escola, #dashboard-data-inicio, #dashboard-data-fim').forEach(el => {
    el.addEventListener('change', atualizarDashboard);
});

document.getElementById('gerar-relatorio').addEventListener('click', () => {
    const escolaId = document.getElementById('relatorio-escola').value;
    if (!escolaId) { alert('Por favor, selecione uma escola.'); return; }
    
    const dataInicio = document.getElementById('relatorio-data-inicio').value;
    const dataFim = document.getElementById('relatorio-data-fim').value;

    let acoesFiltradas = DB.acoes.filter(a => String(a.EscolaID) === String(escolaId));
    if (dataInicio) acoesFiltradas = acoesFiltradas.filter(a => excelDateToISO(a.DataRegistro || a.Data) >= dataInicio);
    if (dataFim) acoesFiltradas = acoesFiltradas.filter(a => { const d = excelDateToISO(a.DataRegistro || a.Data); return d && d <= dataFim; });

    const escola = getEscolaById(escolaId);
    let totalHoras = 0, linhasHtml = '';

    if (acoesFiltradas.length === 0) linhasHtml = '<tr><td colspan="7" style="text-align:center;">Nenhuma ação no período.</td></tr>';
    else {
        acoesFiltradas.forEach(ac => {
            const ag = getAgendamentoById(ac.AgendamentoID);
            const evt = ag ? ag.TipoEvento : 'N/I', resp = ag ? `${ag.Responsavel} - ${ag.RespNome}` : 'N/I';
            const h = Number(ac.CHAcao || ac.CargaHoraria || 0); totalHoras += h;
            
            let desc = ac.Descricao || ac.descricao || '';
            desc = desc.replace(/\n/g, '<br>');
            
            linhasHtml += `<tr><td>${evt}</td><td>${resp}</td><td>${ac.Tipo || ''}</td><td>${excelDateToDate(ac.DataRegistro || ac.Data)}</td><td>${h}h</td><td style="min-width: 250px;">${desc}</td><td><a href="${ac.Fotos || '#'}" target="_blank">Ver Fotos</a></td></tr>`;
        });
    }

    const relatorioHTML = `
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório</title>
        <style>body{font-family:Arial;margin:40px;}.header{display:flex;justify-content:space-between;border-bottom:2px solid #0f3b5e;padding-bottom:15px;margin-bottom:20px;}
        .logo{max-height:60px;}h2{color:#0f3b5e;margin:0;}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px;}
        th{background:#0f3b5e;color:#fff;padding:10px;text-align:left;}td{padding:8px;border-bottom:1px solid #ddd;vertical-align:top;}
        .total{font-weight:bold;margin-top:20px;text-align:right;color:#0f3b5e;font-size:16px;}
        @media print{@page{margin:1.5cm;}body{margin:0;}}</style></head><body onload="window.print();">
        <div class="header"><img src="/images/logozmaker.png" class="logo"><div style="text-align:right;"><h2>Relatório Analítico ZMaker</h2>
        <div>Escola: ${escola ? escola.NomeFantasia : 'N/E'}</div><div>Gerado em: ${new Date().toLocaleString('pt-BR')}</div></div></div>
        <table><thead><tr><th>Evento Agendado</th><th>Responsável</th><th>Tipo Executado</th><th>Data</th><th>C. Horária</th><th>Descrição</th><th>Fotos</th></tr></thead><tbody>${linhasHtml}</tbody></table>
        <div class="total">Total de CH Executada: ${totalHoras}h</div></body></html>`;

    const janela = window.open('', '_blank'); janela.document.write(relatorioHTML); janela.document.close();
});

// ====== INICIALIZAÇÃO FINAL ======
initData();