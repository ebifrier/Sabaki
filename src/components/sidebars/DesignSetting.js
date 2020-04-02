import {h, Component} from 'preact'

import sabaki from '../../modules/sabaki.js'
import i18n from '../../i18n.js'
import ToolBar, {ToolBarButton} from '../ToolBar.js'

const t = i18n.context('PreferencesDrawer')

export class DesignSetting extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isOpen: false
    }
  }

  render(_, state) {
    return h(
      'div',
      {
        class: 'design-setting'
      },

      h(
        'ul',
        {class: 'settings-list'},

        h(
          'li',
          {},
          h('input', {
            type: 'text',
            placeholder: t('Path')
          })
        ),

        h(
          'li',
          {},
          h(
            'label',
            {},
            h('input', {
              type: 'checkbox'
            }),
            '候補手を表示する'
          )
        ),

        h(
          'li',
          {},
          h(
            'label',
            {},
            h('input', {
              type: 'checkbox'
            }),
            '候補手の中に勝率を表示する'
          )
        ),

        h(
          'li',
          {},
          h(
            'label',
            {},
            h('input', {
              type: 'checkbox'
            }),
            '石や候補手の表示テストを行う'
          )
        ),

        h(
          'li',
          {},
          h(
            'label',
            {},
            h('input', {
              type: 'checkbox'
            }),
            '黒番の勝率を左側に設定する'
          )
        )
      ),

      h('input', {
        type: 'checkbox',
        id: 'image-setting',
        checked: this.state.isOpen,
        onClick: () =>
          this.setState({isOpen}, () => {
            !isOpen
          })
      }),
      h('label', {for: 'image-setting'}, '画像設定'),
      h(
        'div',
        {},

        h(
          'ul',
          {},
          h(
            'li',
            {},
            h('input', {
              type: 'text',
              placeholder: t('Path')
            })
          )
        )
      )
    )
  }
}
