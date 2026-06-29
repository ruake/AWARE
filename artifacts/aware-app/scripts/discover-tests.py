#!/usr/bin/env python3
"""
Pytest Test Discovery Script

Traverses pytest files in the specified directories, parses them
using AST, and generates a JSON file of derived test cases for
the AWARE test observability dashboard.

Usage:
    python scripts/discover-tests.py [--dirs TESTS_DIR ...] [--output OUTPUT_PATH]

Defaults:
    --dirs    tests/             (relative to project root)
    --output  data/auto-tests.json
"""

import ast
import json
import os
import re
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

# Map pytest marker names to AWARE fields
MARKER_CATEGORY = "category"
MARKER_PRIORITY = "priority"
MARKER_SEVERITY = "severity"
MARKER_OWNER = "owner"

SEVERITY_MAP = {
    "P0": "critical",
    "P1": "major",
    "P2": "minor",
    "P3": "trivial",
}

KNOWN_CATEGORIES = {
    "geo-match", "locale-split", "url-health", "security",
    "performance", "caching", "routing", "tls", "ddos",
}


@dataclass
class DiscoveredTest:
    id: str = ""
    name: str = ""
    description: str = ""
    testType: str = "api"
    category: str = "general"
    priority: str = "P2"
    severity: str = "minor"
    status: str = "active"
    tags: list[str] = field(default_factory=list)
    owner: str = "auto@discovery"
    suiteIds: list[str] = field(default_factory=lambda: ["suite_auto"])
    automated: bool = True
    scriptPath: str = ""
    preconditions: str = ""
    expectedBehavior: str = ""
    documentation: str = ""
    relatedTestIds: list[str] = field(default_factory=list)
    requestHeaders: dict[str, str] = field(default_factory=dict)
    cookies: dict[str, str] = field(default_factory=dict)
    expectedStatus: int = 200
    captureResponseHeaders: list[str] = field(default_factory=list)
    filmstrip: dict = field(default_factory=lambda: {
        "enabled": False, "threshold": 0.0, "region": "",
        "ignoreAreas": [],
    })
    predicates: list[dict] = field(default_factory=list)
    config: dict = field(default_factory=dict)
    assertions: list[dict] = field(default_factory=list)
    version: int = 1
    changelog: list[dict] = field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""
    githubPath: str = ""
    repoStatus: str = "synced"

    def __post_init__(self) -> None:
        import datetime
        now = datetime.datetime.utcnow().isoformat() + "Z"
        self.createdAt = now
        self.updatedAt = now


class PytestASTVisitor(ast.NodeVisitor):
    """AST visitor that extracts test functions and classes from a pytest file."""

    def __init__(self, filepath: str) -> None:
        self.filepath = filepath
        self.relative_path = filepath
        self.tests: list[DiscoveredTest] = []
        self._current_class = ""
        self._module_docstring = ""
        self._module_markers: list[str] = []

    def visit_Module(self, node: ast.Module) -> None:
        self._module_docstring = ast.get_docstring(node) or ""
        self._module_markers = []
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        if not node.name.startswith("Test"):
            return
        self._current_class = node.name
        self.generic_visit(node)
        self._current_class = ""

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        if not node.name.startswith("test_"):
            return
        markers = self._extract_markers(node)
        docstring = ast.get_docstring(node) or ""
        parametrize_params = self._extract_parametrize(node)

        if parametrize_params:
            for i, params in enumerate(parametrize_params):
                test = self._build_test(node, docstring, markers, i, params)
                self.tests.append(test)
        else:
            test = self._build_test(node, docstring, markers)
            self.tests.append(test)

    def _extract_markers(self, node: ast.FunctionDef) -> dict[str, str]:
        markers: dict[str, str] = {}
        for deco in node.decorator_list:
            if isinstance(deco, ast.Attribute) and deco.attr == "mark" and isinstance(deco.value, ast.Name) and deco.value.id == "pytest":
                continue
            if isinstance(deco, ast.Call):
                func = deco.func
                if isinstance(func, ast.Attribute) and func.attr == "mark":
                    continue
                if isinstance(func, ast.Attribute):
                    marker_name = func.attr
                    if marker_name == "parametrize":
                        continue
                    if deco.args:
                        if isinstance(deco.args[0], ast.Constant):
                            markers[marker_name] = str(deco.args[0].value)
                        elif isinstance(deco.args[0], ast.Str):
                            markers[marker_name] = deco.args[0].s
                elif isinstance(func, ast.Attribute) and isinstance(func.value, ast.Attribute) and func.value.attr == "mark":
                    marker_name = func.attr
                    if deco.args and isinstance(deco.args[0], ast.Constant):
                        markers[marker_name] = str(deco.args[0].value)
        return markers

    def _extract_parametrize(self, node: ast.FunctionDef) -> list[tuple[str, ...]]:
        for deco in node.decorator_list:
            if isinstance(deco, ast.Call):
                func = deco.func
                if isinstance(func, ast.Attribute) and func.attr == "parametrize":
                    args = [a for a in deco.args if isinstance(a, ast.List)]
                    if args:
                        items = []
                        for elt in args[0].elts:
                            if isinstance(elt, ast.Tuple):
                                items.append(tuple(
                                    e.value if isinstance(e, ast.Constant) else str(e.s) if isinstance(e, ast.Str) else str(e)
                                    for e in elt.elts
                                ))
                            elif isinstance(elt, ast.Constant):
                                items.append((elt.value,))
                            elif isinstance(elt, ast.Str):
                                items.append((elt.s,))
                        return items
        return []

    def _build_test(
        self,
        node: ast.FunctionDef,
        docstring: str,
        markers: dict[str, str],
        variant_idx: int = -1,
        params: tuple[str, ...] = (),
    ) -> DiscoveredTest:
        category = markers.get(MARKER_CATEGORY, self._infer_category())
        priority = markers.get(MARKER_PRIORITY, "P2")
        severity = SEVERITY_MAP.get(priority, "minor")
        owner = markers.get(MARKER_OWNER, "auto@discovery")

        test_name = node.name.replace("_", " ").title()
        if params:
            param_suffix = "_".join(str(p) for p in params if p)
            param_suffix = re.sub(r"[^a-zA-Z0-9_-]", "_", param_suffix)[:40]
            test_name = f"{test_name}[{param_suffix}]"

        tags = [category]
        if self._current_class:
            tags.append(self._current_class.lower().replace("test", "").strip())

        description = docstring.split("\n\n")[0] if docstring else f"Auto-discovered from {self.relative_path}"
        documentation = docstring if docstring else description

        test_id = f"ad_{len(self.tests)}"
        expected_behavior = f"Auto-discovered test: {test_name}\nSource: {self.relative_path}\nCategory: {category}\nPriority: {priority}"

        script_path = self.relative_path
        if self._current_class:
            script_path = f"{self.relative_path}::{self._current_class}::{node.name}"
        else:
            script_path = f"{self.relative_path}::{node.name}"

        return DiscoveredTest(
            id=test_id,
            name=test_name,
            description=description,
            testType="api",
            category=category if category in KNOWN_CATEGORIES else "general",
            priority=priority,
            severity=severity,
            status="active",
            tags=tags,
            owner=owner,
            suiteIds=["suite_auto"],
            automated=True,
            scriptPath=script_path,
            preconditions="Auto-discovered via pytest AST traversal",
            expectedBehavior=expected_behavior,
            documentation=documentation,
            version=1,
            githubPath=self.relative_path,
            repoStatus="synced",
        )

    def _infer_category(self) -> str:
        path_lower = self.relative_path.lower()
        if "geo" in path_lower:
            return "geo-match"
        if "security" in path_lower or "waf" in path_lower:
            return "security"
        if "performance" in path_lower or "latency" in path_lower or "cach" in path_lower:
            return "performance"
        if "routing" in path_lower or "dns" in path_lower:
            return "routing"
        if "tls" in path_lower or "ssl" in path_lower:
            return "tls"
        return "general"


def discover_tests(directories: list[str], project_root: str) -> list[DiscoveredTest]:
    """Walk each directory, parse pytest files, and return discovered tests."""
    all_tests: list[DiscoveredTest] = []
    seen_ids: set[str] = set()
    counter = [0]

    for directory in directories:
        dir_path = Path(project_root) / directory
        if not dir_path.exists():
            print(f"  [SKIP] Directory not found: {dir_path}", file=sys.stderr)
            continue

        for py_file in sorted(dir_path.rglob("test_*.py")):
            rel_path = str(py_file.relative_to(project_root))
            print(f"  [PARSE] {rel_path}", file=sys.stderr)
            try:
                source = py_file.read_text(encoding="utf-8")
                tree = ast.parse(source)
                visitor = PytestASTVisitor(rel_path)
                visitor.visit(tree)

                for test in visitor.tests:
                    test.id = f"ad_{counter[0]}"
                    counter[0] += 1
                    all_tests.append(test)

            except SyntaxError as e:
                print(f"  [ERROR] Syntax error in {rel_path}: {e}", file=sys.stderr)
            except Exception as e:
                print(f"  [ERROR] Failed to parse {rel_path}: {e}", file=sys.stderr)

    return all_tests


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Discover pytest tests and generate JSON")
    parser.add_argument("--dirs", nargs="+", default=["tests"],
                        help="Directories to search for pytest files (relative to project root)")
    parser.add_argument("--output", default="data/auto-tests.json",
                        help="Output path for generated JSON (relative to project root)")

    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    os.chdir(project_root)

    print(f"Test Discovery\n{'='*60}", file=sys.stderr)
    print(f"  Project root: {project_root}", file=sys.stderr)
    print(f"  Search dirs:  {args.dirs}", file=sys.stderr)
    print(f"  Output:       {args.output}", file=sys.stderr)
    print(file=sys.stderr)

    tests = discover_tests(args.dirs, str(project_root))

    output_path = Path(project_root) / args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([asdict(t) for t in tests], f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}", file=sys.stderr)
    print(f"  Discovered: {len(tests)} tests", file=sys.stderr)
    print(f"  Written to: {output_path}", file=sys.stderr)
    print(file=sys.stderr)

    if tests:
        cats: dict[str, int] = {}
        for t in tests:
            cats[t.category] = cats.get(t.category, 0) + 1
        print(f"  By category:", file=sys.stderr)
        for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
            print(f"    {cat}: {count}", file=sys.stderr)


if __name__ == "__main__":
    main()
