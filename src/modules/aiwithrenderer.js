import {remote} from 'electron'
import fs from 'fs'
import {loggers} from 'winston'

import * as aiwith from './aiwith'
import sabaki from './sabaki.js'

const designsetting = remote.require('./designsetting')
let lastLoadedData = null
let recordWatchingId = null

export function startRecordWatching() {
  try {
    if (recordWatchingId == null) {
      recordWatchingId = setInterval(() => reloadRecord(), 500)
    }
  } catch (err) {
    console.log(err.message)
    return null
  }
}

export function stopRecordWatching() {
  if (recordWatchingId != null) {
    clearInterval(recordWatchingId)
  }
}

export async function reloadRecord(mode = null, force = false) {
  let loadRecord = async (error, data) => {
    if (error) {
      throw error
    }

    if (!force && data == lastLoadedData) {
      return
    }

    let mainTree = aiwith.loadTreeFromData(data)
    if (mainTree == null) {
      throw new Error('failed to load the record file')
    }

    if ((mode || sabaki.state.mode) === 'watch') {
      await sabaki.loadGameTrees([mainTree], {
        suppressAskForSave: true,
        clearHistory: true
      })
      sabaki.goToEnd()
    } else {
      let tree = sabaki.state.gameTrees[sabaki.state.gameIndex]
      if (tree == null) {
        throw new Error('gameTree is null')
      }

      let {newTree} = aiwith.loadTreeAppend(tree, mainTree)
      sabaki.setCurrentTreePosition(newTree, sabaki.state.treePosition)
    }

    console.log('the new record file was loaded')
    lastLoadedData = data
  }

  return new Promise((resolve, reject) => {
    let path = designsetting.get('record.watch_filepath')
    if (path == null) return

    fs.readFile(path, 'utf8', (error, data) => {
      try {
        loadRecord(error, data).then(() => resolve())
      } catch (error) {
        reject({error})
      }
    })
  })
}
