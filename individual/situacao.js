import { scrapingService } from '../modules/scraping.js';
import { TableManager } from '../modules/tableManager.js';

document.addEventListener('DOMContentLoaded', function () {
    //=================================================================
    // 1. INICIALIZAÇÃO E SELEÇÃO DE ELEMENTOS DOM
    //=================================================================
    // Elementos de input e botões
    const botao = document.getElementById('btAdicionarItem');

    // Modificar o input para ser uma textarea
    const input = document.getElementById('matricula');
    input.outerHTML = `<textarea id="matricula" placeholder="Digite as matrículas (uma por linha)" rows="5" class="${input.className}"></textarea>`;
    const matriculaTextarea = document.getElementById('matricula');

    // Inicializar o gerenciador de tabela
    const tableManager = new TableManager('tabelaContainer', 'containerFooter', 'totalMatriculas');

    //=================================================================
    // 2. CONFIGURAÇÃO DO LOCALSTORAGE
    //=================================================================
    // Inicialização das estruturas de dados no localStorage
    if (!localStorage.getItem('matriculas')) {
        localStorage.setItem('matriculas', JSON.stringify([]));
    }
    if (!localStorage.getItem('matriculas_dados')) {
        localStorage.setItem('matriculas_dados', JSON.stringify({}));
    }

    //=================================================================
    // 3. CONFIGURAÇÃO DOS EVENT LISTENERS
    //=================================================================
    botao?.addEventListener('click', processarMultiplasMatriculas);

    matriculaTextarea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            processarMultiplasMatriculas();
        }
    });

    // Configurar callback de remoção
    tableManager.setRemoveCallback(removeMatricula);

    //=================================================================
    // 4. FUNÇÕES DE MANIPULAÇÃO DO LOCALSTORAGE
    //=================================================================
    function salvarDadosMatricula(matricula, dados) {
        const matriculasStorage = localStorage.getItem('matriculas_dados') || '{}';
        const matriculasDados = JSON.parse(matriculasStorage);

        matriculasDados[matricula] = {
            ...dados,
            timestamp: new Date().getTime()
        };

        localStorage.setItem('matriculas_dados', JSON.stringify(matriculasDados));
    }

    function recuperarDadosMatricula(matricula) {
        const matriculasStorage = localStorage.getItem('matriculas_dados') || '{}';
        const matriculasDados = JSON.parse(matriculasStorage);
        return matriculasDados[matricula];
    }

    //=================================================================
    // 5. FUNÇÕES DE REMOÇÃO
    //=================================================================
    function removeMatricula(matricula) {
        // Remove da lista de matrículas
        let matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
        matriculas = matriculas.filter(m => m !== matricula);
        localStorage.setItem('matriculas', JSON.stringify(matriculas));

        // Remove dados específicos da matrícula
        const matriculasDados = JSON.parse(localStorage.getItem('matriculas_dados') || '{}');
        delete matriculasDados[matricula];
        localStorage.setItem('matriculas_dados', JSON.stringify(matriculasDados));

        // Atualiza a interface
        atualizarTabela();
        tableManager.atualizarVisibilidade(matriculas.length > 0);
    }

    //=================================================================
    // 6. FUNÇÕES PRINCIPAIS DE PROCESSAMENTO DE MATRÍCULAS
    //=================================================================
    async function processarMultiplasMatriculas() {
        const texto = matriculaTextarea.value.trim();
        if (!texto) return;

        // Recupera configurações do localStorage
        const config = JSON.parse(localStorage.getItem('config'));
        if (!config || !config.dtid || !config.uuid) {
            alert('Configuração incompleta. Por favor, volte à página inicial.');
            return;
        }

        // Divide o texto em linhas e remove linhas vazias
        const matriculas = texto
            .split('\n')
            .map(m => m.trim())
            .filter(m => m)
            .map(m => m.replace(/^0+/, '') || '0'); // Remove zeros à esquerda

        // Remove duplicatas
        const matriculasUnicas = [...new Set(matriculas)];

        // Processa cada matrícula
        try {
            for (const matricula of matriculasUnicas) {
                const dadosCache = recuperarDadosMatricula(matricula);
                const umahora = 60 * 60 * 1000;

                let info;
                if (dadosCache && (new Date().getTime() - dadosCache.timestamp) < umahora) {
                    info = dadosCache;
                } else {
                    info = await scrapingService.consultarMatricula(matricula, config.dtid, config.uuid);
                    salvarDadosMatricula(matricula, info);
                }

                // Adiciona à lista de matrículas se ainda não existir
                let matriculasSalvas = JSON.parse(localStorage.getItem('matriculas')) || [];
                if (!matriculasSalvas.includes(matricula)) {
                    matriculasSalvas.push(matricula);
                    localStorage.setItem('matriculas', JSON.stringify(matriculasSalvas));
                }

                // Atualiza a interface após cada consulta
                tableManager.atualizarTabelaComInfo(matriculasSalvas, info);
            }

            // Limpa o textarea e atualiza a visibilidade
            matriculaTextarea.value = '';
            const matriculasSalvas = JSON.parse(localStorage.getItem('matriculas')) || [];
            tableManager.atualizarVisibilidade(matriculasSalvas.length > 0);
            matriculaTextarea.focus();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao consultar matrícula: ' + error.message);
        }
    }

    //=================================================================
    // 7. FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE
    //=================================================================
    function atualizarTabela() {
        const matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
        tableManager.atualizarTabelaComInfo(matriculas, {});
    }

    //=================================================================
    // 8. INICIALIZAÇÃO
    //=================================================================
    // Carrega a tabela inicial
    atualizarTabela();
});