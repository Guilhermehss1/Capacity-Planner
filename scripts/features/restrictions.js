function restrictionDefaultStart(restriction) {
      return itemStart(restriction || {}) || selectedPeriods()[0]?.start || state.periods[0].start;
    }

function restrictionDefaultEnd(restriction) {
      return itemEnd(restriction || {}) || selectedPeriods()[0]?.end || state.periods[0].end;
    }

function renderRestrictions() {
      const restriction = edit.restriction ? state.restrictions.find(r => r.id === edit.restriction) : null;
      const selected = selectedPeriods();
      const rows = state.restrictions.filter(r => {
        const person = state.people.find(p => p.id === r.person);
        const periodOk = overlapsPeriods(r, selected);
        const areaOk = filters.area === "all" || person?.area === filters.area;
        const text = filters.search.trim().toLowerCase();
        const textOk = !text || [personName(r.person), r.type, r.note].join(" ").toLowerCase().includes(text);
        return periodOk && areaOk && textOk;
      });
      return pageShell(
        "Restrições",
        "Férias, treinamentos, indisponibilidades e bloqueios que reduzem capacidade disponível durante o intervalo informado.",
        `
          ${commonToolbar()}
          <section class="card">
            <div class="card-header">
              <div class="card-title"><h2>${restriction ? "Editar restrição" : "Nova restrição"}</h2><span>Restrições impactam capacidade apenas enquanto o intervalo estiver vigente no período analisado.</span></div>
            </div>
            <form id="restrictionForm" class="form-grid">
              <input type="hidden" name="id" value="${escapeHtml(restriction?.id || "")}" />
              <div class="field"><label>Pessoa</label><select class="select" name="person" required>${state.people.filter(p => p.status === "Ativo").map(p => `<option ${restriction?.person === p.id ? "selected" : ""} value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}</select></div>
              <div class="field"><label>Tipo</label><select class="select" name="type" required>${["Férias","Indisponibilidade","Restrição operacional","Treinamento","Fechamento fiscal","Sustentação","Outro"].map(t => `<option ${restriction?.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
              <div class="field"><label>Data de início</label><input class="input" name="start" type="date" required value="${escapeHtml(restrictionDefaultStart(restriction))}" /></div>
              <div class="field"><label>Data de fim</label><input class="input" name="end" type="date" required value="${escapeHtml(restrictionDefaultEnd(restriction))}" /></div>
              <div class="field"><label>Horas indisponíveis</label><input class="input" name="hours" type="number" min="0.5" step="0.5" required value="${escapeHtml(restriction?.hours || 4)}" /></div>
              <div class="field wide"><label>Justificativa</label><input class="input" name="note" value="${escapeHtml(restriction?.note || "")}" /></div>
              <div class="form-actions">
                ${restriction ? `<button class="btn btn-secondary" type="button" data-cancel-edit="restriction">Cancelar</button>` : ""}
                <button class="btn btn-primary" type="submit">${icon(restriction ? "i-edit" : "i-plus")} ${restriction ? "Salvar" : "Cadastrar"}</button>
              </div>
            </form>
          </section>
          <section class="card">
            <div class="card-header"><div class="card-title"><h2>Indisponibilidades</h2><span>${rows.length} restrições encontradas.</span></div></div>
            <div class="data-table-wrap">
              <table>
                <caption>Restrições cadastradas</caption>
                <thead><tr><th>Pessoa</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Horas</th><th>Status</th><th>Impacto</th><th>Ações</th></tr></thead>
                <tbody>
                  ${rows.map(r => {
                    const periods = selected.filter(period => overlapsPeriod(r, period));
                    const calc = calcPerson(r.person, periods.map(p => p.id));
                    const status = restrictionStatus(r);
                    const statusBadge = status === "Ativa" ? badge("warning", "Ativa") : status === "Expirada" ? badge("analysis", "Expirada") : badge("analysis", "Cancelada");
                    return `
                      <tr>
                        <td><strong>${escapeHtml(personName(r.person))}</strong><div class="small">${escapeHtml(areaName(state.people.find(p => p.id === r.person)?.area))}</div></td>
                        <td>${escapeHtml(r.type)}</td>
                        <td>${escapeHtml(formatDate(itemStart(r)))}</td>
                        <td>${escapeHtml(formatDate(itemEnd(r)))}</td>
                        <td class="num">${formatHours(r.hours)}</td>
                        <td>${statusBadge}</td>
                        <td>${status === "Cancelada" ? badge("analysis", "Sem impacto") : statusText(calc.status, calc.pct)}</td>
                        <td><div class="actions"><button class="btn btn-icon" type="button" aria-label="Editar restrição" data-edit-restriction="${r.id}">${icon("i-edit")}</button><button class="btn btn-icon" type="button" aria-label="Cancelar restrição" data-cancel-restriction="${r.id}">${icon("i-x")}</button></div></td>
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

function handleRestrictionSubmit(form) {
      const data = getFormData(form);
      const hours = Number(data.hours);
      if (hours <= 0) {
        toast("error", "Horas inválidas", "Informe horas indisponíveis maiores que zero.");
        return;
      }
      if (new Date(data.end) < new Date(data.start)) {
        toast("error", "Datas inválidas", "A data fim não pode ser anterior à data início.");
        return;
      }
      const candidate = { start: data.start, end: data.end };
      const overlap = state.restrictions.find(r => r.person === data.person && !isRestrictionCancelled(r) && r.id !== data.id && overlapDays(itemStart(r), itemEnd(r), candidate.start, candidate.end) > 0);
      const periods = periodsForRange(data.start, data.end);
      if (!periods.length) {
        toast("error", "Intervalo fora do calendário", "Informe datas dentro dos períodos cadastrados no Capacity Planner.");
        return;
      }
      const payload = {
        id: data.id || uid("r"),
        person: data.person,
        type: data.type,
        period: periods[0]?.id || "",
        start: data.start,
        end: data.end,
        hours,
        status: "Ativa",
        note: data.note || ""
      };
      const idx = state.restrictions.findIndex(r => r.id === payload.id);
      if (idx >= 0) {
        const before = state.restrictions[idx];
        state.restrictions[idx] = { ...before, ...payload };
        addAudit("Editar", "Restrição", `${personName(payload.person)} / ${payload.type}`, "Horas", before.hours, payload.hours);
      } else {
        state.restrictions.push(payload);
        addAudit("Criar", "Restrição", `${personName(payload.person)} / ${payload.type}`);
      }
      edit.restriction = null;
      saveState();
      renderRoute();
      toast(overlap ? "warning" : "success", overlap ? "Restrição salva com sobreposição" : "Restrição salva", overlap ? "Já existe restrição para esta pessoa com intervalo sobreposto." : "Capacidade recalculada com sucesso.");
    }
