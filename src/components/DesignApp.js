import {ipcRenderer, remote} from 'electron'
import {h, render, Component} from 'preact'

import Goban from './Goban.js'
import sabaki from '../modules/sabaki.js'
import * as gametree from '../modules/gametree.js'

const setting = remote.require('./setting')

class DesignApp extends Component {
  constructor(props) {
    super(props)

    this.state = sabaki.state

    ipcRenderer.on('state-change', async (evt, {change}) => {
      if (change != null && change.gameRoots != null) {
        change.gameTrees = this.state.gameTrees.map((tree, i) =>
          this.newTreeFromRoot(tree, change.gameRoots[i])
        )
      }

      await this.setState(change)
    })
  }

  newTreeFromRoot(tree, root) {
    return tree.mutate(draft => {
      draft.root = root
      draft._passOnNodeCache = false
      draft._idAliases = {}
      draft._heightCache = null
      draft._structureHashCache = null
    })
  }

  componentDidMount() {}

  // Render

  render(_, state) {
    let gameTree = state.gameTrees[state.gameIndex]
    let treePosition = state.treePosition
    let design = state.design

    let board =
      gameTree.get(treePosition) != null
        ? gametree.getBoard(gameTree, treePosition)
        : gametree.getBoard(gameTree, gameTree.root.id)

    return h(
      'div',
      {
        class: 'background',
        style: {
          backgroundImage: design.backgroundImage
        }
      },
      h(
        'main',
        {
          style: {
            background: 'none',
            left: design.gobanLeft,
            top: design.gobanTop,
            right: design.gobanRight,
            bottom: design.gobanBottom
          }
        },
        h(Goban, {
          gameTree,
          treePosition,
          board,
          analysisType: design.analysisType,
          analysis:
            design.showAnalysis &&
            state.analysisTreePosition != null &&
            state.analysisTreePosition === treePosition
              ? state.analysis
              : null,

          showCoordinates: false,
          showNextMoves: false,
          showSiblings: false,
          fuzzyStonePlacement: false,
          animateStonePlacement: true,
          transformation: state.boardTransformation
        })
      ),
      h('div', {
        class: 'movable-area'
      })
    )
  }
}

// Render

render(h(DesignApp), document.body)
