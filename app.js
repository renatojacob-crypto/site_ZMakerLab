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
    if (!API.getEscolas || API.getEscolas.trim() === '') return [];
    const response = await callAPI(API.getEscolas, 'GET');
    return response.value || response;
}

async function createEscola(dados) {
    return await callAPI(API.postEscola, 'POST', dados);
}

async function getAgendamentos() {
    if (!API.getAgendamentos || API.getAgendamentos.trim() === '') return [];
    const response = await callAPI(API.getAgendamentos, 'GET');
    return response.value || response;
}

async function createAgendamento(dados) {
    return await callAPI(API.postAgendamento, 'POST', dados);
}

async function getAcoes() {
    if (!API.getAcoes || API.getAcoes.trim() === '') {
        console.warn('⚠️ URL getAcoes não está configurada no config.js!');
        return [];
    }
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

// ====== CONVERSÃO INTELIGENTE DE DATAS ======
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
    if (val.includes('-')) {
        return val.split('T')[0];
    }
    if (val.includes('/')) {
        const p = val.split(' ')[0].split('/');
        if (p.length === 3) {
            let p0 = parseInt(p[0], 10);
            let p1 = parseInt(p[1], 10);
            let p2 = p[2].length === 2 ? '20' + p[2] : p[2];
            let dia, mes;
            if (p0 > 12) {
                dia = String(p0).padStart(2, '0');
                mes = String(p1).padStart(2, '0');
            } else if (p1 > 12) {
                mes = String(p0).padStart(2, '0');
                dia = String(p1).padStart(2, '0');
            } else {
                dia = String(p0).padStart(2, '0');
                mes = String(p1).padStart(2, '0');
            }
            return `${p2}-${mes}-${dia}`;
        }
    }
    if (!isNaN(Number(val))) {
        const epoch = new Date(1899, 11, 30);
        const date = new Date(epoch.getTime() + (Number(val) * 86400000));
        if (isNaN(date.getTime())) return val;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }
    return val;
}

function excelTimeToTime(serial) {
    if (serial === undefined || serial === null || serial === '') return '';
    let val = String(serial).trim();
    if (val.includes(':')) return val.substring(0, 5); 
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
    if (dataFormatada && horaFormatada) return `${dataFormatada} às ${horaFormatada}`;
    if (dataFormatada) return dataFormatada;
    if (horaFormatada) return horaFormatada;
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
const DB = { escolas: [], agendamentos: [], acoes: [], _id: 1000 };

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
            return { ...a, ID: String(rawId).trim(), EscolaID: String(escolaIdRef).trim() };
        });

        DB.acoes = (Array.isArray(acoes) ? acoes : []).map((a, index) => {
            let rawId = a.ID || a.id || a.Id || (index + 1);
            let agendamentoIdRef = a.AgendamentoID || a.agendamentoID || a.agendamentoId || '';
            let escolaIdRef = a.EscolaID || a.escolaID || a.escolaId || '';
            return { ...a, ID: String(rawId).trim(), AgendamentoID: String(agendamentoIdRef).trim(), EscolaID: String(escolaIdRef).trim() };
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
    if (!DB.escolas || !DB.escolas.length) return '<option value="">Nenhuma escola cadastrada</option>';
    
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
        <th>Escola</th><th>Tipo</th><th>Responsável</th><th>Data</th><th>Horas</th><th>Descrição</th><th>Fotos</th>
    </tr></thead><tbody>`;
    
    DB.acoes.forEach(ac => {
        const agendamentoId = ac.AgendamentoID || ac.agendamentoID || ac.agendamentoId;
        const escolaId = ac.EscolaID || ac.escolaID || ac.escolaId;
        const agendamento = getAgendamentoById(agendamentoId);
        const escola = getEscolaById(escolaId);
        
        const nomeEscola = escola ? (escola.NomeFantasia || escola.fantasia || 'N/E') : 'N/E';
        const responsavel = agendamento ? `${agendamento.Responsavel || agendamento.responsavel} - ${agendamento.RespNome || agendamento.respNome}` : 'N/I';
        
        let dataRegRaw = ac.DataRegistro || ac.dataRegistro || ac.Data || ac.data || '';
        let dataExibicao = excelDateToDate(dataRegRaw);
        let horas = ac.CHAcao || ac.chAcao || ac.CargaHoraria || ac.cargaHoraria || ac.Horas || ac.horas || '0';

        let qtdFotos = 0;
        try {
            if (ac.Fotos) {
                qtdFotos = Array.isArray(ac.Fotos) ? ac.Fotos.length : String(ac.Fotos).split(',').filter(f => f.trim() !== '').length;
            } else if (ac.fotos) {
                qtdFotos = Array.isArray(ac.fotos) ? ac.fotos.length : String(ac.fotos).split(',').filter(f => f.trim() !== '').length;
            }
        } catch(e) {}
        
        html += `<tr>
            <td>${nomeEscola}</td>
            <td>${ac.Tipo || ac.tipo || ''}</td>
            <td>${responsavel}</td>
            <td>${dataExibicao}</td>
            <td>${horas}h</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ac.Descricao || ac.descricao || ''}</td>
            <td>${qtdFotos > 0 ? `<a href="#" onclick="alert('URLs salvas no Excel.')" style="color:#0f3b5e;font-weight:bold;">${qtdFotos} foto(s)</a>` : '0 foto(s)'}</td>
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
    
    // Garante o formato limpo yyyy-MM-dd sem horas adicionais do input
    const dataLimpa = rawData ? rawData.split('T')[0] : '';
    const horaLimpa = rawHora ? rawHora.substring(0, 5) : '';
    
    const dados = {
        EscolaID: String(escolaIdValue).trim(), 
        TipoEvento: document.getElementById('agendamento-tipo-evento').value,
        Data: dataLimpa, // Envia para o Excel em formato ISO (yyyy-MM-dd)
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

// ====== FORMULÁRIO DE AÇÃO ======
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

    const dataDigitada = document.getElementById('acao-data').value;
    const cargaHoraria = document.getElementById('acao-horas').value;

    if (!dataDigitada) {
        alert('Por favor, informe a data de realização da ação.');
        return;
    }

    showLoading(); 
    try {
        const filePromises = Array.from(fotosInput.files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve({
                    name: file.name,
                    mimeType: file.type,
                    contentBytes: reader.result.split(',')[1] 
                });
                reader.onerror = error => reject(error);
            });
        });
        const fotosBase64 = await Promise.all(filePromises);

        const dados = {
            AgendamentoID: String(agendamentoIdValue).trim(),
            EscolaID: String(escolaId).trim(),
            Tipo: document.getElementById('acao-tipo').value,
            Descricao: document.getElementById('acao-descricao').value,
            DataRegistro: dataDigitada, // Envia para o Excel em formato ISO (yyyy-MM-dd)
            CargaHoraria: Number(cargaHoraria) || 0, 
            Fotos: fotosBase64 
        };

        await createAcao(dados);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await initData();
        document.getElementById('form-acao').reset();
        document.getElementById('foto-count').textContent = '0 arquivo(s)';
        alert('Ação registrada com sucesso e imagens enviadas!');
    } catch (error) {
        console.error(error);
        alert('Erro de conexão ao registrar a ação.');
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

// ====== NAVEGAÇÃO ======
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
}

// ====== RELATÓRIO COM ANIMAÇÃO E DOWNLOAD DE PDF ======
document.getElementById('gerar-relatorio').addEventListener('click', async () => {
    const escolaId = document.getElementById('relatorio-escola').value;
    const dataInicio = document.getElementById('relatorio-data-inicio').value;
    const dataFim = document.getElementById('relatorio-data-fim').value;

    const filtros = {};
    if (escolaId) filtros.EscolaID = escolaId;
    
    // Envia o padrão ISO (yyyy-MM-dd) para o Power Automate conseguir filtrar e comparar
    if (dataInicio) filtros.DataInicio = dataInicio;
    if (dataFim) filtros.DataFim = dataFim;

    const btnRelatorio = document.getElementById('gerar-relatorio');
    const textoOriginal = btnRelatorio.innerHTML;

    try {
        btnRelatorio.innerHTML = '<span class="spinner"></span> Gerando PDF...';
        btnRelatorio.disabled = true;
        showLoading();

        const response = await gerarRelatorio(filtros);

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json') || contentType.includes('text')) {
            const errText = await response.text();
            throw new Error(errText || 'Erro interno no Power Automate ao gerar o PDF.');
        }

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
        alert('Erro ao gerar o relatório em PDF. Verifique o fluxo do Power Automate.');
    } finally {
        btnRelatorio.innerHTML = textoOriginal;
        btnRelatorio.disabled = false;
        hideLoading();
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
        if (btn.dataset.tab === 'relatorios') atualizarSelects();
    });
});

document.getElementById('acao-fotos').addEventListener('change', function() {
    document.getElementById('foto-count').textContent = this.files.length + ' arquivo(s)';
});

// ====== INICIALIZAÇÃO ======
initData();

document.getElementById('aplicar-filtros-dash').addEventListener('click', atualizarDashboard);
document.querySelectorAll('#dashboard-escola, #dashboard-data-inicio, #dashboard-data-fim').forEach(el => {
    el.addEventListener('change', atualizarDashboard);
});