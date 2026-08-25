import type { ArchiveEdgeType, ArchiveGraph, ArchiveNode } from './archive-graph'

export interface ArchiveRelationshipItem {
  id: string
  label: string
  relation: ArchiveEdgeType
  to: string
  evidence: string
}

const relationPriority: Record<ArchiveEdgeType, number> = {
  homeworld: 0,
  'related-character': 1,
  'participates-in': 2,
  'event-location': 3,
  'appears-on': 4,
  'story-stop': 5,
}

function routeFor(node: ArchiveNode): string | null {
  switch (node.kind) {
    case 'body':
      return `/holocron/planet/${node.recordId}`
    case 'character':
      return `/holocron/character/${node.recordId}`
    case 'event':
      return `/timeline#event-${node.recordId}`
    case 'story':
      return `/stories/${node.recordId}`
  }
}

/** Converts graph facts into visible archive links without exposing joining
 * mechanics to route components. Labels come from the already-loaded records;
 * an unknown label is intentionally omitted rather than invented. */
export function relationshipItemsFor(
  graph: ArchiveGraph,
  focalNodeId: ArchiveNode['id'],
  labels: ReadonlyMap<ArchiveNode['id'], string>,
): ArchiveRelationshipItem[] {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]))
  const deduped = new Map<string, ArchiveRelationshipItem>()

  for (const edge of graph.edges) {
    if (edge.from !== focalNodeId && edge.to !== focalNodeId) continue
    const target = nodes.get(edge.from === focalNodeId ? edge.to : edge.from)
    if (!target) continue
    const label = labels.get(target.id)
    const to = routeFor(target)
    if (!label || !to) continue

    const item: ArchiveRelationshipItem = {
      id: `${edge.type}:${target.id}`,
      label,
      relation: edge.type,
      to,
      evidence: edge.evidence.map((evidence) => `${evidence.recordKind}:${evidence.recordId} · ${evidence.field}`).join(' / '),
    }
    deduped.set(item.id, item)
  }

  return [...deduped.values()].sort((a, b) =>
    relationPriority[a.relation] - relationPriority[b.relation]
    || `${a.label}:${a.id}`.localeCompare(`${b.label}:${b.id}`),
  )
}
