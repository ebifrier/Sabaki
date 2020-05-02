const nativeRequire = eval('require')

const {shell, clipboard, remote} = require('electron')
const isRenderer = remote != null
const {app} = isRenderer ? remote : require('electron')

const i18n = require('./i18n')
const sabaki = isRenderer ? require('./modules/sabaki').default : null
const dialog = isRenderer ? require('./modules/dialog') : null
const setting = isRenderer
  ? remote.require('./setting')
  : nativeRequire('./setting')

exports.get = function(props = {}) {
  let toggleSetting = key => setting.set(key, !setting.get(key))
  let selectTool = tool => (
    sabaki.setMode('edit'), sabaki.setState({selectedTool: tool})
  )

  let {
    disableAll,
    disableGameLoading,
    mode,
    analysisType,
    showAnalysis,
    showCoordinates,
    coordinatesType,
    showMoveNumbers,
    showMoveColorization,
    showNextMoves,
    showSiblings,
    showWinrateGraph,
    showGameGraph,
    showCommentBox,
    showLeftSidebar,
    leftSidebarType,
    engineGameOngoing
  } = props

  let data = [
    {
      id: 'file',
      label: i18n.t('menu.file', '&File'),
      submenu: [
        {
          label: i18n.t('menu.file', '&New'),
          accelerator: 'CmdOrCtrl+N',
          navigation: true,
          enabled: !disableGameLoading,
          click: () => sabaki.newFile({playSound: true, showInfo: true})
        },
        {
          label: i18n.t('menu.file', 'New &Window'),
          accelerator: 'CmdOrCtrl+Shift+N',
          clickMain: 'newWindow',
          neverDisable: true
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.file', '&Open…'),
          accelerator: 'CmdOrCtrl+O',
          navigation: true,
          enabled: !disableGameLoading,
          click: () => sabaki.loadFile()
        },
        {
          label: i18n.t('menu.file', '&Save'),
          accelerator: 'CmdOrCtrl+S',
          click: () => sabaki.saveFile(sabaki.state.representedFilename)
        },
        {
          label: i18n.t('menu.file', 'Sa&ve As…'),
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sabaki.saveFile()
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.file', '&Clipboard'),
          submenu: [
            {
              label: i18n.t('menu.file', '&Load SGF'),
              enabled: !disableGameLoading,
              navigation: true,
              click: () => sabaki.loadContent(clipboard.readText(), 'sgf')
            },
            {
              label: i18n.t('menu.file', '&Copy SGF'),
              click: () => clipboard.writeText(sabaki.getSGF())
            },
            {
              label: i18n.t('menu.file', 'Copy &ASCII Diagram'),
              click: () => clipboard.writeText(sabaki.getBoardAscii())
            }
          ]
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.file', 'Game &Info'),
          accelerator: 'CmdOrCtrl+I',
          click: () => sabaki.openDrawer('info')
        },
        {
          label: i18n.t('menu.file', '&Manage Games…'),
          accelerator: 'CmdOrCtrl+Shift+M',
          enabled: !disableGameLoading,
          click: () => sabaki.openDrawer('gamechooser')
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.file', '&Preferences…'),
          accelerator: 'CmdOrCtrl+,',
          click: () => sabaki.openDrawer('preferences')
        }
      ]
    },
    {
      id: 'play',
      label: i18n.t('menu.play', '&Play'),
      submenu: [
        {
          label: i18n.t('menu.play', '&Toggle Player'),
          click: () =>
            sabaki.setPlayer(
              sabaki.state.treePosition,
              -sabaki.getPlayer(sabaki.state.treePosition)
            )
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.play', 'Se&lect Point'),
          accelerator: 'CmdOrCtrl+L',
          click: async () => {
            let value = await dialog.showInputBox(
              i18n.t('menu.play', 'Enter a coordinate to select a point')
            )
            if (value == null) return

            sabaki.clickVertex(value)
          }
        },
        {
          label: i18n.t('menu.play', '&Pass'),
          accelerator: 'CmdOrCtrl+P',
          click: () => sabaki.makeMove([-1, -1])
        },
        {
          label: i18n.t('menu.play', 'Resig&n'),
          click: () => sabaki.makeResign()
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.play', '&Estimate'),
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () =>
            sabaki.setMode(
              sabaki.state.mode === 'estimator' ? 'play' : 'estimator'
            )
        },
        {
          label: i18n.t('menu.play', 'Sco&re'),
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () =>
            sabaki.setMode(sabaki.state.mode === 'scoring' ? 'play' : 'scoring')
        }
      ]
    },
    {
      id: 'edit',
      label: i18n.t('menu.edit', '&Edit'),
      submenu: [
        {
          label: i18n.t('menu.edit', '&Undo'),
          accelerator: 'CmdOrCtrl+Z',
          navigation: true,
          click: () => sabaki.undo()
        },
        {
          label: i18n.t('menu.edit', 'Re&do'),
          accelerator:
            process.platform === 'win32' ? 'CmdOrCtrl+Y' : 'CmdOrCtrl+Shift+Z',
          navigation: true,
          click: () => sabaki.redo()
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.edit', 'Toggle &Edit Mode'),
          accelerator: 'CmdOrCtrl+E',
          navigation: true,
          click: () =>
            sabaki.setMode(sabaki.state.mode === 'edit' ? 'play' : 'edit')
        },
        {
          label: i18n.t('menu.edit', '&Select Tool'),
          submenu: [
            {
              label: i18n.t('menu.edit', '&Stone Tool'),
              accelerator: 'CmdOrCtrl+1',
              click: () =>
                selectTool(
                  sabaki.state.mode !== 'edit' ||
                    sabaki.state.selectedTool !== 'stone_1'
                    ? 'stone_1'
                    : 'stone_-1'
                )
            },
            {
              label: i18n.t('menu.edit', '&Cross Tool'),
              accelerator: 'CmdOrCtrl+2',
              click: () => selectTool('cross')
            },
            {
              label: i18n.t('menu.edit', '&Triangle Tool'),
              accelerator: 'CmdOrCtrl+3',
              click: () => selectTool('triangle')
            },
            {
              label: i18n.t('menu.edit', 'S&quare Tool'),
              accelerator: 'CmdOrCtrl+4',
              click: () => selectTool('square')
            },
            {
              label: i18n.t('menu.edit', 'C&ircle Tool'),
              accelerator: 'CmdOrCtrl+5',
              click: () => selectTool('circle')
            },
            {
              label: i18n.t('menu.edit', '&Line Tool'),
              accelerator: 'CmdOrCtrl+6',
              click: () => selectTool('line')
            },
            {
              label: i18n.t('menu.edit', '&Arrow Tool'),
              accelerator: 'CmdOrCtrl+7',
              click: () => selectTool('arrow')
            },
            {
              label: i18n.t('menu.edit', 'La&bel Tool'),
              accelerator: 'CmdOrCtrl+8',
              click: () => selectTool('label')
            },
            {
              label: i18n.t('menu.edit', '&Number Tool'),
              accelerator: 'CmdOrCtrl+9',
              click: () => selectTool('number')
            }
          ]
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.edit', '&Copy Variation'),
          navigation: true,
          click: () => sabaki.copyVariation(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', 'Cu&t Variation'),
          navigation: true,
          click: () => sabaki.cutVariation(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', '&Paste Variation'),
          navigation: true,
          click: () => sabaki.pasteVariation(sabaki.state.treePosition)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.edit', 'Make Main &Variation'),
          navigation: true,
          click: () => sabaki.makeMainVariation(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', 'Shift &Left'),
          navigation: true,
          click: () => sabaki.shiftVariation(sabaki.state.treePosition, -1)
        },
        {
          label: i18n.t('menu.edit', 'Shift Ri&ght'),
          navigation: true,
          click: () => sabaki.shiftVariation(sabaki.state.treePosition, 1)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.edit', '&Flatten'),
          navigation: true,
          click: () => sabaki.flattenVariation(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', '&Remove Node'),
          accelerator:
            process.platform === 'darwin'
              ? 'CmdOrCtrl+Backspace'
              : 'CmdOrCtrl+Delete',
          navigation: true,
          click: () => sabaki.removeNode(sabaki.state.treePosition)
        },
        {
          label: i18n.t('menu.edit', 'Remove &Other Variations'),
          navigation: true,
          click: () => sabaki.removeOtherVariations(sabaki.state.treePosition)
        }
      ]
    },
    {
      id: 'find',
      label: i18n.t('menu.find', 'Fin&d'),
      submenu: [
        {
          label: i18n.t('menu.find', 'Toggle &Find Mode'),
          accelerator: 'CmdOrCtrl+F',
          navigation: true,
          click: () =>
            sabaki.setMode(sabaki.state.mode === 'find' ? 'play' : 'find')
        },
        {
          label: i18n.t('menu.find', 'Find &Next'),
          accelerator: 'F3',
          navigation: true,
          click: () => {
            sabaki.setMode('find')
            sabaki.findMove(1, {
              vertex: sabaki.state.findVertex,
              text: sabaki.state.findText
            })
          }
        },
        {
          label: i18n.t('menu.find', 'Find &Previous'),
          accelerator: 'Shift+F3',
          navigation: true,
          click: () => {
            sabaki.setMode('find')
            sabaki.findMove(-1, {
              vertex: sabaki.state.findVertex,
              text: sabaki.state.findText
            })
          }
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.find', 'Toggle &Hotspot'),
          accelerator: 'CmdOrCtrl+B',
          navigation: true,
          click: () =>
            sabaki.setComment(sabaki.state.treePosition, {
              hotspot:
                sabaki.inferredState.gameTree.get(sabaki.state.treePosition)
                  .data.HO == null
            })
        },
        {
          label: i18n.t('menu.find', 'Jump to Ne&xt Hotspot'),
          accelerator: 'F2',
          navigation: true,
          click: () => sabaki.findHotspot(1)
        },
        {
          label: i18n.t('menu.find', 'Jump to Pre&vious Hotspot'),
          accelerator: 'Shift+F2',
          navigation: true,
          click: () => sabaki.findHotspot(-1)
        }
      ]
    },
    {
      id: 'navigation',
      label: i18n.t('menu.navigation', '&Navigation'),
      submenu: [
        {
          label: i18n.t('menu.navigation', '&Back'),
          accelerator: 'Up',
          navigation: true,
          click: () => sabaki.goStep(-1)
        },
        {
          label: i18n.t('menu.navigation', '&Forward'),
          accelerator: 'Down',
          navigation: true,
          click: () => sabaki.goStep(1)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to &Previous Fork'),
          accelerator: 'CmdOrCtrl+Up',
          navigation: true,
          click: () => sabaki.goToPreviousFork()
        },
        {
          label: i18n.t('menu.navigation', 'Go to &Next Fork'),
          accelerator: 'CmdOrCtrl+Down',
          navigation: true,
          click: () => sabaki.goToNextFork()
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Previous Commen&t'),
          accelerator: 'CmdOrCtrl+Shift+Up',
          navigation: true,
          click: () => sabaki.goToComment(-1)
        },
        {
          label: i18n.t('menu.navigation', 'Go to Next &Comment'),
          accelerator: 'CmdOrCtrl+Shift+Down',
          navigation: true,
          click: () => sabaki.goToComment(1)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Be&ginning'),
          accelerator: 'Home',
          navigation: true,
          click: () => sabaki.goToBeginning()
        },
        {
          label: i18n.t('menu.navigation', 'Go to &End'),
          accelerator: 'End',
          navigation: true,
          click: () => sabaki.goToEnd()
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to &Main Variation'),
          accelerator: 'CmdOrCtrl+Left',
          navigation: true,
          click: () => sabaki.goToMainVariation()
        },
        {
          label: i18n.t('menu.navigation', 'Go to Previous &Variation'),
          accelerator: 'Left',
          navigation: true,
          click: () => sabaki.goToSiblingVariation(-1)
        },
        {
          label: i18n.t('menu.navigation', 'Go to Next Va&riation'),
          accelerator: 'Right',
          navigation: true,
          click: () => sabaki.goToSiblingVariation(1)
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Move N&umber'),
          accelerator: 'CmdOrCtrl+G',
          navigation: true,
          click: async () => {
            let value = await dialog.showInputBox(
              i18n.t('menu.navigation', 'Enter a move number to go to')
            )
            if (value == null) return

            sabaki.closeDrawer()
            sabaki.goToMoveNumber(value)
          }
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.navigation', 'Go to Ne&xt Game'),
          accelerator: 'CmdOrCtrl+PageDown',
          navigation: true,
          click: () => sabaki.goToSiblingGame(1)
        },
        {
          label: i18n.t('menu.navigation', 'Go to Previou&s Game'),
          accelerator: 'CmdOrCtrl+PageUp',
          navigation: true,
          click: () => sabaki.goToSiblingGame(-1)
        }
      ]
    },
    {
      id: 'engines',
      label: i18n.t('menu.engines', 'Eng&ines'),
      submenu: [
        {
          label: i18n.t('menu.engines', 'Show &Engines Sidebar'),
          type: 'checkbox',
          checked: !!showLeftSidebar && leftSidebarType === 'engine',
          click: () => {
            if (setting.get('view.leftsidebar_type') === 'engine') {
              toggleSetting('view.show_leftsidebar')
            } else {
              setting.set('view.show_leftsidebar', true)
              setting.set('view.leftsidebar_type', 'engine')
            }
          }
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.engines', 'Toggle &Analysis'),
          accelerator: 'F4',
          click: async () => {
            if (sabaki.state.analyzingEngineSyncerId != null) {
              sabaki.stopAnalysis()
            } else {
              let defaultEngine = setting
                .get('engines.list')
                .find(engine => engine.analysis)

              let syncerId = sabaki.getAnalysisEngineSyncerId(
                defaultEngine != null
              )
              if (syncerId != null) {
                await sabaki.startAnalysis(syncerId)
                return
              }

              if (defaultEngine == null) {
                dialog.showMessageBox(
                  i18n.t('menu.engines', 'No engine available for analysis.'),
                  'info'
                )
                return
              }

              try {
                sabaki.setBusy(true)
                await sabaki.attachAndStartAnalysis(defaultEngine)
              } catch {
                dialog.showMessageBox(
                  i18n.t(
                    'menu.engines',
                    'Initialization of the analysis engine failed.'
                  ),
                  'error'
                )
              } finally {
                sabaki.setBusy(false)
              }
            }
          }
        },
        {
          label: !engineGameOngoing
            ? i18n.t('menu.engines', 'Start Engine vs. Engine &Game')
            : i18n.t('menu.engines', 'Stop Engine vs. Engine &Game'),
          accelerator: 'F5',
          click: () => {
            sabaki.startStopEngineGame(sabaki.state.treePosition)
          }
        },
        {
          label: i18n.t('menu.engines', 'Generate &Move'),
          accelerator: 'F10',
          enabled: !engineGameOngoing,
          click: () => {
            let sign = sabaki.getPlayer(sabaki.state.treePosition)
            let syncerId =
              sign > 0
                ? sabaki.state.blackEngineSyncerId
                : sabaki.state.whiteEngineSyncerId

            if (syncerId == null) {
              dialog.showMessageBox(
                i18n.t(
                  'menu.engines',
                  'Please assign an engine to the player first.'
                ),
                'info'
              )
            }

            sabaki.generateMove(syncerId, sabaki.state.treePosition)
          }
        }
      ]
    },
    {
      id: 'tools',
      label: i18n.t('menu.tools', '&Tools'),
      submenu: [
        {
          label: i18n.t('menu.tools', 'Toggle Auto&play Mode'),
          click: () =>
            sabaki.setMode(
              sabaki.state.mode === 'autoplay' ? 'play' : 'autoplay'
            )
        },
        {
          label: i18n.t('menu.tools', 'Toggle &Guess Mode'),
          click: () =>
            sabaki.setMode(sabaki.state.mode === 'guess' ? 'play' : 'guess')
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.tools', 'Clean &Markup…'),
          click: () => sabaki.openDrawer('cleanmarkup')
        },
        {
          label: i18n.t('menu.tools', '&Edit SGF Properties…'),
          click: () => sabaki.openDrawer('advancedproperties')
        }
      ]
    },
    {
      id: 'view',
      label: i18n.t('menu.view', '&View'),
      submenu: [
        {
          label: i18n.t('menu.view', 'Toggle Menu &Bar'),
          click: () => toggleSetting('view.show_menubar')
        },
        {
          label: i18n.t('menu.view', 'Toggle &Full Screen'),
          accelerator:
            process.platform === 'darwin' ? 'CmdOrCtrl+Shift+F' : 'F11',
          click: () =>
            sabaki.setState(({fullScreen}) => ({fullScreen: !fullScreen}))
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.view', 'Show &Coordinates'),
          submenu: [
            {
              label: i18n.t('menu.view', '&Don’t Show'),
              accelerator: 'CmdOrCtrl+Shift+C',
              type: 'checkbox',
              checked: !showCoordinates,
              click: () => toggleSetting('view.show_coordinates')
            },
            {type: 'separator'},
            {
              label: i18n.t('menu.view', '&A1 (Default)'),
              type: 'checkbox',
              checked: !!showCoordinates && coordinatesType === 'A1',
              click: () => {
                setting.set('view.show_coordinates', true)
                setting.set('view.coordinates_type', 'A1')
              }
            },
            {
              label: i18n.t('menu.view', '&1-1'),
              type: 'checkbox',
              checked: !!showCoordinates && coordinatesType === '1-1',
              click: () => {
                setting.set('view.show_coordinates', true)
                setting.set('view.coordinates_type', '1-1')
              }
            },
            {
              label: i18n.t('menu.view', '&Relative'),
              type: 'checkbox',
              checked: !!showCoordinates && coordinatesType === 'relative',
              click: () => {
                setting.set('view.show_coordinates', true)
                setting.set('view.coordinates_type', 'relative')
              }
            }
          ]
        },
        {
          label: i18n.t('menu.view', 'Show Move N&umbers'),
          type: 'checkbox',
          checked: !!showMoveNumbers,
          click: () => toggleSetting('view.show_move_numbers')
        },
        {
          label: i18n.t('menu.view', 'Show Move Colori&zation'),
          type: 'checkbox',
          checked: !!showMoveColorization,
          click: () => toggleSetting('view.show_move_colorization')
        },
        {
          label: i18n.t('menu.view', 'Show &Next Moves'),
          type: 'checkbox',
          checked: !!showNextMoves,
          click: () => toggleSetting('view.show_next_moves')
        },
        {
          label: i18n.t('menu.view', 'Show &Sibling Variations'),
          type: 'checkbox',
          checked: !!showSiblings,
          click: () => toggleSetting('view.show_siblings')
        },
        {
          label: i18n.t('menu.view', 'Show &Heatmap'),
          submenu: [
            {
              label: i18n.t('menu.view', '&Don’t Show'),
              type: 'checkbox',
              checked: !showAnalysis,
              click: () => toggleSetting('board.show_analysis')
            },
            {type: 'separator'},
            {
              label: i18n.t('menu.view', 'Show &Win Rate'),
              type: 'checkbox',
              checked: !!showAnalysis && analysisType === 'winrate',
              click: () => {
                setting.set('board.show_analysis', true)
                setting.set('board.analysis_type', 'winrate')
              }
            },
            {
              label: i18n.t('menu.view', 'Show &Score Lead'),
              type: 'checkbox',
              checked: !!showAnalysis && analysisType === 'scoreLead',
              click: () => {
                setting.set('board.show_analysis', true)
                setting.set('board.analysis_type', 'scoreLead')
              }
            },
            {
              label: '勝率のみを表示',
              type: 'checkbox',
              checked: !!showAnalysis && analysisType === 'winrate_only',
              click: () => {
                setting.set('board.show_analysis', true)
                setting.set('board.analysis_type', 'winrate_only')
              }
            }
          ]
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.view', 'Show &Winrate Graph'),
          type: 'checkbox',
          checked: !!showWinrateGraph,
          enabled: !!showGameGraph || !!showCommentBox,
          click: () => {
            toggleSetting('view.show_winrategraph')
            sabaki.setState(({showWinrateGraph}) => ({
              showWinrateGraph: !showWinrateGraph
            }))
          }
        },
        {
          label: i18n.t('menu.view', 'Show Game &Tree'),
          type: 'checkbox',
          checked: !!showGameGraph,
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            toggleSetting('view.show_graph')
            sabaki.setState(({showGameGraph}) => ({
              showGameGraph: !showGameGraph
            }))
          }
        },
        {
          label: i18n.t('menu.view', 'Show Co&mments'),
          type: 'checkbox',
          checked: !!showCommentBox,
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => {
            toggleSetting('view.show_comments')
            sabaki.setState(({showCommentBox}) => ({
              showCommentBox: !showCommentBox
            }))
          }
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.view', 'Z&oom'),
          submenu: [
            {
              label: i18n.t('menu.view', '&Increase'),
              accelerator: 'CmdOrCtrl+Plus',
              click: () =>
                setting.set(
                  'app.zoom_factor',
                  setting.get('app.zoom_factor') + 0.1
                )
            },
            {
              label: i18n.t('menu.view', '&Decrease'),
              accelerator: 'CmdOrCtrl+-',
              click: () =>
                setting.set(
                  'app.zoom_factor',
                  Math.max(0, setting.get('app.zoom_factor') - 0.1)
                )
            },
            {
              label: i18n.t('menu.view', '&Reset'),
              accelerator: 'CmdOrCtrl+0',
              click: () => setting.set('app.zoom_factor', 1)
            }
          ]
        },
        {
          label: i18n.t('menu.view', 'T&ransform Board'),
          submenu: [
            {
              label: i18n.t('menu.tools', 'Rotate &Anticlockwise'),
              accelerator: 'CmdOrCtrl+Alt+Left',
              click: () => sabaki.pushBoardTransformation('rrr')
            },
            {
              label: i18n.t('menu.tools', 'Rotate &Clockwise'),
              accelerator: 'CmdOrCtrl+Alt+Right',
              click: () => sabaki.pushBoardTransformation('r')
            },
            {
              label: i18n.t('menu.tools', '&Flip Horizontally'),
              accelerator: 'CmdOrCtrl+Alt+Down',
              click: () => sabaki.pushBoardTransformation('f')
            },
            {
              label: i18n.t('menu.tools', 'Flip &Vertically'),
              accelerator: 'CmdOrCtrl+Alt+Shift+Down',
              click: () => sabaki.pushBoardTransformation('rrf')
            },
            {
              label: i18n.t('menu.tools', '&Invert Colors'),
              accelerator: 'CmdOrCtrl+Alt+Up',
              click: () => sabaki.pushBoardTransformation('i')
            },
            {
              label: i18n.t('menu.tools', '&Reset'),
              accelerator: 'CmdOrCtrl+Alt+0',
              click: () => sabaki.setBoardTransformation('')
            }
          ]
        }
      ]
    },
    process.platform === 'darwin' && {
      submenu: [
        {
          label: i18n.t('menu.file', 'New &Window'),
          clickMain: 'newWindow',
          neverDisable: true
        },
        {role: 'minimize'},
        {role: 'close'},
        {type: 'separator'},
        {role: 'front'}
      ],
      role: 'window'
    },
    ,
    {
      id: 'aiwith',
      label: 'AI用メニュー',
      submenu: [
        {
          label: '管理用サイドバーを表示',
          type: 'checkbox',
          neverDisable: true,
          checked: !!showLeftSidebar && leftSidebarType === 'main-operation',
          click: () => {
            if (setting.get('view.leftsidebar_type') === 'main-operation') {
              toggleSetting('view.show_leftsidebar')
            } else {
              setting.set('view.show_leftsidebar', true)
              setting.set('view.leftsidebar_type', 'main-operation')
            }
          }
        },
        {
          label: '解説用サイドバーを表示',
          type: 'checkbox',
          neverDisable: true,
          checked: !!showLeftSidebar && leftSidebarType === 'commentary',
          click: () => {
            if (setting.get('view.leftsidebar_type') === 'commentary') {
              toggleSetting('view.show_leftsidebar')
            } else {
              setting.set('view.show_leftsidebar', true)
              setting.set('view.leftsidebar_type', 'commentary')
            }
          }
        },
        {
          label: '本譜入力用サイドバーを表示',
          type: 'checkbox',
          neverDisable: true,
          checked: !!showLeftSidebar && leftSidebarType === 'recording',
          click: () => {
            if (setting.get('view.leftsidebar_type') === 'recording') {
              toggleSetting('view.show_leftsidebar')
            } else {
              setting.set('view.show_leftsidebar', true)
              setting.set('view.leftsidebar_type', 'recording')
            }
          }
        },
        {type: 'separator'},
        {
          label: 'デザインウィンドウを表示',
          clickMain: 'newDesignWindow',
          neverDisable: true
        },
        {
          label: 'デザイン設定を読み込み',
          click: () => sabaki.loadDesignFile()
        },
        {
          label: 'デザイン設定を保存',
          click: () => sabaki.saveDesignFile()
        }
      ]
    },
    {
      id: 'help',
      label: i18n.t('menu.help', '&Help'),
      submenu: [
        {
          label: i18n.t('menu.help', p => `${p.appName} v${p.version}`, {
            appName: app.name,
            version: app.getVersion()
          }),
          enabled: false
        }
      ]
    },
    setting.get('debug.dev_tools') && {
      id: 'developer',
      label: i18n.t('menu.developer', 'Devel&oper'),
      submenu: [
        {
          label: i18n.t('menu.developer', 'Open Settings &Folder'),
          click: () => shell.showItemInFolder(setting.settingsPath),
          neverDisable: true
        },
        {
          label: i18n.t('menu.developer', 'Toggle &Developer Tools'),
          click: () => sabaki.window.webContents.toggleDevTools(),
          neverDisable: true
        },
        {type: 'separator'},
        {
          label: i18n.t('menu.developer', 'Load &Language File…'),
          click: () => {
            let t = i18n.context('menu.developer')

            dialog.showMessageBox(
              t(
                [
                  'A language file is basically a JavaScript file and can be used to execute arbitrary code on your computer.',
                  'It can be extremely dangerous, so it is recommended to only load language files from authors you trust.'
                ].join('\n\n')
              ),
              'warning',
              [t('I understand')]
            )

            let result = dialog.showOpenDialog({
              properties: ['openFile'],
              filters: [
                {
                  name: i18n.t('menu.developer', 'JavaScript Files'),
                  extensions: ['js']
                }
              ]
            })
            if (!result || result.length === 0) return

            i18n.loadFile(result[0])
          }
        },
        {
          label: i18n.t('menu.developer', '&Unload Language File'),
          click: () => {
            i18n.loadFile(null)
          }
        }
      ]
    }
  ].filter(x => !!x)

  let findMenuItem = str => data.find(item => item.id === str)

  // Modify menu for macOS

  if (process.platform === 'darwin') {
    // Add 'App' menu

    let appMenu = [{role: 'about'}]
    let helpMenu = findMenuItem('help')
    let items = helpMenu.submenu.splice(0, 3)

    appMenu.push(...items.slice(0, 2))

    // Remove original 'Preferences' menu item

    let fileMenu = findMenuItem('file')
    let preferenceItem = fileMenu.submenu.splice(
      fileMenu.submenu.length - 2,
      2
    )[1]

    appMenu.push(
      {type: 'separator'},
      preferenceItem,
      {type: 'separator'},
      {submenu: [], role: 'services'},
      {
        label: i18n.t('menu.macos', 'Text'),
        submenu: [
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
          {role: 'selectall'}
        ]
      },
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {type: 'separator'},
      {role: 'quit'}
    )

    data.unshift({
      label: app.name,
      submenu: appMenu
    })

    // Remove 'Toggle Menu Bar' menu item

    let viewMenu = findMenuItem('view')
    viewMenu.submenu.splice(0, 1)
  }

  let processMenu = (menu, idPrefix = '') => {
    menu.forEach((item, i) => {
      // Generate id

      if (item.id == null) {
        item.id = idPrefix + i
      }

      // Handle disableAll prop

      if (
        !item.neverDisable &&
        ((disableAll && !('submenu' in item || 'role' in item)) ||
          (mode === 'watch' && !!item.navigation))
      ) {
        item.enabled = false
      }

      if ('submenu' in item) {
        processMenu(item.submenu, `${item.id}-`)
      }
    })

    return menu
  }

  return processMenu(data)
}
