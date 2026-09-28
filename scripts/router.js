const routes = [
      { id: "dashboard", label: "Dashboard", icon: "i-dashboard" },
      { id: "people", label: "Pessoas", icon: "i-users" },
      { id: "projects", label: "Projetos", icon: "i-briefcase" },
      { id: "allocations", label: "Alocações", icon: "i-calendar" },
      { id: "restrictions", label: "Restrições", icon: "i-alert" },
      { id: "capacity", label: "Capacidade", icon: "i-gauge" },
      { id: "exports", label: "Exportações", icon: "i-download" },
      { id: "audit", label: "Auditoria", icon: "i-database" },
      { id: "settings", label: "Configurações", icon: "i-settings" }
    ];

let route = "dashboard";

function renderApp() {
      if (!session) {
        document.getElementById("loginScreen").classList.remove("hidden");
        document.getElementById("appShell").classList.add("hidden");
        return;
      }
      document.getElementById("loginScreen").classList.add("hidden");
      document.getElementById("appShell").classList.remove("hidden");
      document.getElementById("currentProfile").innerHTML = `${icon("i-users", "icon icon-sm")} ${escapeHtml(session.profile)}`;
      renderNav();
      renderRoute();
    }

function renderNav() {
      document.getElementById("nav").innerHTML = routes.map(item => `
        <button class="nav-button ${route === item.id ? "active" : ""}" data-route="${item.id}" type="button" title="${escapeHtml(item.label)}">
          ${icon(item.icon)}
          <span>${escapeHtml(item.label)}</span>
        </button>
      `).join("");
    }

function renderRoute() {
      const main = document.getElementById("main");
      const views = {
        dashboard: renderDashboard,
        people: renderPeople,
        projects: renderProjects,
        allocations: renderAllocations,
        restrictions: renderRestrictions,
        capacity: renderCapacity,
        exports: renderExports,
        audit: renderAudit,
        settings: renderSettings
      };
      main.innerHTML = (views[route] || renderDashboard)();
      main.focus({ preventScroll: true });
    }
