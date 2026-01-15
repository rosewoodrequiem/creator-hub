# Context

## Overview
- Workspace is an Nx monorepo (`@creator-hub/source`) with at least two Vite React apps: `schedule-maker` (primary) and `bingo-maker`. Scripts: `pnpm sm:start` / `bm:start` run `nx serve` for each.
- Deployment scripts use `pnpm build:gh-pages` and `gh-pages -d dist`; there are dev/preview helpers under `tools/gh-pages`.

## Schedule Maker app (focus)
- React + TypeScript + Vite UI for composing weekly schedules and exporting a 1920x1080 PNG via `html-to-image` (export scale defaults to 2, capped at 4; respects `window.devicePixelRatio`).
- UI pieces include `TemplatePicker`, `WeekPicker`, `DayChecklist`, `DayEditor`, undo/redo, hero image upload/clear, and a scaled preview (`ScaledPreview` with `SchedulePreview`). Tailwind utility classes are used in JSX.
- Persisted client-side with Dexie (`ScheduleMakerDB`) + `dexie-relationships`; tables cover schedules, days, components + props, themes, images, global settings, and snapshot history (undo/redo). Default template slug `ElegantBlue` with a gradient-friendly theme; week start defaults to Monday; timezone defaults to browser.
- Image handling: stores hero image and per-day game/background graphics in IndexedDB; `Document.fonts.ready` awaited before export.
- Agent/code style notes: prefer React+TS, DRY/maintainable code, omit semicolons, prefer CSS-in-JS when reasonable, but existing UI uses Tailwind.

## How to keep context updated
- Log new background/decisions here (e.g., feature scope, architectural choices, templates/themes). Keep `progress.md` in sync with active todos and status.
