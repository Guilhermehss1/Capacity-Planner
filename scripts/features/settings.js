function renderSettings() {
      return pageShell(
        "Configurações",
        "Parâmetros funcionais do MVP e tokens principais do design system.",
        `
          <section class="card">
            <div class="card-header">
              <div class="card-title"><h2>Tipos de pessoa</h2><span>Classificação usada no cadastro e nos filtros operacionais.</span></div>
            </div>
            <div class="data-table-wrap">
              <table>
                <caption>Tipos disponíveis</caption>
                <thead><tr><th>Tipo</th><th>Cap. mensal padrão</th><th>Cap. semanal padrão</th></tr></thead>
                <tbody>${PERSON_TYPE_OPTIONS.map(type => `<tr><td><strong>${escapeHtml(type)}</strong></td><td class="num">${formatHours(type === "Liderança" ? 40 : 160)}</td><td class="num">${formatHours(type === "Liderança" ? 10 : 40)}</td></tr>`).join("")}</tbody>
              </table>
            </div>
          </section>
          <section class="card">
            <div class="card-header"><div class="card-title"><h2>Tokens aplicados</h2><span>Baseados na especificação de design v1.0.</span></div></div>
            <div class="grid settings-token-grid">
              ${[
                ["Roxo profundo", "#2A1340"], ["Roxo primário", "#5A1E8E"], ["Roxo médio", "#7A2BC8"], ["Magenta", "#D63A9A"], ["Glow", "#FF5B9D"], ["Canvas", "#F5F6FA"], ["Borda", "#ECECF2"], ["Texto", "#12121A"]
              ].map(([name, color]) => `<div class="mini-stat"><span>${name}</span><strong style="color:${color}">${color}</strong></div>`).join("")}
            </div>
          </section>
        `
      );
    }
