let filters = { month: "Jul/2026", week: "all", area: "all", project: "all", search: "", alertType: "all" };

function selectedPeriods(options = {}) {
      const includeWeek = options.includeWeek !== false;
      return state.periods.filter(period => {
        const monthOk = filters.month === "all" || period.monthLabel === filters.month;
        const weekOk = !includeWeek || filters.week === "all" || period.id === filters.week;
        return monthOk && weekOk;
      });
    }

function filteredPeople() {
      const text = filters.search.trim().toLowerCase();
      return state.people.filter(person => {
        const areaOk = filters.area === "all" || person.area === filters.area;
        const textOk = !text || [person.name, person.email, areaName(person.area), person.type].join(" ").toLowerCase().includes(text);
        return areaOk && textOk;
      });
    }

function filteredProjects() {
      const text = filters.search.trim().toLowerCase();
      return state.projects.filter(project => {
        const areaOk = filters.area === "all" || project.area === filters.area;
        const projectOk = filters.project === "all" || project.id === filters.project;
        const textOk = !text || [project.name, project.code, project.priority, project.status, areaName(project.area)].join(" ").toLowerCase().includes(text);
        return areaOk && projectOk && textOk;
      });
    }
