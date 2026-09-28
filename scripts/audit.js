function addAudit(action, entity, record, field = "-", before = "-", after = "-") {
      state.audit.unshift({
        id: uid("ev"),
        at: new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
        user: session?.name || "Usuário Demo",
        profile: session?.profile || "PMO/Governança",
        action,
        entity,
        record,
        field,
        before,
        after
      });
      saveState();
    }
