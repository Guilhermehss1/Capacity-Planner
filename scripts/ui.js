function icon(id, cls = "icon") {
      return `<svg class="${cls}"><use href="#${id}"></use></svg>`;
    }

function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      })[char]);
    }

function areaName(id) {
      return state.areas.find(a => a.id === id)?.name || id || "-";
    }

function personName(id) {
      return state.people.find(p => p.id === id)?.name || id || "-";
    }

function projectName(id) {
      return state.projects.find(p => p.id === id)?.name || id || "-";
    }

function projectPriority(id) {
      return state.projects.find(p => p.id === id)?.priority || "Média";
    }

function statusLabel(status) {
      return ({
        available: "Disponível",
        healthy: "Saudável",
        warning: "Atenção",
        critical: "Crítico",
        pending: "Pendente",
        analysis: "Em análise"
      })[status] || status;
    }

function statusIcon(status) {
      return ({ available: "●", healthy: "●", warning: "▲", critical: "■", pending: "▣", analysis: "●" })[status] || "●";
    }

function badge(status, text, extra = "") {
      return `<span class="badge ${status}"><span class="badge-dot"></span>${escapeHtml(text || statusLabel(status))}${extra ? ` <span class="num">${extra}</span>` : ""}</span>`;
    }

function statusText(status, pct) {
      return `<span class="status-text ${status}">${statusIcon(status)} ${statusLabel(status)} <span class="num">${formatPct(pct)}</span></span>`;
    }

function formatHours(value) {
      const n = Number(value || 0);
      return `${Number.isInteger(n) ? n : n.toFixed(1)}h`;
    }

function formatPct(value) {
      if (!Number.isFinite(value)) return "0%";
      if (value >= 999) return "Cap. zero";
      return `${Math.round(value)}%`;
    }

function priorityBadge(priority) {
      const status = priority === "Crítica" ? "critical" : priority === "Alta" ? "warning" : priority === "Média" ? "analysis" : "available";
      return badge(status, priority);
    }

function toast(type, title, message) {
      const region = document.getElementById("toastRegion");
      const el = document.createElement("div");
      el.className = `toast ${type}`;
      const status = type === "success" ? "healthy" : type === "warning" ? "warning" : type === "error" ? "critical" : "analysis";
      el.innerHTML = `<div>${statusIcon(status)}</div><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></div><button class="btn btn-icon" type="button" aria-label="Fechar aviso">${icon("i-x", "icon icon-sm")}</button>`;
      el.querySelector("button").addEventListener("click", () => el.remove());
      region.appendChild(el);
      setTimeout(() => el.remove(), 5200);
    }

function pageShell(title, subtitle, body, actions = "") {
      return `
        <section class="page">
          <div class="mobile-note">Modo mobile está disponível para consulta. Edições devem ser feitas em desktop ou tablet.</div>
          <div class="page-header">
            <div class="page-title">
              <h1>${escapeHtml(title)}</h1>
              <p>${escapeHtml(subtitle)}</p>
            </div>
            <div class="page-actions">${actions}</div>
          </div>
          ${body}
        </section>
      `;
    }

function formatDate(value) {
      if (!value) return "-";
      const [year, month, day] = String(value).split("-");
      if (!year || !month || !day) return value;
      return `${day}/${month}/${year}`;
    }

function commonToolbar(options = true) {
      const config = typeof options === "boolean" ? { includeSearch: options } : options;
      const includeSearch = config.includeSearch !== false;
      const includeWeek = config.includeWeek !== false;
      const months = [...new Set(state.periods.map(p => p.monthLabel))];
      return `
        <div class="toolbar">
          <div class="filters">
            <div class="field">
              <label>Mês</label>
              <select class="select" data-filter="month">
                <option value="all">Todos</option>
                ${months.map(m => `<option ${filters.month === m ? "selected" : ""} value="${m}">${m}</option>`).join("")}
              </select>
            </div>
            ${includeWeek ? `<div class="field">
              <label>Semana</label>
              <select class="select" data-filter="week">
                <option value="all">Todas</option>
                ${state.periods.filter(p => filters.month === "all" || p.monthLabel === filters.month).map(p => `<option ${filters.week === p.id ? "selected" : ""} value="${p.id}">${p.week}</option>`).join("")}
              </select>
            </div>` : ""}
            <div class="field">
              <label>Área</label>
              <select class="select" data-filter="area">
                <option value="all">Todas</option>
                ${state.areas.map(a => `<option ${filters.area === a.id ? "selected" : ""} value="${a.id}">${escapeHtml(a.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Projeto</label>
              <select class="select" data-filter="project">
                <option value="all">Todos</option>
                ${state.projects.map(p => `<option ${filters.project === p.id ? "selected" : ""} value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}
              </select>
            </div>
            ${includeSearch ? `<div class="field"><label>Busca</label><input class="input" data-filter="search" value="${escapeHtml(filters.search)}" placeholder="Buscar..." /></div>` : ""}
          </div>
          <button class="btn btn-secondary" type="button" id="resetFilters">${icon("i-filter")} Limpar filtros</button>
        </div>
      `;
    }

function openDetail(personId, periodId) {
      const person = state.people.find(p => p.id === personId);
      const period = state.periods.find(p => p.id === periodId) || selectedPeriods()[0] || state.periods[0];
      if (!person || !period) return;
      const calc = calcPerson(personId, [period.id]);
      const restrictions = activeRestrictions([period]).filter(r => r.person === personId);
      const drawer = document.getElementById("detailDrawer");
      drawer.innerHTML = `
        <div class="drawer-header">
          <div class="card-title">
            <h2>${escapeHtml(person.name)}</h2>
            <span>${escapeHtml(period.monthLabel)} · ${escapeHtml(period.week)} · ${escapeHtml(person.type)}</span>
          </div>
          <button class="btn btn-icon" type="button" id="closeDrawer" aria-label="Fechar detalhe">${icon("i-x")}</button>
        </div>
        <div class="drawer-body">
          ${badge(calc.status, statusLabel(calc.status), formatPct(calc.pct))}
          <div class="mini-grid">
            <div class="mini-stat"><span>Capacidade padrão</span><strong>${formatHours(calc.base)}</strong></div>
            <div class="mini-stat"><span>Restrições</span><strong>${formatHours(calc.restricted)}</strong></div>
            <div class="mini-stat"><span>Disponível</span><strong>${formatHours(calc.available)}</strong></div>
            <div class="mini-stat"><span>Saldo</span><strong style="${calc.balance < 0 ? "color:var(--status-critical)" : ""}">${formatHours(calc.balance)}</strong></div>
          </div>
          <section class="card" style="box-shadow:none">
            <div class="card-title"><h3>Projetos envolvidos</h3><span>Horas planejadas no período.</span></div>
            <div class="ranking-list" style="margin-top:12px">
              ${calc.allocations.map(a => `
                <div class="rank-item">
                  <div class="rank-score">${formatHours(a.hours)}</div>
                  <div><strong>${escapeHtml(projectName(a.project))}</strong><div class="small">${formatHours(a.calculatedHours ?? a.hours)} no período · ${escapeHtml(projectPriority(a.project))}</div></div>
                  ${priorityBadge(projectPriority(a.project))}
                </div>
              `).join("") || `<div class="empty-state">Nenhuma alocação no período.</div>`}
            </div>
          </section>
          <section class="card" style="box-shadow:none">
            <div class="card-title"><h3>Restrições</h3><span>Indisponibilidades ativas no período.</span></div>
            <div class="ranking-list" style="margin-top:12px">
              ${restrictions.map(r => `<div class="alert-item"><div class="alert-icon warning">▲</div><div><strong>${escapeHtml(r.type)}</strong><div class="small">${formatHours(r.calculatedHours ?? r.hours)} no período · ${formatDate(r.start)} a ${formatDate(r.end)} · ${escapeHtml(r.note || "-")}</div></div>${badge("warning", "Ativa")}</div>`).join("") || `<div class="empty-state">Nenhuma restrição ativa.</div>`}
            </div>
          </section>
          <div class="preview-panel">
            <div class="preview-row"><span>Sugestão de análise</span></div>
            <strong>${calc.pct > 120 ? "Revisar projetos de menor prioridade, negociar prazo ou redistribuir horas." : calc.pct > 100 ? "Monitorar ajuste fino da semana e confirmar disponibilidade real." : "Capacidade dentro da faixa esperada."}</strong>
          </div>
        </div>
      `;
      drawer.classList.add("open");
    }

function closeDrawer() {
      document.getElementById("detailDrawer").classList.remove("open");
    }
