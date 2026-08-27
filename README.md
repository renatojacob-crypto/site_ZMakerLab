

# 🚀 ZMaker Manager - ZOOM Education for Life

Um sistema de gestão web completo para orquestrar a implantação, logística e acompanhamento pedagógico dos laboratórios **ZMaker Lab** em instituições de ensino. 

O ZMaker Manager foi desenvolvido com uma arquitetura *Serverless*, utilizando um frontend dinâmico em Vanilla JavaScript que se comunica via requisições HTTP com fluxos do **Microsoft Power Automate**, utilizando o **Excel Online** como banco de dados.

## ✨ Funcionalidades Principais

* **🏫 Gestão de Escolas:** Cadastro completo de instituições com integração à API do ViaCEP para preenchimento automático de endereços.
* **👩‍💼 Gestão de Equipe e Gerência:** Cadastro dinâmico de Responsáveis Técnicos e Gerentes Educacionais.
* **📅 Agendamentos Automatizados:** Criação de agendas (Montagem, Formação, Reuniões) com gatilho automático de envio de e-mails para os envolvidos via Outlook/Power Automate.
* **📝 Registro de Ações (Checklist):** Baixa de agendamentos com registro de carga horária, upload de fotos e um checklist detalhado de inventário de hardware.
* **📦 Painel Logístico:** Acompanhamento do status de materiais, adesivação da sala, tensão elétrica e previsão de entregas.
* **📊 Dashboard e Progresso:** Acompanhamento em tempo real do percentual de implantação de cada escola, com gráficos gerados via Chart.js.
* **🗺️ Roteiros e Mapeamento:** Agrupamento automático de escolas com pendências por Estado/Cidade e plotagem geográfica utilizando a Google Maps API.
* **📑 Geração de PDF:** Emissão automatizada do **Termo de Aceite e Entrega** cruzando dados de logística, montagem e formação, além de relatórios analíticos de carga horária.

## 🛠️ Tecnologias Utilizadas

**Frontend:**
* HTML5, CSS3, JavaScript (ES6+)
* [Chart.js](https://www.chartjs.org/) (Gráficos)
* [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) (Plotagem de Roteiros)
* [ViaCEP API](https://viacep.com.br/) (Busca de CEP)

**Backend / Banco de Dados:**
* Microsoft Power Automate (Processamento de APIs e Disparo de E-mails)
* Microsoft Excel Online (Banco de Dados em formato de Tabelas)

## 🏗️ Arquitetura do Sistema

O sistema não possui um servidor backend tradicional (Node.js, Python, etc). Todo o processamento de dados funciona da seguinte forma:
1. O Frontend dispara um `fetch()` (GET ou POST) com um pacote JSON.
2. Um gatilho HTTP no **Power Automate** intercepta a requisição.
3. O Power Automate lê ou escreve os dados em uma Tabela do **Excel Online**.
4. O Power Automate devolve o status `200 OK` (com ou sem dados) para o frontend.

## ⚙️ Como Configurar e Instalar

### 1. Preparando o Banco de Dados (Excel)
Crie um arquivo no Excel Online e crie planilhas separadas formatadas como **Tabela** (Inserir > Tabela) com as respectivas colunas para:
* `Escolas`
* `Agendamentos`
* `Acoes`
* `Logistica`
* `Gerentes`
* `Equipe`

### 2. Configurando as APIs (Power Automate)
Para cada uma das 6 tabelas acima, você precisará criar 2 fluxos instantâneos no Power Automate:
* **Fluxo GET:** Gatilho HTTP (Método GET) -> Listar linhas da tabela (Excel) -> Resposta HTTP (Retornando a saída do Excel).
* **Fluxo POST:** Gatilho HTTP (Método POST com Esquema JSON) -> Adicionar linha na tabela (Excel) -> Resposta HTTP.
*(Nota: No fluxo POST de Agendamentos, adicione o passo do conector Office 365 Outlook para disparar os e-mails antes de retornar a resposta).*

### 3. Configurando o Frontend
Clone este repositório:
```bash
git clone [https://github.com/SEU-USUARIO/zmaker-manager.git](https://github.com/SEU-USUARIO/zmaker-manager.git)