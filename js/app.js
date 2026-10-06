fetch("data/mapa.json")
    .then(resposta => resposta.json())
    .then(dados => {

        const mapa = document.getElementById("mapa");
        const svg = document.getElementById("conexoes");
        const modal = document.getElementById("modal");

        
        dados.areas.forEach(area => {
            const div = document.createElement("div");
            div.id = area.id;
            div.className = "area-card";

            div.innerHTML = `
                <h3 class="area-title">${area.nome}</h3>

                <div class="section-label">Disciplinas do PPC</div>
                <ul class="disciplinas-list">
                    ${area.disciplinas.map(d => `<li data-disc="${d}">${d}</li>`).join("")}
                </ul>

                <div class="section-label">Carreiras Relacionadas</div>
                <div class="carreiras-container">
                    ${area.carreiras.map(c => `<span class="carreira-tag" data-carreira="${c}">${c}</span>`).join("")}
                </div>
            `;

            mapa.appendChild(div);
        });

        
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

        dados.areas.forEach(area => {
            const el = document.getElementById(area.id);
            if (posicoes[area.id]) {
                el.style.left = posicoes[area.id].esquerda;
                el.style.top = posicoes[area.id].topo;
            }
        });

        
        function desenharConexoes() {
            svg.querySelectorAll("line").forEach(l => l.remove());

            const mapaRect = mapa.getBoundingClientRect();
            svg.setAttribute("width", mapaRect.width);
            svg.setAttribute("height", mapaRect.height);

            dados.conexoes.forEach(conexao => {
                const origem = document.getElementById(conexao.origem);
                const destino = document.getElementById(conexao.destino);
                if (!origem || !destino) return;

                const oRect = origem.getBoundingClientRect();
                const dRect = destino.getBoundingClientRect();

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
                linha.dataset.origem = conexao.origem;
                linha.dataset.destino = conexao.destino;

                svg.appendChild(linha);
            });
        }

        
        let selecao = null;

        
        function vizinhosDe(ids) {
            const v = new Set();
            dados.conexoes.forEach(c => {
                if (ids.has(c.origem) && !ids.has(c.destino)) v.add(c.destino);
                if (ids.has(c.destino) && !ids.has(c.origem)) v.add(c.origem);
            });
            return v;
        }

        function limpar() {
            document.querySelectorAll(".area-card").forEach(c =>
                c.classList.remove("ativo", "relacionado", "apagado"));
            document.querySelectorAll(".disciplinas-list li").forEach(li =>
                li.classList.remove("marcado"));
            svg.querySelectorAll("line").forEach(l =>
                l.classList.remove("destaque", "apagada"));
        }

        function aplicarSelecao() {
            limpar();
            if (!selecao) return;

            if (selecao.tipo === "area") {
                const id = selecao.valor;
                const relacionados = new Set([id]);
                dados.conexoes.forEach(c => {
                    if (c.origem === id) relacionados.add(c.destino);
                    if (c.destino === id) relacionados.add(c.origem);
                });

                document.querySelectorAll(".area-card").forEach(card => {
                    card.classList.toggle("ativo", card.id === id);
                    card.classList.toggle("relacionado", relacionados.has(card.id) && card.id !== id);
                    card.classList.toggle("apagado", !relacionados.has(card.id));
                });

                svg.querySelectorAll("line").forEach(l => {
                    const liga = l.dataset.origem === id || l.dataset.destino === id;
                    l.classList.toggle("destaque", liga);
                    l.classList.toggle("apagada", !liga);
                });
            }

            if (selecao.tipo === "disc") {
                const nome = selecao.valor;
                document.querySelectorAll(".area-card").forEach(card => {
                    const lis = [...card.querySelectorAll(".disciplinas-list li")]
                        .filter(li => li.dataset.disc === nome);
                    lis.forEach(li => li.classList.add("marcado"));
                    card.classList.toggle("ativo", lis.length > 0);
                    card.classList.toggle("apagado", lis.length === 0);
                });
                svg.querySelectorAll("line").forEach(l => l.classList.add("apagada"));
            }

            if (selecao.tipo === "carreira") {
                const ids = new Set(
                    dados.areas
                        .filter(a => a.carreiras.includes(selecao.valor))
                        .map(a => a.id)
                );
                const vizinhos = vizinhosDe(ids);

                document.querySelectorAll(".area-card").forEach(card => {
                    card.classList.toggle("ativo", ids.has(card.id));
                    card.classList.toggle("relacionado", vizinhos.has(card.id));
                    card.classList.toggle("apagado", !ids.has(card.id) && !vizinhos.has(card.id));
                });

                svg.querySelectorAll("line").forEach(l => {
                    const liga = ids.has(l.dataset.origem) || ids.has(l.dataset.destino);
                    l.classList.toggle("destaque", liga);
                    l.classList.toggle("apagada", !liga);
                });
            }
        }

        function alternar(tipo, valor) {
            const igual = selecao && selecao.tipo === tipo && selecao.valor === valor;
            selecao = igual ? null : { tipo, valor };
            aplicarSelecao();
        }

        // ===== MODAL DA CARREIRA =====
        function abrirCarreira(nome) {
            const areas = dados.areas.filter(a => a.carreiras.includes(nome));
            const ids = new Set(areas.map(a => a.id));
            const vizinhos = dados.areas.filter(a => vizinhosDe(ids).has(a.id));

            const bloco = a => `
                <h5>${a.nome}</h5>
                <ul>${a.disciplinas.map(d => `<li>${d}</li>`).join("")}</ul>
            `;

            document.getElementById("modal-titulo").textContent = nome;
            document.getElementById("modal-sub").textContent =
                `${areas.length} área(s) principal(is) • ${vizinhos.length} área(s) conectada(s)`;

            let html = `<h4>Matérias da carreira</h4>` + areas.map(bloco).join("");
            if (vizinhos.length) {
                html += `<h4>Áreas conectadas (base e apoio)</h4>` + vizinhos.map(bloco).join("");
            }
            document.getElementById("modal-conteudo").innerHTML = html;

            modal.classList.remove("oculto");
        }

        function fecharModal() {
            modal.classList.add("oculto");
            selecao = null;
            aplicarSelecao();
        }

        document.getElementById("modal-fechar").addEventListener("click", fecharModal);
        modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
        document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });

        // ===== CLIQUES NO MAPA =====
        mapa.addEventListener("click", e => {
            const tag = e.target.closest(".carreira-tag");
            const li = e.target.closest(".disciplinas-list li");
            const card = e.target.closest(".area-card");

            if (tag) {
                selecao = { tipo: "carreira", valor: tag.dataset.carreira };
                aplicarSelecao();
                abrirCarreira(tag.dataset.carreira);
            }
            else if (li) alternar("disc", li.dataset.disc);
            else if (card) alternar("area", card.id);
            else { fecharModal(); }
        });

        
        function redesenhar() {
            desenharConexoes();
            aplicarSelecao();
        }

        setTimeout(redesenhar, 100);
        window.addEventListener("resize", redesenhar);
    });