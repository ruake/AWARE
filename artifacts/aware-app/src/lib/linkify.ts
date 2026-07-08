export function linkify(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const runRegex = /run_[\w-]+/g;

  let result = text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-gcp-blue hover:text-gcp-blue-light">${url}</a>`;
  });

  result = result.replace(runRegex, (runId) => {
    return `<a href="/runs/${runId}" class="text-gcp-blue hover:text-gcp-blue-light font-mono">${runId}</a>`;
  });

  return result;
}

export function stripLinks(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
