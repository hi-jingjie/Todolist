const {
  createFocusState,
  formatSeconds,
  getProgress,
  getRemainingSeconds,
  getStartSeconds,
} = require('../../utils/focus-timer')
const todo = require('../../utils/todo')

const DURATIONS = [15, 25, 45, 60]

function statusText(status) {
  if (status === 'running') {
    return '专注中'
  }
  if (status === 'paused') {
    return '已暂停'
  }
  if (status === 'done') {
    return '已完成'
  }
  return '准备开始'
}

function actionText(status) {
  if (status === 'paused') {
    return '继续'
  }
  if (status === 'done') {
    return '再来一次'
  }
  return '开始'
}

Page({
  data: {
    durations: DURATIONS,
    durationMinutes: 25,
    totalSeconds: 1500,
    remainingSeconds: 1500,
    displayTime: '25:00',
    progress: 0,
    status: 'idle',
    statusText: '准备开始',
    actionText: '开始',
    todoId: '',
    todoTitle: '',
    completedTodoTitle: '',
  },

  onLoad(options) {
    const todoId = options && options.todoId ? options.todoId : ''
    const item = todoId ? todo.getTodoById(todoId) : null
    if (todoId && !item) {
      wx.showToast({ title: '待办不存在', icon: 'none' })
    }
    this.setData({
      todoId: item ? item.id : '',
      todoTitle: item ? item.title : '',
      completedTodoTitle: '',
    })
    this.applyTimerState(createFocusState(25))
  },

  onUnload() {
    this.clearTimer()
  },

  applyTimerState(state) {
    this.setData({
      ...state,
      statusText: statusText(state.status),
      actionText: actionText(state.status),
    })
  },

  clearTimer() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  onDurationTap(e) {
    if (this.data.status === 'running') {
      return
    }
    const minutes = Number(e.currentTarget.dataset.minutes)
    this.applyTimerState(createFocusState(minutes))
  },

  onStart() {
    if (this.data.status === 'running') {
      return
    }
    this.startCountdown(getStartSeconds(this.data))
  },

  onPause() {
    if (this.data.status !== 'running') {
      return
    }
    const remainingSeconds = getRemainingSeconds(this._endAt, Date.now())
    this.clearTimer()
    this.setData({
      remainingSeconds,
      displayTime: formatSeconds(remainingSeconds),
      progress: getProgress(this.data.totalSeconds, remainingSeconds),
      status: 'paused',
      statusText: statusText('paused'),
      actionText: actionText('paused'),
    })
  },

  onReset() {
    this.clearTimer()
    this.applyTimerState(createFocusState(this.data.durationMinutes))
  },

  startCountdown(seconds) {
    const remainingSeconds = Math.max(0, seconds)
    this.clearTimer()
    this._endAt = Date.now() + remainingSeconds * 1000
    this.setData({
      status: 'running',
      statusText: statusText('running'),
      actionText: actionText('running'),
    })
    this.updateTick()
    this._timer = setInterval(() => this.updateTick(), 500)
  },

  updateTick() {
    const remainingSeconds = getRemainingSeconds(this._endAt, Date.now())
    const progress = getProgress(this.data.totalSeconds, remainingSeconds)
    this.setData({
      remainingSeconds,
      displayTime: formatSeconds(remainingSeconds),
      progress,
    })
    if (remainingSeconds === 0) {
      this.clearTimer()
      const todoId = this.data.todoId
      const todoTitle = this.data.todoTitle
      if (todoId) {
        todo.completeFocus(todoId, this.data.totalSeconds)
        this.setData({
          todoId: '',
          todoTitle: '',
          completedTodoTitle: todoTitle,
        })
      }
      this.setData({
        status: 'done',
        statusText: statusText('done'),
        actionText: actionText('done'),
        progress: 100,
      })
      wx.showToast({
        title: todoId ? '待办已完成' : '专注完成',
        icon: 'success',
      })
    }
  },
})
