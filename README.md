<p align="center">
  <img
    src="https://raw.githubusercontent.com/varavelio/vdl/9cb8432f972f986ba91ffa1e4fe82220a8aa373f/assets/png/vdl.png"
    alt="VDL logo"
    width="130"
  />
</p>

<h1 align="center">VDL Go Events Plugin</h1>

<p align="center">
  Generate Go <strong>subject builders</strong> and a centralized <strong>event catalog</strong> from VDL <code>@event</code> types.
</p>

<p align="center">
  <a href="https://varavel.com">
    <img src="https://cdn.jsdelivr.net/gh/varavelio/brand@1.0.0/dist/badges/project.svg" alt="A Varavel project"/>
  </a>
  <a href="https://varavel.com/vdl">
    <img src="https://cdn.jsdelivr.net/gh/varavelio/brand@1.0.0/dist/badges/vdl-plugin.svg" alt="VDL Plugin"/>
  </a>
</p>

This plugin is event-focused.

It only generates code for types annotated with `@event`. Unannotated types are ignored.

It does **not** generate Go payload models (types/enums/constants). Payload contracts are delegated to [`varavelio/vdl-plugin-go`](https://github.com/varavelio/vdl-plugin-go).

Use it when you want to:

- generate strongly typed subject builders for event routing keys
- build routing subjects from validated placeholder fields
- keep event routing metadata synchronized from one VDL source of truth
- expose a small runtime event catalog for dispatching or introspection

## Quick Start

1. Generate your Go payload types with `varavelio/vdl-plugin-go`.
2. Add this plugin to your `vdl.config.vdl` for event routing artifacts:

```vdl
const config = {
  version 1
  plugins [
    {
      src "varavelio/vdl-plugin-go@v0.1.2"
      schema "./schema.vdl"
      outDir "./events"
      options {
        package "events"
      }
    }
    {
      src "varavelio/vdl-plugin-events-go@v0.1.1"
      schema "./schema.vdl"
      outDir "./events"
      options {
        package "events"
      }
    }
  ]
}
```

3. Run your normal VDL generation command:

```bash
vdl generate
```

4. Check the generated output in `./events`:

## Plugin Options

All options are optional.

| Option    | Type     | Default       | What it changes                                                               |
| --------- | -------- | ------------- | ----------------------------------------------------------------------------- |
| `package` | `string` | `"events"`    | Sets the Go package name used in the generated file.                          |
| `outFile` | `string` | `"events.go"` | Sets the generated Go filename inside `outDir`. The file must end with `.go`. |

Example with all options:

```vdl
const config = {
  version 1
  plugins [
    {
      src "varavelio/vdl-plugin-events-go@v0.1.1"
      schema "./schema.vdl"
      outDir "./gen"
      options {
        package "audit"
        outFile "audit_events.go"
      }
    }
  ]
}
```

## Event Annotation Model

This plugin follows the VDL `@event` specification:

- Spec: https://github.com/varavelio/vdl/blob/c1b8080201d87a329c0d307ead963d6e2659e5b7/docs/reference/events.md

Core rules enforced by this plugin:

- `@event("subject.template")` must be attached to a top-level object type
- placeholders use `{fieldName}` syntax
- placeholders must match top-level payload fields exactly
- placeholders must point to top-level primitive fields only

Example:

```vdl
@event("auth.user_created.{userId}")
type UserCreatedEvent {
  userId string
  email string
  createdAt datetime
}
```

## What You Get

For each annotated event, the plugin generates:

- a `Build<TypeName>Subject(...)` helper
- event documentation comments in idiomatic Go style

It also generates shared runtime metadata:

- `VDLEventMetadataItem`
- `VDLEventMetadata`
- `VDLEventCatalog`

All generated events are consolidated into a single Go file.

## Generated Go Shape

Given this schema:

```vdl
@event("auth.user_created.{userId}")
type UserCreatedEvent {
  userId string
  email string
  createdAt datetime
}
```

The generated Go output is conceptually similar to:

```go
// BuildUserCreatedEventSubject builds the routing subject for UserCreatedEvent.
func BuildUserCreatedEventSubject(userId string) string {
    return "auth.user_created." + userId
}
```

## Type Mapping

| VDL        | Go output   |
| ---------- | ----------- |
| `string`   | `string`    |
| `int`      | `int64`     |
| `float`    | `float64`   |
| `bool`     | `bool`      |
| `datetime` | `time.Time` |

Named placeholder field types are resolved to their underlying VDL primitive type when generating builder function parameters.

## Subject Builder Behavior

- String placeholders are concatenated directly.
- Non-string primitive placeholders are converted using `fmt.Sprint(...)`.
- `datetime` placeholders are formatted with `time.RFC3339Nano`.
- Repeated placeholders are accepted and only appear once in the builder signature.
- Static subjects without placeholders generate zero-argument builders.

## Validation Behavior

Generation fails with structured plugin diagnostics when:

- `@event` is used on a non-object type
- `@event` is missing its string subject argument
- a subject placeholder references a missing field
- a subject placeholder references a non-primitive field
- `outFile` does not end with `.go`

## Notes

- If the schema contains no valid `@event` types, the plugin emits no files.
- The plugin only generates subject builders and event inventory metadata.
- The plugin does not generate generic Go models, enums, constants, or event payload structs.
- Generate payload contracts with [`varavelio/vdl-plugin-go`](https://github.com/varavelio/vdl-plugin-go).
- This plugin is intended specifically for the VDL event specification, not full Go model generation.

## License

This plugin is released under the MIT License. See [LICENSE](LICENSE).
