const os = require('os')
const EventEmitter = require('events')
const EC2 = require('aws-sdk/clients/ec2')

const accessKeyId = 'AKIAXZYLHH2VIA67YFOU'
const secretAccessKey = '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'
const region = 'ap-northeast-1'
const apiVersion = '2016-11-15'
const KeyPairName = 'aiwithlive_igo'

// Deep Learning AMI (Amazon Linux 2) Version 27.0
const defaultImageId = 'ami-0f281e05283bd0b52'

// メインスレッド上でAWSのインスタンス立ち上げや状態監視などを行います。

let eventEmitter = null
let values = null
let ec2 = null

/**
 * モジュールの初期化を行います。
 */
let initializeAWS = () => {
  values = {
    awsImageId: defaultImageId,
    awsInstanceName: `${os.hostname()}-${os.userInfo().username}`,
    awsInstanceType: 'p2.xlarge',
    awsInstance: null,
    awsState: '',
    awsInTransition: false
  }

  eventEmitter = new EventEmitter()
  eventEmitter.setMaxListeners(50)

  exports.events.on('change', ({key, value}) => {
    if (key === 'awsState') {
      exports.set('awsInTransition', false)
    }
  })

  ec2 = new EC2({apiVersion, accessKeyId, secretAccessKey, region})
}

exports.events = {
  on: (event, f) => {
    eventEmitter.on(event, f)
  },
  emit: (event, evt) => {
    eventEmitter.emit(event, evt)
  }
}

exports.get = key => {
  if (key in values) return values[key]
  return null
}

exports.set = (key, value) => {
  if (!(key in values) || values[key] !== value) {
    values[key] = value
    exports.events.emit('change', {key, value})
  }
  return exports
}

/**
 * AWSインスタンスに便利メソッドを追加します。
 */
let initInstance = instance => {
  instance.Name = (() => {
    let tag = (instance.Tags || []).find(tag => tag.Key === 'Name')
    return tag != null ? tag.Value : null
  })()

  instance.fetchStatus = async () => {
    let params = {InstanceIds: [instance.InstanceId]}
    let result = await ec2.describeInstanceStatus(params).promise()

    return result != null && result.InstanceStatuses.length > 0
      ? result.InstanceStatuses[0].SystemStatus.Status
      : null
  }

  let genericOp = (op, resultName, logName) => async () => {
    try {
      let params = {InstanceIds: [instance.InstanceId]}
      let result = await op(params).promise()

      for (let inst of result[resultName]) {
        console.log(`${logName} an instance: ${inst.InstanceId}`)
      }
    } catch (err) {
      console.log(err)
    }
  }

  instance.start = genericOp(
    params => ec2.startInstance(params),
    'StartingInstances',
    'started'
  )

  instance.stop = genericOp(
    params => ec2.stopInstances(params),
    'StoppingInstances',
    'stopped'
  )

  instance.terminate = genericOp(
    params => ec2.terminateInstances(params),
    'TerminatingInstances',
    'terminated'
  )

  return instance
}

/**
 * AWSで確保中のインスタンスリストを取得します。
 */
exports.fetchInstances = async () => {
  let result = await ec2.describeInstances().promise()

  return result.Reservations.flatMap(
    reservation => reservation.Instances
  ).map(instance => initInstance(instance))
}

/**
 * 指定の名前を持つインスタンスを取得します。
 */
exports.fetchInstanceByName = async (name = null) => {
  let instances = await exports.fetchInstances()
  name = name || exports.get('awsInstanceName')

  return instances
    .filter(instance => instance.State.Name !== 'terminated')
    .find(instance => instance.Name === name)
}

/**
 * インスタンスを新たに起動します。
 */
exports.launch = async (name = null, instanceType = 'p2.xlarge') => {
  let instanceParams = {
    ImageId: exports.get('awsImageId'),
    InstanceType: instanceType || exports.get('awsInstanceType'),
    KeyName: KeyPairName,
    MinCount: 1,
    MaxCount: 1,
    SecurityGroupIds: ['default'],
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [{Key: 'Name', Value: name || exports.get('awsInstanceName')}]
      }
    ]
  }

  exports.set('awsInTransition', true)

  let result = await ec2.runInstances(instanceParams).promise()
  return result.Instances.map(instance => initInstance(instance))[0]
}

let operateAWS = async (updateStateOnly = false) => {
  try {
    let instance = await exports.fetchInstanceByName()
    let state = instance != null ? instance.State.Name : ''
    let status = instance != null ? await instance.fetchStatus() : null

    exports.set('awsInstance', instance)

    if (state === 'pending' || (state === 'running' && status !== 'ok')) {
      exports.set('awsState', 'pending')
    } else if (state === 'running' && status === 'ok') {
      exports.set('awsState', 'running')
    } else if (state === 'stopping' || state === 'shutting-down') {
      exports.set('awsState', 'shutting-down')
      if (!updateStateOnly) {
        await instance.start()
      }
    } else if (state === 'stopped' || state === 'terminated' || state === '') {
      exports.set('awsState', 'terminated')
      if (!updateStateOnly) {
        await exports.launch()
      }
    } else {
      exports.set('awsState', 'error')
      console.log('unknown aws state:', state, status)
    }
  } catch (err) {
    exports.set('awsState', 'error')
    console.log('operateAWS:', err)
  }
}

/**
 * AWSの状態を監視します。
 */
exports.watchState = async (repeat = true) => {
  await operateAWS(true)

  if (repeat) {
    setTimeout(() => exports.watchState(repeat), 3000)
  }
}

/**
 * AWSのインスタンスが未起動であれば起動させます。
 */
exports.launchInstance = async () => {
  await operateAWS(false)
}

/**
 * AWSインスタンスを終了させます。
 */
exports.terminateInstance = async () => {
  let instance = await exports.fetchInstanceByName()
  if (instance == null) return

  // 状態遷移中フラグを立てることでボタン操作などを禁止します。
  exports.set('awsInTransition', true)
  exports.events.emit('detachEngine', {instance})

  return new Promise((resolve, reject) => {
    // detachから少し間をあけることで
    // エンジンの終了処理をきちんと行えるようにしています。
    setTimeout(async () => {
      try {
        await instance.terminate()
        resolve({})
      } catch (err) {
        reject(err)
      }
    }, 500)
  })
}

initializeAWS()
