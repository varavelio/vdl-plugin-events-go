/**
 * Matches VDL event subject placeholders such as `{tenantId}`.
 */
export const eventPlaceholderPattern = /\{([^{}]+)\}/g;

/**
 * Extracts placeholder names from a VDL event subject in source order.
 */
export function extractPlaceholderNames(subject: string): string[] {
  return listPlaceholderMatches(subject).map((match) => match[1] ?? "");
}

/**
 * Lists raw placeholder regex matches in source order.
 */
export function listPlaceholderMatches(subject: string): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  const pattern = new RegExp(eventPlaceholderPattern.source, "g");
  let match = pattern.exec(subject);

  while (match) {
    matches.push(match);
    match = pattern.exec(subject);
  }

  return matches;
}
