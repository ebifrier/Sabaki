import assert from 'assert'
import fs from 'fs'

import * as gametree from '../src/modules/gametree'
import * as aiwith from '../src/modules/aiwith.js'

describe('aiwith', () => {
  let names = ['blank', 'pro', 'beginner', 'shodan']
  let mainLongPath = `${__dirname}/sgf/branch_main_long.sgf`
  let mainShortPath = `${__dirname}/sgf/branch_main_short.sgf`
  let branchPath = `${__dirname}/sgf/branch.sgf`

  describe('loadTreeFromData', () => {
    it('load test content', () => {
      for (let name of names) {
        let filename = `${__dirname}/sgf/${name}_game.sgf`
        let content = fs.readFileSync(filename, {encoding: 'utf-8'})
        let tree = aiwith.loadTreeFromData(content)
        assert.ok(tree != null)
        assert.ok(tree.mutate != null)
      }
    })

    it('load error content', () => {
      assert.equal(aiwith.loadTreeFromData('{test 日本語}'), null)
      assert.equal(aiwith.loadTreeFromData(''), null)
      assert.equal(aiwith.loadTreeFromData(null), null)
    })
  })

  describe('loadTreeFromFile', () => {
    it('load test files', () => {
      for (let name of names) {
        let filename = `${__dirname}/sgf/${name}_game.sgf`
        let tree = aiwith.loadTreeFromFile(filename)
        assert.ok(tree != null)
        assert.ok(tree.mutate != null)
      }
    })

    it('load non-exist files', () => {
      assert.equal(aiwith.loadTreeFromFile('unknown.test'), null)
      assert.equal(aiwith.loadTreeFromFile(''), null)
      assert.equal(aiwith.loadTreeFromFile(null), null)
    })
  })

  describe('loadTreeAppend', () => {
    let testLoadTreeAppend = mainFilename => {
      function generateMains(mainNodes) {
        let mains = []
        newTree.mutate(draft => {
          let nodeId = newTree.root.id
          mains.push(nodeId)
          for (let mainNode of mainNodes.slice(1)) {
            nodeId = draft.appendNode(nodeId, mainNode.data)
            mains.push(nodeId)
            assert.ok(nodeId != null)
          }
        })
        return mains
      }

      let tree = aiwith.loadTreeFromFile(branchPath)
      assert.ok(tree != null)

      let mainTree = aiwith.loadTreeFromFile(mainFilename)
      let {newTree} = aiwith.loadTreeAppend(tree, mainTree)

      let mainNodes = Array.from(mainTree.listMainNodes())
      let mains = Array.from(generateMains(mainNodes))
      assert.ok(mains.length > 4)

      for (let n of newTree.listNodes()) {
        if (mains.includes(n.id)) {
          assert.ok(!!n.data.MAIN)
          mains = mains.filter(id => id !== n.id)
        } else {
          assert.ok(!n.data.MAIN)
        }
      }

      assert.equal(mains.length, 0)
    }

    it('load main variations', () => {
      testLoadTreeAppend(mainShortPath)
      testLoadTreeAppend(mainLongPath)
    })

    it('append empty tree', () => {
      let tree = aiwith.loadTreeFromFile(mainLongPath)
      let emptyTree = gametree.new()

      let {newTree, newTreePosition} = aiwith.loadTreeAppend(tree, emptyTree)
      assert.ok(!!newTree)
      assert.equal(newTreePosition, newTree.root.id)
    })
  })

  describe('includeSubTree', () => {
    let removeNodes = (tree, count) =>
      tree.mutate(draft => {
        for (let node of [...tree.listNodes()].reverse()) {
          if (count <= 0) break
          draft.removeNode(node, {suppressConfirmation: true})
          count -= 1
        }
      })

    it('include sub tree with main', () => {
      let tree = aiwith.loadTreeFromFile(mainLongPath)
      for (let i = 0; i < 100; ++i) {
        let subTree = removeNodes(tree, i)
        assert.ok(aiwith.includeSubTree(tree, subTree))
        assert.ok(aiwith.includeSubTree(tree, subTree, {checkMain: false}))
      }

      tree = aiwith.loadTreeFromFile(mainShortPath)
      for (let i = 0; i < 40; ++i) {
        let subTree = removeNodes(tree, i)
        assert.ok(aiwith.includeSubTree(tree, subTree))
        assert.ok(aiwith.includeSubTree(tree, subTree, {checkMain: false}))
      }
    })

    it('include sub tree without main', () => {
      let tree = aiwith.loadTreeFromFile(mainLongPath, {addToMain: false})
      for (let i = 0; i < 100; ++i) {
        let subTree = removeNodes(tree, i)
        assert.ok(!aiwith.includeSubTree(tree, subTree))
        assert.ok(aiwith.includeSubTree(tree, subTree, {checkMain: false}))
      }

      tree = aiwith.loadTreeFromFile(mainShortPath, {addToMain: false})
      for (let i = 0; i < 40; ++i) {
        let subTree = removeNodes(tree, i)
        assert.ok(!aiwith.includeSubTree(tree, subTree))
        assert.ok(aiwith.includeSubTree(tree, subTree, {checkMain: false}))
      }
    })

    it('not include sub tree with main', () => {
      let tree = aiwith.loadTreeFromFile(mainLongPath, {addToMain: true})
      let subTree = aiwith.loadTreeFromFile(mainShortPath)

      assert.ok(!aiwith.includeSubTree(tree, subTree, {checkMain: true}))
      assert.ok(!aiwith.includeSubTree(tree, subTree, {checkMain: false}))
    })

    it('not include sub tree without main', () => {
      let tree = aiwith.loadTreeFromFile(mainLongPath)
      let subTree = aiwith.loadTreeFromFile(mainShortPath)

      assert.ok(!aiwith.includeSubTree(tree, subTree, {checkMain: true}))
      assert.ok(!aiwith.includeSubTree(tree, subTree, {checkMain: false}))
    })
  })

  describe('removeSubNodes', () => {
    it('not removing nodes', () => {
      let testNotRemovedNodes = path => {
        let tree = aiwith.loadTreeFromFile(path)
        let newTree = aiwith.removeSubNodes(tree)
        let nodes = [...tree.listNodes()]
        let newNodes = [...newTree.listNodes()]

        assert.equal(newNodes.length, nodes.length)
      }

      testNotRemovedNodes(mainLongPath)
      testNotRemovedNodes(mainShortPath)
    })

    it('remove all nodes', () => {
      let testRemoveAllNodes = path => {
        let tree = aiwith.loadTreeFromFile(path, {addToMain: false})
        let newTree = aiwith.removeSubNodes(tree)
        let newNodes = [...newTree.listNodes()]

        assert.equal(newNodes.length, 1)
      }

      testRemoveAllNodes(mainLongPath)
      testRemoveAllNodes(mainShortPath)
    })

    it('remove sub nodes', () => {
      let tree = aiwith.loadTreeFromFile(branchPath)
      let newTree = aiwith.removeSubNodes(tree)
      let newNodes = [...newTree.listNodes()]
      let newCurrentNodes = [
        ...newTree.listNodesVertically(newTree.root.id, +1, {})
      ]

      assert.equal(newCurrentNodes.length, newNodes.length)
    })
  })
})
