import {h, Component} from 'preact'
import {remote} from 'electron'

import {showOpenDialog} from '../../modules/dialog.js'
import i18n from '../../i18n.js'

const dsetting = remote.require('./designsetting')
const t = i18n.context('PreferencesDrawer')

let SettingsHeader = ({title, id = null, isOpen = null, setValue = null}) => {
  if (isOpen == null) {
    return h('div', {class: 'settings-header'}, h('label', {}, title))
  } else {
    return h(
      'div',
      {class: 'settings-header'},
      h('input', {
        type: 'checkbox',
        id,
        checked: isOpen,
        onClick: evt => setValue(evt.target.checked)
      }),
      h('label', {for: id}, title)
    )
  }
}

export class DesignSetting extends Component {
  constructor(props) {
    super(props)

    this.state = {
      testMode: dsetting.get('design.test_mode'),
      isOpenAWS: true,
      isOpenBackground: true,
      isOpenOtherImage: false,
      isOpenBasic: false,
      isOpenGoban: false,
      isOpenWinrate: false
    }
  }

  openImagePath() {
    let result = showOpenDialog({
      properties: ['openFile'],
      filters: [
        {name: t('Image Files'), extensions: ['jpg', 'jpeg', 'png', 'gif']}
      ]
    })

    return !result || result.length === 0 ? null : result[0]
  }

  render({awsState}) {
    return h(
      'div',
      {
        class: 'design-setting'
      },

      h(
        'div',
        {class: 'engines-list settings-list'},
        h(SettingsHeader, {
          title: 'AWS操作',
          id: 'aws-operation',
          isOpen: this.state.isOpenAWS,
          setValue: v => this.setState({isOpenAWS: v})
        }),
        h(
          'ul',
          {class: this.state.isOpenAWS ? 'expanded' : ''},
          h(
            'li',
            {},
            h('button', {class: 'aws-start'}, 'AWSを起動'),
            h(
              'button',
              {
                class: 'aws-start',
                disabled: 'disabled'
              },
              'AWSを停止'
            )
          )
        )
      ),

      h(
        'div',
        {class: 'engines-list settings-list'},
        h(SettingsHeader, {
          title: '背景画像',
          id: 'background-image',
          isOpen: this.state.isOpenBackground,
          setValue: v => this.setState({isOpenBackground: v})
        }),
        h(
          'ul',
          {class: this.state.isOpenBackground ? 'expanded' : ''},
          h(
            'li',
            {},
            h(
              'a',
              {
                class: 'browse',
                title: t('Browse…'),
                onClick: () => {
                  let imagePath = this.openImagePath()
                  if (imagePath != null) {
                    dsetting.set('design.background_path', imagePath)
                  }
                }
              },
              h('img', {
                src:
                  './node_modules/@primer/octicons/build/svg/file-directory.svg'
              })
            ),
            h('input', {
              type: 'text',
              placeholder: t('Path'),
              value: dsetting.get('design.background_path'),
              onChange: evt =>
                dsetting.set('design.background_path', evt.target.value)
            })
          )
        )
      ),

      h(
        'div',
        {class: 'engines-list settings-list'},
        h(SettingsHeader, {
          title: 'その他の画像',
          id: 'image-settings',
          isOpen: this.state.isOpenOtherImage,
          setValue: v => this.setState({isOpenOtherImage: v})
        }),
        h(
          'ul',
          {class: this.state.isOpenOtherImage ? 'expanded' : ''},
          h(
            'li',
            {},
            h(
              'a',
              {
                class: 'browse',
                title: t('Browse…'),
                onClick: () => {
                  let imagePath = this.openImagePath()
                  if (imagePath != null) {
                    dsetting.set('design.whitebar_path', imagePath)
                  }
                }
              },
              h('img', {
                src:
                  './node_modules/@primer/octicons/build/svg/file-directory.svg'
              })
            ),
            h('input', {
              type: 'text',
              placeholder: t('Path'),
              value: dsetting.get('design.whitebar_path'),
              onChange: evt =>
                dsetting.set('design.whitebar_path', evt.target.value)
            })
          )
        )
      ),

      h(
        'div',
        {class: 'engines-list settings-list'},
        h(SettingsHeader, {
          title: '候補手表示',
          id: 'basic-image',
          isOpen: this.state.isOpenBasic,
          setValue: v => this.setState({isOpenBasic: v})
        }),
        h(
          'ul',
          {class: this.state.isOpenBasic ? 'expanded' : ''},
          h(
            'li',
            {},
            h(
              'label',
              {class: 'for-checkbox'},
              h('input', {
                type: 'checkbox',
                checked: dsetting.get('design.black_left'),
                onChange: evt =>
                  dsetting.set('design.black_left', evt.target.checked)
              }),
              '黒番の評価値を左側に表示'
            )
          ),
          h(
            'li',
            {},
            h(
              'label',
              {class: 'for-checkbox'},
              h('input', {
                type: 'checkbox',
                checked: dsetting.get('design.show_heatmap'),
                onChange: evt =>
                  dsetting.set('design.show_heatmap', evt.target.checked)
              }),
              '候補手を表示'
            )
          ),
          h(
            'li',
            {},
            h(
              'label',
              {class: 'for-checkbox'},
              h('input', {
                type: 'checkbox',
                checked: dsetting.get('design.test_mode'),
                onChange: evt => {
                  dsetting.set('design.test_mode', evt.target.checked)
                  this.setState({testMode: evt.target.checked})
                }
              }),
              '石や候補手の表示テストを行う'
            )
          ),
          h(
            'li',
            {},
            h('label', {}, 'テストで表示する勝率:'),
            h('input', {
              type: 'range',
              min: 0,
              max: 100,
              step: 1,
              disabled: !this.state.testMode,
              value: dsetting.get('design.test_winrate'),
              onChange: evt =>
                dsetting.set('design.test_winrate', evt.target.value)
            })
          )
        )
      ),

      h(
        'div',
        {class: 'engines-list settings-list'},
        h(SettingsHeader, {
          title: '盤表示',
          id: 'goban-settings',
          isOpen: this.state.isOpenGoban,
          setValue: v => this.setState({isOpenGoban: v})
        }),
        h(
          'ul',
          {class: this.state.isOpenGoban ? 'expanded' : ''},
          h(
            'li',
            {},
            h(
              'label',
              {class: 'for-checkbox'},
              h('input', {
                type: 'checkbox',
                checked: dsetting.get('design.show_goban'),
                onChange: evt =>
                  dsetting.set('design.show_goban', evt.target.checked)
              }),
              'デザイン画面に碁盤を表示'
            )
          ),
          h(
            'li',
            {},
            h('label', {class: 'mr'}, '左端の座標:'),
            h('input', {
              type: 'number',
              min: 0,
              max: 100,
              step: 0.1,
              value: dsetting.get('design.goban_left'),
              onChange: evt =>
                dsetting.set('design.goban_left', evt.target.value)
            }),
            h('label', {}, '%')
          ),
          h(
            'li',
            {},
            h('label', {class: 'mr'}, '上端の座標:'),
            h('input', {
              type: 'number',
              min: 0,
              max: 100,
              step: 0.1,
              value: dsetting.get('design.goban_top'),
              onChange: evt =>
                dsetting.set('design.goban_top', evt.target.value)
            }),
            h('label', {}, '%')
          ),
          h(
            'li',
            {},
            h('label', {class: 'mr'}, '右端の座標:'),
            h('input', {
              type: 'number',
              min: 0,
              max: 100,
              step: 0.1,
              value: dsetting.get('design.goban_right'),
              onChange: evt =>
                dsetting.set('design.goban_right', evt.target.value)
            }),
            h('label', {}, '%')
          ),
          h(
            'li',
            {},
            h('label', {class: 'mr'}, '下端の座標:'),
            h('input', {
              type: 'number',
              min: 0,
              max: 100,
              step: 0.1,
              value: dsetting.get('design.goban_bottom'),
              onChange: evt =>
                dsetting.set('design.goban_bottom', evt.target.value)
            }),
            h('label', {}, '%')
          )
        ),

        h(
          'div',
          {class: 'engines-list settings-list'},
          h(SettingsHeader, {
            title: '勝率表示',
            id: 'winrate-settings',
            isOpen: this.state.isOpenWinrate,
            setValue: v => this.setState({isOpenWinrate: v})
          }),
          h(
            'ul',
            {class: this.state.isOpenWinrate ? 'expanded' : ''},
            h(
              'li',
              {},
              h('label', {class: 'mr'}, '黒番の表示位置[X]:'),
              h('input', {
                type: 'number',
                min: 0,
                max: 2000,
                step: 1,
                value: dsetting.get('design.score_blackx'),
                onChange: evt =>
                  dsetting.set('design.score_blackx', evt.target.value)
              }),
              h('label', {}, 'px')
            ),
            h(
              'li',
              {},
              h('label', {class: 'mr'}, '黒番の表示位置[Y]:'),
              h('input', {
                type: 'number',
                min: 0,
                max: 2000,
                step: 1,
                value: dsetting.get('design.score_blacky'),
                onChange: evt =>
                  dsetting.set('design.score_blacky', evt.target.value)
              }),
              h('label', {}, 'px')
            ),
            h(
              'li',
              {},
              h('label', {class: 'mr'}, '白番の表示位置[X]:'),
              h('input', {
                type: 'number',
                min: 0,
                max: 2000,
                step: 1,
                value: dsetting.get('design.score_whitex'),
                onChange: evt =>
                  dsetting.set('design.score_whitex', evt.target.value)
              }),
              h('label', {}, 'px')
            ),
            h(
              'li',
              {},
              h('label', {class: 'mr'}, '白番の表示位置[Y]:'),
              h('input', {
                type: 'number',
                min: 0,
                max: 2000,
                step: 1,
                value: dsetting.get('design.score_whitey'),
                onChange: evt =>
                  dsetting.set('design.score_whitey', evt.target.value)
              }),
              h('label', {}, 'px')
            ),
            h(
              'li',
              {},
              h('label', {class: 'mr'}, 'フォントサイズ:'),
              h('input', {
                type: 'number',
                min: 0,
                max: 100,
                step: 1,
                value: dsetting.get('design.score_fontsize'),
                onChange: evt =>
                  dsetting.set('design.score_fontsize', evt.target.value)
              }),
              h('label', {}, 'pt')
            )
          )
        )
      )
    )
  }
}
