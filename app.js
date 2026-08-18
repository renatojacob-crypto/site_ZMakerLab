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

// ====== FUNÇÕES DE CRUD ======
async function getEscolas() {
    if (!API.getEscolas) return [];
    const response = await callAPI(API.getEscolas, 'GET');
    return response.value || response;
}
async function createEscola(dados) { return await callAPI(API.postEscola, 'POST', dados); }

async function getAgendamentos() {
    if (!API.getAgendamentos) return [];
    const response = await callAPI(API.getAgendamentos, 'GET');
    return response.value || response;
}
async function createAgendamento(dados) { return await callAPI(API.postAgendamento, 'POST', dados); }

async function getAcoes() {
    if (!API.getAcoes) return [];
    const response = await callAPI(API.getAcoes, 'GET');
    return response.value || response;
}
async function createAcao(dados) { return await callAPI(API.postAcao, 'POST', dados); }

// CRUD Logística
async function getLogistica() {
    if (!API.getLogistica) return [];
    try {
        const response = await callAPI(API.getLogistica, 'GET');
        return response.value || response;
    } catch(e) {
        console.warn("API de Logística não configurada ou vazia.");
        return [];
    }
}
async function createLogistica(dados) { return await callAPI(API.postLogistica, 'POST', dados); }

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
const DB = { escolas: [], agendamentos: [], acoes: [], logistica: [] };

// ====== INICIALIZAR DADOS ======
async function initData() {
    try {
        const [escolas, agendamentos, acoes, logistica] = await Promise.all([
            getEscolas(), getAgendamentos(), getAcoes(), getLogistica()
        ]);
        
        DB.escolas = (Array.isArray(escolas) ? escolas : []).map((e, i) => ({ ...e, ID: String(e.ID || e.id || e.idEscola || i + 1).trim() }));
        DB.agendamentos = (Array.isArray(agendamentos) ? agendamentos : []).map((a, i) => ({ ...a, ID: String(a.ID || a.id || i + 1).trim(), EscolaID: String(a.EscolaID || a.escolaID || '').trim() }));
        DB.acoes = (Array.isArray(acoes) ? acoes : []).map((a, i) => ({ ...a, ID: String(a.ID || a.id || i + 1).trim(), AgendamentoID: String(a.AgendamentoID || a.agendamentoID || '').trim(), EscolaID: String(a.EscolaID || a.escolaID || '').trim() }));
        DB.logistica = (Array.isArray(logistica) ? logistica : []).map(l => ({ ...l, EscolaID: String(l.EscolaID || l.escolaID || '').trim() }));
        
        console.log('✅ Dados carregados.');
    } catch (error) { console.error('❌ Erro:', error); }
    
    atualizarSelects();
    renderEscolas();
    renderAgendamentos();
    renderAcoes();
    atualizarDashboard(); // A régua de progresso é chamada por dentro desta função
    renderPainelLogistica();
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
        alert('Erro ao salvar as informações logísticas. Verifique a configuração do Power Automate.');
    } finally { hideLoading(); }
});

// ====== FORMULÁRIOS RESTANTES ======
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
        ContatoTelefone: document.getElementById('agendamento-contato-telefone').value
    };
    showLoading(); 
    try {
        await createAgendamento(dados);
        await new Promise(r => setTimeout(r, 2000));
        await initData(); 
        document.getElementById('form-agendamento').reset();
        alert('Agendamento criado!');
    } catch (error) { alert('Erro ao salvar o agendamento.'); } finally { hideLoading(); }
});

// ====== LÓGICA DO CHECKLIST DE HARDWARE (MOSTRAR/ESCONDER) ======
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
    
    // Agrupa a descrição e o checklist dinâmico
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
        
        // Esconde o checklist novamente
        if(areaSetup) areaSetup.style.display = 'none';
        
        alert('Ação registrada com sucesso!');
    } catch (error) { alert('Erro ao registrar a ação.'); } finally { hideLoading(); }
});

// ====== ATUALIZAR SELECTS ======
function atualizarSelects() {
    const selects = ['agendamento-escola', 'dashboard-escola', 'relatorio-escola', 'logistica-escola', 'filtro-gerencial-escola'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            const currentVal = sel.value;
            sel.innerHTML = id === 'filtro-gerencial-escola' || id === 'dashboard-escola' || id === 'relatorio-escola' ? 
                            '<option value="">Todas as Escolas</option>' + getEscolasOptions().replace('<option value="">Selecione uma escola...</option>', '') : 
                            getEscolasOptions();
            if (currentVal) sel.value = currentVal;
        }
    });
    
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
        
        // Dispara o evento change para garantir que o checklist comece escondido
        selAcao.dispatchEvent(new Event('change'));
    }
}

document.getElementById('filtro-gerencial-escola').addEventListener('change', renderPainelLogistica);

// ====== DASHBOARD & NAVEGAÇÃO ======
window.carregarAcaoParaAgendamento = function(id) {
    const sel = document.getElementById('acao-agendamento');
    if(!Array.from(sel.options).some(opt => opt.value === id)) { alert('Ação já registrada.'); return; }
    sel.value = id;
    sel.dispatchEvent(new Event('change')); // Avisa ao sistema que a select mudou (para mostrar o checklist, se for Montagem)
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-acoes').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="acoes"]').classList.add('active');
};

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
        acoesFiltradas = acoesFiltradas.filter(a => {
            const isoData = excelDateToISO(a.DataRegistro || a.dataRegistro || a.Data || a.data);
            return isoData >= dataInicio;
        });
    }
    if (dataFim) {
        acoesFiltradas = acoesFiltradas.filter(a => {
            const isoData = excelDateToISO(a.DataRegistro || a.dataRegistro || a.Data || a.data);
            return isoData && isoData <= dataFim;
        });
    }

    const somarHoras = (lista) => {
        return lista.reduce((acc, curr) => {
            let h = Number(curr.CHAcao || curr.chAcao || curr.CargaHoraria || curr.cargaHoraria || curr.Horas || curr.horas || 0);
            return acc + h;
        }, 0);
    };

    let totalHorasGerais = somarHoras(acoesFiltradas);
    document.getElementById('total-acoes').textContent = totalHorasGerais + 'h';
    
    const formacao = somarHoras(acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento || ag.tipoEvento) === 'Formação Inicial/Continuada';
    }));
    document.getElementById('total-formacao').textContent = formacao + 'h';
    
    const montagem = somarHoras(acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento || ag.tipoEvento) === 'Montagem de Equipamentos';
    }));
    document.getElementById('total-montagem').textContent = montagem + 'h';
    
    const reunioes = somarHoras(acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        const tipo = ag.TipoEvento || ag.tipoEvento;
        return ag && tipo && tipo.includes('Reunião');
    }));
    document.getElementById('total-reunioes').textContent = reunioes + 'h';

    const tipos = ['Remota', 'Presencial'];
    const counts = tipos.map(t => {
        const filtradasTipo = acoesFiltradas.filter(a => (a.Tipo || a.tipo) === t);
        return somarHoras(filtradasTipo);
    });
    
    if (chartTipo) chartTipo.destroy();
    chartTipo = new Chart(document.getElementById('chart-acoes-tipo'), {
        type: 'bar',
        data: { labels: tipos, datasets: [{ label: 'Horas de Atendimento', data: counts, backgroundColor: ['#3b82f6', '#0f3b5e'] }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const escolasIds = [...new Set(acoesFiltradas.map(a => String(a.EscolaID || a.escolaID || a.escolaId)))];
    const escolasNomes = escolasIds.map(id => {
        const e = getEscolaById(id);
        return e ? (e.NomeFantasia || e.fantasia) : 'N/E';
    });
    const contagens = escolasIds.map(id => {
        const filtradasEscola = acoesFiltradas.filter(a => String(a.EscolaID || a.escolaID || a.escolaId) === String(id));
        return somarHoras(filtradasEscola);
    });
    
    if (chartEscola) chartEscola.destroy();
    chartEscola = new Chart(document.getElementById('chart-acoes-escola'), {
        type: 'pie',
        data: { labels: escolasNomes, datasets: [{ data: contagens, backgroundColor: ['#3b82f6', '#0f3b5e', '#64748b', '#94a3b8', '#cbd5e1'] }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // Chama a renderização da barra de progresso sempre que o dashboard for atualizado
    renderProgressoImplantacao();
}

// ====== RÉGUA DE PROGRESSO (STATUS DE IMPLANTAÇÃO) ======
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
    if(!container) return; // Segurança para caso o HTML não tenha carregado

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

// ====== GERAR RELATÓRIO PDF ======
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
            
            // Corrige a formatação para que quebras de linha na descrição (como as do checklist) fiquem bonitas no PDF
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
        <div class="header"><img src="/images/logozmaker.png" class="logo"><div style="text-align:right;"><h2>Relatório de Atendimentos ZMaker</h2>
        <div>Escola: ${escola ? escola.NomeFantasia : 'N/E'}</div><div>Gerado em: ${new Date().toLocaleString('pt-BR')}</div></div></div>
        <table><thead><tr><th>Evento Agendado</th><th>Responsável</th><th>Tipo Executado</th><th>Data</th><th>C. Horária</th><th>Descrição</th><th>Fotos</th></tr></thead><tbody>${linhasHtml}</tbody></table>
        <div class="total">Total de CH Executada: ${totalHoras}h</div></body></html>`;

    const janela = window.open('', '_blank'); janela.document.write(relatorioHTML); janela.document.close();
});

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn, .tab-content').forEach(e => e.classList.remove('active'));
        btn.classList.add('active'); document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'relatorios' || btn.dataset.tab === 'logistica' || btn.dataset.tab === 'dashboard') atualizarSelects();
    });
});

document.getElementById('aplicar-filtros-dash').addEventListener('click', atualizarDashboard);
document.querySelectorAll('#dashboard-escola, #dashboard-data-inicio, #dashboard-data-fim').forEach(el => {
    el.addEventListener('change', atualizarDashboard);
});

// ====== INICIALIZAÇÃO FINAL ======
initData();