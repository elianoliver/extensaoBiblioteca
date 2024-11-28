// cadastro.js
import { TableModule } from '../../individual/table.js';

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const btnAlterar = document.querySelector('.buttons-container button:first-child');
    const btnVoltar = document.querySelector('.buttons-container button:last-child');
    const selectAllCheckbox = document.querySelector('.table th input[type="checkbox"]');

    // Local Storage Management
    const StorageManager = {
        initialize() {
            const defaultItems = {
                matriculas: [],
                matriculas_dados: {},
                matriculas_dados_alterados: {}
            };

            Object.entries(defaultItems).forEach(([key, defaultValue]) => {
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, JSON.stringify(defaultValue));
                }
            });
        },

        getItem(key) {
            return JSON.parse(localStorage.getItem(key) || '{}');
        },

        setItem(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },

        getStudentData(matricula) {
            const alterados = this.getItem('matriculas_dados_alterados');
            const originais = this.getItem('matriculas_dados');
            return alterados[matricula] || originais[matricula] || {};
        }
    };

    // Form Management
    const FormManager = {
        validateInputs() {
            let hasChanges = false;
            const changes = {};

            const inputs = document.querySelectorAll('.field-input input, .field-input select');
            inputs.forEach(input => {
                const value = input.value.trim();
                if (value) {
                    hasChanges = true;
                    changes[input.name || input.id] = value;
                }
            });

            return hasChanges ? changes : null;
        },

        applyChanges() {
            const changes = this.validateInputs();
            if (!changes) {
                alert('Por favor, preencha pelo menos um campo para alterar.');
                return;
            }

            const selectedCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
            if (!selectedCheckboxes.length) {
                alert('Por favor, selecione pelo menos um aluno.');
                return;
            }

            const dadosAlterados = StorageManager.getItem('matriculas_dados_alterados');

            selectedCheckboxes.forEach(checkbox => {
                const matricula = checkbox.dataset.matricula;
                const currentData = StorageManager.getStudentData(matricula);

                dadosAlterados[matricula] = {
                    ...currentData,
                    ...changes,
                    isModified: true,
                    lastModified: new Date().toISOString()
                };
            });

            StorageManager.setItem('matriculas_dados_alterados', dadosAlterados);
            this.resetForm();
            tableModule.refreshTable();
        },

        resetForm() {
            const inputs = document.querySelectorAll('.field-input input, .field-input select');
            inputs.forEach(input => input.value = '');

            const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);

            if (selectAllCheckbox) selectAllCheckbox.checked = false;
            tableModule.updateCounters();
        }
    };

    // Configuração da tabela
    const tableConfig = {
        container: document.querySelector('.table-container'),
        columns: [
            {
                type: 'checkbox',
                header: '<input type="checkbox" id="selectAll">',
                onHeaderCheckboxChange: (checked) => {
                    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
                    checkboxes.forEach(cb => cb.checked = checked);
                    tableModule.updateCounters();
                }
            },
            { header: 'Matrícula', field: 'matricula' },
            { header: 'Nome', field: 'nome' },
            { header: 'Email', field: 'email' },
            { header: 'Telefone', field: 'telefone' },
            { header: 'CPF', field: 'cpf' },
            { header: 'Curso', field: 'curso' },
            { header: 'Situação', field: 'situacao' },
            { header: 'Tipo Usuário', field: 'tipo_usuario' },
            { header: 'Validade', field: 'validade_biblioteca' }
        ],
        counters: {
            selected: document.querySelector('#selectedCount'),
            total: document.querySelector('#totalCount')
        },
        rowClassResolver: (dados) => dados.isModified ? 'row-alterado' : '',
        getRowData: (matricula) => StorageManager.getStudentData(matricula)
    };

    const tableModule = new TableModule(tableConfig);

    // Event Listeners
    function initializeEventListeners() {
        if (btnAlterar) {
            btnAlterar.addEventListener('click', () => FormManager.applyChanges());
        }

        if (btnVoltar) {
            btnVoltar.addEventListener('click', () => window.history.back());
        }

        // Initialize phone mask
        const telefoneInput = document.querySelector('.field-input input[type="tel"]');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', function (e) {
                let value = e.target.value.replace(/\D/g, '');
                value = value.substring(0, 11);

                if (value.length > 0) {
                    const ddd = value.substring(0, 2);
                    const numero = value.substring(2);

                    if (value.length === 11) {
                        const parte1 = numero.substring(0, 5);
                        const parte2 = numero.substring(5);
                        value = `(${ddd}) ${parte1}-${parte2}`;
                    } else if (value.length === 10) {
                        const parte1 = numero.substring(0, 4);
                        const parte2 = numero.substring(4);
                        value = `(${ddd}) ${parte1}-${parte2}`;
                    } else if (value.length > 2) {
                        value = `(${ddd}) ${numero}`;
                    } else if (value.length > 0) {
                        value = `(${value}`;
                    }
                }
                e.target.value = value;
            });
        }
    }

    // Initialization
    function initialize() {
        StorageManager.initialize();
        tableModule.initialize();
        initializeEventListeners();
    }

    initialize();
});