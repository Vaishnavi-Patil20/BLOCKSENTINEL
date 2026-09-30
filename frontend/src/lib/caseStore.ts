import type { InvestigationCase } from "../types";

const CASES_KEY = "blocksentinel.cases.v1";
const REPORTS_KEY = "blocksentinel.reportsGenerated.v1";

export function loadCases(): InvestigationCase[] {
  try {
    const raw = localStorage.getItem(CASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCases(cases: InvestigationCase[]) {
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}

export function createCase(input: Omit<InvestigationCase, "id" | "created_at">): InvestigationCase {
  const now = new Date().toISOString();
  const caseItem: InvestigationCase = {
    ...input,
    id: `CASE-${Date.now().toString(36).toUpperCase()}`,
    created_at: now,
  };
  saveCases([caseItem, ...loadCases()]);
  return caseItem;
}

export function updateCase(id: string, patch: Partial<InvestigationCase>): InvestigationCase | null {
  const cases = loadCases();
  const index = cases.findIndex((item) => item.id === id);
  if (index < 0) return null;
  cases[index] = { ...cases[index], ...patch };
  saveCases(cases);
  return cases[index];
}

export function getCase(id: string): InvestigationCase | null {
  return loadCases().find((item) => item.id === id) || null;
}

export function getGeneratedReportCount(): number {
  const value = Number.parseInt(localStorage.getItem(REPORTS_KEY) || "0", 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function incrementGeneratedReportCount(): number {
  const next = getGeneratedReportCount() + 1;
  localStorage.setItem(REPORTS_KEY, String(next));
  return next;
}
