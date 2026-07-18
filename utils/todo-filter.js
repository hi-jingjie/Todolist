function normalizeKeyword(keyword) {
  return String(keyword || '').trim().toLowerCase()
}

function filterTodos(todos, options) {
  const tab = options && options.tab ? options.tab : 'all'
  const keyword = normalizeKeyword(options && options.keyword)
  const statusFilter = options && options.statusFilter ? options.statusFilter : 'all'

  return todos.filter((todo) => {
    const inCategory = tab === 'all' || (todo.category || 'work') === tab
    if (!inCategory) {
      return false
    }
    if (options && options.hideDoneInAll && statusFilter === 'all' && todo.done) {
      return false
    }
    if (statusFilter === 'active' && todo.done) {
      return false
    }
    if (statusFilter === 'done' && !todo.done) {
      return false
    }
    if (!keyword) {
      return true
    }
    return String(todo.title || '').toLowerCase().includes(keyword)
  })
}

module.exports = {
  filterTodos,
}
