/* global describe, it, after */
import fs from 'fs'
import assert from 'assert'
import Config from '../../src/service/config'
import { ConfigEnvType, ConfigSetType } from '../../src/model/type/config.type'
import config, { EnvironmentEnum, OrgTypeEnum } from '../../src/config'
import { ProcessError } from '../../src/util'

describe('Config service: ', () => {
  const configEnv: ConfigEnvType = {
    NODE_ENV: EnvironmentEnum.testing,
    BDK_NETWORK_NAME: 'test-network',
    BDK_ORG_TYPE: OrgTypeEnum.PEER,
    BDK_ORG_NAME: 'TestOrg',
    BDK_ORG_DOMAIN: 'test.domain.com',
    BDK_HOSTNAME: 'peer0',
    DOCKER_LOGGING: true,
  }

  const configSetEnv: ConfigSetType = {
    key: 'BDK_ORG_DOMAIN',
    value: 'test.set.domain.com',
  }

  describe('[init] ', () => {
    describe('Default value', () => {
      after(() => {
        fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      })

      it('should exist .env file in specified path', () => {
        (new Config(config)).init()

        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/.env`), true)
      })

      it('.env content and inputs should be the same', () => {
        (new Config(config)).init()

        const checkConfig = 'NODE_ENV=production\nBDK_NETWORK_NAME=bdk-network\nBDK_ORG_TYPE=peer\nBDK_ORG_NAME=Org1\nBDK_ORG_DOMAIN=org1.example.com\nBDK_HOSTNAME=peer0\nDOCKER_LOGGING=false\n'

        assert.strictEqual(fs.readFileSync(`${config.infraConfig.bdkPath}/.env`).toString(), checkConfig)
      })
    })

    describe('Customized value', () => {
      after(() => {
        fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
      })

      it('should exist .env file in specified path', () => {
        (new Config(config)).init(configEnv)

        assert.strictEqual(fs.existsSync(`${config.infraConfig.bdkPath}/.env`), true)
      })

      it('.env content and inputs should be the same', () => {
        (new Config(config)).init(configEnv)

        const checkConfig = 'NODE_ENV=testing\nBDK_NETWORK_NAME=test-network\nBDK_ORG_TYPE=peer\nBDK_ORG_NAME=TestOrg\nBDK_ORG_DOMAIN=test.domain.com\nBDK_HOSTNAME=peer0\nDOCKER_LOGGING=true\n'

        assert.strictEqual(fs.readFileSync(`${config.infraConfig.bdkPath}/.env`).toString(), checkConfig)
      })
    })
  })

  describe('[set]', () => {
    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
    })

    it('should throw init first error message', () => {
      // TODO bdk error 沒有分別類型
      assert.throws(() => { (new Config(config)).set(configSetEnv) }, new ProcessError('Missing process: Run <bdk config init> first'))
    })

    it('.env should be BDK_ORG_DOMAIN=test.set.domain.com', () => {
      (new Config(config)).init();
      (new Config(config)).set(configSetEnv)

      const checkConfig = 'NODE_ENV=production\nBDK_NETWORK_NAME=bdk-network\nBDK_ORG_TYPE=peer\nBDK_ORG_NAME=Org1\nBDK_ORG_DOMAIN=test.set.domain.com\nBDK_HOSTNAME=peer0\nDOCKER_LOGGING=false\n'

      assert.strictEqual(fs.readFileSync(`${config.infraConfig.bdkPath}/.env`).toString(), checkConfig)
    })
  })

  describe('[ls]', () => {
    after(() => {
      fs.unlinkSync(`${config.infraConfig.bdkPath}/.env`)
    })

    it('should throw init first error message', () => {
      // TODO bdk error 沒有分別類型
      assert.throws(() => { (new Config(config)).set(configSetEnv) }, new ProcessError('Missing process: Run <bdk config init> first'))
    })

    it('should return current .env config', () => {
      (new Config(config)).init();
      (new Config(config)).ls()

      const checkConfig = 'NODE_ENV=production\nBDK_NETWORK_NAME=bdk-network\nBDK_ORG_TYPE=peer\nBDK_ORG_NAME=Org1\nBDK_ORG_DOMAIN=org1.example.com\nBDK_HOSTNAME=peer0\nDOCKER_LOGGING=false\n'

      assert.strictEqual(fs.readFileSync(`${config.infraConfig.bdkPath}/.env`).toString(), checkConfig)
    })
  })
})
