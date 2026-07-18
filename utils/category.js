const { KEYS, read, write } = require('./storage')

const DEFAULT_CATEGORIES = [
  { id: 'work', name: '工作', builtIn: true },
  { id: 'life', name: '生活', builtIn: true },
  { id: 'study', name: '学习', builtIn: true },
]

function uid() {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function normalizeName(name) {
  return String(name || '').trim()
}

function normalizeCategories(list) {
  const source = Array.isArray(list) ? list : []
  const merged = [...DEFAULT_CATEGORIES]

  source.forEach((item) => {
    const id = String(item && item.id ? item.id : '').trim()
    const name = normalizeName(item && item.name)
    if (!id || !name || merged.some((x) => x.id === id || x.name === name)) {
      return
    }
    merged.push({ id, name, builtIn: !!item.builtIn })
  })

  return merged
}

function initIfNeeded() {
  const current = read(KEYS.CATEGORIES, null)
  write(KEYS.CATEGORIES, normalizeCategories(current))
}

function getCategories() {
  initIfNeeded()
  return read(KEYS.CATEGORIES, DEFAULT_CATEGORIES)
}

function saveCategories(list) {
  write(KEYS.CATEGORIES, normalizeCategories(list))
}

function addCategory(name) {
  const normalized = normalizeName(name)
  if (!normalized) {
    return { ok: false, message: '请输入分类名称' }
  }

  const categories = getCategories()
  if (categories.some((item) => item.name === normalized)) {
    return { ok: false, message: '分类已存在' }
  }

  const next = {
    id: uid(),
    name: normalized,
    builtIn: false,
  }
  saveCategories([...categories, next])
  return { ok: true, category: next }
}

function getValidCategoryId(id) {
  const category = getCategories().find((item) => item.id === id)
  return category ? category.id : 'work'
}

module.exports = {
  DEFAULT_CATEGORIES,
  initIfNeeded,
  getCategories,
  saveCategories,
  addCategory,
  getValidCategoryId,
}
