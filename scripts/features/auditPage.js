function renderAudit() {
      const text = filters.search.trim().toLowerCase();
      const rows = state.audit.filter(ev => !text || [ev.user, ev.profile, ev.action, ev.entity, ev.record, ev.field].join(" ").toLowerCase().includes(text));
      return pageShell(
        "Auditoria",
        "Trilha somente leitura de ações relevantes, exportações e alterações críticas.",
        `
          <div class="toolbar">
            <div class="field"><label>Busca</label><input class="input" data-filter="search" value="${escapeHtml(filters.search)}" placeholder="Usuário, ação, entidade..." /></div>
            <button class="btn btn-secondary" type="button" id="resetFilters">${icon("i-filter")} Limpar filtros</button>
          </div>
          <section class="card">
            <div class="card-header"><div class="card-title"><h2>Eventos registrados</h2><span>${rows.length} eventos encontrados.</span></div></div>
            <div class="data-table-wrap">
              <table>
                <caption>Eventos de auditoria</caption>
                <thead><tr><th>Data/hora</th><th>Usuário</th><th>Tipo de acesso</th><th>Ação</th><th>Entidade</th><th>Registro</th><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead>
                <tbody>
                  ${rows.map(ev => `
                    <tr>
                      <td class="num">${escapeHtml(ev.at)}</td>
                      <td>${escapeHtml(ev.user)}</td>
                      <td>${escapeHtml(ev.profile)}</td>
                      <td>${escapeHtml(ev.action)}</td>
                      <td>${escapeHtml(ev.entity)}</td>
                      <td>${escapeHtml(ev.record)}</td>
                      <td>${escapeHtml(ev.field)}</td>
                      <td>${escapeHtml(ev.before)}</td>
                      <td>${escapeHtml(ev.after)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </section>
        `
      );
    }
