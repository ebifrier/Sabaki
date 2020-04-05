import assert from 'assert'
import {v4 as uuid} from 'uuid'
import * as aws from '../src/modules/aws.js'

describe('aws', () => {
  let instanceName = null
  let instance = null

  before(done => {
    aws.initialize()

    instanceName = uuid()
    aws
      .launchInstance(instanceName, 't2.micro')
      .then(inst => {
        assert.ok(inst != null)
        instance = inst
        done()
      })
      .catch(done)
  })

  after(done => {
    if (instance == null) {
      done()
      return
    }

    instance
      .terminate()
      .then(done)
      .catch(done)
  })

  describe('fetchInstances', () => {
    it('fetch all', () =>
      aws.fetchInstances().then(instances => {
        assert.ok(instances.length > 0)
      }))

    it('filter by name', () =>
      aws.fetchInstances().then(instances => {
        instances = instances.filter(inst => inst.Name === instance.Name)
        assert.equal(instances.length, 1)
        assert.equal(instances[0].InstanceId, instance.InstanceId)
      }))
  })

  describe('fetchInstanceByName', () => {
    it('correct name', () =>
      aws.fetchInstanceByName(instanceName).then(inst => {
        assert.equal(inst.Name, instance.Name)
        assert.equal(inst.InstanceId, instance.InstanceId)
      }))

    it('invalid name', async () =>
      aws.fetchInstanceByName('DLKSJDOFI').then(inst => {
        assert.equal(inst, null)
      }))
  })

  describe('fetchStatus', () => {
    it('get status', done => {
      let check = startTime => {
        if (new Date() - startTime > 300 * 1000) {
          assert.fail('timeout')
        }

        instance
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
