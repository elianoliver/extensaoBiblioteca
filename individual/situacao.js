import { scrapingService } from './scraping.js';

document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    // Updated selectors to match new class structure
    const botaoAdicionar = document.querySelector('.input-group .btn-add');
    const inputMatricula = document.querySelector('.input-group input[type="number"]');
    const dtidInput = document.querySelector('.form-group #dtid');
    const uuidInput = document.querySelector('.form-group #uuid');
    const tabelaContainer = document.querySelector('.table-container');
    const footer = document.querySelector('.footer');
    const totalMatriculas = document.querySelector('.total-counter');

    // Initialize localStorage
    if (!localStorage.getItem('matriculas')) {
        localStorage.setItem('matriculas', JSON.stringify([]));
    }
    if (!localStorage.getItem('matriculas_dados')) {
        localStorage.setItem('matriculas_dados', JSON.stringify({}));
    }

    // Load saved parameters
    const parametrosSalvos = JSON.parse(localStorage.getItem('parametros_consulta') || '{}');
    if (parametrosSalvos.dtid) {
        dtidInput.value = parametrosSalvos.dtid;
    }
    if (parametrosSalvos.uuid) {
        uuidInput.value = parametrosSalvos.uuid;
    }

    // Event Listeners
    botaoAdicionar?.addEventListener('click', adicionarMatricula);
    tabelaContainer.addEventListener('click', handleRemoveClick);
    inputMatricula.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            adicionarMatricula();
        }
    });

    // Parameter save listeners
    dtidInput.addEventListener('change', salvarParametros);
    uuidInput.addEventListener('change', salvarParametros);
    dtidInput.addEventListener('blur', salvarParametros);
    uuidInput.addEventListener('blur', salvarParametros);

    function salvarParametros() {
        const parametros = {
            dtid: dtidInput.value.trim(),
            uuid: uuidInput.value.trim()
        };
        localStorage.setItem('parametros_consulta', JSON.stringify(parametros));
    }

    // LocalStorage helper functions
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

    function handleRemoveClick(e) {
        // Updated to use new btn-remove class
        if (e.target.classList.contains('btn-remove')) {
            const matricula = e.target.dataset.matricula;
            removeMatricula(matricula);
        }
    }

    function removeMatricula(matricula) {
        let matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
        matriculas = matriculas.filter(m => m !== matricula);
        localStorage.setItem('matriculas', JSON.stringify(matriculas));

        const matriculasDados = JSON.parse(localStorage.getItem('matriculas_dados') || '{}');
        delete matriculasDados[matricula];
        localStorage.setItem('matriculas_dados', JSON.stringify(matriculasDados));

        atualizarTabela();
        atualizarVisibilidade(matriculas);
    }

    async function adicionarMatricula() {
        let matricula = inputMatricula.value.trim();
        if (!matricula) return;

        matricula = matricula.replace(/^0+/, '');
        if (matricula === '') matricula = '0';

        const dtid = dtidInput.value.trim();
        const uuid = uuidInput.value.trim();

        if (!dtid || !uuid) {
            alert('Por favor, preencha os campos dtid e uuid.');
            return;
        }

        try {
            const dadosCache = recuperarDadosMatricula(matricula);
            const umahora = 60 * 60 * 1000;

            let info;
            if (dadosCache && (new Date().getTime() - dadosCache.timestamp) < umahora) {
                info = dadosCache;
            } else {
                info = await scrapingService.consultarMatricula(matricula, dtid, uuid);
                salvarDadosMatricula(matricula, info);
            }

            let matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
            if (!matriculas.includes(matricula)) {
                matriculas.push(matricula);
                localStorage.setItem('matriculas', JSON.stringify(matriculas));
                atualizarTabelaComInfo(matriculas, info);
                inputMatricula.value = '';
            }

            atualizarVisibilidade(matriculas);
            inputMatricula.focus();
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

        // Updated table structure with new classes
        let html = `
            <table class="table">
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

            // Updated button class to use new btn-remove class
            html += `
                <tr>
                    <td>${matricula}</td>
                    <td>${info.nome || '-'}</td>
                    <td>${info.email || '-'}</td>
                    <td>${info.telefone || '-'}</td>
                    <td>${info.cpf || '-'}</td>
                    <td>${info.curso || '-'}</td>
                    <td class="${info.situacao === 'Pendente' ? 'status-pendente' : 'status-regular'}">${info.situacao || '-'}</td>
                    <td>${info.tipo_usuario || '-'}</td>
                    <td>${info.validade_biblioteca || '-'}</td>
                    <td>
                        <button class="btn btn-remove" data-matricula="${matricula}" aria-label="Remover matrícula">×</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        tabelaContainer.innerHTML = html;
        totalMatriculas.querySelector('span').textContent = matriculas.length;
    }

    function atualizarTabela() {
        const matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
        atualizarTabelaComInfo(matriculas, {});
        atualizarVisibilidade(matriculas);
    }

    function atualizarVisibilidade(matriculas) {
        const temMatriculas = matriculas.length > 0;
        tabelaContainer.style.display = temMatriculas ? 'block' : 'none';
    }

    // Initialize table
    atualizarTabela();
});