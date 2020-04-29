const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const {BrowserWindow} = require('electron')

const setting = require('./setting')

let settings = {}

let defaults = {
  'design.show_heatmap': true,
  'design.black_left': true,
  'design.test_mode': false,
  'design.test_winrate': 50,
  'design.show_goban': true,
  'design.goban_left': 53.4,
  'design.goban_top': 13.9,
  'design.goban_right': 94.5,
  'design.goban_bottom': 96.4,
  'design.show_score': true,
  'design.score_blackx': 162,
  'design.score_blacky': 999,
  'design.score_whitex': 878,
  'design.score_whitey': 999,
  'design.score_fontsize': 42,
  'design.background_path': './img/ryusei/background.png',
  'design.whitebar_path': './img/ryusei/white_bar.png',
  'record.watch_filepath': null
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
    let settingsPath = path.isAbsolute(filePath)
      ? path.normalize(filePath)
      : path.join(setting.userDataDirectory, filePath)
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

  // Emit change events

  for (let key in settings) {
    exports.events.emit('change', {key, value: settings[key]})
  }

  return exports.save()
}

exports.save = function(filePath = 'design.json') {
  let settingsPath = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.join(setting.userDataDirectory, filePath)
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
