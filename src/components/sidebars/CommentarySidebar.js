import {h, Component} from 'preact'

import {SettingsHeader} from './MainOperationSidebar.js'

export class CommentarySidebar extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return h(
      'div',
      {class: 'commentary'},

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
              disabled: false,
              onClick: evt => {}
            },
            '検討モードを開始'
          )
        ),
        h(
          'li',
          {},
          h(
            'button',
            {
              class: 'aiwith-button big secondary',
              disabled: false,
              onClick: evt => {}
            },
            '本譜モードを開始'
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
              disabled: false,
              onClick: evt => {}
            },
            '通常モードを開始'
          )
        )
      )
    )
  }
}
