export class TableManager {
    constructor(containerId, footerId, totalId) {
        // Obter elementos do DOM
        this.container = document.getElementById(containerId);
        this.footer = document.getElementById(footerId);
        this.totalElement = document.getElementById(totalId);
        this.currentSort = { column: null, direction: 'asc' };
        this.lastData = { matriculas: [], infoAtual: {} };

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

        // Adicionar listeners para ordenação e remoção
        if (this.container) {
            this.container.addEventListener('click', (e) => {
                // Listener para botão remover
                if (e.target.classList.contains('botaoRemover')) {
                    const matricula = e.target.dataset.matricula;
                    if (this.onRemoveCallback) this.onRemoveCallback(matricula);
                }

                // Listener para ordenação
                if (e.target.classList.contains('sortable')) {
                    const column = e.target.dataset.column;
                    this.ordenarPor(column);
                }
            });
        }
    }

    setRemoveCallback(callback) {
        this.onRemoveCallback = callback;
    }

    ordenarPor(column) {
        // Atualiza direção da ordenação
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }

        // Reordena e atualiza a tabela
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

            // Normaliza os valores para comparação
            valorA = valorA.toString().toLowerCase();
            valorB = valorB.toString().toLowerCase();

            if (this.currentSort.direction === 'asc') {
                return valorA.localeCompare(valorB);
            } else {
                return valorB.localeCompare(valorA);
            }
        });
    }

    atualizarTabelaComInfo(matriculas, infoAtual = {}) {
        if (!this.container) return;

        // Armazena os dados mais recentes
        this.lastData = { matriculas, infoAtual };

        if (matriculas.length === 0) {
            this.container.innerHTML = '';
            return;
        }

        // Ordena os dados se necessário
        const matriculasOrdenadas = this._ordenarDados(matriculas, infoAtual);

        let html = this._criarCabecalhoTabela();
        html += this._criarCorpoTabela(matriculasOrdenadas, infoAtual);

        this.container.innerHTML = html;
        this.atualizarTotal(matriculas.length);

        // Adiciona indicador de ordenação atual
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
        // Adiciona classe 'sortable' e data-column nos cabeçalhos ordenáveis
        return `
            <table class="table table-hover">
                <thead>
                    <tr>
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
                        <th class="table-col-sm">Ação</th>
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
                        <button class="btn btn-square botaoRemover" data-matricula="${matricula}">×</button>
                    </td>
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