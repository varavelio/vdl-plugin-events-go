<p align="center">
  <img
    src="https://raw.githubusercontent.com/varavelio/vdl/9cb8432f972f986ba91ffa1e4fe82220a8aa373f/assets/png/vdl.png"
    alt="VDL logo"
    width="130"
  />
</p>

<h1 align="center">VDL Plugin Template</h1>

<p align="center">
  Starter template for building a VDL plugin in TypeScript.
</p>

<p align="center">
  <a href="https://varavel.com">
    <img src="https://cdn.jsdelivr.net/gh/varavelio/brand@1.0.0/dist/badges/project.svg" alt="A Varavel project"/>
  </a>
  <a href="https://varavel.com/vdl">
    <img src="https://cdn.jsdelivr.net/gh/varavelio/brand@1.0.0/dist/badges/vdl-plugin.svg" alt="VDL Plugin"/>
  </a>
</p>

## What is included

It includes the VDL plugin SDK, a small code generator, formatting and linting tools, a test setup, an included devcontainer, and a GitHub Actions workflow so you can go from idea to releasable plugin quickly.

- `src/index.ts` with a minimal `definePlugin(...)` entrypoint.
- [`@varavel/vdl-plugin-sdk`](https://github.com/varavelio/vdl-plugin-sdk) for typed plugin input/output, typed VDL IR, option helpers, and the `vdl-plugin` build/check CLI.
- [`@varavel/gen`](https://github.com/varavelio/gen-ts) to make string-based code generation easier.
- TypeScript configuration ready to go based on `@varavel/vdl-plugin-sdk/tsconfig.base.json`.
- `Biome` and `dprint` for linting and formatting.
- `Vitest` for tests.
- A ready-to-use `.devcontainer/` with Node 24, useful CLI tools, and VS Code extensions for VDL, Biome, dprint, and Vitest.
- A GitHub Actions workflow in `.github/workflows/ci.yaml` that runs `npm run ci` on pushes, pull requests, and manual triggers.

## Project layout

- `.devcontainer/` reproducible development environment.
- `.github/workflows/ci.yaml` CI pipeline.
- `biome.json` JavaScript and TypeScript formatting/lint rules.
- `dprint.json` formatting for Markdown, JSON, and YAML.
- `src/index.ts` plugin source.
- `dist/index.js` built plugin bundle consumed by VDL from GitHub releases.

## Getting started

1. Use this repository as a template.
2. Install dependencies:

```bash
npm install
```

3. Implement your plugin in `src/index.ts`.
4. Run `npm run check` while iterating.
5. Run `npm run build` to produce `dist/index.js`.

Your plugin entrypoint receives:

- `input.version` the VDL version.
- `input.options` plugin options from `vdl.config.vdl`.
- `input.ir` the fully prepared VDL IR used to generate files.

Your plugin returns generated `files`, and it can also return `errors` when generation should stop.

## NPM scripts

- `npm run build` bundles `src/index.ts` into `dist/index.js`.
- `npm run check` runs TypeScript type checks for the plugin.
- `npm run format` formats the repository using dprint and Biome.
- `npm run lint` validates formatting and lint rules using dprint and Biome.
- `npm run test` runs the Vitest suite. It is configured to pass even if you have not added tests yet.
- `npm run ci` runs the full verification flow: lint, type-check, test, and build.

## Code generation

This template already includes [`@varavel/gen`](https://www.npmjs.com/package/@varavel/gen).

It is useful when you want to build generated files with predictable indentation and block structure instead of manually concatenating strings.

```ts
import { newGenerator } from "@varavel/gen";

const g = newGenerator();

g.line("export interface User {");
g.block(() => {
  g.line("id: string;");
  g.line("name: string;");
});
g.line("}");

const content = g.toString();
```

If you want real plugin examples, see the official repositories:

- [`varavelio/vdl-plugin-go`](https://github.com/varavelio/vdl-plugin-go)
- [`varavelio/vdl-plugin-ts`](https://github.com/varavelio/vdl-plugin-ts)

## Devcontainer and CI

The included devcontainer installs dependencies on creation and gives you a consistent environment with the expected tooling already configured.

If you want to use it, check the [Dev Containers documentation](https://code.visualstudio.com/docs/devcontainers/containers). You need Docker and VS Code (or fork like cursor, antigravity, etc), and using them is strongly recommended because they remove most local setup friction and make the development workflow much easier.

The GitHub workflow uses the devcontainer in CI as well (without you having to do anything extra), so local development and CI stay aligned.

## Releasing and deployment

VDL plugins do not need to be published to npm.

Release flow:

1. Build your plugin with `npm run build`.
2. Commit your source code and the generated `dist/index.js` file.
3. Create a GitHub release with a tag such as `v0.1.0` after `dist/index.js` is already committed.
4. That is enough for VDL users to consume the plugin from GitHub.

This template intentionally keeps `dist/` out of `.gitignore` because `dist/index.js` is part of the distributable plugin.

Example plugin reference in VDL config (`vdl.config.vdl`):

```vdl
const config = {
  version 1
  plugins [
    {
      src "varavelio/vdl-plugin-go@v0.1.0" // GitHub username/repo@version
      schema "./schema.vdl"
      outDir "./gen/go"
      options {
        // Additional options for the plugin can be specified here
      }
    }
  ]
}
```

## License note

Using MIT for your plugin is not mandatory, but it is strongly appreciated. A permissive license makes it easier for more people to adopt, study, improve, and contribute back to the ecosystem, which helps everyone benefit from better VDL plugins.

## License

This plugin is released under the MIT License. See [LICENSE](LICENSE).
