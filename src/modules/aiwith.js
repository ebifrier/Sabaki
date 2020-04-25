import fs from 'fs'
import {extname} from 'path'

import * as sabakiSgf from '@sabaki/sgf'

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
 * SGFファイルに保存します。
 */
export function saveTree(tree, path) {
  try {
    let content = sabakiSgf.stringify([tree.root])

    fs.writeFileSync(path, content)
  } catch (err) {
    console.log('saveTree error:', err)
  }
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
  let mainTreeNode = mainTree.root.children[0]
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
  return tree.mutate(draft => {
    for (let node of [...tree.listNodes()].reverse()) {
      if (node.id !== draft.root.id && !node.data.MAIN) {
        draft.removeNode(node.id)
      }
    }
  })
}

/**
 * 余計な分岐とtreePosition以降の盤面をすべて削除します。
 */
export function removeOtherVariations(tree, treePosition, currents = {}) {
  return tree.mutate(draft => {
    // 現局面までの分岐を削除します。
    for (let node of tree.listNodesVertically(treePosition, -1, currents)) {
      if (node.children.length <= 1) continue
      let next = tree.navigate(node.id, 1, currents)

      for (let child of node.children) {
        if (child.id === next.id) continue

        draft.removeNode(child.id)
      }
    }

    // 現局面から先のノードをすべて削除します。
    let node = tree.get(treePosition)
    for (let child of node.children) {
      draft.removeNode(child.id)
    }
  })
}
