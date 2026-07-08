import type { TestCase } from '@/lib/types';

function flatten(...args: unknown[]): string[] {
  const result: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (Array.isArray(arg)) {
      result.push(...arg.filter(Boolean));
    } else if (typeof arg === 'string') {
      result.push(arg);
    }
  }
  return result;
}

export function cn(...classes: (string | undefined | null | false | (string | undefined | null | false)[])[]): string {
  return flatten(...classes).join(' ');
}

export function cleanScriptPath(testCase: TestCase): string {
  if (!testCase || typeof testCase !== 'object') return '';
  return (testCase.githubPath || testCase.scriptPath || '')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/::.*$/, '');
}

export function getGitHubUrl(testCase: TestCase): string | null {
  if (!testCase || typeof testCase !== 'object') return null;
  const path = cleanScriptPath(testCase);
  if (!path) return null;
  return `https://github.com/ruake/AWARE/blob/main/${path}`;
}
