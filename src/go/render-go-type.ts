import type { Field, TypeDef, TypeRef } from "@varavel/vdl-plugin-sdk";
import { resolveType } from "../types/type-resolver";

/**
 * Renders a VDL type reference into its Go type form.
 */
export function renderGoType(
  typeRef: TypeRef,
  optional: boolean,
  allTypes: TypeDef[],
): string {
  const rendered = renderRequiredGoType(resolveType(typeRef, allTypes));
  return optional ? `*${rendered}` : rendered;
}

/**
 * Returns whether rendering the type requires the Go `time` package.
 */
export function typeUsesTime(typeRef: TypeRef, allTypes: TypeDef[]): boolean {
  const resolved = resolveType(typeRef, allTypes);
  return resolved.kind === "primitive" && resolved.primitiveName === "datetime";
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
function renderRequiredGoType(typeRef: TypeRef): string {
  switch (typeRef.kind) {
    case "primitive":
      return primitiveToGoType(typeRef.primitiveName ?? "string");
    default:
      throw new Error(
        `Only primitive placeholders are supported, got: ${typeRef.kind}`,
      );
  }
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
