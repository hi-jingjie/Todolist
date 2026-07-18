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
const todo = require('../utils/todo')

const added = category.addCategory('健身')
assert.strictEqual(added.ok, true, 'creates a custom category first')

const result = todo.addTodo({
  title: '练肩',
  category: added.category.id,
  priority: 'high',
  dueDate: '',
})

assert.strictEqual(result.ok, true, 'adds a todo in a custom category')
assert.strictEqual(
  todo.getTodos()[0].category,
  added.category.id,
  'keeps the custom category id on the todo'
)
