import type { TypeDef } from "@varavel/vdl-plugin-sdk";
import { pascalCase } from "@varavel/vdl-plugin-sdk/utils/strings";
import { listPlaceholderMatches } from "../events/placeholders";
import type { EventModel, PlaceholderModel } from "../models/event-model";
import {
  renderGoType,
  renderSubjectValue,
  typeNeedsFmtSprint,
  typeUsesTime,
} from "./render-go-type";

/**
 * Renders the consolidated Go output file for all collected events.
 */
export function renderGoFile(
  packageName: string,
  events: EventModel[],
  allTypes: TypeDef[],
): string {
  const lines: string[] = [`package ${packageName}`, ""];
  const imports = collectImports(events, allTypes);

  if (imports.length > 0) {
    lines.push("import (");
    for (const importPath of imports) {
      lines.push(`\t${importPath}`);
    }
    lines.push(")", "");
  }

  lines.push(...renderCatalog(events), "");

  for (const [index, event] of events.entries()) {
    lines.push(...renderEventStruct(event, allTypes), "");
    lines.push(...renderSubjectBuilder(event, allTypes));

    if (index < events.length - 1) {
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

/**
 * Collects Go imports required by the generated event file.
 */
function collectImports(events: EventModel[], allTypes: TypeDef[]): string[] {
  const imports: string[] = [];

  const needsFmt = events.some((event) =>
    event.placeholders.some((placeholder) =>
      typeNeedsFmtSprint(placeholder.field.typeRef, allTypes),
    ),
  );
  const needsTime = events.some((event) =>
    event.fields.some((field) => typeUsesTime(field.typeRef, allTypes)),
  );

  if (needsFmt) {
    imports.push('"fmt"');
  }

  if (needsTime) {
    imports.push('"time"');
  }

  return imports;
}

/**
 * Renders the generated event catalog definitions.
 */
function renderCatalog(events: EventModel[]): string[] {
  const lines = [
    "// VDLEventMetadataItem describes one generated event contract.",
    "type VDLEventMetadataItem struct {",
    "\tName string",
    "\tSubject string",
    "}",
    "",
    "// VDLEventMetadata groups generated event metadata by payload type name.",
    "type VDLEventMetadata struct {",
  ];

  for (const event of events) {
    lines.push(`\t${event.name} VDLEventMetadataItem`);
  }

  lines.push(
    "}",
    "",
    "// VDLEventCatalog indexes generated events by payload type name.",
    "var VDLEventCatalog = VDLEventMetadata{",
  );

  for (const event of events) {
    lines.push(`\t${event.name}: VDLEventMetadataItem{`);
    lines.push(`\t\tName: "${event.name}",`);
    lines.push(`\t\tSubject: "${event.subject}",`);
    lines.push("\t},");
  }

  lines.push("}");
  return lines;
}

/**
 * Renders one generated Go payload struct for an event.
 */
function renderEventStruct(event: EventModel, allTypes: TypeDef[]): string[] {
  const lines = [
    ...renderEventComment(
      `${event.name} is the payload generated for this event.`,
      event,
    ),
    `type ${event.name} struct {`,
  ];

  for (const field of event.fields) {
    lines.push(
      `\t${pascalCase(field.name)} ${renderGoType(field.typeRef, field.optional, allTypes)} \`json:"${field.name}"\``,
    );
  }

  lines.push("}");
  return lines;
}

/**
 * Renders one generated Go subject builder for an event.
 */
function renderSubjectBuilder(
  event: EventModel,
  allTypes: TypeDef[],
): string[] {
  const params = uniquePlaceholders(event.placeholders).map((placeholder) => {
    return `${placeholder.name} ${renderGoType(placeholder.field.typeRef, placeholder.field.optional, allTypes)}`;
  });

  return [
    ...renderEventComment(
      `Build${event.name}Subject builds the routing subject for this event.`,
      event,
    ),
    `func Build${event.name}Subject(${params.join(", ")}) string {`,
    `\treturn ${renderSubjectParts(event, allTypes).join(" + ")}`,
    "}",
  ];
}

/**
 * Renders a Go doc comment block for one generated event artifact.
 */
function renderEventComment(summary: string, event: EventModel): string[] {
  return [
    `// ${summary}`,
    "//",
    "// Name:",
    "//",
    `//\t${event.name}`,
    "//",
    "// Subject:",
    "//",
    `//\t${event.subject}`,
  ];
}

/**
 * Renders the expression parts that compose one event subject string.
 */
function renderSubjectParts(event: EventModel, allTypes: TypeDef[]): string[] {
  const parts: string[] = [];
  const placeholdersByName = new Map(
    event.placeholders.map((placeholder) => [placeholder.name, placeholder]),
  );
  let cursor = 0;

  for (const match of listPlaceholderMatches(event.subject)) {
    const start = match.index ?? 0;
    const raw = match[0] ?? "";
    const placeholderName = match[1] ?? "";
    const literal = event.subject.slice(cursor, start);

    if (literal.length > 0) {
      parts.push(JSON.stringify(literal));
    }

    const placeholder = placeholdersByName.get(placeholderName);
    if (!placeholder) {
      throw new Error(`Missing placeholder model for ${placeholderName}`);
    }

    parts.push(renderSubjectValue(placeholder.field, allTypes));
    cursor = start + raw.length;
  }

  const tail = event.subject.slice(cursor);
  if (tail.length > 0) {
    parts.push(JSON.stringify(tail));
  }

  return parts.length === 0 ? ['""'] : parts;
}

/**
 * Removes duplicate placeholders while preserving the first occurrence order.
 */
function uniquePlaceholders(
  placeholders: PlaceholderModel[],
): PlaceholderModel[] {
  const seen = new Set<string>();
  return placeholders.filter((placeholder) => {
    if (seen.has(placeholder.name)) {
      return false;
    }

    seen.add(placeholder.name);
    return true;
  });
}
