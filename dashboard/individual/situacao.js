document.addEventListener('DOMContentLoaded', function () {
    // Elementos DOM
    const botao = document.getElementById('botaoCriarTabela');
    const input = document.getElementById('valores');
    const tabelaContainer = document.getElementById('tabelaContainer');
    const containerFooter = document.getElementById('containerFooter');
    const totalMatriculas = document.getElementById('totalMatriculas');

    // Inicialização
    if (!localStorage.getItem('matriculas')) {
        localStorage.setItem('matriculas', JSON.stringify([]));
    }

    // Event Listeners
    botao?.addEventListener('click', adicionarMatricula);
    tabelaContainer.addEventListener('click', handleRemoveClick);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault(); // Previne o comportamento padrão do Tab
            adicionarMatricula();
        }
    });


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
        atualizarTabela();
        atualizarVisibilidade(matriculas);
    }

    function adicionarMatricula() {
        const matricula = input.value.trim();
        if (!matricula) return;

        let matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
        if (!matriculas.includes(matricula)) {
            matriculas.push(matricula);
            localStorage.setItem('matriculas', JSON.stringify(matriculas));
            atualizarTabela();
            input.value = '';
        }
        atualizarVisibilidade(matriculas);
        input.focus();
    }

    function atualizarTabela() {
        const matriculas = JSON.parse(localStorage.getItem('matriculas')) || [];
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
        `;

        matriculas.forEach((matricula) => {
            html += `
                <tr>
                    <td>${matricula}</td>
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

    function atualizarVisibilidade(matriculas) {
        containerFooter.style.visibility = matriculas.length > 0 ? 'visible' : 'hidden';
        tabelaContainer.style.display = matriculas.length > 0 ? 'block' : 'none';
    }

    // Inicialização da tabela
    atualizarTabela();
});