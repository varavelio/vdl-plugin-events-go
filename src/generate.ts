import {
  assert,
  type PluginInput,
  type PluginOutput,
} from "@varavel/vdl-plugin-sdk";
import { getOptionString } from "@varavel/vdl-plugin-sdk/utils/options";
import { collectEventModels } from "./events/collect-event-models";
import { renderGoFile } from "./go/render-go-file";

const defaultOutFile = "events.go";

/**
 * Resolves the output filename for the generated Go event file.
 */
function resolveOutFile(input: PluginInput): string {
  const outFile = getOptionString(input.options, "outFile", defaultOutFile);
  const trimmedOutFile = outFile.trim();
  const finalOutFile =
    trimmedOutFile.length > 0 ? trimmedOutFile : defaultOutFile;

  assert(
    finalOutFile.endsWith(".go"),
    `Invalid outFile "${finalOutFile}". The output file must end with .go`,
  );

  return finalOutFile;
}

/**
 * Generates the plugin output for the VDL Go events plugin.
 */
export function generatePluginOutput(input: PluginInput): PluginOutput {
  const packageName = getOptionString(input.options, "package", "events");
  const outFile = resolveOutFile(input);
  const events = collectEventModels(input.ir.types);

  if (events.length === 0) {
    return { files: [] };
  }

  return {
    files: [
      {
        path: outFile,
        content: renderGoFile(packageName, events, input.ir.types),
      },
    ],
  };
}
