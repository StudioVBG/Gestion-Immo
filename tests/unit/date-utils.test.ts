/**
 * Tests unitaires - Utilitaires de dates (Octobre et Novembre 2025)
 * 
 * Sources:
 * - Vitest: https://vitest.dev/guide/
 * - Date-fns: https://date-fns.org/docs/Getting-Started
 * 
 * Dates de test: Octobre et Novembre 2025
 */

import { describe, it, expect } from "vitest";
import { format, parse, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { fr } from "date-fns/locale";

describe("Utilitaires de dates - Octobre et Novembre 2025", () => {
  // Dates réelles pour les tests
  const OCTOBER_2025 = new Date(2025, 9, 15); // 15 octobre 2025
  const NOVEMBER_2025 = new Date(2025, 10, 15); // 15 novembre 2025

  it("Formater une date d'octobre 2025", () => {
    const formatted = format(OCTOBER_2025, "yyyy-MM", { locale: fr });
    expect(formatted).toBe("2025-10");
  });

  it("Formater une date de novembre 2025", () => {
    const formatted = format(NOVEMBER_2025, "yyyy-MM", { locale: fr });
    expect(formatted).toBe("2025-11");
  });

  it("Parser une période octobre 2025", () => {
    const parsed = parse("2025-10", "yyyy-MM", new Date());
    expect(parsed.getFullYear()).toBe(2025);
    expect(parsed.getMonth()).toBe(9); // Octobre = mois 9 (0-indexed)
  });

  it("Parser une période novembre 2025", () => {
    const parsed = parse("2025-11", "yyyy-MM", new Date());
    expect(parsed.getFullYear()).toBe(2025);
    expect(parsed.getMonth()).toBe(10); // Novembre = mois 10
  });

  it("Calculer le début du mois d'octobre 2025", () => {
    const start = startOfMonth(OCTOBER_2025);
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(9);
    expect(start.getFullYear()).toBe(2025);
  });

  it("Calculer la fin du mois d'octobre 2025", () => {
    const end = endOfMonth(OCTOBER_2025);
    expect(end.getDate()).toBe(31);
    expect(end.getMonth()).toBe(9);
    expect(end.getFullYear()).toBe(2025);
  });

  it("Calculer le début du mois de novembre 2025", () => {
    const start = startOfMonth(NOVEMBER_2025);
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(10);
    expect(start.getFullYear()).toBe(2025);
  });

  it("Calculer la fin du mois de novembre 2025", () => {
    const end = endOfMonth(NOVEMBER_2025);
    expect(end.getDate()).toBe(30);
    expect(end.getMonth()).toBe(10);
    expect(end.getFullYear()).toBe(2025);
  });

  it("Passer d'octobre à novembre 2025", () => {
    const nextMonth = addMonths(OCTOBER_2025, 1);
    expect(nextMonth.getMonth()).toBe(10);
    expect(nextMonth.getFullYear()).toBe(2025);
  });

  it("Passer de novembre à décembre 2025", () => {
    const nextMonth = addMonths(NOVEMBER_2025, 1);
    expect(nextMonth.getMonth()).toBe(11);
    expect(nextMonth.getFullYear()).toBe(2025);
  });

  it("Formater une date complète en français pour octobre 2025", () => {
    const formatted = format(OCTOBER_2025, "d MMMM yyyy", { locale: fr });
    expect(formatted).toContain("octobre");
    expect(formatted).toContain("2025");
  });

  it("Formater une date complète en français pour novembre 2025", () => {
    const formatted = format(NOVEMBER_2025, "d MMMM yyyy", { locale: fr });
    expect(formatted).toContain("novembre");
    expect(formatted).toContain("2025");
  });
});

