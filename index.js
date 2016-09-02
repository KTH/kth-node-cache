'use strict'

const RedisCache = require('./redis-cache')

function _redisCache (redisClient, keyPrefix, systemKeyPrefix, globalExpire, nodeLog) {
  if (!redisClient) {
    throw new Error('KTH-Cache._redisCache: Was not called with a redis client')
  } else if (!keyPrefix) {
    throw new Error('KTH-Cache._redisCache: Was not called with a key prefix')
  } else if (!systemKeyPrefix) {
    throw new Error('KTH-Cache._redisCache: Was not called with a system key prefix')
  }

  return new RedisCache(redisClient, keyPrefix, systemKeyPrefix, globalExpire, nodeLog)
}

module.exports = {
  getRedisCache: _redisCache
}
