var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  generate: () => generate
});
module.exports = __toCommonJS(index_exports);

// node_modules/@varavel/vdl-plugin-sdk/dist/core/errors.js
var _a;
var PluginError = (_a = class extends Error {
  constructor(message, position) {
    super(message);
    this.name = "PluginError";
    this.position = position;
  }
}, __name(_a, "PluginError"), _a);
function fail(message, position) {
  throw new PluginError(message, position);
}
__name(fail, "fail");
function assert(condition, message, position) {
  if (!condition) throw new PluginError(message, position);
}
__name(assert, "assert");

// node_modules/@varavel/vdl-plugin-sdk/dist/core/define-plugin.js
function definePlugin(handler) {
  return (input) => {
    try {
      return handler(input);
    } catch (error) {
      return {
        files: [],
        errors: [toPluginError(error)]
      };
    }
  };
}
__name(definePlugin, "definePlugin");
function toPluginError(error) {
  if (error instanceof PluginError) return {
    message: error.message,
    position: error.position
  };
  if (error instanceof Error) return { message: error.message };
  return { message: "An unknown generation error occurred." };
}
__name(toPluginError, "toPluginError");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/options/get-option-string.js
function getOptionString(options, key, defaultValue) {
  const value = options === null || options === void 0 ? void 0 : options[key];
  return value === void 0 ? defaultValue : value;
}
__name(getOptionString, "getOptionString");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/get-annotation.js
function getAnnotation(annotations, name) {
  if (!annotations) return void 0;
  return annotations.find((anno) => anno.name === name);
}
__name(getAnnotation, "getAnnotation");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/unwrap-literal.js
function unwrapLiteral(value) {
  return unwrapLiteralValue(value);
}
__name(unwrapLiteral, "unwrapLiteral");
function unwrapLiteralValue(value) {
  switch (value.kind) {
    case "string":
      return value.stringValue;
    case "int":
      return value.intValue;
    case "float":
      return value.floatValue;
    case "bool":
      return value.boolValue;
    case "object": {
      var _value$objectEntries;
      const resolvedObject = {};
      const entries = (_value$objectEntries = value.objectEntries) !== null && _value$objectEntries !== void 0 ? _value$objectEntries : [];
      for (const entry of entries) resolvedObject[entry.key] = unwrapLiteralValue(entry.value);
      return resolvedObject;
    }
    case "array":
      var _value$arrayItems;
      return ((_value$arrayItems = value.arrayItems) !== null && _value$arrayItems !== void 0 ? _value$arrayItems : []).map((item) => unwrapLiteralValue(item));
    default:
      return null;
  }
}
__name(unwrapLiteralValue, "unwrapLiteralValue");

// src/types/type-resolver.ts
function resolveType(typeRef, allTypes) {
  if (typeRef.kind !== "type") {
    return typeRef;
  }
  const typeDef = allTypes.find(
    (candidate) => candidate.name === typeRef.typeName
  );
  if (!typeDef) {
    return typeRef;
  }
  return resolveType(typeDef.typeRef, allTypes);
}
__name(resolveType, "resolveType");
function isPrimitiveSubjectType(typeRef, allTypes) {
  return resolveType(typeRef, allTypes).kind === "primitive";
}
__name(isPrimitiveSubjectType, "isPrimitiveSubjectType");

// src/events/placeholders.ts
var eventPlaceholderPattern = /\{([^{}]+)\}/g;
function extractPlaceholderNames(subject) {
  return listPlaceholderMatches(subject).map((match) => {
    var _a2;
    return (_a2 = match[1]) != null ? _a2 : "";
  });
}
__name(extractPlaceholderNames, "extractPlaceholderNames");
function listPlaceholderMatches(subject) {
  const matches = [];
  const pattern = new RegExp(eventPlaceholderPattern.source, "g");
  let match = pattern.exec(subject);
  while (match) {
    matches.push(match);
    match = pattern.exec(subject);
  }
  return matches;
}
__name(listPlaceholderMatches, "listPlaceholderMatches");

// src/events/collect-event-models.ts
function collectEventModels(typeDefs) {
  return typeDefs.map((typeDef) => toEventModel(typeDef, typeDefs)).filter((event) => event !== null);
}
__name(collectEventModels, "collectEventModels");
function toEventModel(typeDef, allTypes) {
  var _a2;
  const eventAnnotation = getAnnotation(typeDef.annotations, "event");
  if (!eventAnnotation) {
    return null;
  }
  if (typeDef.typeRef.kind !== "object") {
    fail(
      `@event can only be used on object types, but "${typeDef.name}" is ${typeDef.typeRef.kind}.`,
      typeDef.position
    );
  }
  if (!eventAnnotation.argument) {
    fail(
      `@event on "${typeDef.name}" must include a routing subject string.`,
      eventAnnotation.position
    );
  }
  const subject = unwrapLiteral(eventAnnotation.argument);
  if (typeof subject !== "string") {
    fail(
      `@event on "${typeDef.name}" must use a string literal subject.`,
      eventAnnotation.position
    );
  }
  const fields = (_a2 = typeDef.typeRef.objectFields) != null ? _a2 : [];
  const fieldsByName = new Map(fields.map((field) => [field.name, field]));
  const placeholders = extractPlaceholderNames(subject).map(
    (placeholderName) => {
      const field = fieldsByName.get(placeholderName);
      if (!field) {
        fail(
          `Placeholder "${placeholderName}" must match a top-level field on "${typeDef.name}".`,
          eventAnnotation.position
        );
      }
      if (!isPrimitiveSubjectType(field.typeRef, allTypes)) {
        fail(
          `Placeholder "${placeholderName}" must reference a top-level primitive field on "${typeDef.name}".`,
          field.position
        );
      }
      return { name: placeholderName, field };
    }
  );
  return {
    name: typeDef.name,
    subject,
    placeholders
  };
}
__name(toEventModel, "toEventModel");

// src/go/render-go-type.ts
function renderGoType(typeRef, optional, allTypes) {
  const rendered = renderRequiredGoType(resolveType(typeRef, allTypes));
  return optional ? `*${rendered}` : rendered;
}
__name(renderGoType, "renderGoType");
function typeUsesTime(typeRef, allTypes) {
  const resolved = resolveType(typeRef, allTypes);
  return resolved.kind === "primitive" && resolved.primitiveName === "datetime";
}
__name(typeUsesTime, "typeUsesTime");
function typeNeedsFmtSprint(typeRef, allTypes) {
  const resolved = resolveType(typeRef, allTypes);
  return !(resolved.kind === "primitive" && (resolved.primitiveName === "string" || resolved.primitiveName === "datetime"));
}
__name(typeNeedsFmtSprint, "typeNeedsFmtSprint");
function renderSubjectValue(field, allTypes) {
  const resolved = resolveType(field.typeRef, allTypes);
  if (resolved.kind === "primitive" && resolved.primitiveName === "string") {
    return field.name;
  }
  if (resolved.kind === "primitive" && resolved.primitiveName === "datetime") {
    return `${field.name}.Format(time.RFC3339Nano)`;
  }
  return `fmt.Sprint(${field.name})`;
}
__name(renderSubjectValue, "renderSubjectValue");
function renderRequiredGoType(typeRef) {
  var _a2;
  switch (typeRef.kind) {
    case "primitive":
      return primitiveToGoType((_a2 = typeRef.primitiveName) != null ? _a2 : "string");
    default:
      throw new Error(
        `Only primitive placeholders are supported, got: ${typeRef.kind}`
      );
  }
}
__name(renderRequiredGoType, "renderRequiredGoType");
function primitiveToGoType(name) {
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
__name(primitiveToGoType, "primitiveToGoType");

// src/go/render-go-file.ts
function renderGoFile(packageName, events, allTypes) {
  const lines = [`package ${packageName}`, ""];
  const imports = collectImports(events, allTypes);
  if (imports.length > 0) {
    lines.push("import (");
    for (const importPath of imports) {
      lines.push(`	${importPath}`);
    }
    lines.push(")", "");
  }
  lines.push(...renderCatalog(events, allTypes), "");
  for (const [index, event] of events.entries()) {
    lines.push(...renderSubjectBuilder(event, allTypes));
    if (index < events.length - 1) {
      lines.push("");
    }
  }
  return `${lines.join("\n")}
`;
}
__name(renderGoFile, "renderGoFile");
function collectImports(events, allTypes) {
  const imports = [];
  const needsFmt = events.some(
    (event) => event.placeholders.some(
      (placeholder) => typeNeedsFmtSprint(placeholder.field.typeRef, allTypes)
    )
  );
  const needsTime = events.some(
    (event) => event.placeholders.some(
      (placeholder) => typeUsesTime(placeholder.field.typeRef, allTypes)
    )
  );
  if (needsFmt) {
    imports.push('"fmt"');
  }
  if (needsTime) {
    imports.push('"time"');
  }
  return imports;
}
__name(collectImports, "collectImports");
function renderCatalog(events, allTypes) {
  const lines = [
    "// VDLEventCatalogMeta groups generated event metadata by payload type name.",
    "type VDLEventCatalogMeta struct {"
  ];
  for (const event of events) {
    const params = renderSubjectParams(event, allTypes);
    lines.push(`	${event.name} struct {`);
    lines.push("		Name string");
    lines.push("		SubjectTemplate string");
    lines.push(`		BuildSubject func(${params}) string`);
    lines.push("	}");
  }
  lines.push(
    "}",
    "",
    "// VDLEventCatalog indexes generated events by payload type name.",
    "var VDLEventCatalog = VDLEventCatalogMeta{"
  );
  for (const event of events) {
    const params = renderSubjectParams(event, allTypes);
    lines.push(`	${event.name}: struct {`);
    lines.push("		// Name is the name of this event.");
    lines.push("		//");
    lines.push(`		//	// Name:    ${event.name}`);
    lines.push(`		//	// Subject: ${event.subject}`);
    lines.push("		Name string");
    lines.push(
      "		// SubjectTemplate is the subject template for this event."
    );
    lines.push("		//");
    lines.push(`		//	// Name:    ${event.name}`);
    lines.push(`		//	// Subject: ${event.subject}`);
    lines.push("		SubjectTemplate string");
    lines.push("		// BuildSubject builds the subject for this event.");
    lines.push("		//");
    lines.push(`		//	// Name:    ${event.name}`);
    lines.push(`		//	// Subject: ${event.subject}`);
    lines.push(`		BuildSubject func(${params}) string`);
    lines.push("	}{");
    lines.push(`		Name: "${event.name}",`);
    lines.push(`		SubjectTemplate: "${event.subject}",`);
    lines.push(`		BuildSubject: build${event.name}Subject,`);
    lines.push("	},");
  }
  lines.push("}");
  return lines;
}
__name(renderCatalog, "renderCatalog");
function renderSubjectBuilder(event, allTypes) {
  const params = renderSubjectParams(event, allTypes);
  return [
    `func build${event.name}Subject(${params}) string {`,
    `	return ${renderSubjectParts(event, allTypes).join(" + ")}`,
    "}"
  ];
}
__name(renderSubjectBuilder, "renderSubjectBuilder");
function renderSubjectParams(event, allTypes) {
  return uniquePlaceholders(event.placeholders).map((placeholder) => {
    return `${placeholder.name} ${renderGoType(placeholder.field.typeRef, placeholder.field.optional, allTypes)}`;
  }).join(", ");
}
__name(renderSubjectParams, "renderSubjectParams");
function renderSubjectParts(event, allTypes) {
  var _a2, _b, _c;
  const parts = [];
  const placeholdersByName = new Map(
    event.placeholders.map((placeholder) => [placeholder.name, placeholder])
  );
  let cursor = 0;
  for (const match of listPlaceholderMatches(event.subject)) {
    const start = (_a2 = match.index) != null ? _a2 : 0;
    const raw = (_b = match[0]) != null ? _b : "";
    const placeholderName = (_c = match[1]) != null ? _c : "";
    const literal = event.subject.slice(cursor, start);
    if (literal.length > 0) {
      parts.push(JSON.stringify(literal));
    }
    const placeholder = placeholdersByName.get(placeholderName);
    if (!placeholder) {
      throw new Error(`Missing placeholder model for ${placeholderName}`);
    }
    parts.push(renderSubjectValue(placeholder.field, allTypes));
    cursor = start + raw.length;
  }
  const tail = event.subject.slice(cursor);
  if (tail.length > 0) {
    parts.push(JSON.stringify(tail));
  }
  return parts.length === 0 ? ['""'] : parts;
}
__name(renderSubjectParts, "renderSubjectParts");
function uniquePlaceholders(placeholders) {
  const seen = /* @__PURE__ */ new Set();
  return placeholders.filter((placeholder) => {
    if (seen.has(placeholder.name)) {
      return false;
    }
    seen.add(placeholder.name);
    return true;
  });
}
__name(uniquePlaceholders, "uniquePlaceholders");

// src/generate.ts
var defaultOutFile = "events.go";
function resolveOutFile(input) {
  const outFile = getOptionString(input.options, "outFile", defaultOutFile);
  const trimmedOutFile = outFile.trim();
  const finalOutFile = trimmedOutFile.length > 0 ? trimmedOutFile : defaultOutFile;
  assert(
    finalOutFile.endsWith(".go"),
    `Invalid outFile "${finalOutFile}". The output file must end with .go`
  );
  return finalOutFile;
}
__name(resolveOutFile, "resolveOutFile");
function generatePluginOutput(input) {
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
        content: renderGoFile(packageName, events, input.ir.types)
      }
    ]
  };
}
__name(generatePluginOutput, "generatePluginOutput");

// src/index.ts
var generate = definePlugin(generatePluginOutput);
