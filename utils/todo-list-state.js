const { filterTodos } = require('./todo-filter')
const { getDueMeta, sortTodosByDueDate } = require('./due-date')
const {
  filterTodosByPriority,
  getPriorityMeta,
  sortTodosByPriority,
} = require('./priority')

function mapList(raw, today) {
  return raw.map((todo) => {
    const priority = getPriorityMeta(todo.priority)
    const due = getDueMeta(todo.dueDate, today)
    const next = {
      ...todo,
      priority: priority.id,
      priorityText: priority.text,
      dueText: due.text,
      dueStatus: due.status,
      isOverdue: !todo.done && due.isOverdue,
    }
    const notePreview = getNotePreview(todo.note)
    const repeatText = getRepeatText(todo.repeat)
    const focusText = getFocusText(todo.focusSeconds)
    if (notePreview) {
      next.notePreview = notePreview
    }
    if (repeatText) {
      next.repeatText = repeatText
    }
    if (focusText) {
      next.focusText = focusText
    }
    return next
  })
}

function getNotePreview(note) {
  const text = String(note || '').trim()
  if (!text) {
    return ''
  }
  return text.length > 36 ? `${text.slice(0, 36)}...` : text
}

function getRepeatText(repeat) {
  if (repeat === 'daily') {
    return '每天重复'
  }
  if (repeat === 'weekly') {
    return '每周重复'
  }
  if (repeat === 'monthly') {
    return '每月重复'
  }
  return ''
}

function getFocusText(seconds) {
  const value = Number(seconds) || 0
  if (value <= 0) {
    return ''
  }
  const minutes = Math.max(1, Math.round(value / 60))
  return `已专注 ${minutes} 分钟`
}

function buildTodoListState(todos, options) {
  const filtered = filterTodos(todos, {
    tab: options && options.tab,
    keyword: options && options.keyword,
    statusFilter: options && options.statusFilter,
    hideDoneInAll: !(options && options.hideDoneInAll === false),
  })
  const priorityFiltered = filterTodosByPriority(
    filtered,
    options && options.priorityFilter
  )
  const today = options && options.today
  const sorted =
    options && options.sortMode === 'priority'
      ? sortTodosByPriority(priorityFiltered)
      : sortTodosByDueDate(priorityFiltered, today)
  const list = mapList(sortPinnedFirst(sorted), today)
  const overdueCount = list.filter((todo) => todo.isOverdue).length

  return {
    list,
    swipeOpenId: '',
    overdueCount,
    overdueText: overdueCount ? `${overdueCount} 条待办已逾期` : '',
  }
}

function sortPinnedFirst(todos) {
  return todos
    .map((todo, index) => ({ todo, index }))
    .sort((a, b) => {
      if (!!a.todo.pinned !== !!b.todo.pinned) {
        return a.todo.pinned ? -1 : 1
      }
      return a.index - b.index
    })
    .map((item) => item.todo)
}

module.exports = {
  buildTodoListState,
}
