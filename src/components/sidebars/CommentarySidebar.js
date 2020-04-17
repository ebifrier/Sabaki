import {h, Component} from 'preact'

import {SettingsHeader} from './MainOperationSidebar.js'
import sabaki from '../../modules/sabaki'

export class CommentarySidebar extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return h(
      'div',
      {class: 'commentary'},

      h(SettingsHeader, {
        title: '解説用サイドバー'
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
              disabled: sabaki.state.mode === 'watch',
              onClick: evt => sabaki.setMode('watch')
            },
            '対局観戦モード'
          )
        ),
        h(
          'li',
          {},
          h(
            'button',
            {
              class: 'aiwith-button big secondary',
              disabled: sabaki.state.mode === 'commentary',
              onClick: evt => sabaki.setMode('commentary')
            },
            '検討モード'
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
