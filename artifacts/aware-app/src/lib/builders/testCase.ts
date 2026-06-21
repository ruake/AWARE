import type { TestCase, TestPriority, TestSeverity, TestAssertion } from "../types";

export class TestCaseBuilder {
  private _tc: Partial<TestCase> = {
    id: crypto.randomUUID(),
    status: "active",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    automated: true,
    tags: [],
    suiteIds: [],
    assertions: [],
    changelog: [],
    requestHeaders: {},
    cookies: {},
    relatedTestIds: [],
    captureResponseHeaders: [],
    predicates: [],
    config: {},
    filmstrip: {
      enabled: true,
      mode: "screenshot",
      threshold: 0.1,
      captureOnFailure: true,
      maxFrames: 10,
    },
    preconditions: "",
    expectedBehavior: "",
    documentation: "",
    scriptPath: "",
    expectedStatus: 200,
  };

  name(v: string): this {
    this._tc.name = v;
    return this;
  }

  description(v: string): this {
    this._tc.description = v;
    return this;
  }

  category(v: string): this {
    this._tc.category = v;
    return this;
  }

  priority(v: TestPriority): this {
    this._tc.priority = v;
    return this;
  }

  severity(v: TestSeverity): this {
    this._tc.severity = v;
    return this;
  }

  testType(v: TestCase["testType"]): this {
    this._tc.testType = v;
    return this;
  }

  owner(v: string): this {
    this._tc.owner = v;
    return this;
  }

  suiteIds(v: string[]): this {
    this._tc.suiteIds = v;
    return this;
  }

  assertion(a: TestAssertion): this {
    this._tc.assertions = [...(this._tc.assertions || []), a];
    return this;
  }

  tag(t: string): this {
    this._tc.tags = [...(this._tc.tags || []), t];
    return this;
  }

  build(): TestCase {
    if (!this._tc.name) throw new Error("TestCase name is required");
    if (!this._tc.category) throw new Error("TestCase category is required");
    if (!this._tc.priority) throw new Error("TestCase priority is required");

    // Ensure all other required fields from TestCase interface are present
    // even if they have defaults in my _tc object.
    // The cast below is safe because of the checks above and the default values.
    return this._tc as TestCase;
  }

  static from(partial: Partial<TestCase>): TestCaseBuilder {
    const builder = new TestCaseBuilder();
    builder._tc = { ...builder._tc, ...partial };
    return builder;
  }
}
