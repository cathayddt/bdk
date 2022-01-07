/* global describe, it, after, before, beforeEach */
import fs from 'fs'
import assert from 'assert'
import Config from '../../src/service/config'
import { ConfigEnvType, ConfigSetType } from '../../src/model/type/config.type'
import config, { defaultEnv } from '../../src/config'
import { ProcessError } from '../../src/util'

import dotenv from 'dotenv'

describe('Config service: ', () => {
  describe('init', () => {
    before(() => {
      (new Config(config)).init()
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
    })

    it('should exist .env file in specified path', () => {
      assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/.env`), true)
    })

    it('.env content and inputs should be the same', () => {
      const env = dotenv.parse(fs.readFileSync(`${config.infraConfig.bdkPath}/.env`))

      for (const iterator of Object.entries(defaultEnv)) {
        assert.strictEqual(env[iterator[0]].toString(), iterator[1].toString())
      }
    })
  })

  describe('set', () => {
    const configSetEnv: ConfigSetType = {
      key: 'BDK_ORG_DOMAIN',
      value: 'test.set.domain.com',
    }

    beforeEach(() => {
      (new Config(config)).init()
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
    })

    it('should throw init first error message', () => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)

      assert.throws(() => { (new Config(config)).set(configSetEnv) }, new ProcessError('Missing process: Run <bdk config init> first'))
    })

    it('.env should be BDK_ORG_DOMAIN=test.set.domain.com', () => {
      (new Config(config)).set(configSetEnv)

      Object.assign(defaultEnv, defaultEnv, { [configSetEnv.key]: configSetEnv.value })

      const env = dotenv.parse(fs.readFileSync(`${config.infraConfig.bdkPath}/.env`))

      for (const iterator of Object.entries(defaultEnv)) {
        assert.strictEqual(env[iterator[0]].toString(), iterator[1].toString())
      }
    })
  })

  describe('ls', () => {
    before(() => {
      (new Config(config)).init()
    })

    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
    })

    it('should return current .env config', () => {
      (new Config(config)).init()
      const ls = (new Config(config)).ls()

      for (const iterator of Object.entries(defaultEnv)) {
        assert.strictEqual(ls[iterator[0] as keyof ConfigEnvType]?.toString(), iterator[1].toString())
      }
    })
  })
})
