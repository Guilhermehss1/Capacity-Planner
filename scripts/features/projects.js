function renderProjects() {
      const project = edit.project ? state.projects.find(p => p.id === edit.project) : null;
      const rows = filteredProjects();
      return pageShell(
        "Projetos",
        "Cadastro de projetos com prioridade, status, gestor e pendências de planejamento.",
        `
          ${commonToolbar()}
          <section class="card">
            <div class="card-header">
              <div class="card-title"><h2>${project ? "Editar projeto" : "Novo projeto"}</h2><span>Projetos planejados ou em andamento sem alocação futura geram pendência.</span></div>
            </div>
            <form id="projectForm" class="form-grid">
              <input type="hidden" name="id" value="${escapeHtml(project?.id || "")}" />
              <div class="field"><label>Código</label><input class="input" name="code" value="${escapeHtml(project?.code || "")}" /></div>
              <div class="field wide"><label>Nome</label><input class="input" name="name" required value="${escapeHtml(project?.name || "")}" /></div>
              <div class="field"><label>Área demandante</label><select class="select" name="area" required>${state.areas.map(a => `<option ${project?.area === a.id ? "selected" : ""} value="${a.id}">${escapeHtml(a.name)}</option>`).join("")}</select></div>
              <div class="field"><label>Gestor</label><select class="select" name="manager" required>${state.people.filter(p => ["Gerente de Projeto","Business Partner","Liderança"].includes(p.type)).map(p => `<option ${project?.manager === p.id ? "selected" : ""} value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}</select></div>
              <div class="field"><label>Prioridade</label><select class="select" name="priority" required>${["Crítica","Alta","Média","Baixa"].map(p => `<option ${project?.priority === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
              <div class="field"><label>Status</label><select class="select" name="status" required>${["Planejado","Em andamento","Pausado","Concluído","Cancelado"].map(s => `<option ${project?.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
              <div class="field"><label>Início</label><input class="input" name="start" type="date" required value="${escapeHtml(project?.start || "2026-07-01")}" /></div>
              <div class="field"><label>Fim</label><input class="input" name="end" type="date" required value="${escapeHtml(project?.end || "2026-09-30")}" /></div>
              <div class="field"><label>Risco</label><select class="select" name="risk">${["Baixo","Médio","Alto","Crítico"].map(r => `<option ${project?.risk === r ? "selected" : ""}>${r}</option>`).join("")}</select></div>
              <div class="form-actions">
                ${project ? `<button class="btn btn-secondary" type="button" data-cancel-edit="project">Cancelar</button>` : ""}
                <button class="btn btn-primary" type="submit">${icon(project ? "i-edit" : "i-plus")} ${project ? "Salvar" : "Cadastrar"}</button>
              </div>
            </form>
          </section>
          <section class="card">
            <div class="card-header"><div class="card-title"><h2>Portfólio</h2><span>${rows.length} projetos encontrados.</span></div></div>
            <div class="data-table-wrap">
              <table>
                <caption>Projetos do portfólio</caption>
                <thead><tr><th>Projeto</th><th>Área</th><th>Gestor</th><th>Prioridade</th><th>Status</th><th>Horas</th><th>Alerta</th><th>Ações</th></tr></thead>
                <tbody>
                  ${rows.map(p => {
                    const selected = selectedPeriods();
                    const hours = activeAllocations().filter(a => a.project === p.id).reduce((t, a) => t + Number(a.hours), 0);
                    const future = activeAllocations().some(a => a.project === p.id && overlapsPeriods(a, selected));
                    const pending = ["Planejado","Em andamento"].includes(p.status) && !future;
                    return `
                      <tr>
                        <td><strong>${escapeHtml(p.name)}</strong><div class="small">${escapeHtml(p.code || "-")} · ${escapeHtml(p.start)} a ${escapeHtml(p.end)}</div></td>
                        <td>${escapeHtml(areaName(p.area))}</td>
                        <td>${escapeHtml(personName(p.manager))}</td>
                        <td>${priorityBadge(p.priority)}</td>
                        <td>${escapeHtml(p.status)}</td>
                        <td class="num">${formatHours(hours)}</td>
                        <td>${pending ? badge("pending", "Sem alocação") : badge("healthy", "Planejado")}</td>
                        <td><div class="actions"><button class="btn btn-icon" type="button" aria-label="Editar projeto" data-edit-project="${p.id}">${icon("i-edit")}</button><button class="btn btn-icon" type="button" aria-label="Ver alocações" data-route="allocations">${icon("i-chevron")}</button></div></td>
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

function handleProjectSubmit(form) {
      const data = getFormData(form);
      if (new Date(data.end) < new Date(data.start)) {
        toast("error", "Datas inválidas", "A data fim não pode ser anterior à data início.");
        return;
      }
      const payload = {
        id: data.id || uid("pr"),
        code: data.code || `PRJ-${String(state.projects.length + 1).padStart(3, "0")}`,
        name: data.name.trim(),
        area: data.area,
        manager: data.manager,
        sponsor: "",
        priority: data.priority,
        status: data.status,
        start: data.start,
        end: data.end,
        risk: data.risk
      };
      const idx = state.projects.findIndex(p => p.id === payload.id);
      if (idx >= 0) {
        const before = state.projects[idx];
        state.projects[idx] = { ...before, ...payload };
        addAudit("Editar", "Projeto", payload.name, "Prioridade/Status", `${before.priority}/${before.status}`, `${payload.priority}/${payload.status}`);
        toast("success", "Projeto atualizado", "Dados do projeto foram salvos.");
      } else {
        state.projects.push(payload);
        addAudit("Criar", "Projeto", payload.name);
        toast("success", "Projeto cadastrado", "Projeto disponível para alocação.");
      }
      edit.project = null;
      saveState();
      renderRoute();
    }
