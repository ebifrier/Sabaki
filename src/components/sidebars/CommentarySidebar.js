import {h, Component} from 'preact'

import sabaki from '../../modules/sabaki'
import {withShouldComponentUpdate} from '../../modules/mixins.js'
import {SettingsHeader} from './MainOperationSidebar.js'

export class CommentarySidebar_ extends Component {
  constructor(props) {
    super(props)
  }

  render({mode}) {
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
              disabled: mode === 'watch',
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
              disabled: mode === 'commentary',
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
              disabled: mode === 'play',
              onClick: evt => sabaki.setMode('play')
            },
            '通常モード'
          )
        )
      )
    )
  }
}

export let CommentarySidebar = withShouldComponentUpdate(CommentarySidebar_)
