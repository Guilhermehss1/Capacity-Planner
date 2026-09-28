function bindEvents() {
      document.getElementById("loginForm").addEventListener("submit", event => {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value.trim() || "pmo@example.com";
        saveSession({ name: "PMO Demo", email, profile: "PMO/Governança" });
        addAudit("Login", "Usuário", email);
        renderApp();
      });

      document.addEventListener("click", event => {
        const demoLogin = event.target.closest("[data-demo-login]");
        if (demoLogin) {
          const profile = demoLogin.dataset.demoLogin;
          saveSession({ name: profile === "Key User" ? "Pessoa Demo 021" : "Pessoa Demo 001", email: profile.toLowerCase().replaceAll(" ", ".") + "@example.com", profile });
          addAudit("Login", "Usuário", profile);
          renderApp();
          return;
        }

        if (event.target.closest("#logoutBtn")) {
          sessionStorage.removeItem(SESSION_KEY);
          session = null;
          renderApp();
          return;
        }

        const routeBtn = event.target.closest("[data-route]");
        if (routeBtn) {
          route = routeBtn.dataset.route;
          renderApp();
          return;
        }

        const close = event.target.closest("#closeDrawer");
        if (close) {
          closeDrawer();
          return;
        }

        const detail = event.target.closest("[data-detail-person]");
        if (detail) {
          openDetail(detail.dataset.detailPerson, detail.dataset.detailPeriod);
          return;
        }

        const alertFilter = event.target.closest("[data-alert-filter]");
        if (alertFilter) {
          filters.alertType = alertFilter.dataset.alertFilter;
          renderRoute();
          return;
        }

        if (event.target.closest("#resetFilters")) {
          filters = { month: "Jul/2026", week: "all", area: "all", project: "all", search: "", alertType: "all" };
          renderRoute();
          return;
        }

        const cancelEdit = event.target.closest("[data-cancel-edit]");
        if (cancelEdit) {
          edit[cancelEdit.dataset.cancelEdit] = null;
          renderRoute();
          return;
        }

        const editPerson = event.target.closest("[data-edit-person]");
        if (editPerson) { edit.person = editPerson.dataset.editPerson; renderRoute(); return; }

        const togglePerson = event.target.closest("[data-toggle-person]");
        if (togglePerson) {
          const p = state.people.find(item => item.id === togglePerson.dataset.togglePerson);
          if (p) {
            p.status = p.status === "Ativo" ? "Inativo" : "Ativo";
            addAudit(p.status === "Ativo" ? "Reativar" : "Remover logicamente", "Pessoa", p.name, "Status", p.status === "Ativo" ? "Inativo" : "Ativo", p.status);
            saveState();
            renderRoute();
          }
          return;
        }

        const editProject = event.target.closest("[data-edit-project]");
        if (editProject) { edit.project = editProject.dataset.editProject; renderRoute(); return; }

        const editAllocation = event.target.closest("[data-edit-allocation]");
        if (editAllocation) { edit.allocation = editAllocation.dataset.editAllocation; renderRoute(); setTimeout(updateAllocationPreview, 0); return; }

        const removeAllocation = event.target.closest("[data-remove-allocation]");
        if (removeAllocation) {
          const a = state.allocations.find(item => item.id === removeAllocation.dataset.removeAllocation);
          if (a) {
            a.status = "Removida";
            addAudit("Remover logicamente", "Alocação", `${personName(a.person)} / ${projectName(a.project)}`);
            saveState();
            toast("success", "Alocação removida", "A alocação saiu dos cálculos, mas permanece em auditoria.");
            renderRoute();
          }
          return;
        }

        const editRestriction = event.target.closest("[data-edit-restriction]");
        if (editRestriction) { edit.restriction = editRestriction.dataset.editRestriction; renderRoute(); return; }

        const cancelRestriction = event.target.closest("[data-cancel-restriction]");
        if (cancelRestriction) {
          const r = state.restrictions.find(item => item.id === cancelRestriction.dataset.cancelRestriction);
          if (r) {
            r.status = "Cancelada";
            addAudit("Editar", "Restrição", `${personName(r.person)} / ${r.type}`, "Status", "Ativa", "Cancelada");
            saveState();
            toast("success", "Restrição cancelada", "Capacidade recalculada com sucesso.");
            renderRoute();
          }
          return;
        }

        const exportBtn = event.target.closest("[data-export]");
        if (exportBtn) {
          downloadExcel(exportBtn.dataset.export);
          return;
        }

        if (event.target.closest("#downloadBackup")) {
          downloadBackup();
          return;
        }

        if (event.target.closest("#restoreDemo")) {
          state = structuredClone(seed);
          saveState();
          toast("success", "Dados restaurados", "A base demo foi restaurada.");
          renderRoute();
          return;
        }
      });

      document.addEventListener("change", event => {
        const filter = event.target.closest("[data-filter]");
        if (filter) {
          filters[filter.dataset.filter] = filter.value;
          if (filter.dataset.filter === "month") filters.week = "all";
          renderRoute();
          return;
        }
        if (event.target.closest("#allocationForm")) updateAllocationPreview();
      });

      document.addEventListener("input", event => {
        const filter = event.target.closest("[data-filter='search']");
        if (filter) {
          filters.search = filter.value;
          return;
        }
        if (event.target.closest("#allocationForm")) updateAllocationPreview();
      });

      document.addEventListener("submit", event => {
        const personForm = event.target.closest("#personForm");
        const projectForm = event.target.closest("#projectForm");
        const allocationForm = event.target.closest("#allocationForm");
        const restrictionForm = event.target.closest("#restrictionForm");
        if (personForm) { event.preventDefault(); handlePersonSubmit(personForm); }
        if (projectForm) { event.preventDefault(); handleProjectSubmit(projectForm); }
        if (allocationForm) { event.preventDefault(); handleAllocationSubmit(allocationForm); }
        if (restrictionForm) { event.preventDefault(); handleRestrictionSubmit(restrictionForm); }
      });
    }

bindEvents();
renderApp();
setTimeout(updateAllocationPreview, 0);
