import {extname} from 'path'

import * as fileformats from './fileformats/index.js'
import * as sgf from './fileformats/sgf'
import {loggers} from 'winston'

export function loadTreeFromData(content) {
  try {
    let gameTrees = sgf.parse(content, () => {})

    return gameTrees.length > 0 ? gameTrees[0] : null
  } catch (err) {
    console.log(err.message)
    return null
  }
}

export function loadTreeFromFile(filename) {
  try {
    let extension = extname(filename).slice(1)
    let fileFormatModule = fileformats.getModuleByExtension(extension)
    let gameTrees = fileFormatModule.parseFile(filename, () => {})

    return gameTrees.length > 0 ? gameTrees[0] : null
  } catch (err) {
    console.log(err.message)
    return null
  }
}

export function loadTreeAppend(tree, mainTree) {
  if (mainTree == null) {
    return
  }

  let mainTreeNode = mainTree.root.children[0]
  if (mainTreeNode == null) {
    return
  }

  let nextTreePosition = tree.root.id
  let newTree = tree.mutate(draft => {
    for (let n of tree.listNodes()) {
      draft.removeProperty(n.id, 'MAIN')
    }

    while (nextTreePosition != null && mainTreeNode != null) {
      nextTreePosition = draft.appendNode(nextTreePosition, {
        ...mainTreeNode.data,
        MAIN: [true]
      })
      mainTreeNode = mainTreeNode.children[0]
    }
  })

  return {newTree, newTreePosition: nextTreePosition}
}
