function activeAllocations() {
      return state.allocations.filter(a => a.status !== "Removida");
    }

function toDate(value) {
      if (!value) return null;
      const date = new Date(`${value}T00:00:00`);
      return Number.isNaN(date.getTime()) ? null : date;
    }

function dateKey(date) {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
      return date.toISOString().slice(0, 10);
    }

function itemStart(item) {
      const period = state.periods.find(p => p.id === item.period);
      return item.start || period?.start || "";
    }

function itemEnd(item) {
      const period = state.periods.find(p => p.id === item.period);
      return item.end || period?.end || itemStart(item);
    }

function daysInclusive(startValue, endValue) {
      const start = toDate(startValue);
      const end = toDate(endValue);
      if (!start || !end || end < start) return 0;
      return Math.floor((end - start) / 86400000) + 1;
    }

function overlapDays(startA, endA, startB, endB) {
      const aStart = toDate(startA);
      const aEnd = toDate(endA);
      const bStart = toDate(startB);
      const bEnd = toDate(endB);
      if (!aStart || !aEnd || !bStart || !bEnd) return 0;
      const start = new Date(Math.max(aStart.getTime(), bStart.getTime()));
      const end = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));
      return daysInclusive(dateKey(start), dateKey(end));
    }

function overlapsPeriod(item, period) {
      return overlapDays(itemStart(item), itemEnd(item), period.start, period.end) > 0;
    }

function overlapsPeriods(item, periods) {
      return periods.some(period => overlapsPeriod(item, period));
    }

function periodsForRange(start, end) {
      return state.periods.filter(period => overlapDays(start, end, period.start, period.end) > 0);
    }

function selectedPeriodList(periodIds) {
      const ids = Array.isArray(periodIds) ? periodIds : selectedPeriods().map(p => p.id);
      return state.periods.filter(p => ids.includes(p.id));
    }

function proratedHoursForPeriods(item, periods) {
      const start = itemStart(item);
      const end = itemEnd(item);
      const totalDays = daysInclusive(start, end);
      if (!totalDays) return 0;
      const selectedDays = periods.reduce((total, period) => total + overlapDays(start, end, period.start, period.end), 0);
      if (!selectedDays) return 0;
      return Number(item.hours || 0) * Math.min(1, selectedDays / totalDays);
    }

function isRestrictionCancelled(restriction) {
      return restriction.status === "Cancelada";
    }

function restrictionStatus(restriction, referenceDate = new Date()) {
      if (isRestrictionCancelled(restriction)) return "Cancelada";
      const end = toDate(itemEnd(restriction));
      if (end && end < new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())) return "Expirada";
      return "Ativa";
    }

function activeRestrictions(periods = selectedPeriods()) {
      return state.restrictions
        .filter(r => !isRestrictionCancelled(r) && overlapsPeriods(r, periods))
        .map(r => ({ ...r, calculatedHours: proratedHoursForPeriods(r, periods) }));
    }

function calcPerson(personId, periodIds = selectedPeriods().map(p => p.id), projectFilter = filters.project) {
      const person = state.people.find(p => p.id === personId);
      if (!person) return null;
      const periods = selectedPeriodList(periodIds);
      const base = periods.reduce((total, period) => {
        const capacity = period.unit === "month" ? person.monthly : person.weekly;
        return total + Number(capacity || 0);
      }, 0);
      const restrictions = activeRestrictions(periods).filter(r => r.person === personId);
      const restricted = restrictions.reduce((total, r) => total + Number(r.calculatedHours ?? r.hours ?? 0), 0);
      const allocations = activeAllocations().filter(a => {
        const projectOk = projectFilter === "all" || a.project === projectFilter;
        return a.person === personId && projectOk && overlapsPeriods(a, periods);
      }).map(a => ({ ...a, calculatedHours: proratedHoursForPeriods(a, periods) }));
      const allocated = allocations.reduce((total, a) => total + Number(a.calculatedHours ?? a.hours ?? 0), 0);
      const available = Math.max(0, base - restricted);
      const pct = available === 0 ? (allocated > 0 ? 999 : 0) : (allocated / available) * 100;
      const balance = available - allocated;
      const status = capacityStatus(pct, available, allocated);
      return { person, base, restricted, available, allocated, pct, balance, status, allocations, restrictions };
    }

function capacityStatus(pct, available = 1, allocated = 0) {
      if (available <= 0 && allocated > 0) return "critical";
      if (pct <= 79) return "available";
      if (pct <= 100) return "healthy";
      if (pct <= 120) return "warning";
      return "critical";
    }

function heatmapStatus(pct, allocated = 0) {
      if (!allocated || pct <= 0) return "empty";
      if (pct < 50) return "low";
      if (pct < 70) return "medium";
      if (pct < 90) return "high";
      return "full";
    }

function priorityWeight(priority) {
      return ({ "Crítica": 4, "Alta": 3, "Média": 2, "Baixa": 1 })[priority] || 0;
    }

function calcRanking(periodIds = selectedPeriods().map(p => p.id)) {
      const periods = selectedPeriodList(periodIds);
      return filteredPeople().map(person => {
        const calc = calcPerson(person.id, periods.map(p => p.id));
        const projects = [...new Set(calc.allocations.map(a => a.project))].map(id => state.projects.find(p => p.id === id)).filter(Boolean);
        const hasRestriction = activeRestrictions(periods).some(r => r.person === person.id);
        let score = 0;
        if (calc.pct > 120) score += 40;
        else if (calc.pct > 100) score += 25;
        projects.forEach(project => {
          if (project.priority === "Crítica") score += 25;
          if (project.priority === "Alta") score += 15;
        });
        if (calc.base > 0 && calc.available / calc.base < .1) score += 10;
        if (hasRestriction && projects.some(project => ["Crítica", "Alta"].includes(project.priority))) score += 10;
        return { person, calc, projects, score };
      }).sort((a, b) => b.score - a.score || b.calc.pct - a.calc.pct || b.projects.length - a.projects.length);
    }

function buildAlerts(periodIds = selectedPeriods().map(p => p.id)) {
      const periods = selectedPeriodList(periodIds);
      const ids = periods.map(p => p.id);
      const conflictAlerts = filteredPeople().map(person => calcPerson(person.id, ids)).filter(calc => calc.pct > 100 || (calc.available === 0 && calc.allocated > 0)).map(calc => ({
        id: `alert-${calc.person.id}`,
        type: calc.status === "critical" ? "critical" : "warning",
        title: `${calc.person.name} · ${formatPct(calc.pct)} de utilização`,
        context: `${formatHours(calc.allocated)} alocadas de ${formatHours(calc.available)} disponíveis · ${calc.allocations.map(a => projectName(a.project)).slice(0, 2).join(", ")}`,
        action: "Ver detalhe",
        person: calc.person.id,
        period: ids[0] || state.periods[0].id
      }));

      const futurePeriods = state.periods.filter(p => filters.month === "all" || p.monthLabel === filters.month);
      const pendingProjects = filteredProjects().filter(project => ["Planejado", "Em andamento"].includes(project.status) && !activeAllocations().some(a => a.project === project.id && overlapsPeriods(a, futurePeriods))).map(project => ({
        id: `pending-${project.id}`,
        type: "pending",
        title: "Projeto sem alocação futura",
        context: `${project.name} · Prioridade ${project.priority} · Gestor ${personName(project.manager)}`,
        action: "Planejar",
        project: project.id
      }));

      const all = [...conflictAlerts, ...pendingProjects];
      if (filters.alertType === "all") return all;
      return all.filter(a => a.type === filters.alertType);
    }

function buildAlertsWithType(type, periodIds = selectedPeriods().map(p => p.id)) {
      const original = filters.alertType;
      filters.alertType = type;
      const result = buildAlerts(periodIds);
      filters.alertType = original;
      return result;
    }
