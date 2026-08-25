import * as fs from 'fs'
import * as path from 'path'
import { GardenKind, GardenColor } from '../types.js'

export interface AtlasRect {
  x: number
  y: number
  width: number
  height: number
}

export interface GardenSpecies {
  id: string
  name: string
  kind: GardenKind
  stages: Record<GardenColor, AtlasRect[]>
  harvestIcon: Record<GardenColor, AtlasRect>
  basketIcon: Record<GardenColor, AtlasRect>
}

export interface GardenAtlas {
  image: string
  tileSize: { width: number; height: number }
  species: GardenSpecies[]
}

let cached: GardenAtlas | null = null

export function loadGardenAtlas(extensionRootPath: string): GardenAtlas {
  if (cached) return cached
  const filePath = path.join(extensionRootPath, 'tileset-atlas.json')
  cached = JSON.parse(fs.readFileSync(filePath, 'utf8')) as GardenAtlas
  return cached
}

export function speciesOfKind(atlas: GardenAtlas, kind: GardenKind): GardenSpecies[] {
  return atlas.species.filter((s) => s.kind === kind)
}

export function findSpecies(atlas: GardenAtlas, kind: GardenKind, speciesId: string): GardenSpecies | null {
  return atlas.species.find((s) => s.kind === kind && s.id === speciesId) ?? null
}

export interface Draw {
  kind: GardenKind
  speciesId: string
  color: GardenColor
}

// Tirage à 2 étapes : catégorie (arbre plus rare que culture), puis espèce uniforme dans la
// catégorie. Avec 3 arbres / 9 cultures et ce ratio 25%/75%, chaque espèce individuelle a la
// même probabilité d'être tirée, quelle que soit sa catégorie.
const TREE_PROBABILITY = 0.25

// Couleur : normal courant, silver bonus notable, gold rare.
const COLOR_WEIGHTS: Record<GardenColor, number> = { normal: 0.7, silver: 0.25, gold: 0.05 }

function weightedPick<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][]
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [key, weight] of entries) {
    roll -= weight
    if (roll <= 0) return key
  }
  return entries[entries.length - 1]![0]
}

export function drawPlanting(atlas: GardenAtlas): Draw {
  const kind: GardenKind = Math.random() < TREE_PROBABILITY ? 'tree' : 'crop'
  const candidates = speciesOfKind(atlas, kind)
  const speciesId = candidates[Math.floor(Math.random() * candidates.length)]!.id
  const color = weightedPick(COLOR_WEIGHTS)
  return { kind, speciesId, color }
}
