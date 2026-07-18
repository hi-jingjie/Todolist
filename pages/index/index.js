const todo = require('../../utils/todo')
const category = require('../../utils/category')
const { buildTodoListState } = require('../../utils/todo-list-state')

function buildTabs() {
  return [{ id: 'all', name: '全部' }, ...category.getCategories()]
}

function decorateSelection(list, selectedIds) {
  const selected = new Set(selectedIds || [])
  return list.map((item) => ({
    ...item,
    selected: selected.has(item.id),
  }))
}

function getFilterSummary(state) {
  const status =
    state.statusFilter === 'done'
      ? '已完成'
      : state.statusFilter === 'active'
        ? '未完成'
        : '未完成默认视图'
  const sort = state.sortMode === 'priority' ? '按优先级' : '按日期'
  return `${status} · ${sort}`
}

Page({
  data: {
    tabs: buildTabs(),
    tab: 'all',
    keyword: '',
    statusFilters: [
      { id: 'all', name: '全部' },
      { id: 'active', name: '未完成' },
      { id: 'done', name: '已完成' },
    ],
    statusFilter: 'all',
    priorityFilters: [
      { id: 'all', name: '全部' },
      { id: 'high', name: '高' },
      { id: 'medium', name: '中' },
      { id: 'low', name: '低' },
    ],
    priorityFilter: 'all',
    sortModes: [
      { id: 'date', name: '日期' },
      { id: 'priority', name: '优先级' },
    ],
    sortMode: 'date',
    list: [],
    swipeOpenId: '',
    selectionMode: false,
    selectedIds: [],
    filtersOpen: false,
    filterSummary: '未完成默认视图 · 按日期',
  },

  onShow() {
    this.refresh()
  },

  createVisibleState(patch) {
    const next = patch || {}
    const all = todo.getTodos()
    const selectedIds =
      next.selectedIds !== undefined ? next.selectedIds : this.data.selectedIds
    const state = buildTodoListState(all, {
      tab: next.tab !== undefined ? next.tab : this.data.tab,
      keyword: next.keyword !== undefined ? next.keyword : this.data.keyword,
      statusFilter:
        next.statusFilter !== undefined
          ? next.statusFilter
          : this.data.statusFilter,
      priorityFilter:
        next.priorityFilter !== undefined
          ? next.priorityFilter
          : this.data.priorityFilter,
      sortMode:
        next.sortMode !== undefined ? next.sortMode : this.data.sortMode,
    })
    return {
      ...state,
      list: decorateSelection(state.list, selectedIds),
    }
  },

  refresh(patch) {
    const next = patch || {}
    const merged = { ...this.data, ...next }
    this.setData({
      tabs: buildTabs(),
      ...next,
      filterSummary: getFilterSummary(merged),
      ...this.createVisibleState(next),
    })
  },

  onTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab || tab === this.data.tab) {
      return
    }
    this.refresh({
      tab,
      selectionMode: false,
      selectedIds: [],
    })
  },

  noop() {},

  onSearchInput(e) {
    const keyword = e.detail.value || ''
    this.refresh({
      keyword,
      selectionMode: false,
      selectedIds: [],
    })
  },

  onClearSearch() {
    this.refresh({
      keyword: '',
      selectionMode: false,
      selectedIds: [],
    })
  },

  onToggleFilters() {
    this.setData({ filtersOpen: !this.data.filtersOpen })
  },

  onStatusFilter(e) {
    const statusFilter = e.currentTarget.dataset.status
    if (!statusFilter || statusFilter === this.data.statusFilter) {
      return
    }
    this.refresh({
      statusFilter,
      selectionMode: false,
      selectedIds: [],
    })
  },

  onPriorityFilter(e) {
    const priorityFilter = e.currentTarget.dataset.priority
    if (!priorityFilter || priorityFilter === this.data.priorityFilter) {
      return
    }
    this.refresh({
      priorityFilter,
      selectionMode: false,
      selectedIds: [],
    })
  },

  onSortMode(e) {
    const sortMode = e.currentTarget.dataset.sort
    if (!sortMode || sortMode === this.data.sortMode) {
      return
    }
    this.refresh({
      sortMode,
      selectionMode: false,
      selectedIds: [],
    })
  },

  onPageTap() {
    if (this.data.swipeOpenId) {
      this.setData({ swipeOpenId: '' })
    }
  },

  onSwipeStart(e) {
    this._touchStartX = e.touches[0].clientX
    this._touchRowId = e.currentTarget.dataset.id
  },

  onSwipeEnd(e) {
    const id = this._touchRowId
    if (!id) {
      return
    }
    const dx = e.changedTouches[0].clientX - this._touchStartX
    if (dx < -48) {
      this.setData({ swipeOpenId: id })
    } else if (dx > 36) {
      this.setData({ swipeOpenId: '' })
    }
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      todo.toggleTodo(id)
      this.refresh()
    }
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      if (this.data.selectionMode) {
        this.toggleSelection(id)
        return
      }
      wx.navigateTo({
        url: `/pages/todo-edit/todo-edit?id=${id}`,
      })
    }
  },

  onAdd() {
    wx.navigateTo({
      url: '/pages/todo-edit/todo-edit',
    })
  },

  onFocus() {
    wx.navigateTo({
      url: '/pages/focus/focus',
    })
  },

  onNavStats() {
    wx.redirectTo({
      url: '/pages/stats/stats',
    })
  },

  onNavArchive() {
    wx.redirectTo({
      url: '/pages/archive/archive',
    })
  },

  onFocusTodo(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({
        url: `/pages/focus/focus?todoId=${id}`,
      })
    }
  },

  onTogglePin(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      todo.togglePin(id)
      this.refresh()
    }
  },

  onMarkVisibleDone() {
    const ids = this.data.list.filter((item) => !item.done).map((item) => item.id)
    if (!ids.length) {
      wx.showToast({ title: '没有未完成待办', icon: 'none' })
      return
    }
    todo.markTodosDone(ids)
    this.refresh({
      selectionMode: false,
      selectedIds: [],
    })
    wx.showToast({ title: '已全部完成', icon: 'success' })
  },

  onClearDone() {
    const doneCount = todo.getTodos().filter((item) => item.done).length
    if (!doneCount) {
      wx.showToast({ title: '没有已完成待办', icon: 'none' })
      return
    }
    wx.showModal({
      title: '清除已完成',
      content: `将删除 ${doneCount} 条已完成待办，确定继续吗？`,
      success: (res) => {
        if (res.confirm) {
          todo.clearDoneTodos()
          this.refresh({
            selectionMode: false,
            selectedIds: [],
          })
        }
      },
    })
  },

  onEnterBatchDelete() {
    if (!this.data.list.length) {
      wx.showToast({ title: '暂无可删除待办', icon: 'none' })
      return
    }
    this.setData({
      selectionMode: true,
      selectedIds: [],
      list: decorateSelection(this.data.list, []),
      swipeOpenId: '',
    })
  },

  toggleSelection(id) {
    const selected = new Set(this.data.selectedIds)
    if (selected.has(id)) {
      selected.delete(id)
    } else {
      selected.add(id)
    }
    const selectedIds = Array.from(selected)
    this.setData({
      selectedIds,
      list: decorateSelection(this.data.list, selectedIds),
    })
  },

  onToggleSelect(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      this.toggleSelection(id)
    }
  },

  onDeleteSelected() {
    const ids = this.data.selectedIds
    if (!ids.length) {
      wx.showToast({ title: '先选择待办', icon: 'none' })
      return
    }
    wx.showModal({
      title: '批量删除',
      content: `确定删除选中的 ${ids.length} 条待办吗？`,
      success: (res) => {
        if (res.confirm) {
          todo.deleteTodos(ids)
          this.refresh({
            selectionMode: false,
            selectedIds: [],
          })
        }
      },
    })
  },

  onCancelBatch() {
    this.refresh({
      selectionMode: false,
      selectedIds: [],
    })
  },

  onDeleteTap(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }
    wx.showModal({
      title: '删除待办',
      content: '确定删除这条待办吗？',
      success: (res) => {
        if (res.confirm) {
          todo.deleteTodo(id)
          this.setData({ swipeOpenId: '' })
          this.refresh()
        }
      },
    })
  },
})
