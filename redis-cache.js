const emptyLogger = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  child: () => { return emptyLogger }
}

function RedisCache (redisClient, keyPrefix, systemKeyPrefix, globalExpire, log) {
  if (!(this instanceof RedisCache)) {
    return new RedisCache(redisClient, keyPrefix, systemKeyPrefix, globalExpire, log)
  }

  this.log = log || emptyLogger
  this.globalExpire = globalExpire
  this.redisClient = redisClient
  this.prefixKey = createPrefixKey(systemKeyPrefix, keyPrefix)
}

RedisCache.prototype.set = function (key, value, expire) {
  const self = this
  const localKey = self.getKeyWithPrefix(key)
  const expireTime = expire || self.globalExpire || 0

  return self.redisClient.setAsync(localKey, value)
    .then(() => {
      self.log.debug(`Stored key: ${localKey}`)
      self.log.trace({ value: value }, 'Stored value')

      if (expireTime) {
        self.log.debug(`Expire time (${expireTime}) + was set on key: ${localKey}`)
        return self.redisClient.expireAsync(localKey, expireTime)
      }

      return true
    })
}

RedisCache.prototype.get = function (key) {
  const self = this
  const localKey = self.getKeyWithPrefix(key)

  return self.redisClient.getAsync(localKey)
    .then((result) => {
      if (result === null || result === undefined) {
        const message = `No result for: ${localKey}`
        self.log.debug(message)
        throw new Error(message)
      }

      self.log.debug(`Found result for: ${localKey}`)
      self.log.trace({ value: result }, 'Value')
      return result
    })
}

RedisCache.prototype.getKeyWithPrefix = function (key) {
  if (this.prefixKey) {
    return this.prefixKey + ':' + key
  } else {
    return key
  }
}

RedisCache.prototype.countKeys = function () {
  const self = this
  const keySearchCriteria = self.getKeyWithPrefix('*')

  return self.redisClient.keysAsync(keySearchCriteria)
    .then((result) => {
      if (result === null || result === undefined) {
        return { keyPrefix: self.prefixKey, numKeys: 0 }
      }

      self.log.debug(`Key search criteria: ${keySearchCriteria} Result: ${result.length}`)
      return { keyPrefix: self.prefixKey, numKeys: result.length }
    })
}

RedisCache.prototype.clearKeys = function () {
  const self = this
  const keySearchCriteria = self.getKeyWithPrefix('*')

  return self.redisClient.keysAsync(keySearchCriteria)
    .then((result) => {
      if (result === null || result === undefined) {
        const message = `No keys to delete for: ${keySearchCriteria}`
        self.log.debug(message)
        throw new Error(message)
      }

      self.log.debug(`Found ${result.length} keys to delete for: ${keySearchCriteria}`)

      return self.redisClient.delAsync.apply(self.redisClient, result)
    })
    .then((numDeleted) => {
      self.log.debug(`Deleted ${numDeleted} keys from cache.`)
      return { keyPrefix: self.prefixKey, numDeleted: numDeleted }
    })
}

function createPrefixKey (systemKeyPrefix, keyPrefix) {
  var keys = []

  if (systemKeyPrefix) {
    keys.push(systemKeyPrefix)
  }

  if (keyPrefix) {
    keys.push(keyPrefix)
  }

  return keys.join(':')
}

module.exports = RedisCache
