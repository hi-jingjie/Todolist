const PRIORITIES = {
  high: { id: 'high', text: '高', rank: 0 },
  medium: { id: 'medium', text: '中', rank: 1 },
  low: { id: 'low', text: '低', rank: 2 },
}

function getPriorityMeta(priority) {
  return PRIORITIES[priority] || PRIORITIES.medium
}

function isAllowedPriority(priority) {
  return priority === 'high' || priority === 'medium' || priority === 'low'
}

function filterTodosByPriority(todos, priorityFilter) {
  if (!isAllowedPriority(priorityFilter)) {
    return todos
  }
  return todos.filter((todo) => getPriorityMeta(todo.priority).id === priorityFilter)
}

function sortTodosByPriority(todos) {
  return todos
    .map((todo, index) => ({
      todo,
      index,
      priority: getPriorityMeta(todo.priority),
    }))
    .sort((a, b) => {
      if (a.priority.rank !== b.priority.rank) {
        return a.priority.rank - b.priority.rank
      }
      return a.index - b.index
    })
    .map((item) => item.todo)
}

module.exports = {
  getPriorityMeta,
  filterTodosByPriority,
  sortTodosByPriority,
}
