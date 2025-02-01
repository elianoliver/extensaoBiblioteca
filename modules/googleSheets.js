const contagemAlunos = document.getElementById("contagemAlunos");
const contagemCursos = document.getElementById("contagemCursos");
const footer = document.getElementsByTagName("footer")[0];

document.getElementById("sheet-button").addEventListener("click", () => {
    mostrarFooter();
    acessarPlanilha();
});

function mostrarFooter() {
    footer.style.display = "block";
}

function acessarPlanilha() {
    const apiKey = "AIzaSyBB7KyxfvyPIz_NkuoXKc4CDtfHTHI7RbI";
    const sheetId = "1luAS2zzqX98O6o4R_sDVk0q7aYhgLyiu2S-s8NLVTbw";
    const range = "C1:K1000";

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
            return response.json();
        })
        .then((data) => {
            if (data.values) {
                console.log("Dados da planilha:", data.values);
                atualizarContadores(data.values);
            } else {
                console.error("Nenhum dado retornado.");
            }
        })
        .catch((error) => console.error("Erro:", error));
}

function atualizarContadores(values) {
    if (!values || !Array.isArray(values) || values.length === 0) {
        console.error("Dados inválidos.");
        return;
    }

    const alunos = new Set();
    const cursos = new Set();

    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const aluno = row[1] ? row[1].trim() : "";
        const curso = row[6] ? row[6].trim() : "";

        if (aluno !== "") alunos.add(aluno);
        if (curso !== "") cursos.add(curso);
    }

    if (contagemAlunos) contagemAlunos.textContent = "Alunos: " + alunos.size;
    if (contagemCursos) contagemCursos.textContent = "Cursos: " + cursos.size;
}