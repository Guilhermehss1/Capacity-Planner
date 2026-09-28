const PERSON_TYPE_OPTIONS = [
      "Consultor SAP",
      "Key User",
      "Business Partner",
      "Desenvolvedor",
      "Gerente de Projeto",
      "Liderança",
      "Outro"
    ];

function profileForPersonType(type) {
      return ({
        "Consultor SAP": "tec",
        "Key User": "key",
        "Business Partner": "gestor",
        "Desenvolvedor": "tec",
        "Gerente de Projeto": "gestor",
        "Liderança": "lider",
        "Outro": "key"
      })[type] || "key";
    }

function renderPeople() {
      const person = edit.person ? state.people.find(p => p.id === edit.person) : null;
      const rows = filteredPeople();
      return pageShell(
        "Pessoas",
        "Cadastro de pessoas planejáveis, tipo de atuação, capacidade e status.",
        `
          ${commonToolbar()}
          <section class="card">
            <div class="card-header">
              <div class="card-title"><h2>${person ? "Editar pessoa" : "Nova pessoa"}</h2><span>Capacidade individual prevalece sobre o perfil padrão quando informada.</span></div>
            </div>
            <form id="personForm" class="form-grid">
              <input type="hidden" name="id" value="${escapeHtml(person?.id || "")}" />
              <div class="field wide"><label>Nome</label><input class="input" name="name" required value="${escapeHtml(person?.name || "")}" /></div>
              <div class="field"><label>E-mail</label><input class="input" name="email" type="email" required value="${escapeHtml(person?.email || "")}" /></div>
              <div class="field"><label>Área</label><select class="select" name="area" required>${state.areas.map(a => `<option ${person?.area === a.id ? "selected" : ""} value="${a.id}">${escapeHtml(a.name)}</option>`).join("")}</select></div>
              <div class="field"><label>Tipo</label><select class="select" name="type" required>${PERSON_TYPE_OPTIONS.map(t => `<option ${person?.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
              <div class="field"><label>Cap. mensal</label><input class="input" name="monthly" type="number" min="0" required value="${escapeHtml(person?.monthly ?? 160)}" /></div>
              <div class="field"><label>Cap. semanal</label><input class="input" name="weekly" type="number" min="0" required value="${escapeHtml(person?.weekly ?? 40)}" /></div>
              <div class="field"><label>Status</label><select class="select" name="status">${["Ativo","Inativo"].map(s => `<option ${person?.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
              <div class="form-actions">
                ${person ? `<button class="btn btn-secondary" type="button" data-cancel-edit="person">Cancelar</button>` : ""}
                <button class="btn btn-primary" type="submit">${icon(person ? "i-edit" : "i-plus")} ${person ? "Salvar" : "Cadastrar"}</button>
              </div>
            </form>
          </section>
          <section class="card">
            <div class="card-header"><div class="card-title"><h2>Base de pessoas</h2><span>${rows.length} registros encontrados.</span></div></div>
            <div class="data-table-wrap">
              <table>
                <caption>Pessoas planejáveis</caption>
                <thead><tr><th>Nome</th><th>Área</th><th>Tipo</th><th>Cap. mensal</th><th>Cap. semanal</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  ${rows.map(p => `
                    <tr>
                      <td><strong>${escapeHtml(p.name)}</strong><div class="small">${escapeHtml(p.email)}</div></td>
                      <td>${escapeHtml(areaName(p.area))}</td>
                      <td>${escapeHtml(p.type)}</td>
                      <td class="num">${formatHours(p.monthly)}</td>
                      <td class="num">${formatHours(p.weekly)}</td>
                      <td>${p.status === "Ativo" ? badge("healthy", "Ativo") : badge("analysis", "Inativo")}</td>
                      <td><div class="actions"><button class="btn btn-icon" type="button" aria-label="Editar pessoa" data-edit-person="${p.id}">${icon("i-edit")}</button><button class="btn btn-icon" type="button" aria-label="Alternar status" data-toggle-person="${p.id}">${icon("i-more")}</button></div></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </section>
        `
      );
    }

function handlePersonSubmit(form) {
      const data = getFormData(form);
      const payload = {
        id: data.id || uid("p"),
        name: data.name.trim(),
        email: data.email.trim(),
        area: data.area,
        type: data.type,
        role: data.type,
        profile: profileForPersonType(data.type),
        monthly: Number(data.monthly),
        weekly: Number(data.weekly),
        manager: "",
        status: data.status || "Ativo"
      };
      const idx = state.people.findIndex(p => p.id === payload.id);
      if (idx >= 0) {
        const before = state.people[idx];
        state.people[idx] = { ...before, ...payload };
        addAudit("Editar", "Pessoa", payload.name, "Capacidade semanal", before.weekly, payload.weekly);
        toast("success", "Pessoa atualizada", "Cadastro salvo com sucesso.");
      } else {
        state.people.push(payload);
        addAudit("Criar", "Pessoa", payload.name);
        toast("success", "Pessoa cadastrada", "Pessoa disponível para planejamento.");
      }
      edit.person = null;
      saveState();
      renderRoute();
    }
