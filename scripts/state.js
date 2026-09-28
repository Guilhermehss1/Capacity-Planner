const STORAGE_KEY = "capacity-planner-v1-state";
const SESSION_KEY = "capacity-planner-v1-session";

function loadState() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(seed);
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.meta?.dataVersion !== seed.meta.dataVersion) return structuredClone(seed);
        return { ...structuredClone(seed), ...parsed };
      } catch {
        return structuredClone(seed);
      }
    }

function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

function loadSession() {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    }

function saveSession(value) {
      session = value;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    }

function uid(prefix) {
      return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    }

let state = loadState();
let session = loadSession();
let edit = { person: null, project: null, allocation: null, restriction: null };
