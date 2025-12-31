import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExportService } from "@/lib/services/export.service";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      update: vi.fn(() => ({ eq: vi.fn() })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })) }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        createSignedUrl: vi.fn()
      }))
    }
  }))
}));

describe("ExportService", () => {
  describe("sanitizeCSVCell", () => {
    it("should prefix suspicious characters with an apostrophe", () => {
      // @ts-ignore - access private method for testing
      const sanitize = ExportService["sanitizeCSVCell"];
      
      expect(sanitize("=SUM(A1)")).toBe("'=SUM(A1)");
      expect(sanitize("+123")).toBe("'+123");
      expect(sanitize("-456")).toBe("'-456");
      expect(sanitize("@admin")).toBe("'@admin");
      expect(sanitize("Normal Text")).toBe("Normal Text");
      expect(sanitize("123")).toBe("123");
      expect(sanitize(null)).toBe("");
    });
  });

  describe("generateCSV", () => {
    it("should generate a valid and sanitized CSV string", () => {
      const data = [
        { id: 1, name: "John", bio: "=Malicious" },
        { id: 2, name: "Doe", bio: "Normal" }
      ];
      const columns = ["id", "name", "bio"];
      
      const csv = ExportService.generateCSV(data, columns);
      
      const lines = csv.split("\n");
      expect(lines[0]).toBe("id,name,bio");
      expect(lines[1]).toBe('"1","John","\'=Malicious"');
      expect(lines[2]).toBe('"2","Doe","Normal"');
    });

    it("should escape quotes correctly", () => {
      const data = [{ name: 'John "The Boss" Doe' }];
      const csv = ExportService.generateCSV(data, ["name"]);
      expect(csv).toContain('"John ""The Boss"" Doe"');
    });
  });
});

