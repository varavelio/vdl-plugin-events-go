import type { ValidatedEvent } from "@varavel/vdl-plugin-sdk/utils/events";

/**
 * Validated event enriched with VPP-1 deprecation metadata.
 */
export type EventModel = ValidatedEvent & {
  /** Whether the source type carries `@deprecated`. */
  isDeprecated: boolean;
  /** Human-readable deprecation message, when a string argument exists. */
  deprecationMessage?: string;
};
