import { listPlaceholderMatches } from "../events/placeholders";
import type { EventModel } from "../models/event-model";
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
): string {
  const lines: string[] = [`package ${packageName}`, ""];
  const imports = collectImports(events);

  if (imports.length > 0) {
    lines.push("import (");
    for (const importPath of imports) {
      lines.push(`\t${importPath}`);
    }
    lines.push(")", "");
  }

  lines.push(...renderCatalog(events), "");

  for (const [index, event] of events.entries()) {
    lines.push(...renderSubjectBuilder(event));

    if (index < events.length - 1) {
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

/**
 * Collects Go imports required by the generated event file.
 */
function collectImports(events: EventModel[]): string[] {
  const imports: string[] = [];

  const needsFmt = events.some((event) =>
    event.placeholders.some((placeholder) =>
      typeNeedsFmtSprint(placeholder.primitiveType),
    ),
  );
  const needsTime = events.some((event) =>
    event.placeholders.some((placeholder) =>
      typeUsesTime(placeholder.primitiveType),
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
 * Renders Go deprecation notice lines for a deprecated event.
 */
function renderDeprecationLines(event: EventModel, indent: string): string[] {
  if (!event.isDeprecated) {
    return [];
  }

  const message = event.deprecationMessage ?? "This event is deprecated.";
  return [`${indent}//`, `${indent}// Deprecated: ${message}`];
}

/**
 * Renders the generated event catalog definitions with typed BuildSubject fields.
 */
function renderEventDocLines(event: EventModel, indent: string): string[] {
  return [
    `${indent}// ${event.name} is the metadata for the ${event.name} event.`,
    `${indent}//`,
    `${indent}//\t// Name:    ${event.name}`,
    `${indent}//\t// Subject: ${event.subjectTemplate}`,
    ...renderDeprecationLines(event, indent),
  ];
}

function renderFieldDocLines(event: EventModel, indent: string): string[] {
  return [
    `${indent}//`,
    `${indent}//\t// Name:    ${event.name}`,
    `${indent}//\t// Subject: ${event.subjectTemplate}`,
  ];
}

function renderCatalog(events: EventModel[]): string[] {
  const lines = [
    "// VDLEventCatalogRegistry catalogs all @event-annotated types with their subject metadata and builders.",
    "type VDLEventCatalogRegistry struct {",
  ];

  for (const event of events) {
    const params = renderSubjectParams(event);
    lines.push(...renderEventDocLines(event, "\t"));
    lines.push(`\t${event.name} struct {`);
    lines.push("\t\t// Name is the name of this event.");
    lines.push(...renderFieldDocLines(event, "\t\t"));
    lines.push("\t\tName string");
    lines.push(
      "\t\t// SubjectTemplate is the subject template for this event.",
    );
    lines.push(...renderFieldDocLines(event, "\t\t"));
    lines.push("\t\tSubjectTemplate string");
    lines.push("\t\t// BuildSubject builds the subject for this event.");
    lines.push(...renderFieldDocLines(event, "\t\t"));
    lines.push(`\t\tBuildSubject func(${params}) string`);
    lines.push("\t}");
  }

  lines.push(
    "}",
    "",
    "// VDLEventCatalog indexes generated events by payload type name.",
    "var VDLEventCatalog = VDLEventCatalogRegistry{",
  );

  for (const event of events) {
    const params = renderSubjectParams(event);
    lines.push(...renderEventDocLines(event, "\t"));
    lines.push(`\t${event.name}: struct {`);
    lines.push("\t\t// Name is the name of this event.");
    lines.push(...renderFieldDocLines(event, "\t\t"));
    lines.push("\t\tName string");
    lines.push(
      "\t\t// SubjectTemplate is the subject template for this event.",
    );
    lines.push(...renderFieldDocLines(event, "\t\t"));
    lines.push("\t\tSubjectTemplate string");
    lines.push("\t\t// BuildSubject builds the subject for this event.");
    lines.push(...renderFieldDocLines(event, "\t\t"));
    lines.push(`\t\tBuildSubject func(${params}) string`);
    lines.push("\t}{");
    lines.push("\t\t// Name is the name of this event.");
    lines.push(...renderFieldDocLines(event, "\t\t"));
    lines.push(`\t\tName: "${event.name}",`);
    lines.push(
      "\t\t// SubjectTemplate is the subject template for this event.",
    );
    lines.push(...renderFieldDocLines(event, "\t\t"));
    lines.push(`\t\tSubjectTemplate: "${event.subjectTemplate}",`);
    lines.push("\t\t// BuildSubject builds the subject for this event.");
    lines.push(...renderFieldDocLines(event, "\t\t"));
    lines.push(`\t\tBuildSubject: build${event.name}Subject,`);
    lines.push("\t},");
  }

  lines.push("}");
  return lines;
}

/**
 * Renders one generated (unexported) Go subject builder for an event.
 */
function renderSubjectBuilder(event: EventModel): string[] {
  const params = renderSubjectParams(event);
  const lines = [
    `// build${event.name}Subject builds the subject for the ${event.name} event.`,
    ...renderDeprecationLines(event, ""),
  ];
  lines.push(
    `func build${event.name}Subject(${params}) string {`,
    `\treturn ${renderSubjectParts(event).join(" + ")}`,
    "}",
  );
  return lines;
}

/**
 * Renders the parameter list string for a subject builder function.
 */
function renderSubjectParams(event: EventModel): string {
  return event.placeholders
    .map((placeholder) => {
      return `${placeholder.field} ${renderGoType(placeholder.primitiveType)}`;
    })
    .join(", ");
}

/**
 * Renders the expression parts that compose one event subject string.
 */
function renderSubjectParts(event: EventModel): string[] {
  const parts: string[] = [];
  const placeholdersByName = new Map(
    event.placeholders.map((placeholder) => [placeholder.field, placeholder]),
  );
  let cursor = 0;

  for (const match of listPlaceholderMatches(event.subjectTemplate)) {
    const start = match.index ?? 0;
    const raw = match[0] ?? "";
    const placeholderName = match[1] ?? "";
    const literal = event.subjectTemplate.slice(cursor, start);

    if (literal.length > 0) {
      parts.push(JSON.stringify(literal));
    }

    const placeholder = placeholdersByName.get(placeholderName);
    if (!placeholder) {
      throw new Error(`Missing placeholder model for ${placeholderName}`);
    }

    parts.push(
      renderSubjectValue(placeholder.field, placeholder.primitiveType),
    );
    cursor = start + raw.length;
  }

  const tail = event.subjectTemplate.slice(cursor);
  if (tail.length > 0) {
    parts.push(JSON.stringify(tail));
  }

  return parts.length === 0 ? ['""'] : parts;
}
