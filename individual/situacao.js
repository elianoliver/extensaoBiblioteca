// situacao.js
import { TableModule } from './table.js';

document.addEventListener('DOMContentLoaded', function () {
    const tabelaContainer = document.querySelector('.table-container');
    const totalMatriculas = document.querySelector('.total-counter');

    // Função para remover matrícula
    function handleRemoveClick(e) {
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

        tableModule.refreshTable();
        atualizarVisibilidade(matriculas);
    }

    function atualizarVisibilidade(matriculas) {
        const temMatriculas = matriculas.length > 0;
        tabelaContainer.style.display = temMatriculas ? 'block' : 'none';
    }

    const tableConfig = {
        container: tabelaContainer,
        columns: [
            { header: 'Matrícula', field: 'matricula' },
            { header: 'Nome', field: 'nome' },
            { header: 'Email', field: 'email' },
            { header: 'Telefone', field: 'telefone' },
            { header: 'CPF', field: 'cpf' },
            { header: 'Curso', field: 'curso' },
            {
                header: 'Situação',
                field: 'situacao',
                getClass: (value) => value === 'Pendente' ? 'status-pendente' : 'status-regular'
            },
            { header: 'Tipo Usuário', field: 'tipo_usuario' },
            { header: 'Validade', field: 'validade_biblioteca' },
            {
                header: 'Ação',
                type: 'action',
                className: 'btn btn-remove',
                ariaLabel: 'Remover matrícula',
                content: '×'
            }
        ],
        counters: {
            total: totalMatriculas.querySelector('span')
        },
        onRowClick: handleRemoveClick
    };

    const tableModule = new TableModule(tableConfig);
    tableModule.initialize();
});