import { definePlugin } from "@varavel/vdl-plugin-sdk";
import { generatePluginOutput } from "./generate";

/**
 * Canonical VDL plugin entrypoint for Go event generation.
 */
export const generate = definePlugin(generatePluginOutput);
