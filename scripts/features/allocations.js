function allocationDefaultStart(allocation) {
      return itemStart(allocation || {}) || selectedPeriods()[0]?.start || state.periods[0].start;
    }

function allocationDefaultEnd(allocation) {
      return itemEnd(allocation || {}) || selectedPeriods()[0]?.end || state.periods[0].end;
    }

function renderAllocations() {
      const allocation = edit.allocation ? state.allocations.find(a => a.id === edit.allocation) : null;
      const selected = selectedPeriods();
      const rows = activeAllocations().filter(a => {
        const person = state.people.find(p => p.id === a.person);
        const project = state.projects.find(p => p.id === a.project);
        const periodOk = overlapsPeriods(a, selected);
        const areaOk = filters.area === "all" || person?.area === filters.area || project?.area === filters.area;
        const projectOk = filters.project === "all" || a.project === filters.project;
        const text = filters.search.trim().toLowerCase();
        const textOk = !text || [personName(a.person), projectName(a.project), person?.type].join(" ").toLowerCase().includes(text);
        return periodOk && areaOk && projectOk && textOk;
      });
      return pageShell(
        "Alocações",
        "Lançamento de horas planejadas por pessoa, projeto e intervalo de datas, com alerta de sobrealocação.",
        `
          ${commonToolbar()}
          <section class="card">
            <div class="card-header">
              <div class="card-title"><h2>${allocation ? "Editar alocação" : "Nova alocação"}</h2><span>Sobrealocação gera alerta e permite salvamento para análise.</span></div>
            </div>
            <form id="allocationForm" class="form-grid">
              <input type="hidden" name="id" value="${escapeHtml(allocation?.id || "")}" />
              <div class="field"><label>Pessoa</label><select class="select" name="person" required>${state.people.filter(p => p.status === "Ativo").map(p => `<option ${allocation?.person === p.id ? "selected" : ""} value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}</select></div>
              <div class="field wide"><label>Projeto</label><select class="select" name="project" required>${state.projects.map(p => `<option ${allocation?.project === p.id ? "selected" : ""} value="${p.id}">${escapeHtml(p.name)} · ${p.priority}</option>`).join("")}</select></div>
              <div class="field"><label>Data de início</label><input class="input" name="start" type="date" required value="${escapeHtml(allocationDefaultStart(allocation))}" /></div>
              <div class="field"><label>Data de término</label><input class="input" name="end" type="date" required value="${escapeHtml(allocationDefaultEnd(allocation))}" /></div>
              <div class="field"><label>Horas</label><input class="input" name="hours" type="number" min="0.5" step="0.5" required value="${escapeHtml(allocation?.hours || 8)}" /></div>
              <div id="allocationPreview" class="preview-panel wide"></div>
              <div class="form-actions">
                ${allocation ? `<button class="btn btn-secondary" type="button" data-cancel-edit="allocation">Cancelar</button>` : ""}
                <button class="btn btn-primary" type="submit">${icon(allocation ? "i-edit" : "i-plus")} ${allocation ? "Salvar" : "Cadastrar"}</button>
              </div>
            </form>
          </section>
          <section class="card">
            <div class="card-header"><div class="card-title"><h2>Horas planejadas</h2><span>${rows.length} alocações ativas nos filtros atuais.</span></div></div>
            <div class="data-table-wrap">
              <table>
                <caption>Alocações planejadas</caption>
                <thead><tr><th>Pessoa</th><th>Projeto</th><th>Início</th><th>Término</th><th>Horas</th><th>Disponível</th><th>%</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  ${rows.map(a => {
                    const periods = selected.filter(period => overlapsPeriod(a, period));
                    const calc = calcPerson(a.person, periods.map(p => p.id));
                    return `
                      <tr>
                        <td><strong>${escapeHtml(personName(a.person))}</strong><div class="small">${escapeHtml(state.people.find(p => p.id === a.person)?.type || "")}</div></td>
                        <td>${escapeHtml(projectName(a.project))}<div class="small">${priorityBadge(projectPriority(a.project))}</div></td>
                        <td>${escapeHtml(formatDate(itemStart(a)))}</td>
                        <td>${escapeHtml(formatDate(itemEnd(a)))}</td>
                        <td class="num">${formatHours(a.hours)}</td>
                        <td class="num">${formatHours(calc.available)}</td>
                        <td class="num">${formatPct(calc.pct)}</td>
                        <td>${statusText(calc.status, calc.pct)}</td>
                        <td><div class="actions"><button class="btn btn-icon" type="button" aria-label="Editar alocação" data-edit-allocation="${a.id}">${icon("i-edit")}</button><button class="btn btn-icon" type="button" aria-label="Remover alocação" data-remove-allocation="${a.id}">${icon("i-trash")}</button></div></td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          </section>
        `
      );
    }

function updateAllocationPreview() {
      const form = document.getElementById("allocationForm");
      const target = document.getElementById("allocationPreview");
      if (!form || !target) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const currentId = data.id;
      const person = state.people.find(p => p.id === data.person);
      const hours = Number(data.hours || 0);
      if (!person || !data.start || !data.end || new Date(data.end) < new Date(data.start)) {
        target.innerHTML = "";
        return;
      }
      const periods = periodsForRange(data.start, data.end);
      const periodIds = periods.map(p => p.id);
      const baseCalc = calcPerson(data.person, periodIds, "all");
      const existing = activeAllocations().find(a => a.id === currentId);
      const currentHours = existing ? proratedHoursForPeriods(existing, periods) : 0;
      const projectedAllocated = baseCalc.allocated - currentHours + hours;
      const pct = baseCalc.available === 0 ? (projectedAllocated > 0 ? 999 : 0) : projectedAllocated / baseCalc.available * 100;
      const status = capacityStatus(pct, baseCalc.available, projectedAllocated);
      target.innerHTML = `
        <div class="preview-row"><span>Período analisado</span><strong>${periods.length} período(s)</strong></div>
        <div class="preview-row"><span>Capacidade disponível</span><strong>${formatHours(baseCalc.available)}</strong></div>
        <div class="preview-row"><span>Alocado após salvar</span><strong>${formatHours(projectedAllocated)}</strong></div>
        <div class="preview-row"><span>Utilização prevista</span><strong>${formatPct(pct)}</strong></div>
        <div class="preview-row"><span>Status previsto</span>${statusText(status, pct)}</div>
      `;
    }

function getFormData(form) {
      return Object.fromEntries(new FormData(form).entries());
    }

function handleAllocationSubmit(form) {
      const data = getFormData(form);
      const hours = Number(data.hours);
      if (hours <= 0) {
        toast("error", "Horas inválidas", "Informe horas maiores que zero.");
        return;
      }
      if (new Date(data.end) < new Date(data.start)) {
        toast("error", "Datas inválidas", "A data de término não pode ser anterior à data de início.");
        return;
      }
      const project = state.projects.find(p => p.id === data.project);
      if (project && ["Concluído", "Cancelado"].includes(project.status)) {
        toast("warning", "Projeto indisponível", "Projeto concluído ou cancelado exige confirmação específica fora do MVP.");
        return;
      }
      const candidate = { start: data.start, end: data.end };
      const duplicate = activeAllocations().find(a => a.person === data.person && a.project === data.project && a.id !== data.id && overlapDays(itemStart(a), itemEnd(a), candidate.start, candidate.end) > 0);
      if (duplicate) {
        toast("warning", "Alocação existente", "Já existe alocação para esta pessoa e projeto com intervalo sobreposto. Edite a alocação existente.");
        return;
      }
      const periods = periodsForRange(data.start, data.end);
      if (!periods.length) {
        toast("error", "Intervalo fora do calendário", "Informe datas dentro dos períodos cadastrados no Capacity Planner.");
        return;
      }
      const payload = {
        id: data.id || uid("a"),
        person: data.person,
        project: data.project,
        period: periods[0]?.id || "",
        start: data.start,
        end: data.end,
        hours,
        role: "",
        status: "Planejada"
      };
      const baseCalc = calcPerson(data.person, periods.map(p => p.id));
      const existing = activeAllocations().find(a => a.id === data.id);
      const currentHours = existing ? proratedHoursForPeriods(existing, periods) : 0;
      const projected = baseCalc.allocated - currentHours + hours;
      const pct = baseCalc.available === 0 ? (projected > 0 ? 999 : 0) : projected / baseCalc.available * 100;
      const idx = state.allocations.findIndex(a => a.id === payload.id);
      if (idx >= 0) {
        const before = state.allocations[idx];
        state.allocations[idx] = { ...before, ...payload };
        addAudit("Editar", "Alocação", `${personName(payload.person)} / ${projectName(payload.project)}`, "Horas", before.hours, payload.hours);
      } else {
        state.allocations.push(payload);
        addAudit("Criar", "Alocação", `${personName(payload.person)} / ${projectName(payload.project)}`);
      }
      edit.allocation = null;
      saveState();
      renderRoute();
      if (pct > 100 || baseCalc.available === 0) {
        toast("warning", "Alocação salva com conflito", "Alocação salva, mas gerou conflito de capacidade no período.");
      } else {
        toast("success", "Alocação salva", "Capacidade recalculada com sucesso.");
      }
    }
