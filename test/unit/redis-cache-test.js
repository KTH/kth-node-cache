'use strict'

const test = require('tape')
const sinon = require('sinon')
const factory = require('../../index')
const RedisCache = require('../../redis-cache')

const keyPrefix = 'test-key-prefix'
const systemKeyPrefix = 'test-system-key-prefix'

function _create (mock) {
  return factory.getRedisCache(mock, keyPrefix, systemKeyPrefix)
}

test('factory initializes RedisCache', (assert) => {
  const cache = _create({})
  assert.ok(cache instanceof RedisCache, 'should be instance of RedisCache')
  assert.end()
})

test('set stores value with expiration time', (assert) => {
  const mock = {
    setAsync: sinon.stub().returns(Promise.resolve('ok set')),
    expireAsync: sinon.stub().returns(Promise.resolve('ok expire'))
  }

  const cache = _create(mock)

  cache.set('test-key', 'test-value', 1000)
    .then((result) => {
      assert.ok(mock.setAsync.called, 'should call setAsync')
      assert.ok(mock.expireAsync.called, 'should call expireAsync')
      assert.equal(result, 'ok expire', 'should equal result "ok expire"')
      assert.end()
    })
    .catch((err) => {
      assert.error(err, 'should not yield error')
      assert.end()
    })
})

test('get returns value', (assert) => {
  const mock = {
    getAsync: sinon.stub().returns(Promise.resolve('ok get'))
  }

  const cache = _create(mock)

  cache.get('test-key')
    .then((result) => {
      assert.ok(mock.getAsync.called, 'should call getAsync')
      assert.equal(result, 'ok get')
      assert.end()
    })
    .catch((err) => {
      assert.error(err, 'should not yield error')
      assert.end()
    })
})

test('get throws error', (assert) => {
  const mock = {
    getAsync: sinon.stub().returns(Promise.resolve(null))
  }

  const cache = _create(mock)
  const key = 'test-key'
  const expectedMessage = `No result for: ${systemKeyPrefix}:${keyPrefix}:${key}`

  cache.get(key)
    .then((result) => {
      assert.notOk(result, 'should not get result')
      assert.end()
    })
    .catch((err) => {
      assert.ok(mock.getAsync.called, 'should call getAsync')
      assert.equal(err.message, expectedMessage, 'should yield error')
      assert.end()
    })
})

test('getKeyWithPrefix returns full key', (assert) => {
  const cache = _create({})
  const key = 'test'
  const prefixedKey = cache.getKeyWithPrefix(key)
  const expectedKey = `${systemKeyPrefix}:${keyPrefix}:${key}`

  assert.equal(prefixedKey, expectedKey, 'should equal prefix key')
  assert.end()
})

test('countKeys return number of matching keys', (assert) => {
  const mock = {
    keysAsync: sinon.stub().returns(Promise.resolve([ 'a', 'b' ]))
  }

  const cache = _create(mock)
  const expected = { keyPrefix: `${systemKeyPrefix}:${keyPrefix}`, numKeys: 2 }

  cache.countKeys()
    .then((result) => {
      assert.ok(mock.keysAsync.called, 'should call keysAsync')
      assert.deepEqual(result, expected, 'should equal expected result')
      assert.end()
    })
    .catch((err) => {
      assert.error(err, 'should not yield error')
      assert.end()
    })
})

test('clearKeys deletes all matching keys', (assert) => {
  const mock = {
    keysAsync: sinon.stub().returns(Promise.resolve([ 'a', 'b' ])),
    delAsync: sinon.stub().returns(Promise.resolve(2))
  }

  const cache = _create(mock)
  const expected = { keyPrefix: `${systemKeyPrefix}:${keyPrefix}`, numDeleted: 2 }

  cache.clearKeys()
    .then((result) => {
      assert.ok(mock.keysAsync.called, 'should call keysAsync')
      assert.ok(mock.delAsync.called, 'should call delAsync')
      assert.deepEqual(result, expected, 'should equal expected result')
      assert.end()
    })
    .catch((err) => {
      assert.error(err, 'should not yield error')
      assert.end()
    })
})
