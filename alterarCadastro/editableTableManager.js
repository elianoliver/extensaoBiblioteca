// editableTableManager.js
import { TableManager } from '../modules/tableManager.js';

export class EditableTableManager extends TableManager {
    constructor(containerId, footerId, totalId) {
        super(containerId, footerId, totalId);
        this.editableColumns = ['nome', 'email', 'telefone', 'cpf', 'curso', 'situacao', 'tipo_usuario', 'validade_biblioteca'];
        this.EDITED_DATA_KEY = 'matriculas_dados_editado';
        this.ORIGINAL_DATA_KEY = 'matriculas_dados';
    }

    _criarCabecalhoTabela() {
        return `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th class="table-col-sm">Ações</th>
                        <th class="table-col-sm sortable" data-column="matricula">
                            Matrícula
                            <span class="sort-icon"></span>
                        </th>
                        <th class="table-col-lg sortable" data-column="nome">
                            Nome
                            <span class="sort-icon"></span>
                        </th>
                        <th class="table-col-xl sortable" data-column="email">
                            Email
                            <span class="sort-icon"></span>
                        </th>
                        <th class="table-col-md sortable" data-column="telefone">
                            Telefone
                            <span class="sort-icon"></span>
                        </th>
                        <th class="table-col-md sortable" data-column="cpf">
                            CPF
                            <span class="sort-icon"></span>
                        </th>
                        <th class="table-col-lg sortable" data-column="curso">
                            Curso
                            <span class="sort-icon"></span>
                        </th>
                        <th class="table-col-md sortable" data-column="situacao">
                            Situação
                            <span class="sort-icon"></span>
                        </th>
                        <th class="table-col-md sortable" data-column="tipo_usuario">
                            Tipo Usuário
                            <span class="sort-icon"></span>
                        </th>
                        <th class="table-col-md sortable" data-column="validade_biblioteca">
                            Validade
                            <span class="sort-icon"></span>
                        </th>
                    </tr>
                </thead>
                <tbody>
        `;
    }

    _criarCorpoTabela(matriculas, infoAtual) {
        let html = '';

        matriculas.forEach((matricula) => {
            const info = this._getDadosMatricula(matricula);
            const infoOriginal = this._getDadosMatriculaOriginal(matricula);

            const getModifiedClass = (columnName) => {
                const editedValue = info[columnName];
                const originalValue = infoOriginal[columnName];
                return editedValue !== originalValue ? 'modified-cell' : '';
            };

            html += `
                <tr data-matricula="${matricula}">
                    <td class="table-col-sm acoes-cell">
                        <div class="acoes-container">
                            <button class="btn-acao botaoRemover" title="Remover" data-matricula="${matricula}">×</button>
                            <button class="btn-acao botaoResetar" title="Resetar alterações" data-matricula="${matricula}">↺</button>
                        </div>
                    </td>
                    <td class="table-col-sm">${matricula}</td>
                    <td class="table-col-lg ${getModifiedClass('nome')}" contenteditable="true" data-original="${infoOriginal.nome || '-'}">${info.nome || '-'}</td>
                    <td class="table-col-xl ${getModifiedClass('email')}" contenteditable="true" data-original="${infoOriginal.email || '-'}">${info.email || '-'}</td>
                    <td class="table-col-md ${getModifiedClass('telefone')}" contenteditable="true" data-original="${infoOriginal.telefone || '-'}">${info.telefone || '-'}</td>
                    <td class="table-col-md ${getModifiedClass('cpf')}" contenteditable="true" data-original="${infoOriginal.cpf || '-'}">${info.cpf || '-'}</td>
                    <td class="table-col-lg ${getModifiedClass('curso')}" contenteditable="true" data-original="${infoOriginal.curso || '-'}">${info.curso || '-'}</td>
                    <td class="table-col-md ${getModifiedClass('situacao')}" contenteditable="true" data-original="${infoOriginal.situacao || '-'}">${info.situacao || '-'}</td>
                    <td class="table-col-md ${getModifiedClass('tipo_usuario')}" contenteditable="true" data-original="${infoOriginal.tipo_usuario || '-'}">${info.tipo_usuario || '-'}</td>
                    <td class="table-col-md ${getModifiedClass('validade_biblioteca')}" contenteditable="true" data-original="${infoOriginal.validade_biblioteca || '-'}">${info.validade_biblioteca || '-'}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        return html;
    }

    _configurarEventListeners() {
        super._configurarEventListeners();

        if (!this.container) return;

        // Eventos para edição
        this.container.addEventListener('blur', (e) => {
            if (e.target.hasAttribute('contenteditable')) {
                this._handleCellEdit(e.target);
            }
        }, true);

        this.container.addEventListener('keydown', (e) => {
            if (e.target.hasAttribute('contenteditable') && e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        }, true);

        // Evento para resetar alterações
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('botaoResetar')) {
                const matricula = e.target.dataset.matricula;
                this._resetarAlteracoes(matricula);
            }
        });
    }

    _handleCellEdit(cell) {
        const newValue = cell.textContent.trim();
        if (newValue === '-') return;

        const row = cell.closest('tr');
        const matricula = row.dataset.matricula;
        const columnName = this._getColumnNameByIndex(cell.cellIndex);

        // Salva apenas no storage de dados editados
        const matriculasDadosEditados = JSON.parse(localStorage.getItem(this.EDITED_DATA_KEY)) || {};
        if (!matriculasDadosEditados[matricula]) {
            matriculasDadosEditados[matricula] = this._getDadosMatriculaOriginal(matricula);
        }

        matriculasDadosEditados[matricula][columnName] = newValue;
        matriculasDadosEditados[matricula].timestamp = new Date().getTime();

        localStorage.setItem(this.EDITED_DATA_KEY, JSON.stringify(matriculasDadosEditados));

        // Atualiza visual da célula modificada
        const originalValue = cell.dataset.original;
        if (newValue !== originalValue) {
            cell.classList.add('modified-cell');
        } else {
            cell.classList.remove('modified-cell');
        }
    }

    _resetarAlteracoes(matricula) {
        if (!confirm('Deseja realmente resetar todas as alterações para esta matrícula?')) return;

        const matriculasDadosEditados = JSON.parse(localStorage.getItem(this.EDITED_DATA_KEY)) || {};
        if (matriculasDadosEditados[matricula]) {
            delete matriculasDadosEditados[matricula];
            localStorage.setItem(this.EDITED_DATA_KEY, JSON.stringify(matriculasDadosEditados));
        }

        // Atualiza a visualização
        this.atualizarTabelaComInfo(this.lastData.matriculas, this.lastData.infoAtual);
    }

    _getDadosMatricula(matricula) {
        // Primeiro busca nos dados editados
        const matriculasEditadas = JSON.parse(localStorage.getItem(this.EDITED_DATA_KEY)) || {};
        if (matriculasEditadas[matricula]) {
            return matriculasEditadas[matricula];
        }
        // Se não encontrar, retorna os dados originais
        return this._getDadosMatriculaOriginal(matricula);
    }

    _getDadosMatriculaOriginal(matricula) {
        const matriculasStorage = localStorage.getItem(this.ORIGINAL_DATA_KEY) || '{}';
        const matriculasDados = JSON.parse(matriculasStorage);
        return matriculasDados[matricula] || {};
    }

    _getColumnNameByIndex(index) {
        const columnMap = {
            2: 'nome',
            3: 'email',
            4: 'telefone',
            5: 'cpf',
            6: 'curso',
            7: 'situacao',
            8: 'tipo_usuario',
            9: 'validade_biblioteca'
        };
        return columnMap[index];
    }
}