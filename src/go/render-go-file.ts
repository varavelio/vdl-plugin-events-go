import type { TypeDef } from "@varavel/vdl-plugin-sdk";
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

  lines.push(...renderCatalog(events, allTypes), "");

  for (const [index, event] of events.entries()) {
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
    event.placeholders.some((placeholder) =>
      typeUsesTime(placeholder.field.typeRef, allTypes),
    ),
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
 * Renders the generated event catalog definitions with typed BuildSubject fields.
 */
function renderCatalog(events: EventModel[], allTypes: TypeDef[]): string[] {
  const lines = [
    "// VDLEventCatalogMeta groups generated event metadata by payload type name.",
    "type VDLEventCatalogMeta struct {",
  ];

  for (const event of events) {
    const params = renderSubjectParams(event, allTypes);
    lines.push(`\t${event.name} struct {`);
    lines.push("\t\tName string");
    lines.push("\t\tSubjectTemplate string");
    lines.push(`\t\tBuildSubject func(${params}) string`);
    lines.push("\t}");
  }

  lines.push(
    "}",
    "",
    "// VDLEventCatalog indexes generated events by payload type name.",
    "var VDLEventCatalog = VDLEventCatalogMeta{",
  );

  for (const event of events) {
    const params = renderSubjectParams(event, allTypes);
    lines.push(`\t${event.name}: struct {`);
    lines.push("\t\t// Name is the name of this event.");
    lines.push("\t\t//");
    lines.push(`\t\t//\t// Name:    ${event.name}`);
    lines.push(`\t\t//\t// Subject: ${event.subject}`);
    lines.push("\t\tName string");
    lines.push(
      "\t\t// SubjectTemplate is the subject template for this event.",
    );
    lines.push("\t\t//");
    lines.push(`\t\t//\t// Name:    ${event.name}`);
    lines.push(`\t\t//\t// Subject: ${event.subject}`);
    lines.push("\t\tSubjectTemplate string");
    lines.push("\t\t// BuildSubject builds the subject for this event.");
    lines.push("\t\t//");
    lines.push(`\t\t//\t// Name:    ${event.name}`);
    lines.push(`\t\t//\t// Subject: ${event.subject}`);
    lines.push(`\t\tBuildSubject func(${params}) string`);
    lines.push("\t}{");
    lines.push(`\t\tName: "${event.name}",`);
    lines.push(`\t\tSubjectTemplate: "${event.subject}",`);
    lines.push(`\t\tBuildSubject: build${event.name}Subject,`);
    lines.push("\t},");
  }

  lines.push("}");
  return lines;
}

/**
 * Renders one generated (unexported) Go subject builder for an event.
 */
function renderSubjectBuilder(
  event: EventModel,
  allTypes: TypeDef[],
): string[] {
  const params = renderSubjectParams(event, allTypes);
  return [
    `func build${event.name}Subject(${params}) string {`,
    `\treturn ${renderSubjectParts(event, allTypes).join(" + ")}`,
    "}",
  ];
}

/**
 * Renders the parameter list string for a subject builder function.
 */
function renderSubjectParams(event: EventModel, allTypes: TypeDef[]): string {
  return uniquePlaceholders(event.placeholders)
    .map((placeholder) => {
      return `${placeholder.name} ${renderGoType(placeholder.field.typeRef, placeholder.field.optional, allTypes)}`;
    })
    .join(", ");
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
