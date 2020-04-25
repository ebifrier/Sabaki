const fs = require('fs')
const glob = require('glob')
const {normalize, resolve} = require('path')

const sgf = require('@sabaki/sgf')
const gametree = require('./modules/gametree')
const aiwith = require('./modules/aiwith')

const state = {}

let resetTree = () => {
  let {inputPathes} = state
  let index = Math.floor(Math.random() * inputPathes.length)
  let path = inputPathes[index]
  let tree = aiwith.loadTreeFromFile(path, {addToMain: false})

  Object.assign(state, {
    tree,
    treeNode: tree.root,
    currTree: gametree.new()
  })

  console.log('reset tree')
}

let appendNode = ({treeNode, currTree}) => {
  let [nextNode] = treeNode.children
  let newTree = currTree.mutate(draft => {
    let [lastCurrNode] = [...currTree.listNodes()].slice(-1)
    draft.appendNode(lastCurrNode.id, nextNode.data)
  })

  Object.assign(state, {
    treeNode: nextNode,
    currTree: newTree
  })

  console.log('append tree:', nextNode.data)
}

function updateRecord() {
  let {tree, treeNode} = state

  if (tree == null || treeNode == null || treeNode.children.length === 0) {
    resetTree()
  } else {
    appendNode(state)
  }

  let {currTree, recordPath} = state
  aiwith.saveTree(currTree, recordPath)

  let interval = Math.random() * 5 * 1000
  setTimeout(updateRecord, interval)
}

function main(recordPath) {
  let globPathes = () => {
    const pattern = normalize(`./test/record/*.sgf`)
    return glob.sync(pattern)
  }

  Object.assign(state, {
    inputPathes: globPathes(),
    recordPath
  })

  updateRecord()
}

if (process.argv.length < 3) {
  console.error('The record file path is needed')
  process.exit(-1)
}

main(resolve(process.argv[2]))
