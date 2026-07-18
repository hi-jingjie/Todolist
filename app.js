const todo = require('./utils/todo')

App({
  onLaunch() {
    todo.initIfNeeded()
  },
})
