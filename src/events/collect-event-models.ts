import { fail, type TypeDef } from "@varavel/vdl-plugin-sdk";
import { getAnnotation, unwrapLiteral } from "@varavel/vdl-plugin-sdk/utils/ir";
import type { EventModel } from "../models/event-model";
import { isPrimitiveSubjectType } from "../types/type-resolver";
import { extractPlaceholderNames } from "./placeholders";

/**
 * Collects validated event models from the schema and ignores non-event types.
 */
export function collectEventModels(typeDefs: TypeDef[]): EventModel[] {
  return typeDefs
    .map((typeDef) => toEventModel(typeDef, typeDefs))
    .filter((event): event is EventModel => event !== null);
}

/**
 * Converts one annotated VDL type into a normalized event model.
 */
function toEventModel(
  typeDef: TypeDef,
  allTypes: TypeDef[],
): EventModel | null {
  const eventAnnotation = getAnnotation(typeDef.annotations, "event");
  if (!eventAnnotation) {
    return null;
  }

  if (typeDef.typeRef.kind !== "object") {
    fail(
      `@event can only be used on object types, but "${typeDef.name}" is ${typeDef.typeRef.kind}.`,
      typeDef.position,
    );
  }

  if (!eventAnnotation.argument) {
    fail(
      `@event on "${typeDef.name}" must include a routing subject string.`,
      eventAnnotation.position,
    );
  }

  const subject = unwrapLiteral<string>(eventAnnotation.argument);
  if (typeof subject !== "string") {
    fail(
      `@event on "${typeDef.name}" must use a string literal subject.`,
      eventAnnotation.position,
    );
  }

  const fields = typeDef.typeRef.objectFields ?? [];
  const fieldsByName = new Map(fields.map((field) => [field.name, field]));
  const placeholders = extractPlaceholderNames(subject).map(
    (placeholderName) => {
      const field = fieldsByName.get(placeholderName);

      if (!field) {
        fail(
          `Placeholder "${placeholderName}" must match a top-level field on "${typeDef.name}".`,
          eventAnnotation.position,
        );
      }

      if (!isPrimitiveSubjectType(field.typeRef, allTypes)) {
        fail(
          `Placeholder "${placeholderName}" must reference a top-level primitive field on "${typeDef.name}".`,
          field.position,
        );
      }

      return { name: placeholderName, field };
    },
  );

  return {
    name: typeDef.name,
    subject,
    fields,
    placeholders,
  };
}
