export interface LinkifyRule {
  pattern: RegExp;
  href: (id: string) => string;
  label?: (id: string) => string;
}

const RULES: LinkifyRule[] = [
  { pattern: /(?<!`|\w)\b(tc_\d+)\b(?!`)/g, href: (id) => `/tests?detail=${id}` },
  { pattern: /(?<!`|\w)\b(diff_\d+)\b(?!`)/g, href: (id) => `/trends?diffId=${id}` },
  { pattern: /(?<!`|\w)\b(run_[\w-]+)\b(?!`)/g, href: (id) => `/runs/${id}` },
  { pattern: /(?<!`|\w)\b(TC-\d{3})\b(?!`)/g, href: (id) => `/trends?testId=${id}` },
];

export function linkifyText(text: string): string {
  let result = text;
  for (const rule of RULES) {
    result = result.replace(rule.pattern, (_match, id: string) => {
      const href = rule.href(id);
      const label = rule.label ? rule.label(id) : id;
      return `[${label}](${href})`;
    });
  }
  return result;
}
