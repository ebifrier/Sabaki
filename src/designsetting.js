const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const {BrowserWindow} = require('electron')

const setting = require('./setting')

let settings = {}

let defaults = {
  'design.show_heatmap': true,
  'design.test_mode': false,
  'design.black_left': true,
  'design.show_goban': true,
  'design.goban_left': 55,
  'design.goban_top': 18,
  'design.goban_right': 94,
  'design.goban_bottom': 90,
  'design.show_score': true,
  'design.score_blackx': 200,
  'design.score_blacky': 200,
  'design.score_whitex': 400,
  'design.score_whitey': 200,
  'design.score_fontsize': 30,
  'design.background_path': './img/premium/background.png',
  'design.whitebar_path': './img/premium/white_bar.png'
}

let eventEmitters = {}

exports.events = {
  on: (id, event, f) => {
    if (eventEmitters[id] == null) {
      eventEmitters[id] = new EventEmitter()
      eventEmitters[id].setMaxListeners(30)
    }

    eventEmitters[id].on(event, f)
  },
  emit: (event, evt) => {
    let windows = BrowserWindow.getAllWindows()

    for (let id in eventEmitters) {
      if (!windows.some(window => window.id.toString() === id)) {
        delete eventEmitters[id]
      } else {
        eventEmitters[id].emit(event, evt)
      }
    }
  }
}

exports.load = function(filePath = 'design.json') {
  try {
    let settingsPath = path.join(setting.userDataDirectory, filePath)
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
  } catch (err) {
    settings = {}
  }

  // Load default settings

  for (let key in defaults) {
    if (key in settings) continue
    settings[key] = defaults[key]
  }

  // Delete invalid settings

  for (let key in settings) {
    if (key in defaults) continue
    delete settings[key]
  }

  return exports
}

exports.save = function(filePath = 'design.json') {
  let settingsPath = path.join(setting.userDataDirectory, filePath)
  let keys = Object.keys(settings).sort()

  fs.writeFileSync(
    settingsPath,
    JSON.stringify(
      keys.reduce((acc, key) => ((acc[key] = settings[key]), acc), {}),
      null,
      '  '
    )
  )

  return exports
}

exports.get = function(key) {
  if (key in settings) return settings[key]
  if (key in defaults) return defaults[key]
  return null
}

exports.set = function(key, value) {
  settings[key] = value
  exports.save()
  exports.events.emit('change', {key, value})
  return exports
}

exports.load()
