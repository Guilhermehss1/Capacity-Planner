function exportRows(type) {
      const periods = selectedPeriods();
      const periodIds = periods.map(p => p.id);
      if (type === "people") return state.people.map(p => ({ Nome: p.name, Email: p.email, Area: areaName(p.area), Tipo: p.type, CapacidadeMensal: p.monthly, CapacidadeSemanal: p.weekly, Status: p.status }));
      if (type === "projects") return state.projects.map(p => ({ Codigo: p.code, Projeto: p.name, Area: areaName(p.area), Gestor: personName(p.manager), Prioridade: p.priority, Status: p.status, Inicio: p.start, Fim: p.end, Risco: p.risk }));
      if (type === "allocations") return activeAllocations().filter(a => overlapsPeriods(a, periods)).map(a => ({ Pessoa: personName(a.person), Projeto: projectName(a.project), Inicio: itemStart(a), Fim: itemEnd(a), Horas: a.hours, Prioridade: projectPriority(a.project) }));
      if (type === "restrictions") return state.restrictions.filter(r => overlapsPeriods(r, periods)).map(r => ({ Pessoa: personName(r.person), Tipo: r.type, Inicio: itemStart(r), Fim: itemEnd(r), Horas: r.hours, Status: restrictionStatus(r), Justificativa: r.note }));
      if (type === "capacity") return filteredPeople().map(p => calcPerson(p.id, periodIds)).map(c => ({ Pessoa: c.person.name, Area: areaName(c.person.area), CapacidadePadrao: c.base, Restricoes: c.restricted, Disponivel: c.available, Alocado: c.allocated, Saldo: c.balance, Percentual: formatPct(c.pct), Status: statusLabel(c.status) }));
      if (type === "conflicts") return filteredPeople().map(p => calcPerson(p.id, periodIds)).filter(c => c.pct > 100 || (c.available === 0 && c.allocated > 0)).map(c => ({ Pessoa: c.person.name, Disponivel: c.available, Alocado: c.allocated, Saldo: c.balance, Percentual: formatPct(c.pct), Status: statusLabel(c.status), Projetos: c.allocations.map(a => projectName(a.project)).join("; ") }));
      if (type === "ranking") return calcRanking(periodIds).map(r => ({ Pessoa: r.person.name, Score: r.score, Alocado: r.calc.allocated, Projetos: r.projects.map(p => p.name).join("; ") }));
      if (type === "audit") return state.audit.map(ev => ({ DataHora: ev.at, Usuario: ev.user, TipoAcesso: ev.profile, Acao: ev.action, Entidade: ev.entity, Registro: ev.record, Campo: ev.field, Antes: ev.before, Depois: ev.after }));
      return [];
    }

function downloadExcel(type) {
      const rows = exportRows(type);
      if (!rows.length) {
        toast("warning", "Sem dados", "Nenhum registro encontrado para os filtros selecionados.");
        return;
      }
      const headers = Object.keys(rows[0]);
      const table = `
        <html><head><meta charset="utf-8"></head><body><table border="1">
          <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map(row => `<tr>${headers.map(h => `<td>${escapeHtml(row[h])}</td>`).join("")}</tr>`).join("")}</tbody>
        </table></body></html>`;
      const blob = new Blob([table], { type: "application/vnd.ms-excel;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `capacity-planner-${type}-${Date.now()}.xls`;
      a.click();
      URL.revokeObjectURL(a.href);
      addAudit("Exportar", "Exportação", type, "Filtros", "-", JSON.stringify(filters));
      toast("success", "Exportação gerada", "Arquivo Excel compatível gerado com sucesso.");
    }

function downloadBackup() {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `capacity-planner-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      addAudit("Exportar", "Backup", "JSON");
      toast("success", "Backup gerado", "Arquivo JSON baixado com sucesso.");
    }
