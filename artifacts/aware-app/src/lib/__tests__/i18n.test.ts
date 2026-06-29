import { describe, it, expect } from "vitest";
import { formatRelativeTime, formatPercent, formatDurationMs, formatDateTime } from "../i18n";

describe("i18n utilities", () => {
  describe("formatRelativeTime", () => {
    it("formats 'just now' (0 seconds)", () => {
      const now = new Date().toISOString();
      const result = formatRelativeTime(now, "en-US");
      expect(result).toBe("now");
    });

    it("formats minutes", () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      const result = formatRelativeTime(fiveMinsAgo, "en-US");
      expect(result).toBe("5 minutes ago");
    });

    it("formats hours", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString();
      const result = formatRelativeTime(twoHoursAgo, "en-US");
      expect(result).toBe("2 hours ago");
    });

    it("formats days", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
      const result = formatRelativeTime(threeDaysAgo, "en-US");
      expect(result).toBe("3 days ago");
    });
  });

  describe("formatPercent", () => {
    it("formats whole percentages", () => {
      expect(formatPercent(95, "en-US")).toBe("95%");
    });

    it("formats decimal percentages", () => {
      expect(formatPercent(95.56, "en-US")).toBe("95.6%");
    });

    it("respects locale", () => {
      // Some locales use a non-breaking space before %
      const result = formatPercent(95, "de-DE");
      expect(result).toMatch(/95\s*%/);
    });
  });

  describe("formatDurationMs", () => {
    it("formats 0ms", () => {
      expect(formatDurationMs(0)).toBe("0s");
    });

    it("formats seconds only", () => {
      expect(formatDurationMs(45000)).toBe("45s");
    });

    it("formats minutes and seconds", () => {
      expect(formatDurationMs(125000)).toBe("2m 5s");
    });

    it("formats hours, minutes, and seconds", () => {
      expect(formatDurationMs(3661000)).toBe("1h 1m 1s");
    });
  });

  describe("formatDateTime", () => {
    it("returns a non-empty string", () => {
      const now = new Date().toISOString();
      const result = formatDateTime(now, "en-US");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("formats a specific date correctly", () => {
      const date = "2023-12-25T10:30:00Z";
      const result = formatDateTime(date, "en-US");
      // Format: Dec 25, 2023, 10:30 AM (approximate depending on local time, but we just check content)
      expect(result).toContain("2023");
      expect(result).toContain("Dec");
    });
  });
});
