import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeProductName,
  productNameIndexId
} from './Product.js'

test('product names are normalized for duplicate detection', () => {
  assert.equal(normalizeProductName('  Monitor Gamer  '), 'monitor gamer')
  assert.equal(
    productNameIndexId(' Monitor Gamer '),
    productNameIndexId('monitor gamer')
  )
})
