function renderDashboard() {
      filters.week = "all";
      const people = filteredPeople().filter(p => p.status === "Ativo");
      const periods = selectedPeriods({ includeWeek: false });
      const periodIds = periods.map(p => p.id);
      const calcs = people.map(p => calcPerson(p.id, periodIds));
      const allocated = calcs.reduce((t, c) => t + c.allocated, 0);
      const critical = calcs.filter(c => c.status === "critical").length;
      const conflicts = calcs.filter(c => c.pct > 100 || (c.available === 0 && c.allocated > 0)).length;
      const projectsActive = filteredProjects().filter(p => ["Planejado", "Em andamento"].includes(p.status)).length;
      const cards = [
        { icon: "i-users", label: "Pessoas ativas", value: people.length, meta: "+4 em relação aos últimos 30 dias" },
        { icon: "i-briefcase", label: "Projetos ativos", value: projectsActive, meta: "Planejados ou em andamento" },
        { icon: "i-alert", label: "Pessoas críticas", value: critical, meta: "Acima de 120% ou cap. zero", danger: critical > 0 },
        { icon: "i-calendar", label: "Horas alocadas", value: formatHours(allocated), meta: "Planejamento no período" },
        { icon: "i-alert", label: "Conflitos ativos", value: conflicts, meta: "Requer análise", danger: conflicts > 0 },
        { icon: "i-briefcase", label: "Projetos sem alocação", value: buildAlerts(periodIds).filter(a => a.type === "pending").length, meta: "Pendências de planejamento" }
      ];

      return pageShell(
        "Dashboard executivo",
        "Visão consolidada de capacidade, conflitos, heatmap, ranking e alertas.",
        `
          ${commonToolbar({ includeSearch: false, includeWeek: false })}
          <div class="grid kpi-grid">${cards.map(renderKpiCard).join("")}</div>
          <div class="grid split-grid">
            ${renderHeatmapCard(periods)}
            ${renderRankingCard(periodIds)}
          </div>
          ${renderAlertsCard(periodIds)}
        `,
        `<button class="btn btn-primary" type="button" data-route="allocations">${icon("i-plus")} Nova alocação</button>`
      );
    }

function renderKpiCard(card) {
      const valueClass = card.danger ? " kpi-value-danger" : "";
      return `
        <article class="card kpi-card">
          <div class="kpi-icon">${icon(card.icon)}</div>
          <div>
            <div class="kpi-label">${escapeHtml(card.label)}</div>
            <div class="kpi-value${valueClass}">${escapeHtml(card.value)}</div>
          </div>
          <div class="kpi-meta">
            <span>${escapeHtml(card.meta)}</span>
          </div>
        </article>
      `;
    }

function heatmapPeople(periodList) {
      const people = filteredPeople().filter(p => p.status === "Ativo");
      if (filters.project === "all") return people;
      const allocatedPeople = new Set(
        activeAllocations()
          .filter(allocation => allocation.project === filters.project && overlapsPeriods(allocation, periodList))
          .map(allocation => allocation.person)
      );
      return people.filter(person => allocatedPeople.has(person.id));
    }

function renderHeatmapCard(periods = selectedPeriods()) {
      const periodList = periods.length ? periods : state.periods.slice(0, 5);
      const people = heatmapPeople(periodList);
      return `
        <section class="card">
          <div class="card-header">
            <div class="card-title">
              <h2>Heatmap de capacidade</h2>
              <span>Clique em uma célula para abrir o detalhe do conflito ou disponibilidade.</span>
            </div>
            ${badge("analysis", `${periodList.length} períodos`)}
          </div>
          <div class="heatmap-scroll">
            <div class="heatmap" style="--period-count:${periodList.length}">
              <div class="heatmap-row heatmap-head">
                <div>Pessoa</div>
                ${periodList.map(p => `<div>${escapeHtml(p.week)}</div>`).join("")}
              </div>
              ${people.map(person => `
                <div class="heatmap-row">
                  <div class="heat-person" title="${escapeHtml(person.name)}">${escapeHtml(person.name)}</div>
                  ${periodList.map(period => {
                    const calc = calcPerson(person.id, [period.id]);
                    const heatStatus = heatmapStatus(calc.pct, calc.allocated);
                    return `<button class="heat-cell ${heatStatus}" type="button" data-detail-person="${person.id}" data-detail-period="${period.id}" title="${escapeHtml(person.name)} · ${period.week} · ${formatPct(calc.pct)}">${formatPct(calc.pct)}</button>`;
                  }).join("")}
                </div>
              `).join("") || `<div class="heatmap-empty-message">Nenhuma pessoa alocada neste projeto para o período filtrado.</div>`}
            </div>
          </div>
          <div class="legend" aria-label="Legenda do heatmap">
            <span class="legend-item"><span class="legend-swatch heat-empty"></span>0%</span>
            <span class="legend-item"><span class="legend-swatch heat-low"></span>1-49%</span>
            <span class="legend-item"><span class="legend-swatch heat-medium"></span>50-69%</span>
            <span class="legend-item"><span class="legend-swatch heat-high"></span>70-89%</span>
            <span class="legend-item"><span class="legend-swatch heat-full"></span>90% ou mais</span>
          </div>
        </section>
      `;
    }

function renderRankingCard(periodIds = selectedPeriods().map(p => p.id)) {
      const ranking = calcRanking(periodIds).slice(0, 6);
      return `
        <section class="card">
          <div class="card-header">
            <div class="card-title">
              <h2>Ranking de recursos críticos</h2>
              <span>Indicador de exposição de capacidade. Não é avaliação individual.</span>
            </div>
          </div>
          <div class="ranking-list">
            ${ranking.map(item => `
              <button class="rank-item rank-compact" type="button" data-detail-person="${item.person.id}" data-detail-period="${periodIds[0] || state.periods[0].id}">
                <div class="rank-score">${item.score}</div>
                <div>
                  <strong>${escapeHtml(item.person.name)}</strong>
                  <div class="small">${escapeHtml(areaName(item.person.area))} · ${formatHours(item.calc.allocated)} alocadas · ${item.projects.length} projetos</div>
                </div>
              </button>
            `).join("") || `<div class="empty-state">Nenhum recurso crítico nos filtros atuais.</div>`}
          </div>
        </section>
      `;
    }

function renderAlertsCard(periodIds = selectedPeriods().map(p => p.id)) {
      const allAlerts = buildAlerts(periodIds);
      const counts = {
        all: buildAlertsWithType("all", periodIds).length,
        critical: buildAlertsWithType("critical", periodIds).length,
        warning: buildAlertsWithType("warning", periodIds).length,
        pending: buildAlertsWithType("pending", periodIds).length
      };
      return `
        <section class="card">
          <div class="card-header">
            <div class="card-title">
              <h2>Lista de alertas</h2>
              <span>Conflitos, atenção e pendências que exigem ação.</span>
            </div>
            <div class="segmented" role="tablist" aria-label="Filtrar alertas">
              ${[
                ["all", "Todos", counts.all],
                ["critical", "Críticos", counts.critical],
                ["warning", "Atenção", counts.warning],
                ["pending", "Pendências", counts.pending]
              ].map(([id, label, count]) => `<button class="segment ${filters.alertType === id ? "active" : ""}" data-alert-filter="${id}" type="button">${label} ${count}</button>`).join("")}
            </div>
          </div>
          <div class="alert-list">
            ${allAlerts.map(alert => `
              <div class="alert-item">
                <div class="alert-icon ${alert.type}">${statusIcon(alert.type === "pending" ? "pending" : alert.type)}</div>
                <div>
                  <strong>${escapeHtml(alert.title)}</strong>
                  <div class="small">${escapeHtml(alert.context)}</div>
                </div>
                <button class="btn btn-ghost" type="button" ${alert.person ? `data-detail-person="${alert.person}" data-detail-period="${alert.period}"` : `data-route="projects"`}>${escapeHtml(alert.action)} ${icon("i-chevron", "icon icon-sm")}</button>
              </div>
            `).join("") || `<div class="empty-state">${icon("i-check")} Nenhum alerta encontrado para os filtros atuais.</div>`}
          </div>
        </section>
      `;
    }
