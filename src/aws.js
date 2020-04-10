const os = require('os')
const EventEmitter = require('events')
const AWS = require('aws-sdk')

const accessKeyId = 'AKIAXZYLHH2VIA67YFOU'
const secretAccessKey = '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'
const region = 'ap-northeast-1'
const apiVersion = '2016-11-15'
const KeyPairName = 'aiwithlive_igo'

// Deep Learning AMI (Amazon Linux 2) Version 27.0
const defaultImageId = 'ami-0f281e05283bd0b52'

let eventEmitter = null
let values = null
let ec2 = null

let initializeAWS = () => {
  values = {
    awsImageId: defaultImageId,
    awsInstanceName: `${os.hostname()}-${os.userInfo().username}`,
    awsInstanceType: 'p2.xlarge',
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

  //AWS.config.loadFromPath
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region
  })

  ec2 = new AWS.EC2({apiVersion})
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

    if (state === 'pending' || (state === 'running' && status !== 'ok')) {
      exports.set('awsState', 'pending')
    } else if (state === 'running' && status === 'ok') {
      if (exports.get('awsState') !== 'running') {
        exports.set('awsState', 'running')
        exports.events.emit('startAnalysis', {instance})
      }
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
    }
  } catch (err) {
    exports.set('awsState', 'error')
    console.log('operateAWS:', err)
  }
}

exports.updateState = async (repeat = true) => {
  await operateAWS(true)

  if (repeat) {
    setTimeout(() => exports.updateState(repeat), 3000)
  }
}

exports.launchInstance = async () => {
  await operateAWS(false)
}

exports.terminateInstance = async () => {
  let instance = await exports.fetchInstanceByName()
  if (instance == null) return

  exports.set('awsInTransition', true)
  exports.events.emit('stopAnalysis', {instance})

  return new Promise((resolve, reject) => {
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
