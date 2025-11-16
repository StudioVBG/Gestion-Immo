/**
 * Tests unitaires - Pagination
 * 
 * Sources:
 * - Vitest: https://vitest.dev/guide/
 * - React Testing: https://react.dev/learn/testing
 */

import { describe, it, expect } from "vitest";

// Simuler le hook usePagination
function usePagination(totalItems: number, itemsPerPage: number = 10, initialPage: number = 1) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (initialPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage: initialPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    canGoNext: initialPage < totalPages,
    canGoPrevious: initialPage > 1,
  };
}

describe("Pagination", () => {
  it("Pagination avec 12 items par page - 10 items", () => {
    const pagination = usePagination(10, 12);
    expect(pagination.totalPages).toBe(1);
    expect(pagination.startIndex).toBe(0);
    expect(pagination.endIndex).toBe(10);
    expect(pagination.canGoNext).toBe(false);
    expect(pagination.canGoPrevious).toBe(false);
  });

  it("Pagination avec 12 items par page - 24 items", () => {
    const pagination = usePagination(24, 12);
    expect(pagination.totalPages).toBe(2);
    expect(pagination.startIndex).toBe(0);
    expect(pagination.endIndex).toBe(12);
    expect(pagination.canGoNext).toBe(true);
    expect(pagination.canGoPrevious).toBe(false);
  });

  it("Pagination avec 12 items par page - 25 items", () => {
    const pagination = usePagination(25, 12);
    expect(pagination.totalPages).toBe(3);
    expect(pagination.startIndex).toBe(0);
    expect(pagination.endIndex).toBe(12);
  });

  it("Pagination page 2 avec 24 items", () => {
    const pagination = usePagination(24, 12, 2);
    expect(pagination.currentPage).toBe(2);
    expect(pagination.startIndex).toBe(12);
    expect(pagination.endIndex).toBe(24);
    expect(pagination.canGoNext).toBe(false);
    expect(pagination.canGoPrevious).toBe(true);
  });

  it("Pagination page 3 avec 25 items", () => {
    const pagination = usePagination(25, 12, 3);
    expect(pagination.currentPage).toBe(3);
    expect(pagination.startIndex).toBe(24);
    expect(pagination.endIndex).toBe(25);
    expect(pagination.canGoNext).toBe(false);
    expect(pagination.canGoPrevious).toBe(true);
  });

  it("Pagination avec 0 items", () => {
    const pagination = usePagination(0, 12);
    expect(pagination.totalPages).toBe(1);
    expect(pagination.startIndex).toBe(0);
    expect(pagination.endIndex).toBe(0);
  });
});

