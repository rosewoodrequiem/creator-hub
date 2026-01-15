# Progress

- Track running todos and brief status updates here.
- Update as work is completed to maintain continuity across sessions.
- Add new todos or checkpoints as soon as they arise so the log stays current.

## Todos
- [ ] Add grid snapping for component moves
- [ ] Provide a toggle to disable grid snapping
- [ ] Show proximity guides for alignment while moving components
- [ ] Move layer up/down controls into the minibar or a higher-level toolbar
- [ ] Treat each canvas component as a layer with consistent ordering metadata
- [ ] Add a layer panel to list all components and allow reorder similar to Photoshop
- [ ] Make index controls adjust relative layer position (move above/below, send to front/back)
- [ ] Choose/implement a doubly linked or equivalent structure to persist and mutate layer ordering

## Log
- Added a root lint script and explicit Nx lint target for schedule-maker so linting runs via `pnpm lint` (Nx CLI currently timing out locally).
- Resolved TypeScript/lint errors from drag handling by aligning pointer handler params and recalculating distances without unused refs; `pnpm tsc --noEmit` and `pnpm lint` now pass.
- Fixed drag jitter by using the current optimistic position for offsets and cleaned lint issues (`pnpm lint` now passes).
- Documented coding standards in `agent.md` (enums for fields, arrow components, helper/hooks extraction) and refactored canvas/text components accordingly.
- Added drag-and-drop positioning and layer controls (z-index) for schedule components; text blocks still focus on click with drag via hold.
- (Most recent at top)
