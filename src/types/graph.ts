/**
 * Knowledge Graph contracts — types for domains, connections, nodes, edges, manifest, and query state.
 * No runtime imports; consumed by schemas, domain modules, components, and routes.
 */

// ---------------------------------------------------------------------------
// Controlled vocabularies
// ---------------------------------------------------------------------------

/** Five approved initial knowledge domains. */
export type KnowledgeDomain =
  | 'engineering'
  | 'artificial-intelligence'
  | 'music'
  | 'reading-literature'
  | 'philosophy-life';

/** Seven approved relationship types. */
export type ConnectionType =
  | 'prerequisite'
  | 'explains'
  | 'extends'
  | 'contrasts'
  | 'applies-to'
  | 'derived-from'
  | 'related';

// ---------------------------------------------------------------------------
// Authored connections (schema boundary)
// ---------------------------------------------------------------------------

/** A single authored connection in content frontmatter. */
export interface ContentConnection {
  readonly type: ConnectionType;
  readonly target: {
    readonly collection: 'articles' | 'notes' | 'projects' | 'series';
    readonly id: string;
  };
  readonly context?: string;
}

// ---------------------------------------------------------------------------
// Resolved connections (domain module output)
// ---------------------------------------------------------------------------

/** Resolved semantic connection with target summary for rendering. */
export interface ResolvedConnection {
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly type: ConnectionType;
  readonly direction: 'outgoing' | 'incoming' | 'symmetric';
  readonly context?: string;
  readonly target: {
    readonly title: string;
    readonly url: string;
    readonly collection: 'articles' | 'notes' | 'projects' | 'series';
  };
}

// ---------------------------------------------------------------------------
// Graph data model
// ---------------------------------------------------------------------------

/** Public graph node — no body, raw frontmatter, draft, or integration metadata. */
export interface GraphNode {
  readonly id: string;
  readonly collection: 'articles' | 'notes' | 'projects' | 'series';
  readonly entryId: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly domains: readonly KnowledgeDomain[];
  readonly tags: readonly string[];
}

/** Deterministic directed edge between two public nodes. */
export interface GraphEdge {
  readonly source: string;
  readonly target: string;
  readonly type: ConnectionType;
  readonly context?: string;
}

/** Deterministic static public manifest — no generated timestamp. */
export interface GraphManifest {
  readonly schemaVersion: number;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

// ---------------------------------------------------------------------------
// Query/UI state
// ---------------------------------------------------------------------------

/** Graph route query state for filters and selection. */
export interface GraphQueryState {
  readonly selectedNode?: string;
  readonly domainFilter?: KnowledgeDomain;
  readonly collectionFilter?: 'articles' | 'notes' | 'projects' | 'series';
  readonly connectionTypeFilter?: ConnectionType;
}
