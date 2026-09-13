# Tab grid architecture

The tab grid is split by responsibility:

- `model/registry.ts` is the source of truth for component metadata, supported sizes, physical grid dimensions and capabilities.
- `model/factory.ts` creates complete component records with shared defaults.
- `model/validation.ts` validates persisted and imported component records without rewriting them.
- `collection/` contains list, header, scrolling and expansion primitives shared by folders and todos.
- `shared/` contains visual surfaces shared by multiple component kinds.
- Root-level component files render or edit a specific component kind and coordinate drag-and-drop.

When adding a component kind, define its persisted type first, then register its sizes and capabilities. Creation, validation and rendering should consume that registration. A legacy size may remain in `sizes` so stored data can render safely while being omitted from `menuSizes`, `editorSizes` or `catalogSizes` to keep it out of new user flows.
