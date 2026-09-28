function renderCapacity() {
      const periodIds = selectedPeriods().map(p => p.id);
      const calcs = filteredPeople().map(p => calcPerson(p.id, periodIds)).sort((a, b) => b.pct - a.pct);
      return pageShell(
        "Capacidade e conflitos",
        "Análise consolidada e detalhada de capacidade, saldos, status e projetos envolvidos.",
        `
          ${commonToolbar()}
          <section class="card">
            <div class="card-header">
              <div class="card-title"><h2>Tabela consolidada</h2><span>Percentual calculado sobre capacidade disponível.</span></div>
            </div>
            <div class="data-table-wrap">
              <table>
                <caption>Capacidade por pessoa</caption>
                <thead><tr><th>Pessoa</th><th>Área</th><th>Tipo</th><th>Cap. padrão</th><th>Restrições</th><th>Disponível</th><th>Alocado</th><th>Saldo</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  ${calcs.map(c => `
                    <tr>
                      <td><strong>${escapeHtml(c.person.name)}</strong><div class="small">${escapeHtml(c.person.type)}</div></td>
                      <td>${escapeHtml(areaName(c.person.area))}</td>
                      <td>${escapeHtml(c.person.type)}</td>
                      <td class="num">${formatHours(c.base)}</td>
                      <td class="num">${formatHours(c.restricted)}</td>
                      <td class="num">${formatHours(c.available)}</td>
                      <td class="num">${formatHours(c.allocated)}</td>
                      <td class="num" style="${c.balance < 0 ? "color:var(--status-critical);font-weight:900" : ""}">${formatHours(c.balance)}</td>
                      <td>${statusText(c.status, c.pct)}</td>
                      <td><div class="actions"><button class="btn btn-secondary" type="button" data-detail-person="${c.person.id}" data-detail-period="${periodIds[0] || state.periods[0].id}">Ver detalhes</button></div></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </section>
          <div class="grid split-grid">
            ${renderHeatmapCard()}
            ${renderRankingCard()}
          </div>
        `
      );
    }
