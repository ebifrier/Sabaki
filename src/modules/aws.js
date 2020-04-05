const AWS = require('aws-sdk')

const region = 'ap-northeast-1'
const accessKeyId = 'AKIAXZYLHH2VIA67YFOU'
const secretAccessKey = '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'
const KeyPairName = 'aiwithlive_igo'
const apiVersion = '2016-11-15'
// Deep Learning AMI (Amazon Linux 2) Version 27.0
const defaultImageId = 'ami-0f281e05283bd0b52'

let ec2 = null

/**
 * AWSの初期化処理を行います。
 */
export const initialize = () => {
  //AWS.config.loadFromPath
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region
  })

  ec2 = new AWS.EC2({apiVersion})
}

/**
 * インスタンスに便利メソッドなどを追加します。
 */
const initInstance = instance => {
  instance.Name = (() => {
    let tag = (instance.Tags || []).find(tag => tag.Key === 'Name')
    return tag != null ? tag.Value : null
  })()

  let genericOp = (opInstances, resultName, logName) => async () => {
    try {
      let params = {InstanceIds: [instance.InstanceId]}
      let result = await opInstances(params).promise()

      for (let inst of result[resultName]) {
        console.log(`${logName} an instance: ${inst.InstanceId}`)
      }
    } catch (err) {
      console.log(err)
    }
  }

  instance.start = genericOp(
    ec2.startInstances.bind(ec2),
    'StartingInstances',
    'started'
  )

  instance.stop = genericOp(
    ec2.stopInstances.bind(ec2),
    'StoppingInstances',
    'stopped'
  )

  instance.terminate = genericOp(
    ec2.terminateInstances.bind(ec2),
    'TerminatingInstances',
    'terminated'
  )

  instance.fetchStatus = async () => {
    let params = {InstanceIds: [instance.InstanceId]}
    let result = await ec2.describeInstanceStatus(params).promise()

    return result != null && result.InstanceStatuses.length > 0
      ? result.InstanceStatuses[0]
      : null
  }

  return instance
}

/**
 * AWSで確保中のインスタンスリストを取得します。
 */
export const fetchInstances = async () => {
  let result = await ec2.describeInstances().promise()

  return result.Reservations.flatMap(
    reservation => reservation.Instances
  ).map(instance => initInstance(instance))
}

/**
 * 指定の名前を持つインスタンスを取得します。
 */
export const fetchInstanceByName = async name => {
  let instances = await fetchInstances()

  return instances.find(instance => instance.Name === name)
}

export const launchInstance = async (
  name,
  instanceType = 'p2.xlarge',
  imageId = defaultImageId
) => {
  let instanceParams = {
    ImageId: imageId,
    InstanceType: instanceType,
    KeyName: KeyPairName,
    MinCount: 1,
    MaxCount: 1,
    SecurityGroupIds: ['default'],
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [{Key: 'Name', Value: name}]
      }
    ]
  }

  let result = await ec2.runInstances(instanceParams).promise()
  return result.Instances.map(instance => initInstance(instance))[0]
}
