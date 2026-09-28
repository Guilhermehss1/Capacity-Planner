function renderExports() {
      const items = [
        ["people", "Pessoas", "Cadastro de pessoas, áreas e capacidades."],
        ["projects", "Projetos", "Portfólio, prioridade, status e gestor."],
        ["allocations", "Alocações", "Horas planejadas por pessoa, projeto e intervalo de datas."],
        ["restrictions", "Restrições", "Indisponibilidades por intervalo e impacto na capacidade."],
        ["capacity", "Capacidade consolidada", "Capacidade padrão, disponível, alocada, saldo e percentual."],
        ["conflicts", "Conflitos", "Pessoas acima de 100% e projetos envolvidos."],
        ["ranking", "Ranking", "Recursos críticos e pontuação explicável."],
        ["audit", "Auditoria", "Trilha de ações, entidades e campos críticos."]
      ];
      return pageShell(
        "Exportações",
        "Geração de arquivos compatíveis com Excel respeitando filtros aplicados.",
        `
          ${commonToolbar(false)}
          <section class="card">
            <div class="card-header"><div class="card-title"><h2>Catálogo de exportações</h2><span>Formato v1.2: arquivo .xls compatível com Excel, gerado localmente no navegador.</span></div></div>
            <div class="grid export-grid">
              ${items.map(([id, name, desc]) => `
                <article class="card export-card">
                  <div class="card-header">
                    <div class="card-title"><h3>${escapeHtml(name)}</h3><span>${escapeHtml(desc)}</span></div>
                    ${icon("i-download")}
                  </div>
                  <button class="btn btn-primary" type="button" data-export="${id}">${icon("i-download")} Exportar Excel</button>
                </article>
              `).join("")}
            </div>
          </section>
          <section class="card">
            <div class="card-header">
              <div class="card-title"><h2>Backup local</h2><span>Use para compartilhar ou restaurar o estado de demonstração.</span></div>
            </div>
            <div class="filters">
              <button class="btn btn-secondary" type="button" id="downloadBackup">${icon("i-download")} Baixar backup JSON</button>
              <button class="btn btn-secondary" type="button" id="restoreDemo">${icon("i-database")} Restaurar dados demo</button>
            </div>
          </section>
        `
      );
    }
