import { describe, it, expect } from 'vitest';
import { SuiteTree } from '../suiteTree';
import type { SuiteNode, TestSuite } from '../types';

describe('SuiteTree', () => {
  const mockSuite = (id: string, testIds: string[] = []): TestSuite => ({
    id,
    name: `Suite ${id}`,
    description: '',
    testIds,
    metadata: {},
  });

  const roots: SuiteNode[] = [
    {
      suite: mockSuite('root1', ['t1']),
      children: [
        {
          suite: mockSuite('child1.1', ['t2']),
          children: [],
        },
      ],
    },
    {
      suite: mockSuite('root2', ['t1', 't3']),
      children: [],
    },
  ];

  it('should create from nodes', () => {
    const tree = SuiteTree.from(roots);
    expect(tree.toRoots()).toEqual(roots);
  });

  it('should find suite by predicate', () => {
    const tree = SuiteTree.from(roots);
    const found = tree.find((s) => s.id === 'child1.1');
    expect(found?.suite.id).toBe('child1.1');
  });

  it('should count suites', () => {
    const tree = SuiteTree.from(roots);
    expect(tree.countSuites()).toBe(3);
  });

  it('should flatten test IDs', () => {
    const tree = SuiteTree.from(roots);
    const testIds = tree.flattenTestIds();
    expect(testIds.sort()).toEqual(['t1', 't2', 't3'].sort());
  });

  it('should get leaf suites', () => {
    const tree = SuiteTree.from(roots);
    const leaves = tree.getLeafSuites();
    expect(leaves.length).toBe(2);
    expect(leaves.map(l => l.suite.id)).toContain('child1.1');
    expect(leaves.map(l => l.suite.id)).toContain('root2');
  });

  it('should walk the tree', () => {
    const tree = SuiteTree.from(roots);
    const visited: string[] = [];
    tree.walk((node) => visited.push(node.suite.id));
    expect(visited).toEqual(['root1', 'child1.1', 'root2']);
  });
});
