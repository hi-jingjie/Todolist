const todo = require('../../utils/todo')
const categoryStore = require('../../utils/category')

const priorities = [
  { id: 'high', name: '高' },
  { id: 'medium', name: '中' },
  { id: 'low', name: '低' },
]

const repeats = [
  { id: 'none', name: '不重复' },
  { id: 'daily', name: '每天' },
  { id: 'weekly', name: '每周' },
  { id: 'monthly', name: '每月' },
]

function indexById(list, id, fallbackIndex) {
  const i = list.findIndex((x) => x.id === id)
  return i >= 0 ? i : fallbackIndex
}

Page({
  data: {
    id: '',
    title: '',
    categories: categoryStore.DEFAULT_CATEGORIES,
    categoryIndex: 0,
    category: 'work',
    newCategoryName: '',
    priorities,
    priorityIndex: 1,
    priority: 'medium',
    dueDate: '',
    note: '',
    repeats,
    repeatIndex: 0,
    repeat: 'none',
    moreOpen: false,
  },

  onLoad(options) {
    const categories = categoryStore.getCategories()
    const id = options.id || ''
    if (id) {
      wx.setNavigationBarTitle({ title: '编辑待办' })
      const item = todo.getTodoById(id)
      if (!item) {
        wx.showToast({ title: '记录不存在', icon: 'none', duration: 2000 })
        const pages = getCurrentPages()
        if (pages.length > 1) {
          wx.navigateBack()
        } else {
          wx.reLaunch({ url: '/pages/index/index' })
        }
        return
      }
      const category = item.category || 'work'
      const priority = item.priority || 'medium'
      const repeat = item.repeat || 'none'
      this.setData({
        id,
        title: item.title,
        categories,
        categoryIndex: indexById(categories, category, 0),
        category: categoryStore.getValidCategoryId(category),
        priorityIndex: indexById(priorities, priority, 1),
        priority,
        dueDate: item.dueDate || '',
        note: item.note || '',
        repeatIndex: indexById(repeats, repeat, 0),
        repeat,
        moreOpen: !!item.note || repeat !== 'none',
      })
    } else {
      wx.setNavigationBarTitle({ title: '新增待办' })
      this.setData({
        id: '',
        title: '',
        categories,
        categoryIndex: 0,
        category: categories[0] ? categories[0].id : 'work',
        priorityIndex: 1,
        priority: 'medium',
        dueDate: '',
        note: '',
        repeatIndex: 0,
        repeat: 'none',
        newCategoryName: '',
        moreOpen: false,
      })
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  onCategoryPick(e) {
    const categoryIndex = Number(e.detail.value)
    const c = this.data.categories[categoryIndex]
    this.setData({
      categoryIndex,
      category: c ? c.id : 'work',
    })
  },

  onPriorityPick(e) {
    const priorityIndex = Number(e.detail.value)
    const p = priorities[priorityIndex]
    this.setData({
      priorityIndex,
      priority: p ? p.id : 'medium',
    })
  },

  onDuePick(e) {
    this.setData({ dueDate: e.detail.value || '' })
  },

  onPrioritySelect(e) {
    const priority = e.currentTarget.dataset.id
    this.setData({
      priority,
      priorityIndex: indexById(priorities, priority, 1),
    })
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  onRepeatPick(e) {
    const repeatIndex = Number(e.detail.value)
    const repeat = repeats[repeatIndex]
    this.setData({
      repeatIndex,
      repeat: repeat ? repeat.id : 'none',
    })
  },

  onNewCategoryInput(e) {
    this.setData({ newCategoryName: e.detail.value })
  },

  onAddCategory() {
    const r = categoryStore.addCategory(this.data.newCategoryName)
    if (!r.ok) {
      wx.showToast({ title: r.message, icon: 'none' })
      return
    }

    const categories = categoryStore.getCategories()
    this.setData({
      categories,
      categoryIndex: indexById(categories, r.category.id, 0),
      category: r.category.id,
      newCategoryName: '',
    })
    wx.showToast({ title: '已添加分类', icon: 'success' })
  },

  onClearDueDate() {
    this.setData({ dueDate: '' })
  },

  onToggleMore() {
    this.setData({ moreOpen: !this.data.moreOpen })
  },

  onSave() {
    const { id, title, category, priority, dueDate, note, repeat } = this.data
    if (id) {
      const r = todo.updateTodo(id, {
        title,
        category,
        priority,
        dueDate,
        note,
        repeat,
      })
      if (!r.ok) {
        wx.showToast({ title: r.message, icon: 'none' })
        return
      }
    } else {
      const r = todo.addTodo({
        title,
        category,
        priority,
        dueDate,
        note,
        repeat,
      })
      if (!r.ok) {
        wx.showToast({ title: r.message, icon: 'none' })
        return
      }
    }
    wx.navigateBack()
  },

  onDelete() {
    if (!this.data.id) {
      return
    }
    wx.showModal({
      title: '删除待办',
      content: '确定删除这条待办吗？',
      success: (res) => {
        if (res.confirm) {
          todo.deleteTodo(this.data.id)
          wx.navigateBack()
        }
      },
    })
  },
})
