import type { PrimitiveType } from "@varavel/vdl-plugin-sdk";

/**
 * Renders a VDL primitive type into its Go type form.
 */
export function renderGoType(primitiveType: PrimitiveType): string {
  switch (primitiveType) {
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
      return primitiveType;
  }
}

/**
 * Returns whether rendering the type requires the Go `time` package.
 */
export function typeUsesTime(primitiveType: PrimitiveType): boolean {
  return primitiveType === "datetime";
}

/**
 * Returns whether the placeholder value requires `fmt.Sprint` during subject rendering.
 */
export function typeNeedsFmtSprint(primitiveType: PrimitiveType): boolean {
  return primitiveType !== "string" && primitiveType !== "datetime";
}

/**
 * Renders a placeholder field reference into Go subject-building code.
 */
export function renderSubjectValue(
  fieldName: string,
  primitiveType: PrimitiveType,
): string {
  if (primitiveType === "string") {
    return fieldName;
  }

  if (primitiveType === "datetime") {
    return `${fieldName}.Format(time.RFC3339Nano)`;
  }

  return `fmt.Sprint(${fieldName})`;
}
