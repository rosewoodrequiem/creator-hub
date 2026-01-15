# Agent Guidelines

- Prefer React with TypeScript; bootstrap new frontends with Vite.
- Follow solid engineering practices; avoid anti-patterns and unnecessary complexity.
- Keep code DRY, flexible, and maintainable; design for incremental growth without over-engineering.
- Omit semicolons in code style.
- Prefer CSS-in-JS via styled-components, Tailwind, or twin.macro; avoid standalone .css files when reasonable.
- At session start, read `context.md` for background and `progress.md` for running todos/notes; keep `progress.md` updated as work advances.
- Whenever new background or decisions arise, capture them in `context.md`; record task updates and new todos in `progress.md` as you go.
- Prefer enums over string literal unions for shared keys/identifiers (e.g., component fields), and centralize updateable component fields in one place.
- Use arrow functions for React components with typed props (interfaces/React.FC or inline generics); avoid `function Component()` definitions.
- Keep components small/DRY by extracting helpers and hooks (e.g., `*.helpers.ts`, `components/<name>/hooks`).
- Before delivering changes, run `pnpm tsc --noEmit` (or workspace equivalent) to catch TypeScript errors when feasible.
