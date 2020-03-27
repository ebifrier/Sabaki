import {remote} from 'electron'
import fs from 'fs'
import {loggers} from 'winston'

import * as aiwith from './aiwith'
import sabaki from './sabaki.js'

const setting = remote.require('./setting')
let lastLoadedData = null
let recordWatching = false

export function resetRecordWatchingData() {
  lastLoadedData = null
}

export function startRecordWatching() {
  try {
    if (!recordWatching) {
      recordWatching = true
      reloadRecord()
    }
  } catch (err) {
    console.log(err.message)
    return null
  }
}

export function stopRecordWatching() {
  recordWatching = false
}

export async function reloadRecord() {
  let filename = setting.get('.watch_filename')
  filename = 'C:/Users/ebifrier/Desktop/record.sgf'

  return new Promise((resolve, reject) => {
    let processData = (error, data) => {
      if (error) {
        throw error
      }

      if (data == lastLoadedData) {
        return
      }

      let mainTree = aiwith.loadTreeFromData(data)
      if (mainTree == null) {
        throw new Error('failed to load the record file')
      }

      let tree = sabaki.state.gameTrees[sabaki.state.gameIndex]
      if (tree == null) {
        throw new Error('gameTree is null')
      }

      let {newTree} = aiwith.loadTreeAppend(tree, mainTree)
      sabaki.setCurrentTreePosition(newTree, sabaki.state.treePosition)

      console.log('the new record file was loaded')
      lastLoadedData = data
    }

    fs.readFile(filename, 'utf8', (error, data) => {
      try {
        processData(error, data)
        resolve({})
      } catch (error) {
        reject({error})
      }

      if (recordWatching) {
        setTimeout(() => reloadRecord(), 1000)
      }
    })
  })
}
