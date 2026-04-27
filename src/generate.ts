import type { PluginInput, PluginOutput } from "@varavel/vdl-plugin-sdk";
import { getOptionString } from "@varavel/vdl-plugin-sdk/utils/options";
import { collectEventModels } from "./events/collect-event-models";
import { renderGoFile } from "./go/render-go-file";

/**
 * Generates the plugin output for the VDL Go events plugin.
 */
export function generatePluginOutput(input: PluginInput): PluginOutput {
  const packageName = getOptionString(input.options, "package", "events");
  const events = collectEventModels(input.ir.types);

  if (events.length === 0) {
    return { files: [] };
  }

  return {
    files: [
      {
        path: "events.gen.go",
        content: renderGoFile(packageName, events, input.ir.types),
      },
    ],
  };
}
