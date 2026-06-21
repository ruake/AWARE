import type { SuiteNode, TestSuite } from './types';

export class SuiteTree {
  private roots: SuiteNode[];

  constructor(roots: SuiteNode[]) {
    this.roots = roots;
  }

  // Static factory
  static from(nodes: SuiteNode[]): SuiteTree {
    return new SuiteTree(nodes);
  }

  // Traversal
  find(predicate: (suite: TestSuite) => boolean): SuiteNode | undefined {
    let found: SuiteNode | undefined;
    this.walk((node) => {
      if (predicate(node.suite)) {
        found = node;
      }
    });
    return found;
  }

  findById(id: string): SuiteNode | undefined {
    return this.find((suite) => suite.id === id);
  }

  walk(visitor: (node: SuiteNode, depth: number) => void): void {
    const traverse = (nodes: SuiteNode[], depth: number) => {
      for (const node of nodes) {
        visitor(node, depth);
        if (node.children.length > 0) {
          traverse(node.children, depth + 1);
        }
      }
    };
    traverse(this.roots, 0);
  }

  toDepthFirstArray(): SuiteNode[] {
    const result: SuiteNode[] = [];
    this.walk((node) => {
      result.push(node);
    });
    return result;
  }

  toRoots(): readonly SuiteNode[] {
    return this.roots;
  }

  // Aggregation
  flattenTestIds(): string[] {
    const testIds = new Set<string>();
    this.walk((node) => {
      for (const id of node.suite.testIds) {
        testIds.add(id);
      }
    });
    return Array.from(testIds);
  }

  countSuites(): number {
    let count = 0;
    this.walk(() => {
      count++;
    });
    return count;
  }

  countTests(): number {
    return this.flattenTestIds().length;
  }

  getLeafSuites(): SuiteNode[] {
    const leaves: SuiteNode[] = [];
    this.walk((node) => {
      if (node.children.length === 0) {
        leaves.push(node);
      }
    });
    return leaves;
  }

  getMaxDepth(): number {
    let maxDepth = 0;
    this.walk((_, depth) => {
      if (depth > maxDepth) {
        maxDepth = depth;
      }
    });
    return maxDepth;
  }

  // Query
  getAncestors(suiteId: string): SuiteNode[] {
    const path: SuiteNode[] = [];
    const findPath = (nodes: SuiteNode[], targetId: string): boolean => {
      for (const node of nodes) {
        if (node.suite.id === targetId) {
          return true;
        }
        path.push(node);
        if (findPath(node.children, targetId)) {
          return true;
        }
        path.pop();
      }
      return false;
    };
    findPath(this.roots, suiteId);
    return path;
  }

  getDescendants(suiteId: string): SuiteNode[] {
    const node = this.findById(suiteId);
    if (!node) return [];
    const descendants: SuiteNode[] = [];
    const collect = (n: SuiteNode) => {
      for (const child of n.children) {
        descendants.push(child);
        collect(child);
      }
    };
    collect(node);
    return descendants;
  }

  // Transformation
  filter(predicate: (suite: TestSuite) => boolean): SuiteTree {
    const filterNodes = (nodes: SuiteNode[]): SuiteNode[] => {
      return nodes
        .map((node) => {
          const filteredChildren = filterNodes(node.children);
          const matches = predicate(node.suite);
          
          if (matches || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren
            };
          }
          return null;
        })
        .filter((node): node is SuiteNode => node !== null);
    };

    return new SuiteTree(filterNodes(this.roots));
  }

  // Serialization
  toPlainArray(): SuiteNode[] {
    return this.toDepthFirstArray();
  }
}
