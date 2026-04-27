import type { Field, TypeDef, TypeRef } from "@varavel/vdl-plugin-sdk";
import { pascalCase } from "@varavel/vdl-plugin-sdk/utils/strings";
import { resolveType } from "../types/type-resolver";

/**
 * Renders a VDL type reference into its Go type form.
 */
export function renderGoType(
  typeRef: TypeRef,
  optional: boolean,
  allTypes: TypeDef[],
): string {
  const rendered = renderRequiredGoType(typeRef, allTypes);
  return optional ? `*${rendered}` : rendered;
}

/**
 * Returns whether rendering the type requires the Go `time` package.
 */
export function typeUsesTime(typeRef: TypeRef, allTypes: TypeDef[]): boolean {
  const resolved = resolveType(typeRef, allTypes);

  switch (resolved.kind) {
    case "primitive":
      return resolved.primitiveName === "datetime";
    case "array":
      return typeUsesTime(
        resolved.arrayType ?? { kind: "primitive", primitiveName: "string" },
        allTypes,
      );
    case "map":
      return typeUsesTime(
        resolved.mapType ?? { kind: "primitive", primitiveName: "string" },
        allTypes,
      );
    case "object":
      return (resolved.objectFields ?? []).some((field) =>
        typeUsesTime(field.typeRef, allTypes),
      );
    case "type":
    case "enum":
      return false;
    default:
      throw new Error(`Unhandled type kind: ${resolved.kind}`);
  }
}

/**
 * Returns whether the placeholder value requires `fmt.Sprint` during subject rendering.
 */
export function typeNeedsFmtSprint(
  typeRef: TypeRef,
  allTypes: TypeDef[],
): boolean {
  const resolved = resolveType(typeRef, allTypes);
  return !(
    resolved.kind === "primitive" &&
    (resolved.primitiveName === "string" ||
      resolved.primitiveName === "datetime")
  );
}

/**
 * Renders a placeholder field reference into Go subject-building code.
 */
export function renderSubjectValue(field: Field, allTypes: TypeDef[]): string {
  const resolved = resolveType(field.typeRef, allTypes);
  if (resolved.kind === "primitive" && resolved.primitiveName === "string") {
    return field.name;
  }

  if (resolved.kind === "primitive" && resolved.primitiveName === "datetime") {
    return `${field.name}.Format(time.RFC3339Nano)`;
  }

  return `fmt.Sprint(${field.name})`;
}

/**
 * Renders the non-optional form of a VDL type reference into Go.
 */
function renderRequiredGoType(typeRef: TypeRef, allTypes: TypeDef[]): string {
  switch (typeRef.kind) {
    case "primitive":
      return primitiveToGoType(typeRef.primitiveName ?? "string");
    case "array":
      return `${"[]".repeat(typeRef.arrayDims ?? 1)}${renderGoType(typeRef.arrayType ?? { kind: "primitive", primitiveName: "string" }, false, allTypes)}`;
    case "map":
      return `map[string]${renderGoType(typeRef.mapType ?? { kind: "primitive", primitiveName: "string" }, false, allTypes)}`;
    case "object":
      return renderInlineObjectType(typeRef, allTypes);
    case "type":
      return typeRef.typeName ?? "any";
    case "enum":
      return renderEnumGoType(typeRef.enumType);
    default:
      throw new Error(`Unhandled type kind: ${typeRef.kind}`);
  }
}

/**
 * Renders an inline VDL object type into an anonymous Go struct.
 */
function renderInlineObjectType(typeRef: TypeRef, allTypes: TypeDef[]): string {
  const lines = ["struct {"];
  for (const field of typeRef.objectFields ?? []) {
    lines.push(
      `\t${pascalCase(field.name)} ${renderGoType(field.typeRef, field.optional, allTypes)} \`json:"${field.name}"\``,
    );
  }
  lines.push("}");
  return lines.join("\n");
}

/**
 * Maps VDL primitive types to their Go equivalents.
 */
function primitiveToGoType(name: string): string {
  switch (name) {
    case "string":
      return "string";
    case "int":
      return "int64";
    case "float":
      return "float64";
    case "bool":
      return "bool";
    case "datetime":
      return "time.Time";
    default:
      return name;
  }
}

/**
 * Maps VDL enum storage types to their Go equivalents.
 */
function renderEnumGoType(enumType: string | undefined): string {
  switch (enumType) {
    case "int":
      return "int64";
    default:
      return "string";
  }
}
