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
    const response = await callAPI(API.getEscolas, 'GET');
    return response.value || response;
}

async function createEscola(dados) {
    return await callAPI(API.postEscola, 'POST', dados);
}

async function getAgendamentos() {
    const response = await callAPI(API.getAgendamentos, 'GET');
    return response.value || response;
}

async function createAgendamento(dados) {
    return await callAPI(API.postAgendamento, 'POST', dados);
}

async function getAcoes() {
    const response = await callAPI(API.getAcoes, 'GET');
    return response.value || response;
}

async function createAcao(dados) {
    return await callAPI(API.postAcao, 'POST', dados);
}

async function gerarRelatorio(filtros) {
    const url = API.postRelatorio;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'respond-async=false'
        },
        body: JSON.stringify(filtros)
    };
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Erro ao gerar relatório: ${response.status}`);
    }
    return response;
}

// ====== CONVERSÃO DE DATA DO EXCEL ======
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

function excelTimeToTime(serial) {
    if (serial === undefined || serial === null || serial === '') return '';
    
    let val = String(serial).trim();
    
    if (val.includes(':')) {
        return val.substring(0, 5); 
    }
    
    val = val.replace(',', '.');
    
    if (!isNaN(Number(val))) {
        const totalSeconds = Math.round(Number(val) * 86400);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    return val;
}

function formatExcelDateTime(dateVal, timeVal) {
    const dataFormatada = excelDateToDate(dateVal);
    const horaFormatada = excelTimeToTime(timeVal);

    if (dataFormatada && horaFormatada) {
        return `${dataFormatada} às ${horaFormatada}`;
    } else if (dataFormatada) {
        return dataFormatada;
    } else if (horaFormatada) {
        return horaFormatada;
    }
    return '';
}

// ====== CEP ======
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

async function preencherEndereco(cep) {
    const dados = await buscarCEP(cep);
    if (!dados) return;
    document.getElementById('escola-endereco').value = dados.logradouro || '';
    document.getElementById('escola-bairro').value = dados.bairro || '';
    document.getElementById('escola-cidade').value = dados.localidade || '';
    document.getElementById('escola-uf').value = dados.uf || '';
    document.getElementById('escola-complemento').focus();
}

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

// ====== BANCO DE DADOS LOCAL ======
const DB = {
    escolas: [],
    agendamentos: [],
    acoes: [],
    _id: 1000 
};

// ====== INICIALIZAR DADOS (via API) ======
async function initData() {
    try {
        const [escolas, agendamentos, acoes] = await Promise.all([
            getEscolas(),
            getAgendamentos(),
            getAcoes()
        ]);
        
        DB.escolas = (Array.isArray(escolas) ? escolas : []).map((e, index) => {
            let rawId = e.ID || e.id || e.Id || e.idEscola || (index + 1);
            return { ...e, ID: String(rawId).trim() };
        });

        DB.agendamentos = (Array.isArray(agendamentos) ? agendamentos : []).map((a, index) => {
            let rawId = a.ID || a.id || a.Id || (index + 1);
            let escolaIdRef = a.EscolaID || a.escolaID || a.escolaId || '';
            return {
                ...a,
                ID: String(rawId).trim(),
                EscolaID: String(escolaIdRef).trim()
            };
        });

        DB.acoes = (Array.isArray(acoes) ? acoes : []).map((a, index) => {
            let rawId = a.ID || a.id || a.Id || (index + 1);
            let agendamentoIdRef = a.AgendamentoID || a.agendamentoID || a.agendamentoId || '';
            let escolaIdRef = a.EscolaID || a.escolaID || a.escolaId || '';
            return {
                ...a,
                ID: String(rawId).trim(),
                AgendamentoID: String(agendamentoIdRef).trim(),
                EscolaID: String(escolaIdRef).trim()
            };
        });
        
        console.log('✅ Dados carregados da API do Excel.');
    } catch (error) {
        console.error('❌ Erro ao carregar dados da API:', error);
    }
    
    atualizarSelects();
    renderEscolas();
    renderAgendamentos();
    renderAcoes();
    atualizarDashboard();
}

// ====== HELPERS ======
function getEscolaById(id) {
    if (!id) return null;
    const searchId = String(id).trim();
    return DB.escolas.find(e => {
        const eId = String(e.ID || e.id || '').trim();
        return eId === searchId || eId.startsWith(searchId) || searchId.startsWith(eId);
    });
}

function getAgendamentoById(id) {
    if (!id) return null;
    const searchId = String(id).trim();
    return DB.agendamentos.find(a => {
        const aId = String(a.ID || a.id || '').trim();
        return aId === searchId || aId.startsWith(searchId) || searchId.startsWith(aId);
    });
}

function getEscolasOptions() {
    let optionsHtml = '<option value="">Selecione uma escola...</option>';
    
    if (!DB.escolas || !DB.escolas.length) {
        return '<option value="">Nenhuma escola cadastrada</option>';
    }
    
    const listaHtml = DB.escolas.map((e, index) => {
        let id = e.ID || e.id || (index + 1);
        const nome = e.NomeFantasia || e.fantasia || e.nomeFantasia || e.RazaoSocial || e.razao || 'Escola sem nome';
        const cidade = e.Cidade || e.cidade || 'Sem cidade';
        
        return `<option value="${id}">${nome} (${cidade})</option>`;
    }).join('');
    
    return optionsHtml + listaHtml;
}

// ====== RENDERIZAÇÃO ======
function renderEscolas() {
    const container = document.getElementById('lista-escolas');
    if (!DB.escolas.length) {
        container.innerHTML = '<p>Nenhuma escola encontrada no Excel.</p>';
        return;
    }
    let html = `<table><thead><tr>
        <th>CNPJ</th><th>Razão Social</th><th>Fantasia</th>
        <th>Endereço</th><th>Bairro</th><th>Cidade/UF</th>
        <th>Contato</th><th>ZMaker</th>
    </tr></thead><tbody>`;
    DB.escolas.forEach(e => {
        html += `<tr>
            <td>${e.CNPJ || e.cnpj || ''}</td>
            <td>${e.RazaoSocial || e.razao || e.razaoSocial || ''}</td>
            <td>${e.NomeFantasia || e.fantasia || e.nomeFantasia || ''}</td>
            <td>${e.Endereco || e.endereco || ''}, ${e.CEP || e.cep || ''}</td>
            <td>${e.Bairro || e.bairro || ''}</td>
            <td>${e.Cidade || e.cidade || ''}/${e.UF || e.uf || ''}</td>
            <td>${e.ContatoNome || e.contatoNome || ''}</td>
            <td>${e.TipoZMaker || e.tipoZmaker || e.tipoZMaker || ''}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderAgendamentos() {
    const container = document.getElementById('lista-agendamentos');
    if (!DB.agendamentos.length) {
        container.innerHTML = '<p>Nenhum agendamento encontrado no Excel.</p>';
        return;
    }
    
    let html = `<table><thead><tr>
        <th>Escola</th><th>Tipo</th><th>Data/Hora</th>
        <th>Responsável</th><th>Contato</th><th>Ações</th>
    </tr></thead><tbody>`;
    
    DB.agendamentos.forEach(a => {
        const escolaId = a.EscolaID || a.escolaID || a.escolaId;
        const escola = getEscolaById(escolaId);
        const nomeEscola = escola ? (escola.NomeFantasia || escola.fantasia || escola.RazaoSocial || 'N/E') : 'N/E';
        
        let dataHora = formatExcelDateTime(a.Data, a.Hora);
        const agendamentoId = a.ID || a.id;
        
        html += `<tr>
            <td>${nomeEscola}</td>
            <td>${a.TipoEvento || a.tipoEvento || ''}</td>
            <td>${dataHora}</td>
            <td>${a.Responsavel || a.responsavel || ''} - ${a.RespNome || a.respNome || ''}</td>
            <td>${a.ContatoNome || a.contatoNome || '—'}</td>
            <td><button class="btn-primary" style="padding:4px 12px;font-size:0.8rem;" onclick="carregarAcaoParaAgendamento('${agendamentoId}')">Registrar Ação</button></td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderAcoes() {
    const container = document.getElementById('lista-acoes');
    if (!DB.acoes.length) {
        container.innerHTML = '<p>Nenhuma ação registrada no Excel.</p>';
        return;
    }
    let html = `<table><thead><tr>
        <th>Escola</th><th>Tipo</th><th>Responsável</th><th>Data</th><th>Descrição</th><th>Fotos</th>
    </tr></thead><tbody>`;
    DB.acoes.forEach(ac => {
        const agendamentoId = ac.AgendamentoID || ac.agendamentoID || ac.agendamentoId;
        const escolaId = ac.EscolaID || ac.escolaID || ac.escolaId;
        const agendamento = getAgendamentoById(agendamentoId);
        const escola = getEscolaById(escolaId);
        
        const nomeEscola = escola ? (escola.NomeFantasia || escola.fantasia || 'N/E') : 'N/E';
        const responsavel = agendamento ? `${agendamento.Responsavel || agendamento.responsavel} - ${agendamento.RespNome || agendamento.respNome}` : 'N/I';
        
        // Se Fotos vier como string do Excel (URLs separadas por vírgula) ou array
        let qtdFotos = 0;
        if (ac.Fotos) {
            qtdFotos = Array.isArray(ac.Fotos) ? ac.Fotos.length : String(ac.Fotos).split(',').filter(f => f.trim() !== '').length;
        } else if (ac.fotos) {
            qtdFotos = Array.isArray(ac.fotos) ? ac.fotos.length : String(ac.fotos).split(',').filter(f => f.trim() !== '').length;
        }
        
        html += `<tr>
            <td>${nomeEscola}</td>
            <td>${ac.Tipo || ac.tipo || ''}</td>
            <td>${responsavel}</td>
            <td>${ac.DataRegistro || ac.dataRegistro || ''}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ac.Descricao || ac.descricao || ''}</td>
            <td>${qtdFotos > 0 ? `<a href="#" onclick="alert('URLs salvas no Excel. Verifique a tabela original para os links.')" style="color:#0f3b5e;font-weight:bold;">${qtdFotos} foto(s)</a>` : '0 foto(s)'}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ====== FORMULÁRIOS ======
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
        await new Promise(resolve => setTimeout(resolve, 2000));
        await initData(); 
        document.getElementById('form-escola').reset();
        alert('Escola salva com sucesso!');
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar na nuvem. Verifique sua conexão.');
    } finally {
        hideLoading(); 
    }
});

// ====== FORMULÁRIO DE AGENDAMENTO ======
document.getElementById('form-agendamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectEscola = document.getElementById('agendamento-escola');
    const escolaIdValue = selectEscola.value;
    
    if (!escolaIdValue || escolaIdValue === '') {
        alert('Por favor, selecione uma escola válida no menu.');
        return;
    }
    
    const rawData = document.getElementById('agendamento-data').value; 
    const rawHora = document.getElementById('agendamento-hora').value; 
    
    const dataLimpa = rawData ? rawData.split('T')[0] : '';
    const horaLimpa = rawHora ? rawHora.substring(0, 5) : '';
    
    const dados = {
        EscolaID: String(escolaIdValue).trim(), 
        TipoEvento: document.getElementById('agendamento-tipo-evento').value,
        Data: dataLimpa,
        Hora: horaLimpa,
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
        await new Promise(resolve => setTimeout(resolve, 2000));
        await initData(); 
        document.getElementById('form-agendamento').reset();
        alert('Agendamento criado com sucesso!');
    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro de conexão ao salvar o agendamento.');
    } finally {
        hideLoading(); 
    }
});

// ====== FORMULÁRIO DE AÇÃO (COM ENVIO EM BASE64) ======
document.getElementById('form-acao').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const agendamentoIdValue = document.getElementById('acao-agendamento').value;
    const agendamento = getAgendamentoById(agendamentoIdValue);
    
    if (!agendamento) { 
        alert('Selecione um agendamento válido.'); 
        return; 
    }

    const fotosInput = document.getElementById('acao-fotos');
    const escolaId = agendamento.EscolaID || agendamento.escolaID || agendamento.escolaId;

    showLoading(); 
    try {
        // Converte as fotos selecionadas para Base64
        const filePromises = Array.from(fotosInput.files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve({
                    name: file.name,
                    mimeType: file.type,
                    // Pega apenas a string codificada em base64 e retira o prefixo "data:image/jpeg;base64,"
                    contentBytes: reader.result.split(',')[1] 
                });
                reader.onerror = error => reject(error);
            });
        });

        // Aguarda a conversão de todas as imagens
        const fotosBase64 = await Promise.all(filePromises);

        const dados = {
            AgendamentoID: String(agendamentoIdValue).trim(),
            EscolaID: String(escolaId).trim(),
            Tipo: document.getElementById('acao-tipo').value,
            Descricao: document.getElementById('acao-descricao').value,
            Fotos: fotosBase64 // Agora envia o array de objetos com o arquivo decodificado
        };

        await createAcao(dados);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await initData();
        document.getElementById('form-acao').reset();
        document.getElementById('foto-count').textContent = '0 arquivo(s)';
        alert('Ação registrada com sucesso e imagens enviadas!');
    } catch (error) {
        console.error(error);
        alert('Erro de conexão ao registrar a ação. Verifique o Power Automate e a conversão de arquivos.');
    } finally {
        hideLoading(); 
    }
});

// ====== ATUALIZAR SELECTS ======
function atualizarSelects() {
    const selects = ['agendamento-escola', 'dashboard-escola', 'relatorio-escola'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            const currentVal = sel.value;
            sel.innerHTML = getEscolasOptions();
            
            if (currentVal && currentVal !== '') {
                const existe = Array.from(sel.options).some(opt => opt.value === currentVal);
                if (existe) sel.value = currentVal;
                else sel.value = "";
            } else {
                sel.value = "";
            }
        }
    });
    
    const selAcao = document.getElementById('acao-agendamento');
    if (selAcao) {
        const currentVal = selAcao.value;
        selAcao.innerHTML = '<option value="">Selecione o agendamento...</option>';
        DB.agendamentos.forEach(a => {
            const escolaId = a.EscolaID || a.escolaID || a.escolaId;
            const escola = getEscolaById(escolaId);
            const nome = escola ? (escola.NomeFantasia || escola.fantasia || 'N/E') : 'N/E';
            const idAg = a.ID || a.id;
            
            const exibicaoAgend = formatExcelDateTime(a.Data, a.Hora);
            selAcao.innerHTML += `<option value="${idAg}">${nome} - ${a.TipoEvento || a.tipoEvento} (${exibicaoAgend})</option>`;
        });
        
        if (currentVal && currentVal !== '') {
            const existe = Array.from(selAcao.options).some(opt => opt.value === currentVal);
            if (existe) selAcao.value = currentVal;
        }
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
        acoesFiltradas = acoesFiltradas.filter(a => String(a.EscolaID || a.escolaID || a.escolaId) === String(escolaFiltro));
    }
    if (dataInicio) {
        acoesFiltradas = acoesFiltradas.filter(a => (a.DataRegistro || a.dataRegistro) >= dataInicio);
    }
    if (dataFim) {
        acoesFiltradas = acoesFiltradas.filter(a => (a.DataRegistro || a.dataRegistro) <= dataFim);
    }

    document.getElementById('total-acoes').textContent = acoesFiltradas.length;
    const formacao = acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento || ag.tipoEvento) === 'Formação Inicial/Continuada';
    }).length;
    document.getElementById('total-formacao').textContent = formacao;
    const montagem = acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        return ag && (ag.TipoEvento || ag.tipoEvento) === 'Montagem de Equipamentos';
    }).length;
    document.getElementById('total-montagem').textContent = montagem;
    const reunioes = acoesFiltradas.filter(a => {
        const ag = getAgendamentoById(a.AgendamentoID || a.agendamentoID || a.agendamentoId);
        const tipo = ag.TipoEvento || ag.tipoEvento;
        return ag && tipo && tipo.includes('Reunião');
    }).length;
    document.getElementById('total-reunioes').textContent = reunioes;

    const tipos = ['Remota', 'Presencial'];
    const counts = tipos.map(t => acoesFiltradas.filter(a => (a.Tipo || a.tipo) === t).length);
    if (chartTipo) chartTipo.destroy();
    chartTipo = new Chart(document.getElementById('chart-acoes-tipo'), {
        type: 'bar',
        data: { labels: tipos, datasets: [{ label: 'Ações', data: counts, backgroundColor: ['#3b82f6', '#0f3b5e'] }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const escolasIds = [...new Set(acoesFiltradas.map(a => String(a.EscolaID || a.escolaID || a.escolaId)))];
    const escolasNomes = escolasIds.map(id => {
        const e = getEscolaById(id);
        return e ? (e.NomeFantasia || e.fantasia) : 'N/E';
    });
    const contagens = escolasIds.map(id => acoesFiltradas.filter(a => String(a.EscolaID || a.escolaID || a.escolaId) === String(id)).length);
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
    if (escolaId) filtros.EscolaID = escolaId;
    if (dataInicio) filtros.DataInicio = dataInicio;
    if (dataFim) filtros.DataFim = dataFim;

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