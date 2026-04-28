import {
  annotation,
  arrayType,
  enumDef,
  enumMember,
  enumType,
  field,
  intLiteral,
  mapType,
  namedType,
  objectType,
  pluginInput,
  primitiveType,
  schema,
  stringLiteral,
  typeDef,
} from "@varavel/vdl-plugin-sdk/testing";
import { describe, expect, it } from "vitest";
import { generate } from "./index";

function createEventAnnotation(subject?: string) {
  return annotation(
    "event",
    subject === undefined ? undefined : stringLiteral(subject),
  );
}

function generateFromSchema(
  options: { package?: string; outFile?: string } = {},
  schemaInput = schema(),
) {
  return generate(
    pluginInput({
      options,
      ir: schemaInput,
    }),
  );
}

function getOnlyGeneratedFile(output: ReturnType<typeof generate>) {
  const files = output.files ?? [];
  expect(files).toHaveLength(1);

  const file = files[0];
  if (!file) {
    throw new Error("expected one generated file");
  }

  return file;
}

describe("generate", () => {
  it("returns no files when the schema has no @event types", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef("User", objectType([field("id", primitiveType("string"))])),
        ],
      }),
    );

    expect(output.errors).toBeUndefined();
    expect(output.files ?? []).toEqual([]);
  });

  it("uses the default Go package when the package option is omitted", () => {
    const output = generateFromSchema(
      {},
      schema({
        types: [
          typeDef(
            "HealthcheckEvent",
            objectType([field("service", primitiveType("string"))]),
            { annotations: [createEventAnnotation("healthcheck.ok")] },
          ),
        ],
      }),
    );

    expect(output.errors).toBeUndefined();

    const file = getOnlyGeneratedFile(output);
    expect(file.content).toContain("package events");
  });

  it("uses events.go as the default output filename", () => {
    const output = generateFromSchema(
      {},
      schema({
        types: [
          typeDef(
            "HealthcheckEvent",
            objectType([field("service", primitiveType("string"))]),
            { annotations: [createEventAnnotation("healthcheck.ok")] },
          ),
        ],
      }),
    );

    const file = getOnlyGeneratedFile(output);
    expect(file.path).toBe("events.go");
  });

  it("uses a custom outFile when it ends with .go", () => {
    const output = generateFromSchema(
      { outFile: "custom-events.go" },
      schema({
        types: [
          typeDef(
            "HealthcheckEvent",
            objectType([field("service", primitiveType("string"))]),
            { annotations: [createEventAnnotation("healthcheck.ok")] },
          ),
        ],
      }),
    );

    const file = getOnlyGeneratedFile(output);
    expect(file.path).toBe("custom-events.go");
  });

  it("falls back to events.go when outFile is blank", () => {
    const output = generateFromSchema(
      { outFile: "   " },
      schema({
        types: [
          typeDef(
            "HealthcheckEvent",
            objectType([field("service", primitiveType("string"))]),
            { annotations: [createEventAnnotation("healthcheck.ok")] },
          ),
        ],
      }),
    );

    const file = getOnlyGeneratedFile(output);
    expect(file.path).toBe("events.go");
  });

  it("generates a single documented Go file for annotated events only", () => {
    const output = generateFromSchema(
      { package: "audit" },
      schema({
        types: [
          typeDef(
            "UserCreatedEvent",
            objectType([
              field("userId", primitiveType("string")),
              field("email", primitiveType("string")),
              field("timestamp", primitiveType("datetime")),
            ]),
            {
              annotations: [
                createEventAnnotation("auth.user_created.{userId}"),
              ],
            },
          ),
          typeDef(
            "IgnoredType",
            objectType([field("value", primitiveType("string"))]),
          ),
        ],
      }),
    );

    expect(output.errors).toBeUndefined();

    const file = getOnlyGeneratedFile(output);
    expect(file.path).toBe("events.go");
    expect(file.content).toContain("package audit");
    expect(file.content).toContain(
      "// VDLEventMetadataItem describes one generated event contract.",
    );
    expect(file.content).toContain(
      "// VDLEventMetadata groups generated event metadata by payload type name.",
    );
    expect(file.content).toContain("type VDLEventMetadataItem struct {");
    expect(file.content).toContain("type VDLEventMetadata struct {");
    expect(file.content).toContain("var VDLEventCatalog = VDLEventMetadata{");
    expect(file.content).toContain("UserCreatedEvent VDLEventMetadataItem");
    expect(file.content).toContain("UserCreatedEvent: VDLEventMetadataItem{");
    expect(file.content).toContain("// Name:");
    expect(file.content).toContain("// Subject:");
    expect(file.content).toContain("//\tUserCreatedEvent");
    expect(file.content).toContain("//\tauth.user_created.{userId}");
    expect(file.content).toContain(
      "// BuildUserCreatedEventSubject builds the routing subject for this event.",
    );
    expect(file.content).not.toContain("type UserCreatedEvent struct {");
    expect(file.content).not.toContain("type IgnoredType struct {");
  });

  it("generates a builder with no parameters when the subject has no placeholders", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef(
            "SystemReadyEvent",
            objectType([field("message", primitiveType("string"))]),
            { annotations: [createEventAnnotation("system.ready")] },
          ),
        ],
      }),
    );

    const file = getOnlyGeneratedFile(output);
    expect(file.content).toContain(
      "func BuildSystemReadyEventSubject() string {",
    );
    expect(file.content).toContain("//\tsystem.ready");
    expect(file.content).toContain('return "system.ready"');
    expect(file.content).not.toContain('"fmt"');
    expect(file.content).not.toContain('"time"');
  });

  it("deduplicates repeated placeholders in the builder signature", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef(
            "TenantAuditEvent",
            objectType([field("tenantId", primitiveType("string"))]),
            {
              annotations: [
                createEventAnnotation(
                  "audit.{tenantId}.users.{tenantId}.created",
                ),
              ],
            },
          ),
        ],
      }),
    );

    const file = getOnlyGeneratedFile(output);
    expect(file.content).toContain(
      "func BuildTenantAuditEventSubject(tenantId string) string {",
    );
    expect(file.content).toContain(
      "//\taudit.{tenantId}.users.{tenantId}.created",
    );
    expect(file.content).toContain(
      'return "audit." + tenantId + ".users." + tenantId + ".created"',
    );
  });

  it("formats placeholders for every supported primitive type", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef(
            "PrimitiveSubjectEvent",
            objectType([
              field("name", primitiveType("string")),
              field("count", primitiveType("int")),
              field("amount", primitiveType("float")),
              field("active", primitiveType("bool")),
              field("occurredAt", primitiveType("datetime")),
            ]),
            {
              annotations: [
                createEventAnnotation(
                  "metrics.{name}.{count}.{amount}.{active}.{occurredAt}",
                ),
              ],
            },
          ),
        ],
      }),
    );

    const file = getOnlyGeneratedFile(output);
    expect(file.content).toContain(`import (
	"fmt"
	"time"
)`);
    expect(file.content).toContain(
      "func BuildPrimitiveSubjectEventSubject(name string, count int64, amount float64, active bool, occurredAt time.Time) string {",
    );
    expect(file.content).toContain(
      'return "metrics." + name + "." + fmt.Sprint(count) + "." + fmt.Sprint(amount) + "." + fmt.Sprint(active) + "." + occurredAt.Format(time.RFC3339Nano)',
    );
  });

  it("supports named primitive placeholder fields while keeping the named Go type", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef("TenantID", primitiveType("string")),
          typeDef(
            "TenantCreatedEvent",
            objectType([
              field("tenantId", namedType("TenantID")),
              field("createdBy", primitiveType("string")),
            ]),
            {
              annotations: [
                createEventAnnotation("tenants.{tenantId}.created"),
              ],
            },
          ),
        ],
      }),
    );

    const file = getOnlyGeneratedFile(output);
    expect(file.content).toContain(
      "func BuildTenantCreatedEventSubject(tenantId string) string {",
    );
    expect(file.content).toContain('return "tenants." + tenantId + ".created"');
  });

  it("does not generate payload structs even when events use complex payload fields", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef(
            "ComplexPayloadEvent",
            objectType([
              field("tenantId", primitiveType("string")),
              field("actorId", primitiveType("int")),
              field("tags", arrayType(primitiveType("string"))),
              field("attributes", arrayType(primitiveType("bool"))),
              field(
                "details",
                objectType([field("ip", primitiveType("string"))]),
              ),
            ]),
            {
              annotations: [
                createEventAnnotation("audit.{tenantId}.payload.created"),
              ],
            },
          ),
        ],
      }),
    );

    const file = getOnlyGeneratedFile(output);
    expect(file.content).toContain(
      "func BuildComplexPayloadEventSubject(tenantId string) string {",
    );
    expect(file.content).not.toContain("type ComplexPayloadEvent struct {");
    expect(file.content).not.toContain("ActorId int64");
    expect(file.content).not.toContain("Details struct {");
  });

  it("returns a diagnostic when @event is used on a non-object type", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef("UserCreatedEvent", primitiveType("string"), {
            annotations: [createEventAnnotation("auth.user_created.{userId}")],
          }),
        ],
      }),
    );

    expect(output.files).toEqual([]);
    expect(output.errors).toHaveLength(1);
    expect(output.errors?.[0]?.message).toContain(
      "@event can only be used on object types",
    );
  });

  it("returns a diagnostic when @event is missing its subject argument", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef(
            "UserCreatedEvent",
            objectType([field("userId", primitiveType("string"))]),
            { annotations: [createEventAnnotation()] },
          ),
        ],
      }),
    );

    expect(output.files).toEqual([]);
    expect(output.errors).toHaveLength(1);
    expect(output.errors?.[0]?.message).toContain(
      "must include a routing subject string",
    );
  });

  it("returns a diagnostic when @event uses a non-string literal argument", () => {
    const output = generate(
      pluginInput({
        options: { package: "events" },
        ir: schema({
          types: [
            typeDef(
              "UserCreatedEvent",
              objectType([field("userId", primitiveType("string"))]),
              { annotations: [annotation("event", intLiteral(42))] },
            ),
          ],
        }),
      }),
    );

    expect(output.files).toEqual([]);
    expect(output.errors).toHaveLength(1);
    expect(output.errors?.[0]?.message).toContain(
      "must use a string literal subject",
    );
  });

  it("returns a diagnostic when outFile does not end with .go", () => {
    const output = generateFromSchema(
      { outFile: "events.txt" },
      schema({
        types: [
          typeDef(
            "HealthcheckEvent",
            objectType([field("service", primitiveType("string"))]),
            { annotations: [createEventAnnotation("healthcheck.ok")] },
          ),
        ],
      }),
    );

    expect(output.files).toEqual([]);
    expect(output.errors).toHaveLength(1);
    expect(output.errors?.[0]?.message).toContain(
      'Invalid outFile "events.txt"',
    );
  });

  it("returns a diagnostic when a placeholder field is missing", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef(
            "UserCreatedEvent",
            objectType([field("userId", primitiveType("string"))]),
            {
              annotations: [
                createEventAnnotation("auth.user_created.{tenantId}"),
              ],
            },
          ),
        ],
      }),
    );

    expect(output.files).toEqual([]);
    expect(output.errors).toHaveLength(1);
    expect(output.errors?.[0]?.message).toContain(
      'Placeholder "tenantId" must match a top-level field',
    );
  });

  it("returns a diagnostic when a placeholder uses a nested path", () => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        types: [
          typeDef(
            "AccountCreatedEvent",
            objectType([
              field("user", objectType([field("id", primitiveType("string"))])),
            ]),
            {
              annotations: [
                createEventAnnotation("accounts.{user.id}.created"),
              ],
            },
          ),
        ],
      }),
    );

    expect(output.files).toEqual([]);
    expect(output.errors).toHaveLength(1);
    expect(output.errors?.[0]?.message).toContain(
      'Placeholder "user.id" must match a top-level field',
    );
  });

  it.each([
    ["array", arrayType(primitiveType("string"))],
    ["map", mapType(primitiveType("string"))],
    ["inline object", objectType([field("id", primitiveType("string"))])],
    ["named object", namedType("User")],
    ["enum", enumType("Status", "string")],
  ])("returns a diagnostic when a placeholder references a non-primitive %s field", (_label, typeRef) => {
    const output = generateFromSchema(
      { package: "events" },
      schema({
        enums: [
          enumDef("Status", "string", [
            enumMember("Pending", stringLiteral("pending")),
          ]),
        ],
        types: [
          typeDef("User", objectType([field("id", primitiveType("string"))])),
          typeDef(
            "InvalidEvent",
            objectType([
              field("subjectPart", typeRef),
              field("ok", primitiveType("string")),
            ]),
            {
              annotations: [
                createEventAnnotation("invalid.{subjectPart}.created"),
              ],
            },
          ),
        ],
      }),
    );

    expect(output.files).toEqual([]);
    expect(output.errors).toHaveLength(1);
    expect(output.errors?.[0]?.message).toContain(
      'Placeholder "subjectPart" must reference a top-level primitive field',
    );
  });
});
