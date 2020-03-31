import {ipcRenderer, remote} from 'electron'
import {h, render, Component} from 'preact'
import Jimp from 'jimp'

import Goban from './Goban.js'
import sabaki from '../modules/sabaki.js'
import * as gametree from '../modules/gametree.js'

const setting = remote.require('./setting')
const CanvasWidth = 1920
const CanvasHeight = 1080

class Rectangle {
  constructor(left = 0, top = 0, right = 0, bottom = 0) {
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
  }

  get width() {
    return Math.abs(this.right - this.left)
  }

  get height() {
    return Math.abs(this.bottom - this.top)
  }
}

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

    this.background.src = this.state.design.backgroundPath
    this.whiteBar.src = this.state.design.whiteBarPath

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

  async getVisibleRect(imagePath) {
    const MaxValue = Number.MAX_SAFE_INTEGER

    try {
      let image = await Jimp.read(imagePath)
      let bitmap = image.bitmap
      let rect = new Rectangle(MaxValue, MaxValue, 0, 0)

      image.scan(0, 0, bitmap.width, bitmap.height, (x, y, idx) => {
        let alpha = bitmap.data[idx + 3]

        if (alpha > 0) {
          rect.left = Math.min(rect.left, x)
          rect.top = Math.min(rect.top, y)
          rect.right = Math.max(rect.right, x)
          rect.bottom = Math.max(rect.bottom, y)
        }
      })

      rect.left -= 4
      rect.right += 4
      return rect
    } catch {
      return null
    }
  }

  async onWhiteBarLoaded() {
    this.whiteBarRect = await this.getVisibleRect(
      this.state.design.whiteBarPath
    )
    this.forceUpdate()
  }

  // Render

  renderCanvas() {
    let normalizeWinrate = value => {
      value = Math.round(value)
      return Math.max(1, Math.min(value, 99))
    }

    let renderScoreValue = winrate => {
      let blackWinrate = normalizeWinrate(winrate)
      let whiteWinrate = 100 - blackWinrate

      ctx.font = `bold ${design.scoreValueFontSize}pt Arial`
      ctx.fillStyle = 'white'
      ctx.fillText(
        blackWinrate.toString(),
        design.scoreValueBlackX,
        design.scoreValueBlackY
      )

      ctx.fillStyle = 'black'
      ctx.fillText(
        whiteWinrate.toString(),
        design.scoreValueWhiteX,
        design.scoreValueWhiteY
      )
    }

    let calcWhiteBarRect = (whiteBarRect, winrate, blackIsLeft) => {
      let value = blackIsLeft ? winrate : 100.0 - winrate
      let offset = (whiteBarRect.width * value) / 100.0

      return blackIsLeft
        ? new Rectangle(
            this.whiteBarRect.left + offset,
            this.whiteBarRect.top,
            this.whiteBarRect.right,
            this.whiteBarRect.bottom
          )
        : new Rectangle(
            this.whiteBarRect.left,
            this.whiteBarRect.top,
            this.whiteBarRect.left + offset,
            this.whiteBarRect.bottom
          )
    }

    let ctx = this.canvas.getContext('2d')
    let w = this.background.naturalWidth || CanvasWidth
    let h = this.background.naturalHeight || CanvasHeight
    let design = this.state.design

    this.canvas.width = w
    this.canvas.height = h

    let analysis = this.state.analysis || {}
    let winrate = analysis.sign > 0 ? analysis.winrate : 100 - analysis.winrate
    if (winrate == null || isNaN(winrate)) winrate = 50
    winrate = normalizeWinrate(winrate)

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(this.background, 0, 0, w, h, 0, 0, w, h)

    if (this.whiteBarRect != null) {
      let rect = calcWhiteBarRect(
        this.whiteBarRect,
        winrate,
        design.blackIsLeft
      )

      ctx.drawImage(
        this.whiteBar,
        rect.left,
        rect.top,
        rect.width,
        rect.height,
        rect.left,
        rect.top,
        rect.width,
        rect.height
      )
    }

    if (design.showScoreValue) {
      renderScoreValue(winrate)
    }
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
      {
        class: 'design-main'
      },

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
