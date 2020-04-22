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

/**
 * treeにsubTreeのノードが含まれているか調べます。
 */
export function includeSubTree(tree, subTree, {checkMain = true} = {}) {
  let getNextNode = (parent, data) => {
    for (let child of parent.children) {
      if (tree.merger(child, data) != null) return child
    }
    return null
  }

  let subTreeNode = subTree.root.children[0]
  let parentNode = tree.root
  while (parentNode != null && subTreeNode != null) {
    let nextNode = getNextNode(parentNode, subTreeNode.data)
    if (nextNode == null || (checkMain && !nextNode.data.MAIN)) return false

    subTreeNode = subTreeNode.children[0]
    parentNode = nextNode
  }

  return true
}

/**
 * MAINノード以外のノードを削除します。
 */
export function removeSubNodes(tree) {
  let newTreePosition = null
  let newTree = tree.mutate(draft => {
    for (let node of [...tree.listNodes()].reverse()) {
      if (!!node.data.MAIN) {
        if (newTreePosition == null) newTreePosition = node.id
      } else if (node.id !== draft.root.id) {
        draft.removeNode(node.id)
      }
    }
  })

  newTreePosition = newTreePosition || newTree.root.id
  return {newTree, newTreePosition}
}
