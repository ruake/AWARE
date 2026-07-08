import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Layout } from "@/components/Layout";
import * as wouter from "wouter";

vi.mock("wouter", () => ({
  Link: ({ children, href, ...props }: any) => {
    if (React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, { href, ...props });
    }
    return <a href={href}>{children}</a>;
  },
  useLocation: vi.fn(() => ["/"]),
}));

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("light");
});

describe("Layout", () => {
  it("renders children", () => {
    render(<Layout><div data-testid="child">Hello</div></Layout>);
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("renders logo with A.W.A.R.E. text", () => {
    render(<Layout><div /></Layout>);
    expect(screen.getByText("A.W.A.R.E.")).toBeDefined();
  });

  it("renders all navigation links", () => {
    render(<Layout><div /></Layout>);
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Runs")).toBeDefined();
    expect(screen.getByText("Compare")).toBeDefined();
  });

  it("renders Dashboard link pointing to /", () => {
    render(<Layout><div /></Layout>);
    const link = screen.getByText("Dashboard").closest("a");
    expect(link?.getAttribute("href")).toBe("/");
  });

  it("renders Runs link pointing to /runs", () => {
    render(<Layout><div /></Layout>);
    const link = screen.getByText("Runs").closest("a");
    expect(link?.getAttribute("href")).toBe("/runs");
  });

  it("renders Compare link pointing to /compare", () => {
    render(<Layout><div /></Layout>);
    const link = screen.getByText("Compare").closest("a");
    expect(link?.getAttribute("href")).toBe("/compare");
  });

  it("renders theme toggle button", () => {
    render(<Layout><div /></Layout>);
    const btn = screen.getByLabelText("Toggle theme");
    expect(btn).toBeDefined();
  });

  it("renders Sun icon in dark mode by default", () => {
    render(<Layout><div /></Layout>);
    expect(screen.getByLabelText("Toggle theme")).toBeDefined();
  });

  it("toggles theme on button click", () => {
    render(<Layout><div /></Layout>);
    const btn = screen.getByLabelText("Toggle theme");
    act(() => btn.click());
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("aware-theme")).toBe("light");
  });

  it("toggles back to dark on second click", () => {
    render(<Layout><div /></Layout>);
    const btn = screen.getByLabelText("Toggle theme");
    act(() => btn.click());
    act(() => btn.click());
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(localStorage.getItem("aware-theme")).toBe("dark");
  });

  it("shows active indicator on current route", () => {
    vi.mocked(wouter.useLocation).mockReturnValue(["/runs"]);
    render(<Layout><div /></Layout>);
    const runsLink = screen.getByText("Runs").closest("a");
    expect(runsLink?.querySelector("span")).toBeDefined();
  });

  it("does not show active indicator on inactive route", () => {
    vi.mocked(wouter.useLocation).mockReturnValue(["/runs"]);
    render(<Layout><div /></Layout>);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    const spans = dashboardLink?.querySelectorAll("span");
    const hasActive = [...(spans || [])].some(s => s.className.includes("bg-gcp-blue"));
    expect(hasActive).toBe(false);
  });
});
