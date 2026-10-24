import test from 'node:test'
import assert from 'node:assert/strict'
import { validateProductData } from './productValidator.js'
import { ValidationError } from './ValidationError.js'

test('product validation normalizes valid values', () => {
  assert.deepEqual(
    validateProductData({
      name: '  Monitor  ',
      sku: ' SKU-1 ',
      price: '12.5',
      stock: '3',
      categoryId: ' category-1 ',
      description: '  Pantalla  '
    }, true),
    {
      name: 'Monitor',
      sku: 'SKU-1',
      price: 12.5,
      stock: 3,
      categoryId: 'category-1',
      description: 'Pantalla'
    }
  )
})

test('product validation rejects invalid stock values', () => {
  assert.throws(
    () => validateProductData({
      name: 'Monitor',
      sku: 'SKU-1',
      price: 12.5,
      stock: 1.5,
      categoryId: 'category-1'
    }, false),
    ValidationError
  )
})
