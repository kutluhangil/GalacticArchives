// Source-backed relationship graph for the archive. This module is deliberately
// pure: it knows nothing about JSON imports, React, routing, or browser APIs.

import type { CelestialBody, Character, TimelineEvent } from '../types/lore'

export type ArchiveNodeKind = 'body' | 'character' | 'event' | 'story'
export type ArchiveEdgeType =
  | 'homeworld'
  | 'appears-on'
  | 'participates-in'
  | 'related-character'
  | 'event-location'
  | 'story-stop'

export interface ArchiveNode {
  id: `${ArchiveNodeKind}:${string}`
  kind: ArchiveNodeKind
  recordId: string
}

export interface ArchiveEvidence {
  recordKind: 'body' | 'character' | 'event' | 'story'
  recordId: string
  field: string
}

export interface ArchiveEdge {
  type: ArchiveEdgeType
  from: ArchiveNode['id']
  to: ArchiveNode['id']
  evidence: readonly ArchiveEvidence[]
}

export interface ArchiveGraph {
  nodes: readonly ArchiveNode[]
  edges: readonly ArchiveEdge[]
}

export interface ArchiveGraphInput {
  bodies: readonly CelestialBody[]
  characters: readonly Character[]
  events: readonly TimelineEvent[]
}

export class ArchiveGraphValidationError extends Error {
  readonly issues: readonly string[]

  constructor(issues: readonly string[]) {
    super(`Archive graph validation failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`)
    this.name = 'ArchiveGraphValidationError'
    this.issues = issues
  }
}

const nodeId = (kind: ArchiveNodeKind, recordId: string): ArchiveNode['id'] => `${kind}:${recordId}`
const compare = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id)

function validateUnique<T extends { id: string }>(kind: ArchiveNodeKind, records: readonly T[], issues: string[]) {
  const ids = new Set<string>()
  for (const record of records) {
    if (ids.has(record.id)) issues.push(`duplicate ${kind} id "${record.id}"`)
    ids.add(record.id)
  }
  return ids
}

function freezeGraph(nodes: ArchiveNode[], edges: ArchiveEdge[]): ArchiveGraph {
  const frozenNodes = nodes.map((node) => Object.freeze({ ...node }))
  const frozenEdges = edges.map((edge) =>
    Object.freeze({
      ...edge,
      evidence: Object.freeze(edge.evidence.map((evidence) => Object.freeze({ ...evidence }))),
    }),
  )
  return Object.freeze({ nodes: Object.freeze(frozenNodes), edges: Object.freeze(frozenEdges) })
}

export function buildArchiveGraph({ bodies, characters, events }: ArchiveGraphInput): ArchiveGraph {
  const issues: string[] = []
  const bodyIds = validateUnique('body', bodies, issues)
  const characterIds = validateUnique('character', characters, issues)
  validateUnique('event', events, issues)

  const nodes: ArchiveNode[] = [
    ...bodies.map((body) => ({ id: nodeId('body', body.id), kind: 'body' as const, recordId: body.id })),
    ...characters.map((character) => ({ id: nodeId('character', character.id), kind: 'character' as const, recordId: character.id })),
    ...events.map((event) => ({ id: nodeId('event', event.id), kind: 'event' as const, recordId: event.id })),
  ]

  const edgeEvidence = new Map<string, { type: ArchiveEdgeType; from: ArchiveNode['id']; to: ArchiveNode['id']; evidence: ArchiveEvidence[] }>()
  const addEdge = (type: ArchiveEdgeType, from: ArchiveNode['id'], to: ArchiveNode['id'], evidence: ArchiveEvidence) => {
    const key = `${type}|${from}|${to}`
    const existing = edgeEvidence.get(key)
    if (existing) {
      existing.evidence.push(evidence)
      return
    }
    edgeEvidence.set(key, { type, from, to, evidence: [evidence] })
  }

  for (const character of characters) {
    if (character.homeworldId) {
      if (!bodyIds.has(character.homeworldId)) {
        issues.push(`character "${character.id}" homeworldId references unknown body "${character.homeworldId}"`)
      } else {
        addEdge('homeworld', nodeId('character', character.id), nodeId('body', character.homeworldId), {
          recordKind: 'character',
          recordId: character.id,
          field: 'homeworldId',
        })
      }
    }
    for (const relatedId of character.relatedCharacters ?? []) {
      if (!characterIds.has(relatedId)) {
        issues.push(`character "${character.id}" relatedCharacters references unknown character "${relatedId}"`)
        continue
      }
      const [first, second] = [character.id, relatedId].sort()
      addEdge('related-character', nodeId('character', first), nodeId('character', second), {
        recordKind: 'character',
        recordId: character.id,
        field: 'relatedCharacters',
      })
    }
  }

  for (const body of bodies) {
    for (const characterId of body.characters ?? []) {
      if (!characterIds.has(characterId)) {
        issues.push(`body "${body.id}" characters references unknown character "${characterId}"`)
        continue
      }
      addEdge('appears-on', nodeId('character', characterId), nodeId('body', body.id), {
        recordKind: 'body',
        recordId: body.id,
        field: 'characters',
      })
    }
  }

  for (const event of events) {
    if (event.planetId) {
      if (!bodyIds.has(event.planetId)) {
        issues.push(`event "${event.id}" planetId references unknown body "${event.planetId}"`)
      } else {
        addEdge('event-location', nodeId('event', event.id), nodeId('body', event.planetId), {
          recordKind: 'event',
          recordId: event.id,
          field: 'planetId',
        })
      }
    }
    for (const characterId of event.characterIds ?? []) {
      if (!characterIds.has(characterId)) {
        issues.push(`event "${event.id}" characterIds references unknown character "${characterId}"`)
        continue
      }
      addEdge('participates-in', nodeId('character', characterId), nodeId('event', event.id), {
        recordKind: 'event',
        recordId: event.id,
        field: 'characterIds',
      })
    }
  }

  if (issues.length) throw new ArchiveGraphValidationError([...issues].sort())

  const sortedNodes = [...nodes].sort(compare)
  const sortedEdges = [...edgeEvidence.values()]
    .map(({ type, from, to, evidence }) => ({
      type,
      from,
      to,
      evidence: [...evidence].sort((a, b) => `${a.recordKind}:${a.recordId}:${a.field}`.localeCompare(`${b.recordKind}:${b.recordId}:${b.field}`)),
    }))
    .sort((a, b) => `${a.type}|${a.from}|${a.to}`.localeCompare(`${b.type}|${b.from}|${b.to}`))

  return freezeGraph(sortedNodes, sortedEdges)
}
