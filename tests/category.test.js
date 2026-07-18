const assert = require('assert')

const store = {}

global.wx = {
  getStorageSync(key) {
    return store[key] === undefined ? '' : store[key]
  },
  setStorageSync(key, value) {
    store[key] = value
  },
}

const category = require('../utils/category')

category.initIfNeeded()

assert.deepStrictEqual(
  category.getCategories().map((item) => item.name),
  ['工作', '生活', '学习'],
  'initializes default categories'
)

const added = category.addCategory('  健身  ')
assert.strictEqual(added.ok, true, 'adds a trimmed custom category')
assert.strictEqual(added.category.name, '健身')
assert.strictEqual(
  category.getCategories().some((item) => item.name === '健身'),
  true,
  'persists the custom category'
)

assert.deepStrictEqual(
  category.addCategory(''),
  { ok: false, message: '请输入分类名称' },
  'rejects empty category names'
)

assert.deepStrictEqual(
  category.addCategory('健身'),
  { ok: false, message: '分类已存在' },
  'rejects duplicate category names'
)

assert.strictEqual(
  category.getValidCategoryId(added.category.id),
  added.category.id,
  'accepts custom category ids'
)

assert.strictEqual(
  category.getValidCategoryId('missing'),
  'work',
  'falls back to work for unknown category ids'
)
