import {extname} from 'path'

import * as fileformats from './fileformats/index.js'
import * as sgf from './fileformats/sgf'

function addMainProperty(tree) {
  return tree.mutate(draft => {
    let node = draft.root
    while (node != null) {
      draft.addToProperty(node.id, 'MAIN', true)
      node = node.children[0]
    }
  })
}

/**
 * 棋譜を文字列データから読み込みます。
 */
export function loadTreeFromData(content, {addToMain = true} = {}) {
  try {
    let gameTrees = sgf.parse(content, () => {})
    if (gameTrees == null || gameTrees.length === 0) return null

    return addToMain ? addMainProperty(gameTrees[0]) : gameTrees[0]
  } catch (err) {
    console.log(err.message)
    return null
  }
}

/**
 * ファイルから棋譜を読み込みます。
 */
export function loadTreeFromFile(filename, {addToMain = true} = {}) {
  try {
    let extension = extname(filename).slice(1)
    let fileFormatModule = fileformats.getModuleByExtension(extension)
    let gameTrees = fileFormatModule.parseFile(filename, () => {})
    if (gameTrees == null || gameTrees.length === 0) return null

    return addToMain ? addMainProperty(gameTrees[0]) : gameTrees[0]
  } catch (err) {
    console.log(err.message)
    return null
  }
}

/**
 * 現状のノードツリーは残しつつ、新しいノードを追加で読み込みます。
 */
export function loadTreeAppend(tree, mainTree) {
  if (mainTree == null) {
    return
  }

  let mainTreeNode = mainTree.root.children[0]
  if (mainTreeNode == null) {
    return
  }

  let newTreePosition = tree.root.id
  let newTree = tree.mutate(draft => {
    for (let n of tree.listNodes()) {
      draft.removeProperty(n.id, 'MAIN')
    }

    // 必要ならrootノードにMAIN属性を付けます。
    if ('MAIN' in mainTree.root.data) {
      draft.updateProperty(draft.root.id, 'MAIN', mainTree.root.data)
    }

    while (newTreePosition != null && mainTreeNode != null) {
      newTreePosition = draft.appendNode(newTreePosition, mainTreeNode.data)
      mainTreeNode = mainTreeNode.children[0]
    }
  })

  return {newTree, newTreePosition}
}
