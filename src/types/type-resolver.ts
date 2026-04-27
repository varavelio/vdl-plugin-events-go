import type { TypeDef, TypeRef } from "@varavel/vdl-plugin-sdk";

/**
 * Resolves named VDL types until a concrete underlying type is reached.
 */
export function resolveType(typeRef: TypeRef, allTypes: TypeDef[]): TypeRef {
  if (typeRef.kind !== "type") {
    return typeRef;
  }

  const typeDef = allTypes.find(
    (candidate) => candidate.name === typeRef.typeName,
  );
  if (!typeDef) {
    return typeRef;
  }

  return resolveType(typeDef.typeRef, allTypes);
}

/**
 * Returns whether a type can legally back an event subject placeholder.
 */
export function isPrimitiveSubjectType(
  typeRef: TypeRef,
  allTypes: TypeDef[],
): boolean {
  return resolveType(typeRef, allTypes).kind === "primitive";
}
