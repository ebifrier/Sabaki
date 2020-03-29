import {ipcRenderer, remote} from 'electron'
import {h, render, Component} from 'preact'
import Jimp from 'jimp'

import Goban from './Goban.js'
import sabaki from '../modules/sabaki.js'
import * as gametree from '../modules/gametree.js'

const setting = remote.require('./setting')
const CanvasWidth = 1920
const CanvasHeight = 1080

class DesignApp extends Component {
  constructor(props) {
    super(props)

    this.state = sabaki.state
    this.canvas = null
    this.whiteBarRect = null

    this.background = new Image()
    this.background.onload = () => this.onBackgroundLoaded()

    this.whiteBar = new Image()
    this.whiteBar.onload = async () => await this.onWhiteBarLoaded()

    this.background.src = this.state.design.backgroundImage
    this.whiteBar.src = this.state.design.whiteBarImage

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

  onBackgroundLoaded() {
    this.forceUpdate()
  }

  async getImagePixelRect(imagePath) {
    let image = await Jimp.read(imagePath)
    let bitmap = image.bitmap
    let rect = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0, 0]

    image.scan(0, 0, bitmap.width, bitmap.height, (x, y, idx) => {
      let alpha = this.bitmap.data[idx + 3]

      if (alpha > 0) {
        rect[0] = Math.min(rect[0], x)
        rect[1] = Math.min(rect[1], y)
        rect[2] = Math.max(rect[2], x)
        rect[3] = Math.max(rect[3], y)
      }
    })

    return rect
  }

  async onWhiteBarLoaded() {
    this.whiteBarRect = await this.getImagePixelRect(
      this.state.design.whiteBarImage
    )
    this.forceUpdate()
  }

  // Render

  renderCanvas() {
    let ctx = this.canvas.getContext('2d')
    let cw = CanvasWidth
    let ch = CanvasHeight
    let sw = this.background.naturalWidth
    let sh = this.background.naturalHeight

    this.canvas.width = CanvasWidth
    this.canvas.height = CanvasHeight

    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(this.background, 0, 0, sw, sh, 0, 0, cw, ch)
    ctx.drawImage(this.whiteBar, 0, 0, 400, sh, 0, 0, 400, ch)

    ctx.fillStyle = 'red'
    ctx.font = 'bold 40pt Arial'
    ctx.fillText('55', 0, 100)
    ctx.fillText('88', 200, 100)
  }

  render(_, state) {
    let gameTree = state.gameTrees[state.gameIndex]
    let treePosition = state.treePosition
    let design = state.design

    let board =
      gameTree.get(treePosition) != null
        ? gametree.getBoard(gameTree, treePosition)
        : gametree.getBoard(gameTree, gameTree.root.id)

    if (this.canvas != null) {
      this.renderCanvas()
    }

    return h(
      'main',
      {class: 'design-main'},
      h('canvas', {
        class: 'background',
        ref: el => (this.canvas = el)
      }),
      h(
        'div',
        {
          class: 'goban-wrap',
          style: {
            left: `${design.gobanLeft}%`,
            top: `${design.gobanTop}%`,
            right: `${100 - design.gobanRight}%`,
            bottom: `${100 - design.gobanBottom}%`
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
