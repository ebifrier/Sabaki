import {h, Component} from 'preact'

import {SettingsHeader} from './MainOperationSidebar.js'
import sabaki from '../../modules/sabaki'

export class RecordingSidebar extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return h(
      'div',
      {class: 'recording'},

      h(SettingsHeader, {
        title: 'モード切替'
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
        ),
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
