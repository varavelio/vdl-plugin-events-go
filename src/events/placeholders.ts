/**
 * Matches VDL event subject placeholders such as `{tenantId}`.
 */
export const eventPlaceholderPattern = /\{([^{}]+)\}/g;

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
