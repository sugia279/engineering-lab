/**
 * Graph domain: resolve connections, detect prerequisite cycles,
 * derive per-entry neighborhoods, and build the deterministic public manifest.
 * No presentation or browser imports.
 */

import type { GraphManifest, GraphNode, GraphEdge, ResolvedConnection, KnowledgeDomain, ConnectionType } from '../../types/graph';
import type { AnyEntry } from './queries';
import { entryUrl } from '../../utils/url';
import { DOMAIN_SLUGS } from '../../config/domains';

export interface GraphValidationError {
  readonly source: string;
  readonly field: string;
  readonly target?: string;
  readonly reason: string;
}

// ---------------------------------------------------------------------------
// Node ID helpers
// ---------------------------------------------------------------------------

export function graphNodeId(entry: AnyEntry): string {
  return `${entry.collection}:${entry.id}`;
}

function nodeIdFromParts(collection: string, id: string): string {
  return `${collection}:${id}`;
}

// ---------------------------------------------------------------------------
// Node construction
// ---------------------------------------------------------------------------

export function buildGraphNode(entry: AnyEntry): GraphNode {
  return {
    id: graphNodeId(entry),
    collection: entry.collection,
    entryId: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    url: entryUrl(entry.collection, entry.id),
    domains: entry.data.domains as KnowledgeDomain[],
    tags: entry.data.tags,
  };
}

// ---------------------------------------------------------------------------
// Connection validation
// ---------------------------------------------------------------------------

/** Validate all authored connections across all entries. */
export function validateGraphConnections(
  entries: AnyEntry[],
): GraphValidationError[] {
  const errors: GraphValidationError[] = [];
  const publishedIds = new Set(entries.map((e) => graphNodeId(e)));

  for (const entry of entries) {
    const nodeId = graphNodeId(entry);
    const connections = entry.data.connections ?? [];

    // Validate domains
    for (const domain of entry.data.domains) {
      if (!DOMAIN_SLUGS.includes(domain as KnowledgeDomain)) {
        errors.push({ source: nodeId, field: 'domains', reason: `Unknown domain: ${domain}` });
      }
    }

    const seenEdges = new Set<string>();

    for (const conn of connections) {
      const targetId = nodeIdFromParts(conn.target.collection, conn.target.id);
      const edgeKey = `${conn.type}:${targetId}`;

      // Duplicate edge
      if (seenEdges.has(edgeKey)) {
        errors.push({ source: nodeId, field: 'connections', target: targetId, reason: 'Duplicate connection' });
        continue;
      }
      seenEdges.add(edgeKey);

      // Self-reference
      if (targetId === nodeId) {
        errors.push({ source: nodeId, field: 'connections', target: targetId, reason: 'Self-reference' });
        continue;
      }

      // Missing/draft target
      if (!publishedIds.has(targetId)) {
        errors.push({ source: nodeId, field: 'connections', target: targetId, reason: 'Target not found in published entries' });
        continue;
      }
    }
  }

  // Validate symmetric related: reject reverse duplicates
  const relatedPairs = new Set<string>();
  for (const entry of entries) {
    const nodeId = graphNodeId(entry);
    for (const conn of (entry.data.connections ?? [])) {
      if (conn.type === 'related') {
        const targetId = nodeIdFromParts(conn.target.collection, conn.target.id);
        const reverseKey = `${targetId}→${nodeId}`;
        if (relatedPairs.has(reverseKey)) {
          errors.push({
            source: nodeId,
            field: 'connections',
            target: targetId,
            reason: 'Reverse-duplicate related edge — author one direction only',
          });
        }
        relatedPairs.add(`${nodeId}→${targetId}`);
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Prerequisite cycle detection (DFS)
// ---------------------------------------------------------------------------

/** Detect prerequisite cycles. Returns arrays of node IDs forming each cycle. */
export function detectPrerequisiteCycles(entries: AnyEntry[]): string[][] {
  // Build adjacency list for prerequisite edges only
  const adj = new Map<string, string[]>();
  for (const entry of entries) {
    const nodeId = graphNodeId(entry);
    adj.set(nodeId, []);
  }
  for (const entry of entries) {
    const nodeId = graphNodeId(entry);
    for (const conn of (entry.data.connections ?? [])) {
      if (conn.type === 'prerequisite') {
        const targetId = nodeIdFromParts(conn.target.collection, conn.target.id);
        const neighbors = adj.get(nodeId);
        if (neighbors) neighbors.push(targetId);
      }
    }
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]): void {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push([...path.slice(cycleStart), node]);
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    for (const neighbor of (adj.get(node) ?? [])) {
      dfs(neighbor, path);
    }

    path.pop();
    inStack.delete(node);
  }

  for (const nodeId of adj.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  }

  return cycles;
}

// ---------------------------------------------------------------------------
// Resolved connections (per-entry neighborhoods)
// ---------------------------------------------------------------------------

/** Resolve all connections for a single entry including symmetric related. */
export function resolveEntryConnections(
  entry: AnyEntry,
  allEntries: AnyEntry[],
): ResolvedConnection[] {
  const nodeId = graphNodeId(entry);
  const entryMap = new Map(allEntries.map((e) => [graphNodeId(e), e]));
  const connections: ResolvedConnection[] = [];

  // Outgoing connections
  for (const conn of (entry.data.connections ?? [])) {
    const targetId = nodeIdFromParts(conn.target.collection, conn.target.id);
    const target = entryMap.get(targetId);
    if (!target) continue;

    const direction: 'outgoing' | 'symmetric' =
      conn.type === 'related' ? 'symmetric' : 'outgoing';

    connections.push({
      sourceNodeId: nodeId,
      targetNodeId: targetId,
      type: conn.type as ConnectionType,
      direction,
      context: conn.context,
      target: {
        title: target.data.title,
        url: entryUrl(target.collection, target.id),
        collection: target.collection,
      },
    });
  }

  // Incoming connections (from other entries pointing to this one)
  for (const other of allEntries) {
    if (other.id === entry.id && other.collection === entry.collection) continue;
    const otherId = graphNodeId(other);

    for (const conn of (other.data.connections ?? [])) {
      const targetId = nodeIdFromParts(conn.target.collection, conn.target.id);
      if (targetId !== nodeId) continue;

      // related is already symmetric from the author side; skip reverse
      if (conn.type === 'related') continue;

      connections.push({
        sourceNodeId: otherId,
        targetNodeId: nodeId,
        type: conn.type as ConnectionType,
        direction: 'incoming',
        context: conn.context,
        target: {
          title: other.data.title,
          url: entryUrl(other.collection, other.id),
          collection: other.collection,
        },
      });
    }
  }

  return connections;
}

// ---------------------------------------------------------------------------
// Manifest construction
// ---------------------------------------------------------------------------

const MANIFEST_SCHEMA_VERSION = 1;

/** Build the deterministic public graph manifest from all published entries. */
export function buildGraphManifest(entries: AnyEntry[]): GraphManifest {
  // Nodes — sorted by stable ID
  const nodes: GraphNode[] = entries
    .map(buildGraphNode)
    .sort((a, b) => a.id.localeCompare(b.id));

  // Edges — directed edges, related authored once; do NOT add a reverse copy
  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const entry of entries) {
    const sourceId = graphNodeId(entry);
    for (const conn of (entry.data.connections ?? [])) {
      const targetId = nodeIdFromParts(conn.target.collection, conn.target.id);
      const key = `${conn.type}:${sourceId}→${targetId}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);

      edges.push({
        source: sourceId,
        target: targetId,
        type: conn.type as ConnectionType,
        ...(conn.context && { context: conn.context }),
      });
    }
  }

  // Sort edges deterministically
  edges.sort((a, b) => {
    const src = a.source.localeCompare(b.source);
    if (src !== 0) return src;
    const tgt = a.target.localeCompare(b.target);
    if (tgt !== 0) return tgt;
    return a.type.localeCompare(b.type);
  });

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    nodes,
    edges,
  };
}
