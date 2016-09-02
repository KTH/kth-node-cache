'use strict'

const test = require('tape')
const redis = require('kth-node-redis')
const factory = require('../../index')
const logger = require('kth-node-log')

logger.init({})

test('full stack integration test', (assert) => {
  const redisPromise = redis('default', {})
  const cachePromise = redisPromise
    .then((client) => {
      return factory.getRedisCache(client, 'test', 'test', 0, logger)
    })

  cachePromise
    .then((cache) => {
      return cache.set('key', 'value', 30)
    })
    .then(() => cachePromise)
    .then((cache) => {
      return cache.get('key')
    })
    .then((value) => {
      assert.equal(value, 'value', 'should equal set value')
      return cachePromise
    })
    .then((cache) => {
      return cache.countKeys()
    })
    .then((result) => {
      assert.equal(result.numKeys, 1, 'should have one key set')
      return cachePromise
    })
    .then((cache) => {
      return cache.clearKeys()
    })
    .then((result) => {
      assert.equal(result.numDeleted, 1, 'should have cleared one key')
      return redisPromise
    })
    .catch((err) => {
      assert.error(err, 'should not yield error')
      return redisPromise
    })
    .then((client) => {
      client.quit()
      assert.end()
    })
})
