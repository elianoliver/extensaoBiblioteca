// table.js
export class TableModule {
    constructor(config) {
        this.container = config.container;
        this.columns = config.columns;
        this.storageKey = config.storageKey || 'matriculas';
        this.onRowClick = config.onRowClick;
        this.getRowData = config.getRowData || this.defaultGetRowData;
        this.rowClassResolver = config.rowClassResolver;
        this.counters = config.counters || {};
    }

    defaultGetRowData(matricula) {
        const matriculasDados = JSON.parse(localStorage.getItem('matriculas_dados') || '{}');
        const matriculasDadosAlterados = JSON.parse(localStorage.getItem('matriculas_dados_alterados') || '{}');
        return matriculasDadosAlterados[matricula] || matriculasDados[matricula] || {};
    }

    createRow(matricula) {
        const tr = document.createElement('tr');
        const dados = this.getRowData(matricula);

        if (this.rowClassResolver) {
            const className = this.rowClassResolver(dados);
            if (className) tr.classList.add(className);
        }

        let html = '';
        this.columns.forEach(column => {
            if (column.type === 'checkbox') {
                html += `
                    <td class="checkbox-column">
                        <input type="checkbox" data-matricula="${matricula}">
                    </td>`;
            } else if (column.type === 'action') {
                html += `
                    <td>
                        <button class="${column.className}" data-matricula="${matricula}" aria-label="${column.ariaLabel}">
                            ${column.content}
                        </button>
                    </td>`;
            } else {
                const value = column.getValue ? column.getValue(dados) : (dados[column.field] || '-');
                const className = column.getClass ? column.getClass(value) : '';
                html += `<td ${className ? `class="${className}"` : ''}>${value}</td>`;
            }
        });

        tr.innerHTML = html;
        return tr;
    }

    refreshTable() {
        const matriculas = JSON.parse(localStorage.getItem(this.storageKey)) || [];

        if (matriculas.length === 0) {
            this.container.innerHTML = '';
            return;
        }

        let html = `
            <table class="table">
                <thead>
                    <tr>
                        ${this.columns.map(col => `<th>${col.header || ''}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        `;

        this.container.innerHTML = html;
        const tbody = this.container.querySelector('tbody');

        matriculas.forEach(matricula => {
            tbody.appendChild(this.createRow(matricula));
        });

        // Adiciona evento ao checkbox do header após criar a tabela
        const selectAllCheckbox = this.container.querySelector('thead input[type="checkbox"]');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = this.container.querySelectorAll('tbody input[type="checkbox"]');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
                this.updateCounters(matriculas);
            });
        }

        this.updateCounters(matriculas);
    }

    updateCounters(matriculas) {
        const total = matriculas?.length || 0;
        const selected = this.container.querySelectorAll('tbody input[type="checkbox"]:checked').length;

        if (this.counters.total) {
            this.counters.total.textContent = total;
        }
        if (this.counters.selected) {
            this.counters.selected.textContent = selected;
        }
    }

    initialize() {
        this.refreshTable();

        if (this.onRowClick) {
            this.container.addEventListener('click', this.onRowClick);
        }

        // Atualiza contadores quando checkboxes mudam
        this.container.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const matriculas = JSON.parse(localStorage.getItem(this.storageKey)) || [];
                this.updateCounters(matriculas);
            }
        });
    }
}