import type { IrSchema } from "@varavel/vdl-plugin-sdk";
import {
  getDeprecationMessage,
  isDeprecated,
} from "@varavel/vdl-plugin-sdk/utils/deprecations";
import { assertValidIrForEvents } from "@varavel/vdl-plugin-sdk/utils/events";
import type { EventModel } from "../models/event-model";

/**
 * Collects validated events with deprecation metadata for code generation.
 */
export function collectEventModels(ir: IrSchema): EventModel[] {
  const events = assertValidIrForEvents(ir);
  const typesByName = new Map(
    ir.types.map((typeDef) => [typeDef.name, typeDef]),
  );

  return events.map((event) => {
    const typeDef = typesByName.get(event.name);
    const deprecated = isDeprecated(typeDef?.annotations);
    const message = getDeprecationMessage(typeDef?.annotations);

    return {
      ...event,
      isDeprecated: deprecated,
      ...(message === undefined ? {} : { deprecationMessage: message }),
    };
  });
}
