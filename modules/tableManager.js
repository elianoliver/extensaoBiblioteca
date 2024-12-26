export class TableManager {
    constructor(containerId, footerId, totalId) {
        // Obter elementos do DOM
        this.container = document.getElementById(containerId);
        this.footer = document.getElementById(footerId);
        this.totalElement = document.getElementById(totalId);

        // Estado de ordenação
        this.currentSort = { column: null, direction: 'asc' };
        this.lastData = { matriculas: [], infoAtual: {} };

        // Estado de seleção
        this.selectedCells = new Set();
        this.isSelecting = false;
        this.startCell = null;

        // Verificar se os elementos foram encontrados
        if (!this.container) {
            console.error(`Elemento com ID '${containerId}' não encontrado`);
        }
        if (!this.footer) {
            console.error(`Elemento com ID '${footerId}' não encontrado`);
        }
        if (!this.totalElement) {
            console.error(`Elemento com ID '${totalId}' não encontrado`);
        }

        this.onRemoveCallback = null;
        this._configurarEventListeners();
    }

    _configurarEventListeners() {
        if (!this.container) return;

        // Eventos de click para remoção, ordenação e seleção de coluna
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('botaoRemover')) {
                const matricula = e.target.dataset.matricula;
                if (this.onRemoveCallback) this.onRemoveCallback(matricula);
            }
            else if (e.target.classList.contains('sortable')) {
                const column = e.target.dataset.column;
                this.ordenarPor(column);
            }
            else if (e.target.tagName === 'TH' && e.shiftKey) {
                this.selecionarColuna(e.target.cellIndex);
            }
        });

        // Eventos para seleção de células
        this.container.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'TD') {
                this.iniciarSelecao(e.target);
            }
        });

        this.container.addEventListener('mouseover', (e) => {
            if (this.isSelecting && e.target.tagName === 'TD') {
                this.atualizarSelecao(e.target);
            }
        });

        this.container.addEventListener('mouseup', () => {
            this.finalizarSelecao();
        });

        // Evento para copiar seleção
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                this.copiarSelecao();
            }
        });
    }

    // Métodos de seleção
    iniciarSelecao(cell) {
        this.isSelecting = true;
        this.startCell = cell;
        this.selectedCells.clear();
        this.selectedCells.add(cell);
        this.atualizarEstilosSelecao();
    }

    atualizarSelecao(currentCell) {
        if (!this.startCell || !currentCell) return;

        this.selectedCells.clear();

        const table = currentCell.closest('table');
        const rows = table.rows;

        const startRow = this.startCell.parentElement.rowIndex;
        const startCol = this.startCell.cellIndex;
        const currentRow = currentCell.parentElement.rowIndex;
        const currentCol = currentCell.cellIndex;

        const minRow = Math.min(startRow, currentRow);
        const maxRow = Math.max(startRow, currentRow);
        const minCol = Math.min(startCol, currentCol);
        const maxCol = Math.max(startCol, currentCol);

        for (let i = minRow; i <= maxRow; i++) {
            for (let j = minCol; j <= maxCol; j++) {
                this.selectedCells.add(rows[i].cells[j]);
            }
        }

        this.atualizarEstilosSelecao();
    }

    selecionarColuna(columnIndex) {
        const table = this.container.querySelector('table');
        if (!table) return;

        this.selectedCells.clear();

        // Seleciona todas as células da coluna (exceto cabeçalho)
        for (let i = 1; i < table.rows.length; i++) {
            const cell = table.rows[i].cells[columnIndex];
            if (cell) this.selectedCells.add(cell);
        }

        this.atualizarEstilosSelecao();
    }

    finalizarSelecao() {
        this.isSelecting = false;
    }

    atualizarEstilosSelecao() {
        const allCells = this.container.querySelectorAll('td');
        allCells.forEach(cell => cell.classList.remove('selected-cell'));
        this.selectedCells.forEach(cell => cell.classList.add('selected-cell'));
    }

    copiarSelecao() {
        if (this.selectedCells.size === 0) return;

        const table = this.container.querySelector('table');
        if (!table) return;

        // Organiza as células selecionadas
        const cellsByPosition = Array.from(this.selectedCells)
            .map(cell => ({
                row: cell.parentElement.rowIndex,
                col: cell.cellIndex,
                text: cell.textContent.trim()
            }))
            .sort((a, b) => a.row - b.row || a.col - b.col);

        // Agrupa por linhas
        const rows = [];
        let currentRow = -1;
        let currentRowCells = [];

        cellsByPosition.forEach(cell => {
            if (cell.row !== currentRow) {
                if (currentRowCells.length > 0) {
                    rows.push(currentRowCells);
                }
                currentRowCells = [cell.text];
                currentRow = cell.row;
            } else {
                currentRowCells.push(cell.text);
            }
        });
        if (currentRowCells.length > 0) {
            rows.push(currentRowCells);
        }

        // Cria o texto para copiar
        const copyText = rows.map(row => row.join('\t')).join('\n');

        // Copia para a área de transferência
        navigator.clipboard.writeText(copyText).then(() => {
            this.mostrarFeedbackCopia();
        });
    }

    mostrarFeedbackCopia() {
        const feedback = document.createElement('div');
        feedback.textContent = 'Copiado!';
        feedback.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--color-primary);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            animation: fadeOut 1.5s forwards;
        `;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1500);
    }

    // Seus métodos existentes continuam aqui...
    setRemoveCallback(callback) {
        this.onRemoveCallback = callback;
    }

    ordenarPor(column) {
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }
        this.atualizarTabelaComInfo(this.lastData.matriculas, this.lastData.infoAtual);
    }

    _ordenarDados(matriculas, infoAtual) {
        if (!this.currentSort.column) return matriculas;

        return [...matriculas].sort((a, b) => {
            const infoA = a === infoAtual.matricula ? infoAtual : this._getDadosMatricula(a);
            const infoB = b === infoAtual.matricula ? infoAtual : this._getDadosMatricula(b);

            let valorA, valorB;

            switch (this.currentSort.column) {
                case 'matricula':
                    valorA = a;
                    valorB = b;
                    break;
                default:
                    valorA = infoA[this.currentSort.column] || '';
                    valorB = infoB[this.currentSort.column] || '';
            }

            valorA = valorA.toString().toLowerCase();
            valorB = valorB.toString().toLowerCase();

            return this.currentSort.direction === 'asc'
                ? valorA.localeCompare(valorB)
                : valorB.localeCompare(valorA);
        });
    }

    atualizarTabelaComInfo(matriculas, infoAtual = {}) {
        if (!this.container) return;

        this.lastData = { matriculas, infoAtual };

        if (matriculas.length === 0) {
            this.container.innerHTML = '';
            return;
        }

        const matriculasOrdenadas = this._ordenarDados(matriculas, infoAtual);
        let html = this._criarCabecalhoTabela();
        html += this._criarCorpoTabela(matriculasOrdenadas, infoAtual);

        this.container.innerHTML = html;
        this.atualizarTotal(matriculas.length);

        if (this.currentSort.column) {
            const thAtual = this.container.querySelector(`th[data-column="${this.currentSort.column}"]`);
            if (thAtual) {
                thAtual.classList.add(this.currentSort.direction);
            }
        }
    }

    atualizarVisibilidade(temMatriculas) {
        if (this.footer) {
            this.footer.style.visibility = temMatriculas ? 'visible' : 'hidden';
        }
        if (this.container) {
            this.container.style.display = temMatriculas ? 'block' : 'none';
        }
    }

    atualizarTotal(total) {
        if (this.totalElement) {
            this.totalElement.textContent = `Total: ${total}`;
        }
    }

    _criarCabecalhoTabela() {
        return `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th class="table-col-sm">Ação</th>
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
            const info = matricula === infoAtual.matricula ? infoAtual : this._getDadosMatricula(matricula);

            html += `
                <tr>
                    <td class="table-col-sm acoes-cell">
                        <div class="acoes-container">
                            <button class="btn-acao botaoRemover" title="Remover" data-matricula="${matricula}">×</button>
                        </div>
                    </td>
                    <td>${matricula}</td>
                    <td>${info.nome || '-'}</td>
                    <td>${info.email || '-'}</td>
                    <td>${info.telefone || '-'}</td>
                    <td>${info.cpf || '-'}</td>
                    <td>${info.curso || '-'}</td>
                    <td>${info.situacao || '-'}</td>
                    <td>${info.tipo_usuario || '-'}</td>
                    <td>${info.validade_biblioteca || '-'}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        return html;
    }

    _getDadosMatricula(matricula) {
        const matriculasStorage = localStorage.getItem('matriculas_dados') || '{}';
        const matriculasDados = JSON.parse(matriculasStorage);
        return matriculasDados[matricula] || {};
    }
}