import { Argv, Arguments } from 'yargs'
import Channel from '../../service/channel'
import prompts from 'prompts'
import { PolicyTypeEnum, ChannelCreateType, ChannelPolicyType, PolicyStyleEnum } from '../../model/type/channel.type'
import config from '../../config'
import { onCancel, logger, ParamsError } from '../../util'
import { policyQuestions, getPolicyTypeAndValue } from '../../model/prompts/policyQuestion'
import { getOrdererList, getOrgNames } from '../../model/prompts/util'

export const command = 'create'

export const desc = '建立新的 Channel 在 Blockchain network'

interface OptType {
  interactive: boolean
  name: string
  orgNames: string[]
  channelAdminPolicy: ChannelPolicyType
  channelAdminPolicyStyle: PolicyStyleEnum
  channelAdminPolicyType: PolicyTypeEnum
  channelAdminPolicyValue: string
  lifecycleEndorsement: ChannelPolicyType
  lifecycleEndorsementStyle: PolicyStyleEnum
  lifecycleEndorsementType: PolicyTypeEnum
  lifecycleEndorsementValue: string
  endorsement: ChannelPolicyType
  endorsementStyle: PolicyStyleEnum
  endorsementType: PolicyTypeEnum
  endorsementValue: string
  orderer: string
}

const ordererList = getOrdererList(config)
const orgNames = getOrgNames(config)

export const checkPolicyValue = (policyType: PolicyTypeEnum | undefined, policyValue: string | undefined, identity: string | undefined, policyStyle: PolicyStyleEnum | undefined, peerOrgs: string[]): ChannelPolicyType => {
  if (policyStyle) {
    if (!identity) {
      logger.error('[x] Please input identity when use policy style!!!')
      throw new ParamsError('Please input identity when use policy style!!!')
    }
    return getPolicyTypeAndValue(policyStyle, peerOrgs, identity)
  } else if (policyType === PolicyTypeEnum.IMPLICITMETA) {
    if (!(policyValue && policyValue.match(/^((ALL)|(ANY)|(MAJORITY)).+$/))) {
      logger.error(`[x] Please input ${PolicyTypeEnum.IMPLICITMETA} policy value!!!`)
      throw new ParamsError(`Invalid params: Input invalid ${PolicyTypeEnum.IMPLICITMETA} policy value!!!`)
    }

    return {
      type: policyType,
      value: policyValue,
    }
  } else if (policyType === PolicyTypeEnum.SIGNATURE) {
    if (!(policyValue && policyValue.match(/^((OR)|(AND)|(OutOf)) *\(.+\)$/))) {
      logger.error(`[x] Please input correct ${PolicyTypeEnum.SIGNATURE} policy value!!!`)
      throw new ParamsError(`Invalid params: Input invalid ${PolicyTypeEnum.SIGNATURE} policy value!!!`)
    }

    return {
      type: policyType,
      value: policyValue,
    }
  } else {
    logger.error('[x] Please input policy type or policy style!!!')
    throw new ParamsError('Please input policy type or policy style!!!')
  }
}

export const builder = (yargs: Argv<OptType>) => {
  return yargs
    .example('bdk channel create --interactive', 'Cathay BDK 互動式問答')
    .example('bdk channel create --name test --orderer orderer0.example.com:7050 --orgNames Org1 --orgNames Org2', '使用 orderer0.example.com:7050 建立有 Org1 和 Org2 的 test 名稱 Channel')
    .example('bdk channel create --name test --orderer orderer0.example.com:7050 --orgNames Org1 --orgNames Org2 --channel-admin-policy-style Any-Member-in-Channel', '使用 orderer0.example.com:7050 建立有 Org1 和 Org2 的 test 名稱 Channel，其中 Channel Admin Policy 為有任何在 Channel 中的 Peer Org 簽名選項')
    .example('bdk channel create --name test --orderer orderer0.example.com:7050 --orgNames Org1 --orgNames Org2 --channel-admin-policy-type Signature --channel-admin-policy-value OR(\'Org1.admin\', \'Org2.admin\')', '使用 orderer0.example.com:7050 建立有 Org1 和 Org2 的 test 名稱 Channel，其中 Channel Admin Policy 為有 Org1 和 Org2 任意一個 admin 身份的簽名')
    .example('bdk channel create --name test --orderer orderer0.example.com:7050 --orgNames Org1 --orgNames Org2 --lifecycle-endorsement-style Any-Member-in-Channel', '使用 orderer0.example.com:7050 建立有 Org1 和 Org2 的 test 名稱 Channel，其中 Lifecycle Endorsement Policy 為有任何在 Channel 中的 Peer Org 簽名選項')
    .example('bdk channel create --name test --orderer orderer0.example.com:7050 --orgNames Org1 --orgNames Org2 --lifecycle-endorsement-type Signature --lifecycle-endorsement-value OR(\'Org1.admin\', \'Org2.admin\')', '使用 orderer0.example.com:7050 建立有 Org1 和 Org2 的 test 名稱 Channel，其中 Lifecycle Endorsement Policy 為有 Org1 和 Org2 任意一個 peer 身份的簽名')
    .example('bdk channel create --name test --orderer orderer0.example.com:7050 --orgNames Org1 --orgNames Org2 --endorsement-style Any-Member-in-Channel', '使用 orderer0.example.com:7050 建立有 Org1 和 Org2 的 test 名稱 Channel，其中 Endorsement Policy 為有任何在 Channel 中的 Peer Org 簽名選項')
    .example('bdk channel create --name test --orderer orderer0.example.com:7050 --orgNames Org1 --orgNames Org2 --endorsement-type Signature --endorsement-value OR(\'Org1.admin\', \'Org2.admin\')', '使用 orderer0.example.com:7050 建立有 Org1 和 Org2 的 test 名稱 Channel，其中 Endorsement Policy 為有 Org1 和 Org2 任意一個 peer 身份的簽名')
    .option('interactive', { type: 'boolean', description: '是否使用 Cathay BDK 互動式問答', alias: 'i' })
    .option('name', { type: 'string', description: '建立 Channel 的名稱', alias: 'n' })
    .option('orgNames', { type: 'array', choices: orgNames, description: '加入新建立 Channel 的 Peer Org 名稱', alias: 'o' })
    .option('channel-admin-policy-style', { type: 'string', choices: Object.values(PolicyStyleEnum), description: '選擇新建立 Channel 中基本的 Channel Admin Policy 選項（像是用在新 Peer Org 加入在 Channel 中的 Policy）', alias: 'as' })
    .option('channel-admin-policy-type', { type: 'string', choices: Object.values(PolicyTypeEnum), description: '選擇新建立 Channel 中的 Channel Admin Policy 型態', alias: 'at', default: PolicyTypeEnum.IMPLICITMETA })
    .option('channel-admin-policy-value', { type: 'string', description: '新建立 Channel 中的 Channel Admin Policy 值', alias: 'a', default: 'MAJORITY Admins' })
    .option('lifecycle-endorsement-style', { type: 'string', choices: Object.values(PolicyStyleEnum), description: '選擇新建立 Channel 中基本的 Lifcycle Endorsement Policy 選項（用在部署新的 Chaincode 在 Channel 中的 Policy）', alias: 'ls' })
    .option('lifecycle-endorsement-type', { type: 'string', choices: Object.values(PolicyTypeEnum), description: '選擇新建立 Channel 中的 Lifcycle Endorsement Policy 型態', alias: 'lt', default: PolicyTypeEnum.IMPLICITMETA })
    .option('lifecycle-endorsement-value', { type: 'string', description: '新建立 Channel 中的 Lifcycle Endorsement Policy 值', alias: 'l', default: 'MAJORITY Endorsement' })
    .option('endorsement-style', { type: 'string', choices: Object.values(PolicyStyleEnum), description: '選擇新建立 Channel 中基本的 Endorsement Policy 選項（用在發送交易在 Channel 中的 Policy）', alias: 'es' })
    .option('endorsement-type', { type: 'string', choices: Object.values(PolicyTypeEnum), description: '選擇新建立 Channel 中的 Endorsement Policy 型態', alias: 'et', default: PolicyTypeEnum.IMPLICITMETA })
    .option('endorsement-value', { type: 'string', description: '新建立 Channel 中的 Endorsement Policy 值', alias: 'e', default: 'MAJORITY Endorsement' })
    .option('orderer', { type: 'string', choices: ordererList, description: '選擇 Orderer 建立 Channel' })
}

export const handler = async (argv: Arguments<OptType>) => {
  const channel = new Channel(config)

  let createChannelInput: ChannelCreateType

  if (argv.interactive) {
    const channelDetails = await prompts([
      {
        type: 'text',
        name: 'channelName',
        message: 'What is your channel name?',
        initial: 'test',
      },
      {
        type: 'select',
        name: 'orderer',
        message: 'Ordering service endpoint',
        choices: ordererList.map(x => ({
          title: x,
          value: x,
        })),
      },
      {
        type: 'multiselect',
        name: 'orgNames',
        message: 'Please choose org in your channel?',
        choices: orgNames.map(orgName => ({
          title: orgName,
          value: orgName,
        })),
        initial: 0,
      },
    ], { onCancel })

    const channelAdminPolicy = await policyQuestions('channelAdminPolicy', channelDetails.orgNames, 'admin')
    const lifecycleEndorsement = await policyQuestions('lifecycleEndorsement', channelDetails.orgNames, 'peer')
    const endorsement = await policyQuestions('endorsement', channelDetails.orgNames, 'peer')

    createChannelInput = {
      channelName: channelDetails.channelName,
      orgNames: channelDetails.orgNames,
      channelAdminPolicy: channelAdminPolicy,
      lifecycleEndorsement: lifecycleEndorsement,
      endorsement: endorsement,
      orderer: channelDetails.orderer,
    }
  } else {
    const { name, orgNames, channelAdminPolicyStyle, channelAdminPolicyType, channelAdminPolicyValue, lifecycleEndorsementStyle, lifecycleEndorsementType, lifecycleEndorsementValue, endorsementStyle, endorsementType, endorsementValue, orderer } = argv

    createChannelInput = {
      channelName: name,
      orgNames: orgNames,
      channelAdminPolicy: checkPolicyValue(channelAdminPolicyType, channelAdminPolicyValue, 'admin', channelAdminPolicyStyle, orgNames),
      lifecycleEndorsement: checkPolicyValue(lifecycleEndorsementType, lifecycleEndorsementValue, 'peer', lifecycleEndorsementStyle, orgNames),
      endorsement: checkPolicyValue(endorsementType, endorsementValue, 'peer', endorsementStyle, orgNames),
      orderer: orderer,
    }
  }
  await channel.create(createChannelInput)
}
