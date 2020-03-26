import fs from 'fs'
import {loggers} from 'winston'

import * as aiwith from './aiwith'
import sabaki from './sabaki.js'

//const setting = electron.remote.require('./setting')
let lastLoadedData = null
let recordWatching = false

export function resetRecordWatchingData() {
  lastLoadedData = null
}

export function startRecordWatching() {
  try {
    recordWatching = true
    reloadRecord()
  } catch (err) {
    console.log(err.message)
    return null
  }
}

export function stopRecordWatching() {
  recordWatching = false
}

export async function reloadRecord() {
  //let filename = setting.get('.watch_filename')
  let filename = 'C:/Users/ebifrier/Desktop/record.sgf'

  return new Promise((resolve, reject) => {
    let resetTimmeout = () => {
      if (recordWatching) {
        setTimeout(() => reloadRecord(), 1000)
      }
    }

    fs.readFile(filename, 'utf8', (error, data) => {
      if (error) {
        reject({error})
        resetTimmeout()
        return
      }

      if (data == lastLoadedData) {
        resolve({})
        resetTimmeout()
        return
      }

      let mainTree = aiwith.loadTreeFromData(data)
      if (mainTree == null) {
        reject({error: new Error('failed to load the record file')})
        resetTimmeout()
        return
      }

      let tree = sabaki.state.gameTrees[sabaki.state.gameIndex]
      if (tree == null) {
        reject({error: ''})
        resetTimmeout()
        return
      }

      let {newTree} = aiwith.loadTreeAppend(tree, mainTree)
      sabaki.setCurrentTreePosition(newTree, sabaki.state.treePosition)
      lastLoadedData = data
      console.log('the new record file is loaded')

      resolve({})
      resetTimmeout()
    })
  })
}
