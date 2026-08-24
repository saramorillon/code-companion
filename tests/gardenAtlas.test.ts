import * as path from 'path'
import { assert, test } from 'vitest'
import { loadGardenAtlas, speciesOfKind, findSpecies, drawPlanting } from '../src/core/gardenAtlas.js'

const repoRoot = path.join(__dirname, '..')

test('loadGardenAtlas loads the real tileset-atlas.json with 3 trees and 9 crops', () => {
  const atlas = loadGardenAtlas(repoRoot)
  assert.equal(speciesOfKind(atlas, 'tree').length, 3)
  assert.equal(speciesOfKind(atlas, 'crop').length, 9)
})

test('findSpecies returns a tree with 4 growth stages', () => {
  const atlas = loadGardenAtlas(repoRoot)
  const apple = findSpecies(atlas, 'tree', 'apple')
  assert.ok(apple)
  assert.equal(apple!.stages.normal.length, 4)
})

test('findSpecies returns a crop with 5 growth stages', () => {
  const atlas = loadGardenAtlas(repoRoot)
  const corn = findSpecies(atlas, 'crop', 'corn')
  assert.ok(corn)
  assert.equal(corn!.stages.normal.length, 5)
})

test('findSpecies returns null for an unknown id', () => {
  const atlas = loadGardenAtlas(repoRoot)
  assert.equal(findSpecies(atlas, 'tree', 'does-not-exist'), null)
})

test('drawPlanting draws roughly 25% trees and 5% gold over many trials', () => {
  const atlas = loadGardenAtlas(repoRoot)
  const trials = 10_000
  let treeCount = 0
  let goldCount = 0

  for (let i = 0; i < trials; i++) {
    const draw = drawPlanting(atlas)
    if (draw.kind === 'tree') treeCount++
    if (draw.color === 'gold') goldCount++
  }

  assert.ok(Math.abs(treeCount / trials - 0.25) < 0.03, `treeCount ratio was ${treeCount / trials}`)
  assert.ok(Math.abs(goldCount / trials - 0.05) < 0.02, `goldCount ratio was ${goldCount / trials}`)
})

test('drawPlanting always returns a species id that exists in its drawn category', () => {
  const atlas = loadGardenAtlas(repoRoot)
  for (let i = 0; i < 100; i++) {
    const draw = drawPlanting(atlas)
    assert.ok(findSpecies(atlas, draw.kind, draw.speciesId))
  }
})
