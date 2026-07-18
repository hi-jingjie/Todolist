const todo = require('../../utils/todo')
const { buildTodoListState } = require('../../utils/todo-list-state')

Page({
  data: {
    list: [],
  },

  onShow() {
    this.refresh()
  },

  onNavTodo() {
    wx.redirectTo({
      url: '/pages/index/index',
    })
  },

  onNavStats() {
    wx.redirectTo({
      url: '/pages/stats/stats',
    })
  },

  refresh() {
    const state = buildTodoListState(todo.getTodos(), {
      tab: 'all',
      keyword: '',
      statusFilter: 'done',
      priorityFilter: 'all',
      sortMode: 'date',
    })
    this.setData({ list: state.list })
  },

  onRestore(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      todo.updateTodo(id, { done: false })
      this.refresh()
      wx.showToast({ title: '已恢复', icon: 'success' })
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }
    wx.showModal({
      title: '删除归档',
      content: '确定删除这条已完成待办吗？',
      success: (res) => {
        if (res.confirm) {
          todo.deleteTodo(id)
          this.refresh()
        }
      },
    })
  },
})
