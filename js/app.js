fetch("data/mapa.json")
    .then(resposta => resposta.json())
    .then(dados => {

        const mapa = document.getElementById("mapa");
        const svg = document.getElementById("conexoes");

        // 1. Renderiza os Cards das Áreas com nova estrutura visual
        dados.areas.forEach(area => {
            const div = document.createElement("div");
            div.id = area.id;
            div.className = "area-card";

            div.innerHTML = `
                <h3 class="area-title">${area.nome}</h3>

                <div class="section-label">Disciplinas do PPC</div>
                <ul class="disciplinas-list">
                    ${area.disciplinas.map(d => `<li>${d}</li>`).join("")}
                </ul>

                <div class="section-label">Carreiras Relacionadas</div>
                <div class="carreiras-container">
                    ${area.carreiras.map(c => `<span class="carreira-tag">${c}</span>`).join("")}
                </div>
            `;

            mapa.appendChild(div);
        });

        // 2. Coordenadas de layout dos cartões
        const posicoes = {
            "desenvolvimento-software": { esquerda: "37%", topo: "40px" },
            "desenvolvimento-web":      { esquerda: "5%",  topo: "380px" },
            "ux":                       { esquerda: "5%",  topo: "780px" },
            "desenvolvimento-mobile":   { esquerda: "37%", topo: "580px" },
            "banco-dados":              { esquerda: "69%", topo: "480px" },
            "dados-ia":                 { esquerda: "69%", topo: "820px" },
            "redes-infraestrutura":     { esquerda: "5%",  topo: "1120px" },
            "seguranca":                { esquerda: "37%", topo: "1220px" },
            "gestao-ti":                { esquerda: "69%", topo: "1280px" }
        };

        // Aplica posições aos elementos
        dados.areas.forEach(area => {
            const el = document.getElementById(area.id);
            if (posicoes[area.id]) {
                el.style.left = posicoes[area.id].esquerda;
                el.style.top = posicoes[area.id].topo;
            }
        });

        // 3. Função dinâmica para calcular e desenhar as linhas SVG com precisão
        function desenharConexoes() {
            // Remove linhas anteriores para redesenhar limpo
            const linhasAntigas = svg.querySelectorAll("line");
            linhasAntigas.forEach(l => l.remove());

            const mapaRect = mapa.getBoundingClientRect();
            svg.setAttribute("width", mapaRect.width);
            svg.setAttribute("height", mapaRect.height);

            dados.conexoes.forEach(conexao => {
                const origem = document.getElementById(conexao.origem);
                const destino = document.getElementById(conexao.destino);

                if (!origem || !destino) return;

                const oRect = origem.getBoundingClientRect();
                const dRect = destino.getBoundingClientRect();

                // Calcula ponto central de cada card referente ao contêiner pai
                const x1 = (oRect.left - mapaRect.left) + (oRect.width / 2);
                const y1 = (oRect.top - mapaRect.top) + (oRect.height / 2);
                const x2 = (dRect.left - mapaRect.left) + (dRect.width / 2);
                const y2 = (dRect.top - mapaRect.top) + (dRect.height / 2);

                const linha = document.createElementNS("http://www.w3.org/2000/svg", "line");
                linha.setAttribute("x1", x1);
                linha.setAttribute("y1", y1);
                linha.setAttribute("x2", x2);
                linha.setAttribute("y2", y2);
                linha.setAttribute("marker-end", "url(#arrow)");

                svg.appendChild(linha);
            });
        }

        // Desenha na abertura e recalcula se a tela for redimensionada
        setTimeout(desenharConexoes, 100);
        window.addEventListener("resize", desenharConexoes);
    });