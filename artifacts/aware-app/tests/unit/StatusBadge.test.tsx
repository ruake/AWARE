import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders PASS status", () => {
    render(<StatusBadge status="PASS" />);
    expect(screen.getByText("PASS")).toBeDefined();
  });

  it("renders FAIL status", () => {
    render(<StatusBadge status="FAIL" />);
    expect(screen.getByText("FAIL")).toBeDefined();
  });

  it("renders PARTIAL status", () => {
    render(<StatusBadge status="PARTIAL" />);
    expect(screen.getByText("PARTIAL")).toBeDefined();
  });

  it("renders RUNNING status", () => {
    render(<StatusBadge status="RUNNING" />);
    expect(screen.getByText("RUNNING")).toBeDefined();
  });

  it("renders PENDING status", () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText("PENDING")).toBeDefined();
  });

  it("renders ERROR status", () => {
    render(<StatusBadge status="ERROR" />);
    expect(screen.getByText("ERROR")).toBeDefined();
  });

  it("renders PASS badge with sm size", () => {
    render(<StatusBadge status="PASS" size="sm" />);
    expect(screen.getByText("PASS")).toBeDefined();
  });

  it("renders FAIL badge with sm size", () => {
    render(<StatusBadge status="FAIL" size="sm" />);
    expect(screen.getByText("FAIL")).toBeDefined();
  });

  it("renders with md size by default", () => {
    const { container } = render(<StatusBadge status="PASS" />);
    const span = container.querySelector("span");
    expect(span?.className).toContain("text-xs");
  });

  it("renders with sm size class", () => {
    const { container } = render(<StatusBadge status="PASS" size="sm" />);
    const spans = container.querySelectorAll("span");
    const outer = spans[0];
    expect(outer?.className).toContain("text-[10px]");
  });

  it("renders a dot indicator", () => {
    const { container } = render(<StatusBadge status="PASS" />);
    const spans = container.querySelectorAll("span");
    const dot = [...spans].find(s => s.className.includes("rounded-full"));
    expect(dot).toBeDefined();
  });
});
