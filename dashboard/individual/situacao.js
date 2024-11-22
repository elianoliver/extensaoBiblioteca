import { scrapingService } from './scraping.js';

document.addEventListener('DOMContentLoaded', function () {
    // Elementos DOM
    const botao = document.getElementById('btAdicionarItem');
    const input = document.getElementById('matricula');
    const dtidInput = document.getElementById('dtid');
    const uuidInput = document.getElementById('uuid');
    const tabelaContainer = document.getElementById('tabelaContainer');
    const containerFooter = document.getElementById('containerFooter');
    const totalMatriculas = document.getElementById('totalMatriculas');

    // Inicialização do localStorage
    if (!localStorage.getItem('matriculas')) {
        localStorage.setItem('matriculas', JSON.stringify([]));
    }
    if (!localStorage.getItem('matriculas_dados')) {
        localStorage.setItem('matriculas_dados', JSON.stringify({}));
    }

    // Event Listeners
    botao?.addEventListener('click', adicionarMatricula);
    tabelaContainer.addEventListener('click', handleRemoveClick);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            adicionarMatricula();
        }
    });

    // Funções auxiliares para o localStorage
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

    // Handlers
    function handleRemoveClick(e) {
        if (e.target.classList.contains('botaoRemover')) {
            const matricula = e.target.dataset.matricula;
            removeMatricula(matricula);
        }
    }

    function removeMatricula(matricula) {
        let matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
        matriculas = matriculas.filter(m => m !== matricula);
        localStorage.setItem('matriculas', JSON.stringify(matriculas));

        // Remove também os dados da matrícula
        const matriculasDados = JSON.parse(localStorage.getItem('matriculas_dados') || '{}');
        delete matriculasDados[matricula];
        localStorage.setItem('matriculas_dados', JSON.stringify(matriculasDados));

        atualizarTabela();
        atualizarVisibilidade(matriculas);
    }

    async function adicionarMatricula() {
        let matricula = input.value.trim();
        if (!matricula) return;

        // Remove zeros à esquerda
        matricula = matricula.replace(/^0+/, '');

        // Caso a matrícula seja toda composta de zeros, mantém um zero
        if (matricula === '') matricula = '0';

        // Obtém os valores de dtid e uuid dos inputs
        const dtid = dtidInput.value.trim();
        const uuid = uuidInput.value.trim();

        if (!dtid || !uuid) {
            alert('Por favor, preencha os campos dtid e uuid.');
            return;
        }

        try {
            // Verifica se já temos dados em cache
            const dadosCache = recuperarDadosMatricula(matricula);
            const umahora = 60 * 60 * 1000; // 1 hora em milissegundos

            let info;
            if (dadosCache && (new Date().getTime() - dadosCache.timestamp) < umahora) {
                info = dadosCache;
            } else {
                // Se não temos dados em cache ou eles são antigos, faz nova consulta
                info = await scrapingService.consultarMatricula(matricula, dtid, uuid);
                salvarDadosMatricula(matricula, info);
            }

            let matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
            if (!matriculas.includes(matricula)) {
                matriculas.push(matricula);
                localStorage.setItem('matriculas', JSON.stringify(matriculas));
                atualizarTabelaComInfo(matriculas, info);
                input.value = '';
            }

            atualizarVisibilidade(matriculas);
            input.focus();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao consultar matrícula: ' + error.message);
        }
    }

    function atualizarTabelaComInfo(matriculas, infoAtual) {
        if (matriculas.length === 0) {
            tabelaContainer.innerHTML = '';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>CPF</th>
                        <th>Curso</th>
                        <th>Situação</th>
                        <th>Tipo Usuário</th>
                        <th>Validade</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
        `;

        matriculas.forEach((matricula) => {
            const dadosMatricula = recuperarDadosMatricula(matricula) || {};
            const info = matricula === infoAtual.matricula ? infoAtual : dadosMatricula;

            html += `
                <tr>
                    <td>${matricula}</td>
                    <td>${info.nome || '-'}</td>
                    <td>${info.email || '-'}</td>
                    <td>${info.telefone || '-'}</td>
                    <td>${info.cpf || '-'}</td>
                    <td>${info.curso || '-'}</td>
                    <td>${info.situacao || '-'}</td>
                    <td>${info.tipo_usuario || '-'}</td>
                    <td>${info.validade_biblioteca || '-'}</td>
                    <td>
                        <button class="botaoRemover" data-matricula="${matricula}">×</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        tabelaContainer.innerHTML = html;
        totalMatriculas.textContent = `Total: ${matriculas.length}`;
    }

    function atualizarTabela() {
        const matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
        atualizarTabelaComInfo(matriculas, {});
        atualizarVisibilidade(matriculas);
    }

    function atualizarVisibilidade(matriculas) {
        const temMatriculas = matriculas.length > 0;
        containerFooter.style.visibility = temMatriculas ? 'visible' : 'hidden';
        tabelaContainer.style.display = temMatriculas ? 'block' : 'none';
    }

    // Inicialização da tabela
    atualizarTabela();
});