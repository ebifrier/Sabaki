import {ipcRenderer, remote} from 'electron'
import {h, render, Component} from 'preact'
import Jimp from 'jimp'

import GoBoard from '@sabaki/go-board'
import Goban from './Goban.js'
import sabaki from '../modules/sabaki.js'
import * as gametree from '../modules/gametree.js'

const dsetting = remote.require('./designsetting')
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
    this.background.onerror = () => this.background.setAttribute('src', '')
    this.background.src = dsetting.get('design.background_path')

    this.whiteBar = new Image()
    this.whiteBar.onload = async () => await this.onWhiteBarLoaded()
    this.whiteBar.onerror = () => this.whiteBar.setAttribute('src', '')
    this.whiteBar.src = dsetting.get('design.whitebar_path')

    let window = remote.getCurrentWindow()
    dsetting.events.on(window.id, 'change', this.onChangeSetting.bind(this))

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

  onChangeSetting({key}) {
    if (key === 'design.background_path') {
      this.background.src = dsetting.get('design.background_path')
    } else if (key === 'design.whitebar_path') {
      this.whiteBar.src = dsetting.get('design.whitebar_path')
    }

    this.forceUpdate()
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
      dsetting.get('design.whitebar_path')
    )
    this.forceUpdate()
  }

  getTestBoard() {
    let board = GoBoard.fromDimensions(19, 19)
    board.set([9, 2], +1)
    board.set([11, 2], +1)
    board.set([13, 2], -1)
    board.set([15, 2], +1)
    board.set([16, 2], -1)
    board.set([17, 2], +1)
    board.set([3, 3], -1)
    board.set([15, 3], +1)
    board.set([16, 3], +1)
    board.set([17, 3], -1)
    board.set([16, 4], +1)
    board.set([17, 4], -1)
    board.set([14, 5], +1)
    board.set([15, 5], +1)
    board.set([16, 5], -1)
    board.set([15, 6], -1)
    board.set([16, 6], -1)
    board.set([16, 10], -1)
    board.set([15, 13], -1)
    board.set([3, 15], -1)
    board.set([15, 16], +1)

    return Object.assign(board, {
      markers: board.signMap.map(row => row.map(_ => null)),
      lines: [],
      childrenInfo: [],
      siblingsInfo: []
    })
  }

  getTestAnalysis() {
    return {
      sign: -1,
      winrate: dsetting.get('design.test_winrate'),
      variations: [
        {
          vertex: [5, 2],
          visits: 100,
          winrate: 96.0
        },
        {
          vertex: [2, 16],
          visits: 50,
          winrate: 50.0
        },
        {
          vertex: [13, 5],
          visits: 20,
          winrate: 26.0
        },
        {
          vertex: [14, 6],
          visits: 100,
          winrate: 89.0
        },
        {
          vertex: [10, 3],
          visits: 70,
          winrate: 49.0
        },
        {
          vertex: [2, 12],
          visits: 50,
          winrate: 3.0
        },
        {
          vertex: [2, 5],
          visits: 30,
          winrate: 8.0
        },
        {
          vertex: [5, 16],
          visits: 28,
          winrate: 27.0
        }
      ]
    }
  }

  getAnalysis(analysis) {
    return dsetting.get('design.test_mode') ? this.getTestAnalysis() : analysis
  }

  // Render

  renderCanvas(analysis) {
    let normalizeWinrate = (winrate, round = false) => {
      if (winrate == null || isNaN(winrate)) winrate = 50
      if (round) winrate = Math.round(winrate)
      return Math.max(1, Math.min(winrate, 99))
    }

    let getWinrate = (analysis = {}) => {
      let winrate =
        analysis == null || analysis.winrate == null
          ? 50
          : analysis.sign > 0
          ? analysis.winrate
          : 100 - analysis.winrate
      return normalizeWinrate(winrate)
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

    let renderWhiteBarRect = (ctx, winrate) => {
      let rect = calcWhiteBarRect(
        this.whiteBarRect,
        winrate,
        dsetting.get('design.black_left')
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

    let renderScoreValue = (ctx, winrate) => {
      let blackWinrate = normalizeWinrate(winrate, true)
      let whiteWinrate = 100 - blackWinrate
      let winratePosList = [
        [
          dsetting.get('design.score_blackx'),
          dsetting.get('design.score_blacky')
        ],
        [
          dsetting.get('design.score_whitex'),
          dsetting.get('design.score_whitey')
        ]
      ]
      let blackIndex = dsetting.get('design.black_left') ? 0 : 1

      ctx.font = `bold ${dsetting.get('design.score_fontsize')}pt Arial`
      ctx.fillStyle = 'white'
      ctx.fillText(
        ('00' + blackWinrate).slice(-2),
        winratePosList[blackIndex][0],
        winratePosList[blackIndex][1]
      )

      ctx.fillStyle = 'black'
      ctx.fillText(
        ('00' + whiteWinrate).slice(-2),
        winratePosList[1 - blackIndex][0],
        winratePosList[1 - blackIndex][1]
      )
    }

    let ctx = this.canvas.getContext('2d')
    let w = this.background.naturalWidth || CanvasWidth
    let h = this.background.naturalHeight || CanvasHeight
    let winrate = getWinrate(analysis)

    this.canvas.width = w
    this.canvas.height = h

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(this.background, 0, 0, w, h, 0, 0, w, h)

    if (this.whiteBarRect != null) {
      renderWhiteBarRect(ctx, winrate)
    }

    if (dsetting.get('design.show_score')) {
      renderScoreValue(ctx, winrate)
    }
  }

  render(_, state) {
    let gameTree = state.gameTrees[state.gameIndex]
    let treePosition = state.treePosition
    let analysis = this.getAnalysis(state.analysis)
    let board = dsetting.get('design.test_mode')
      ? this.getTestBoard()
      : gameTree.get(treePosition) != null
      ? gametree.getBoard(gameTree, treePosition)
      : gametree.getBoard(gameTree, gameTree.root.id)

    if (this.canvas != null) {
      this.renderCanvas(analysis)
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
            left: `${dsetting.get('design.goban_left')}%`,
            top: `${dsetting.get('design.goban_top')}%`,
            right: `${100 - dsetting.get('design.goban_right')}%`,
            bottom: `${100 - dsetting.get('design.goban_bottom')}%`
          }
        },

        dsetting.get('design.show_goban')
          ? h(Goban, {
              gameTree,
              treePosition,
              board,
              analysisType: 'simple',
              analysis: dsetting.get('design.test_mode')
                ? analysis
                : dsetting.get('design.show_heatmap') &&
                  state.analysisTreePosition != null &&
                  state.analysisTreePosition === treePosition
                ? analysis
                : null,

              showCoordinates: false,
              showNextMoves: false,
              showSiblings: false,
              fuzzyStonePlacement: false,
              animateStonePlacement: true,
              transformation: state.boardTransformation
            })
          : null
      ),

      h('div', {
        class: 'movable-area'
      })
    )
  }
}

// Render

render(h(DesignApp), document.body)
