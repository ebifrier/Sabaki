import assert from 'assert'
import fs from 'fs'
import * as aiwithgo from '../src/modules/aiwith.js'

describe('aiwith', () => {
  let names = ['blank', 'pro', 'beginner', 'shodan']

  describe('clearMainProperty', () => {
    it('clear all', () => {
      let filename = `${__dirname}/sgf/branch.sgf`
      let tree = aiwithgo.loadTreeFromFile(filename)
      assert.ok(tree != null)

      tree.mutate(draft => {
        for (let n of tree.listNodes()) {
          draft.updateProperty(n.id, 'MAIN', [true])
        }
      })
      aiwithgo.clearMainProperty(tree)

      for (let n of tree.listNodes()) {
        assert.ok(n.data.MAIN == null)
      }
    })
  })

  describe('loadTreeFromData', () => {
    it('load test content', () => {
      for (let name of names) {
        let filename = `${__dirname}/sgf/${name}_game.sgf`
        let content = fs.readFileSync(filename, {encoding: 'utf-8'})
        let tree = aiwithgo.loadTreeFromData(content)
        assert.ok(tree != null)
        assert.ok(tree.mutate != null)
      }
    })
  })

  describe('loadTreeFromFile', () => {
    it('load test files', () => {
      for (let name of names) {
        let filename = `${__dirname}/sgf/${name}_game.sgf`
        let tree = aiwithgo.loadTreeFromFile(filename)
        assert.ok(tree != null)
        assert.ok(tree.mutate != null)
      }
    })
  })

  describe('loadTreeAppend', () => {
    let testLoadTreeAppend = mainFilename => {
      let filename = `${__dirname}/sgf/branch.sgf`
      let tree = aiwithgo.loadTreeFromFile(filename)
      assert.ok(tree != null)

      let mainTree = aiwithgo.loadTreeFromFile(mainFilename)
      let {newTree} = aiwithgo.loadTreeAppend(tree, mainTree)

      function generateMains(mainNodes) {
        let mains = []
        newTree.mutate(draft => {
          let nodeId = newTree.root.id
          for (let mainNode of mainNodes.slice(1)) {
            nodeId = draft.appendNode(nodeId, mainNode.data)
            mains.push(nodeId)
            assert.ok(nodeId != null)
          }
        })
        return mains
      }

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
      testLoadTreeAppend(`${__dirname}/sgf/branch_main_short.sgf`)
      testLoadTreeAppend(`${__dirname}/sgf/branch_main_long.sgf`)
    })
  })
})
