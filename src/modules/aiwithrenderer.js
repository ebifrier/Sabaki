import {dialog, remote} from 'electron'
import {resolve} from 'path'
import fs from 'fs'

import * as aiwith from './aiwith.js'
import sabaki from './sabaki.js'

const designsetting = remote.require('./designsetting')
const setting = remote.require('./setting')
const aws = remote.require('./aws')
let lastLoadedData = null
let recordWatchingId = null

// rendererスレッドで行う処理を担当します。

/**
 * 初期化処理はsabakiの初期化後に呼ぶ必要があります。
 */
export function initialize() {
  aws.events.on('change', ({key, value}) => {
    // AWSが起動していたら自動的にエンジンも起動
    if (key === 'awsState' && value === 'running') {
      startAnalyzeAWS()
    }
  })

  sabaki.events.on('modeChange', ({mode}) => {
    if (['watch', 'commentary'].includes(mode)) {
      // 対局観戦モード、検討モードでは本譜を自動的に更新しながら
      // 同時に検討も行います。
      startAnalyzeAWS()

      reloadRecord(true)
      startRecordWatching()
    } else {
      // 本譜入力モードでは最初だけ棋譜を読み込みます。
      if (mode === 'recording') {
        sabaki.stopAnalysis()
        reloadRecord(true)
      }

      stopRecordWatching()
    }
  })

  let onTreeChanged = () => {
    if (sabaki.state.mode === 'recording') {
      // 本譜入力モードでは手が進むと同時に、余計な分岐を削除し
      // 棋譜をファイルに出力します。
      sabaki.removeOtherVariations(sabaki.state.treePosition, {
        suppressConfirmation: true
      })

      let path = designsetting.get('record.watch_filepath')
      if (path != null) {
        sabaki.saveFile(path, false)
      }
    }
  }

  sabaki.events.on('fileLoad', onTreeChanged)
  sabaki.events.on('moveMake', onTreeChanged)
  sabaki.events.on('nodeRemove', onTreeChanged)

  // aws.events.on(...)はタイミング的に呼ばれないことがあるため
  // AWSが起動していれば自動的にエンジンを起動します。
  startAnalyzeAWS()
}

/**
 * AWSでエンジンを起動するための情報を取得します。
 */
function getEngineAWS() {
  let instance = aws.get('awsInstance')
  if (instance == null) return null

  let args = [
    '-o "StrictHostKeyChecking=no"',
    `-i aiwithlive_igo.pem`,
    `ec2-user@${instance.PublicIpAddress}`,
    `-t "docker run --rm --runtime=nvidia -i ebifrier/katago:latest-opencl"`
  ]

  return {
    name: 'aws',
    path: resolve(__dirname, './bin/ssh.exe'),
    args: args.join(' '),
    commands: '',
    analysis: true
  }
}

/**
 * AWS上で分析用エンジンを起動します。
 */
export async function startAnalyzeAWS() {
  if (sabaki.state.analyzingEngineSyncerId != null) return
  if (aws.get('awsState') !== 'running') return

  let engine = getEngineAWS()
  if (engine == null) return

  // F4でも動かせるように、エンジン設定を書き換えます。
  let engines = setting.get('engines.list')
  if (engines.length > 0) engines[0] = engine
  else engines = [engine]
  setting.set('engines.list', engines)

  let syncerId = sabaki.getAnalysisEngineSyncerId(true)
  if (syncerId != null) {
    await sabaki.startAnalysis(syncerId)
    return
  }

  try {
    await sabaki.attachAndStartAnalysis(engine)
  } catch {
    dialog.showMessageBox(
      i18n.t('menu.engines', 'Initialization of the analysis engine failed.'),
      'error'
    )
  }
}

/**
 * 本譜の監視を開始します。
 *
 * TODO: chokidarはwindowsだとfseventsが動かせない関係で使えませんでした。
 */
export function startRecordWatching() {
  try {
    if (recordWatchingId == null) {
      recordWatchingId = setInterval(() => reloadRecord(), 500)
    }
  } catch (err) {
    console.log(err.message)
    return null
  }
}

/**
 * 本譜の監視を終了します。
 */
export function stopRecordWatching() {
  if (recordWatchingId != null) {
    clearInterval(recordWatchingId)
    recordWatchingId = null
  }
}

/**
 * 強制的に本譜ファイルを再読み込みします。
 */
export async function reloadRecord(force = false) {
  let loadRecord = async data => {
    if (!force && data == lastLoadedData) {
      return
    }

    // 検討モードでのみMAIN属性を使います。
    let addToMain = ['watch', 'commentary'].includes(sabaki.state.mode)
    let mainTree = aiwith.loadTreeFromData(data, {addToMain})
    if (mainTree == null) {
      throw new Error('failed to load the record file')
    }

    if (['recording', 'watch'].includes(sabaki.state.mode)) {
      // 本譜入力モード、対局観戦モードでは単に棋譜を読み込みます。
      await sabaki.loadGameTrees([mainTree], {
        suppressAskForSave: true,
        clearHistory: true
      })
      sabaki.goToEnd()
    } else if (sabaki.state.mode === 'commentary') {
      // 検討モードでは本譜を読み込み検討エンジンの対象盤面を切り替えつつ
      // 現盤面はそのまま残すようにします。
      let tree = sabaki.state.gameTrees[sabaki.state.gameIndex]
      if (tree == null) {
        throw new Error('gameTree is null')
      }

      let {newTree, newTreePosition} = aiwith.loadTreeAppend(tree, mainTree)
      sabaki.setCurrentTreePosition(newTree, sabaki.state.treePosition)

      // 本譜の最後の手を検討させます。
      let analyzingEngineSyncer = sabaki.inferredState.analyzingEngineSyncer
      if (
        analyzingEngineSyncer != null &&
        newTreePosition !== sabaki.state.analysisTreePosition
      ) {
        sabaki.analyzeMove(newTreePosition)
      }
    }

    console.log('the new record file was loaded')
    lastLoadedData = data
  }

  let path = designsetting.get('record.watch_filepath')
  if (path == null) return

  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (error, data) => {
      if (error) {
        reject(error)
        return
      }

      loadRecord(data)
        .then(() => resolve())
        .catch(err => reject(err))
    })
  })
}
