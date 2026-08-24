const todo = require('./utils/todo')

App({
  onLaunch() {
    todo.initIfNeeded()
    if (wx.cloud) {
      wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV,
      })
    }
  },
})
