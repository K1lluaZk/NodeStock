import test from 'node:test'
import assert from 'node:assert/strict'
import { validateCategoryData } from './categoryValidator.js'
import { ValidationError } from './ValidationError.js'

test('category validation normalizes valid values', () => {
  assert.deepEqual(
    validateCategoryData({
      name: '  Electrónica  ',
      description: '  Equipos  '
    }),
    {
      name: 'Electrónica',
      description: 'Equipos'
    }
  )
})

test('category validation rejects names outside the allowed length', () => {
  assert.throws(
    () => validateCategoryData({ name: 'ab' }),
    ValidationError
  )
})
