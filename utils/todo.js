const { KEYS, read, write } = require('./storage')
const category = require('./category')

const LEGACY_TODOS = 'todolist_todos'

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function isAllowedRepeat(repeat) {
  return ['none', 'daily', 'weekly', 'monthly'].includes(repeat)
}

function validRepeat(repeat) {
  return isAllowedRepeat(repeat) ? repeat : 'none'
}

function parseDate(dateText) {
  const match = String(dateText || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return null
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nextDueDate(dueDate, repeat) {
  const base = parseDate(dueDate) || new Date()
  const next = new Date(base.getTime())
  if (repeat === 'daily') {
    next.setDate(next.getDate() + 1)
  } else if (repeat === 'weekly') {
    next.setDate(next.getDate() + 7)
  } else if (repeat === 'monthly') {
    next.setMonth(next.getMonth() + 1)
  }
  return formatDate(next)
}

function buildNextRepeatTodo(source) {
  const repeat = validRepeat(source.repeat)
  if (repeat === 'none') {
    return null
  }
  return {
    ...source,
    id: uid(),
    done: false,
    dueDate: nextDueDate(source.dueDate, repeat),
    createdAt: Date.now(),
    updatedAt: undefined,
    completedAt: undefined,
    focusSeconds: 0,
    focusCount: 0,
    recurringParentId: source.recurringParentId || source.id,
  }
}

function migrateLegacyIfNeeded() {
  const next = read(KEYS.TASKS, null)
  if (Array.isArray(next)) {
    return
  }
  const legacy = read(LEGACY_TODOS, null)
  if (!Array.isArray(legacy) || legacy.length === 0) {
    write(KEYS.TASKS, [])
    return
  }
  const migrated = legacy.map((t) => ({
    id: t.id || uid(),
    title: t.title || '',
    done: !!t.done,
    category: 'work',
    priority: 'medium',
    dueDate: '',
    note: '',
    repeat: 'none',
    focusSeconds: 0,
    focusCount: 0,
    pinned: false,
    createdAt: t.createdAt || Date.now(),
  }))
  write(KEYS.TASKS, migrated)
}

function initIfNeeded() {
  category.initIfNeeded()
  migrateLegacyIfNeeded()
  if (!Array.isArray(read(KEYS.TASKS, null))) {
    write(KEYS.TASKS, [])
  }
}

function getTodos() {
  initIfNeeded()
  return read(KEYS.TASKS, [])
}

function saveTodos(list) {
  write(KEYS.TASKS, list)
}

function addTodo(payload) {
  const title = (payload.title || '').trim()
  if (!title) {
    return { ok: false, message: '请输入标题' }
  }
  const todos = getTodos()
  todos.unshift({
    id: uid(),
    title,
    done: false,
    category: category.getValidCategoryId(payload.category),
    priority: ['high', 'medium', 'low'].includes(payload.priority)
      ? payload.priority
      : 'medium',
    dueDate: payload.dueDate || '',
    note: String(payload.note || '').trim(),
    repeat: validRepeat(payload.repeat),
    focusSeconds: 0,
    focusCount: 0,
    pinned: !!payload.pinned,
    createdAt: Date.now(),
  })
  saveTodos(todos)
  return { ok: true }
}

function updateTodo(id, payload) {
  const todos = getTodos().map((t) => {
    if (t.id !== id) {
      return t
    }
    const next = { ...t, updatedAt: Date.now() }
    if (payload.title !== undefined) {
      next.title = String(payload.title).trim()
    }
    if (payload.category !== undefined) {
      next.category = category.getValidCategoryId(payload.category)
    }
    if (payload.priority !== undefined) {
      const allow = ['high', 'medium', 'low']
      next.priority = allow.includes(payload.priority)
        ? payload.priority
        : 'medium'
    }
    if (payload.dueDate !== undefined) {
      next.dueDate = payload.dueDate
    }
    if (payload.note !== undefined) {
      next.note = String(payload.note || '').trim()
    }
    if (payload.repeat !== undefined) {
      next.repeat = validRepeat(payload.repeat)
    }
    if (payload.done !== undefined) {
      next.done = payload.done
      if (payload.done === false) {
        next.completedAt = undefined
      }
    }
    if (payload.pinned !== undefined) {
      next.pinned = !!payload.pinned
    }
    return next
  })
  const target = todos.find((t) => t.id === id)
  if (target && !target.title) {
    return { ok: false, message: '标题不能为空' }
  }
  saveTodos(todos)
  return { ok: true }
}

function deleteTodo(id) {
  saveTodos(getTodos().filter((t) => t.id !== id))
}

function deleteTodos(ids) {
  const set = new Set(ids || [])
  saveTodos(getTodos().filter((t) => !set.has(t.id)))
}

function clearDoneTodos() {
  saveTodos(getTodos().filter((t) => !t.done))
}

function completeTodo(id) {
  let createdNext = null
  let completed = false
  const todos = getTodos().map((t) => {
    if (t.id !== id || t.done) {
      return t
    }
    completed = true
    const next = {
      ...t,
      done: true,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    }
    createdNext = buildNextRepeatTodo(next)
    return next
  })
  if (createdNext) {
    todos.unshift(createdNext)
  }
  saveTodos(todos)
  return {
    ok: completed,
    createdNext: !!createdNext,
  }
}

function markTodosDone(ids) {
  const set = new Set(ids || [])
  let nextItems = []
  const todos = getTodos().map((t) => {
    if (!set.has(t.id) || t.done) {
      return t
    }
    const next = {
      ...t,
      done: true,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    }
    const repeatNext = buildNextRepeatTodo(next)
    if (repeatNext) {
      nextItems.push(repeatNext)
    }
    return next
  })
  saveTodos([...nextItems, ...todos])
}

function markAllDone() {
  markTodosDone(getTodos().filter((t) => !t.done).map((t) => t.id))
}

function completeFocus(id, seconds) {
  const addSeconds = Math.max(0, Number(seconds) || 0)
  const todos = getTodos().map((t) => {
    if (t.id !== id) {
      return t
    }
    return {
      ...t,
      focusSeconds: (Number(t.focusSeconds) || 0) + addSeconds,
      focusCount: (Number(t.focusCount) || 0) + 1,
      updatedAt: Date.now(),
    }
  })
  saveTodos(todos)
  completeTodo(id)
}

function togglePin(id) {
  const target = getTodoById(id)
  if (!target) {
    return
  }
  updateTodo(id, { pinned: !target.pinned })
}

function toggleTodo(id) {
  const t = getTodos().find((x) => x.id === id)
  if (t) {
    if (t.done) {
      updateTodo(id, { done: false })
    } else {
      completeTodo(id)
    }
  }
}

function getTodoById(id) {
  return getTodos().find((t) => t.id === id) || null
}


module.exports = {
  initIfNeeded,
  getTodos,
  saveTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  deleteTodos,
  clearDoneTodos,
  completeTodo,
  markTodosDone,
  markAllDone,
  completeFocus,
  togglePin,
  toggleTodo,
  getTodoById,
}
