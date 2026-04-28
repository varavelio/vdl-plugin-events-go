import type { Field } from "@varavel/vdl-plugin-sdk";

/**
 * Describes one `@event` declaration after validation and normalization.
 */
export type EventModel = {
  /** Payload type name used to name generated event artifacts. */
  name: string;
  /** Literal event subject template from the VDL schema. */
  subject: string;
  /** Ordered subject placeholders resolved against payload fields. */
  placeholders: PlaceholderModel[];
};

/**
 * Describes one resolved subject placeholder for an event subject template.
 */
export type PlaceholderModel = {
  /** Placeholder token name without surrounding braces. */
  name: string;
  /** Payload field that supplies the placeholder value. */
  field: Field;
};
