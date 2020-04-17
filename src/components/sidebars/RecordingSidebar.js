import {h, Component} from 'preact'

import sgf from '@sabaki/sgf'

import {SettingsHeader} from './MainOperationSidebar.js'
import sabaki from '../../modules/sabaki'

export class RecordingSidebar extends Component {
  constructor(props) {
    super(props)
  }

  render({gameTrees, gameIndex, treePosition}) {
    let getNodeText = node => {
      let getDataText = (prefix, data) => {
        let [x, y] = sgf.parseVertex(data)
        return `${prefix}${x + 1}-${y + 1}`
      }

      return node.data.B != null
        ? getDataText('黒', node.data.B[0])
        : node.data.W != null
        ? getDataText('白', node.data.W[0])
        : null
    }

    let tree = gameTrees[gameIndex]
    let node = tree.get(treePosition)

    return h(
      'div',
      {class: 'recording'},

      h(SettingsHeader, {
        title: '本譜入力用サイドバー'
      }),
      h(
        'ul',
        {},
        h(
          'li',
          {},
          h(
            'button',
            {
              class: 'aiwith-button big primary',
              disabled: sabaki.state.mode === 'recording',
              onClick: evt => sabaki.setMode('recording')
            },
            '棋譜入力モード'
          )
        )
      ),

      h(SettingsHeader, {
        title: '最終着手'
      }),
      h(
        'ul',
        {},
        h(
          'li',
          {},
          h('input', {
            type: 'text',
            readOnly: true,
            value: getNodeText(node),
            style: {
              width: '100%',
              background: 'black',
              color: 'white'
            }
          })
        )
      ),

      h(
        'ul',
        {},
        h(
          'li',
          {
            style: {
              position: 'absolute',
              bottom: '4px',
              right: 0,
              left: 0
            }
          },
          h(
            'button',
            {
              class: 'aiwith-button big danger',
              disabled: sabaki.state.mode === 'play',
              onClick: evt => sabaki.setMode('play')
            },
            '通常モード'
          )
        )
      )
    )
  }
}
