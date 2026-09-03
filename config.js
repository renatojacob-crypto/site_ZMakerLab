// ====== CONFIGURAÇÃO DAS URLs COMPLETAS DO POWER AUTOMATE ======
// Cada fluxo tem sua própria URL única.
// Substitua cada URL pela URL real que você copiou do gatilho HTTP de cada fluxo.

const API_CONFIG = {
    // Listar escolas (GET)
    getEscolas: 'https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com/powerautomate/automations/direct/cu/06/workflows/c62297c1ce6345d0ab2190018233c32a/triggers/manual/paths/invoke/api/escolas?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=7KE5gnQ8LVEE9Mwl5F_oWvjG0M3cnMWMkSdMumSyCdM',
    
    // Criar escola (POST)
    postEscola: 'https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/08/workflows/eaf3341a3a0446ccb348a26bb532179c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ipxBpTOL9LWIJVdAtDcmWvTf6OGnbTkdQbGzfeg3z-E',
    
    // Listar agendamentos (GET)
    getAgendamentos: 'https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com/powerautomate/automations/direct/cu/28/workflows/6d09ca561ea14ba78e645badee9589c3/triggers/manual/paths/invoke/api/agendamentos?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=yo-GTcMnPD4dczTiKt7cGQS96kXSLJlv6253AUd7FI8',
    
    // Criar agendamento (POST)
    postAgendamento: 'https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com/powerautomate/automations/direct/cu/20/workflows/1fb61a4796de4a4295b69b04e6942e49/triggers/manual/paths/invoke/api/agendamentos?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ersor03w4lxamcigEUDwpwEILa2wGC2r4sWQASm5rwA',
    
    // Listar ações (GET)
    getAcoes: 'https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com/powerautomate/automations/direct/cu/28/workflows/4769b005b04941f6b9952e88f2fe6901/triggers/manual/paths/invoke/api/acoes?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fUKlDwHbGSzI9iu-xpUpf7B9zbxkVrCIn6FfspfhQrw',
    
    // Criar ação (POST)
    postAcao: 'https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com/powerautomate/automations/direct/cu/12/workflows/52b6af4c67e9414181fa67d5790f5e1e/triggers/manual/paths/invoke/api/acoes?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iKV0M_6AvGsmRvHhgagr4dygDJnlOxrnWbIE-Ncx_08',
    
    // Gerar relatório (POST) - retorna PDF
    postRelatorio: 'https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com/powerautomate/automations/direct/cu/15/workflows/e4e666c3f12e40e3a4c80fc3ad21a37a/triggers/manual/paths/invoke/gerar_relatorio?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xycg3o9PQwJ3ixkVY1_V_iO83_7sf5Ac88T4SeEFvwc',

    // Lista os Itens da Logística (GET)
    getLogistica: 'https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/17/workflows/12d41abd5414403093287015101e0933/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PMkBFgXIaLMgvfcRNudf6xYGZ5l3Lq9ROqxzV7M2LiU', 

    // Cria os itens de Logística
    postLogistica: 'https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/04/workflows/1a0c5045504a41bf9828a6b096dd3a41/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=JlHf8lZR1iPSm_VIju906dkBf4kmdvoFzZHwTBwwBT8',

    // Lista Gerentes
    getGerentes: "https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/00/workflows/47c815abb0004523953111c24dab324e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xbiDwh8cguw4xFVfqTReM5MCIWbYhV0DYqCAMEZEaJA",

    // Cria gerentes
    postGerente: "https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/04/workflows/83664ad832474c9681ba6e709752406d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=UhP3gmkoKP4jX5IF9gNz4-Rd4Sb3r6hnrYKROMUbxJ4",

    // Lista Equipe
    getEquipe: "https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/05/workflows/6ccab32599a14a399b705668c8324670/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=M-7yAwvQ97klTiCZ_-q8OAhZzjxtQY2Ak3UDIpirtg8",

    // Cria Equipe
    postEquipe: "https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/20/workflows/21e14bb7e4404a48be00e959593b0179/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0JarmAc-OqA0t19gTqdTiuvnUeBWmoeOOio0LvYybjw",

    //Editar Escola
    putEscola: "https://defaultf916220e9d9a444a9c2bddd8cd5534.b2.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/17/workflows/ff938f9bc9534d6fbf064ea64c1ef14b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=S1XUkO_RmynGTKOlpggzaF1Ou63a6tMWoIrRE1hrpgA"

};

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
} else {
    window.API_CONFIG = API_CONFIG;
}