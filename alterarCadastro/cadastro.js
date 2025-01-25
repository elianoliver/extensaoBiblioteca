// cadastro.js
import { EditableTableManager } from './editableTableManager.js';
import { BulkUpdateManager } from './bulkUpdateManager.js';

document.addEventListener('DOMContentLoaded', function () {
    // Inicialização dos elementos do formulário
    const cursoSelect = document.getElementById('curso');
    const situacaoSelect = document.getElementById('situacao');
    const tipoUsuarioSelect = document.getElementById('tipoUsuario');
    const validadeBibliotecaInput = document.getElementById('validadeBiblioteca');

    // Inicializar o gerenciador de tabela editável
    const tableManager = new EditableTableManager('tabelaContainer', 'containerFooter', 'totalMatriculas');

    // Inicializar o gerenciador de atualização em massa
    const bulkUpdateManager = new BulkUpdateManager();

    // Função para atualizar a tabela com os dados do localStorage
    function atualizarTabela() {
        const matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
        const matriculasDados = JSON.parse(localStorage.getItem('matriculas_dados')) || {};
        tableManager.atualizarTabelaComInfo(matriculas, matriculasDados);
    }

    // Configurar o botão de alteração
    const btnAlterar = document.getElementById('btnAlterar');
    btnAlterar.addEventListener('click', async () => {
        const selectedRows = tableManager.getSelectedRows();
        if (selectedRows.length === 0) {
            alert('Selecione pelo menos uma matrícula para alterar.');
            return;
        }

        // Coletar os dados do formulário
        const dadosAtualizacao = {
            curso: cursoSelect.value,
            situacao: situacaoSelect.value,
            tipoUsuario: tipoUsuarioSelect.value,
            validadeBiblioteca: validadeBibliotecaInput.value
        };

        // Atualizar os dados no localStorage para cada matrícula selecionada
        const matriculasDados = JSON.parse(localStorage.getItem('matriculas_dados')) || {};

        selectedRows.forEach(matricula => {
            matriculasDados[matricula] = {
                ...matriculasDados[matricula],
                ...dadosAtualizacao,
                timestamp: new Date().getTime()
            };
        });

        localStorage.setItem('matriculas_dados', JSON.stringify(matriculasDados));

        // Atualizar a interface
        atualizarTabela();
        alert('Dados atualizados com sucesso!');
    });

    // Configurar o botão voltar
    const btnVoltar = document.getElementById('btnVoltar');
    btnVoltar.addEventListener('click', () => {
        window.location.href = '../individual/situacao.html';
    });

    // Carregar a tabela inicial
    atualizarTabela();
});