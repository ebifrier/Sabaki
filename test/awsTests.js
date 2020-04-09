import assert from 'assert'
import {v4 as uuid} from 'uuid'
import * as aws from '../src/aws.js'

describe('aws', () => {
  let awsInstanceName = null
  let awsInstance = null

  before(done => {
    awsInstanceName = uuid()
    aws
      .launch(awsInstanceName, 't2.micro')
      .then(instance => {
        assert.ok(instance != null)
        awsInstance = instance
        done()
      })
      .catch(err => assert.fail(err))
  })

  after(done => {
    if (awsInstance == null) {
      done()
      return
    }

    awsInstance
      .terminate()
      .then(done)
      .catch(err => assert.fail(err))
  })

  describe('fetchInstances', () => {
    it('fetch all', () =>
      aws.fetchInstances().then(instances => {
        assert.ok(instances.length > 0)
      }))

    it('filter by name', () =>
      aws.fetchInstances().then(instances => {
        instances = instances.filter(
          instance => instance.Name === awsInstance.Name
        )
        assert.equal(instances.length, 1)
        assert.equal(instances[0].InstanceId, awsInstance.InstanceId)
      }))
  })

  describe('fetchInstanceByName', () => {
    it('correct name', () =>
      aws.fetchInstanceByName(awsInstanceName).then(instance => {
        assert.equal(instance.Name, awsInstance.Name)
        assert.equal(instance.InstanceId, awsInstance.InstanceId)
      }))

    it('invalid name', async () =>
      aws.fetchInstanceByName('DLKSJDOFI').then(instance => {
        assert.equal(instance, null)
      }))
  })

  describe('fetchStatus', () => {
    it('get status', done => {
      let check = startTime => {
        if (new Date() - startTime > 300 * 1000) {
          assert.fail('timeout')
        }

        awsInstance
          .fetchStatus()
          .then(status => {
            if (status != null) {
              done()
            } else {
              setTimeout(() => check(startTime), 1000)
            }
          })
          .catch(err => assert.fail(err))
      }

      check(new Date())
    }).timeout(300 * 1000) // テストの最長時間を5分に設定
  })
})
