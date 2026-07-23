Atlas v0.6.0

# ADR 0001: Public Personal Knowledge Garden and Knowledge Graph

- **Status:** Approved
- **Date:** 2026-07-21
- **Decision owners:** Product owner and Principal Software Architect
- **Affected documents:** `01_Architecture.md` through `09_DeploymentGuide.md`

## Context

The original product began as an engineering resume and portfolio. During architecture work, it evolved into a public knowledge platform. The desired scope now includes professional knowledge such as test automation and artificial intelligence together with music, reading and literature, and philosophy and life knowledge.

The product must remain public, static, content-first, accessible, and deployable through GitHub Pages. Obsidian and NotebookLM may be useful later, but neither is required for the initial implementation. The public repository remains the canonical source for published content.

The existing tags, series, and related-content model supports browsing but does not express semantic knowledge relationships such as prerequisite, explanation, extension, contrast, or application. A public Knowledge Graph is required as an additional discovery layer.

## Decision

### Product identity

The product is a **Public Personal Knowledge Garden + Living Portfolio**, with a **Knowledge Graph as a public discovery layer**.

It is not a private second-brain application. It publishes reviewed knowledge and portfolio content from a public canonical repository.

### Content collections

Keep exactly four collections:

- `articles`
- `notes`
- `projects`
- `series`

Every published entry is a graph node. No graph-node collection is added.

### Controlled domains

Every published entry declares one or more controlled domains from typed configuration. The initial values are:

- `engineering`
- `artificial-intelligence`
- `music`
- `reading-literature`
- `philosophy-life`

Domains are broad navigation and graph-filter dimensions. They are not graph nodes or a fifth collection. New domains require content-model review and configuration validation.

### Typed connections

Every collection may declare optional typed connections to stable content references. The approved relationship types are:

- `prerequisite`
- `explains`
- `extends`
- `contrasts`
- `applies-to`
- `derived-from`
- `related`

A connection contains target collection, target entry ID, relationship type, and optional concise editorial context.

Directed relationships preserve source-to-target meaning. `related` is semantically symmetric: authors record it once, the graph resolver exposes both traversal directions, and reverse duplicate declarations fail validation. `prerequisite` edges must form an acyclic graph. All connections reject missing, draft-only, self, type-invalid, and duplicate targets.

Tags remain a flat detailed taxonomy. Domains provide broad grouping. Connections provide explicit semantic edges. Series provides canonical ordered learning paths. These concepts are not interchangeable.

### Stable graph model

Graph node IDs use `<collection>:<entry-id>`. The build-time graph domain produces deterministic nodes and edges from production-visible content only. It emits a static graph manifest without generated timestamps or environment-dependent ordering.

The manifest contains only public normalized data required for discovery: stable node ID, collection, entry ID, title, description, URL, domains, tags, and deterministic typed edges with optional context.

### Public graph experience

Add:

- `/graph/` as the canonical graph discovery page.
- `/graph/graph.json` as the static build-time graph manifest endpoint.
- Entry-local semantic connection discovery through an accessible connection list and a link to the selected graph neighborhood.
- Shareable graph state using query parameters such as selected node and filters. Query variants canonicalize to `/graph/`.

The default experience is a selected-node neighborhood rather than an unbounded all-node hairball. Users can search and filter by domain, collection, and relationship type.

The visual graph is progressive enhancement. A semantic list, textual node details, keyboard controls, and direct content links remain available without the visual renderer. The graph does not replace menu navigation, topics, Pagefind, series, or related content.

### Browser implementation

Use Cytoscape.js as the approved graph-layout and visualization engine. It is not a UI framework. It is lazy-loaded only by the graph browser controller on `/graph/`.

No React integration or additional client framework is introduced. Graph browser code must not import Astro content collections or build-time modules.

### Living Portfolio

Projects may represent professional or creative work. Replace the engineering-only required `technologies` concept with:

- required `skills`: capabilities demonstrated by the project;
- optional `tools`: technologies, instruments, platforms, or materials used.

Repository and live URLs remain optional. Existing project facts and summaries use the broader skills/tools terminology.

### Future Obsidian boundary

Obsidian is not implemented. A future one-way publishing adapter may transform selected vault content into the canonical public model before normal validation:

- permanent notes to `notes`;
- essays to `articles`;
- case studies to `projects`;
- maps of content to `series`;
- reviewed wikilinks to typed connections;
- reviewed vault tags to canonical domains/tags.

No Obsidian-specific identifier or syntax is added to the public schema. The whole vault is never implicitly published or synchronized bidirectionally.

### Future NotebookLM boundary

NotebookLM is not implemented and is never the canonical source. A future export may provide selected public URLs, RSS, Markdown, or a generated knowledge package after content validation. Generated AI output must return through normal editorial review before publication.

## Consequences

### Positive

- The public site supports broad personal knowledge while retaining a strong professional portfolio.
- Semantic discovery becomes explicit and deterministic.
- The content model remains portable and future adapters remain replaceable.
- Graph integrity can fail early at build time.
- The graph remains compatible with static GitHub Pages hosting.

### Costs and risks

- Content authors must curate domains and semantic connections.
- Cytoscape.js adds a browser dependency and graph-specific performance/accessibility risk.
- Manifest size and visual complexity grow with the corpus.
- Relationship semantics require governance to prevent noisy or misleading edges.
- Broadening project metadata requires updating all project contracts before implementation.

## Rejected alternatives

### Make Obsidian the canonical repository now

Rejected because it introduces private/public synchronization, plugin syntax, and accidental publication risks before a concrete integration need exists.

### Make NotebookLM the content database

Rejected because NotebookLM is a synthesis tool, not a versioned canonical content store or deterministic build dependency.

### Add a fifth graph-node collection

Rejected because every existing content entry is already a valid node and a separate collection would duplicate identity and metadata.

### Derive all graph edges from shared tags

Rejected because tag similarity does not express prerequisite, explanation, contrast, application, or provenance and would create a noisy graph.

### Hand-roll graph layout

Rejected because graph layout and interaction are established specialized problems. Cytoscape.js is the approved focused engine.

### Replace normal navigation with the graph

Rejected because graph visualization is not a sufficient accessible, predictable, or no-JavaScript navigation model.

## Implementation sequence

Keep M0 through M13:

1. M1: graph/domain shared types and controlled domain configuration.
2. M3: `domains` and `connections` schema contracts and fixtures.
3. M4: graph resolution, validation, prerequisite-cycle detection, and deterministic manifest construction.
4. M5-M7: semantic connection and graph presentation components.
5. M9: `/graph/` and `/graph/graph.json` static routes.
6. M10: Cytoscape.js, lazy graph controller, graph artifact verification, and caching checks.
7. M11-M13: full graph accessibility, performance, regression, deployment, and production validation.

## Compliance

This decision is implemented only when all numbered documents are synchronized and cross-validation confirms:

- exactly four content collections;
- controlled domains and approved typed connections;
- no invalid or cyclic prerequisite edges;
- complete graph registry and milestone assignment;
- accessible static fallback;
- graph-only lazy browser dependency;
- deterministic manifest and artifact parity;
- no Obsidian or NotebookLM runtime/integration code.
