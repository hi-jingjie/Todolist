const KEYS = {
  TASKS: 'todolist_tasks_v2',
  CATEGORIES: 'todolist_categories_v1',
}

function read(key, defaultValue) {
  try {
    const value = wx.getStorageSync(key)
    if (value === '' || value === undefined) {
      return defaultValue
    }
    return value
  } catch (e) {
    return defaultValue
  }
}

function write(key, value) {
  wx.setStorageSync(key, value)
}

module.exports = {
  KEYS,
  read,
  write,
}
