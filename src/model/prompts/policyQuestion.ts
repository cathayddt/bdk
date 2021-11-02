import prompts from 'prompts'
import { onCancel, ParamsError } from '../../util'
import { ChannelPolicyType, PolicyTypeEnum, PolicyStyleEnum } from '../type/channel.type'

const signaturePolicyValue = (orgNameList: string[], identity: string): string => `(${orgNameList.map(orgName => `'${orgName}.${identity}'`).toString()})`
const adminAndEndorsementChanger = (identity: string): string => (identity === 'admin') ? 'Admins' : 'Endorsement'

export const getPolicyTypeAndValue = (samplePolicy: PolicyStyleEnum, orgNameList: string[], identity: string): ChannelPolicyType => {
  switch (samplePolicy) {
    case PolicyStyleEnum.ALL_INITIAL_MEMBER:
      return {
        type: PolicyTypeEnum.SIGNATURE,
        value: `AND ${signaturePolicyValue(orgNameList, identity)}`,
      }
    case PolicyStyleEnum.ANY_INITIAL_MEMBER:
      return {
        type: PolicyTypeEnum.SIGNATURE,
        value: `OR ${signaturePolicyValue(orgNameList, identity)}`,
      }
    case PolicyStyleEnum.ANY_MEMBER_IN_CHANNEL:
      return {
        type: PolicyTypeEnum.IMPLICITMETA,
        value: `ANY ${adminAndEndorsementChanger(identity)}`,
      }
    case PolicyStyleEnum.MAJORITY_MEMBER_IN_CHANNEL:
      return {
        type: PolicyTypeEnum.IMPLICITMETA,
        value: `MAJORITY ${adminAndEndorsementChanger(identity)}`,
      }
    default:
      throw new ParamsError('Invalid params: Required parameter <policyStyle> missing')
  }
}

export const policyQuestions = async (policyName: string, orgNameList: string[], identity: string): Promise<ChannelPolicyType> => {
  const { type } = await prompts([
    {
      type: 'select',
      name: 'type',
      message: `Please choose your ${policyName} type in channel`,
      choices: [
        {
          title: 'Signature',
          value: PolicyTypeEnum.SIGNATURE,
        },
        {
          title: 'ImplicitMeta',
          value: PolicyTypeEnum.IMPLICITMETA,
        },
      ],
      initial: 1,
    },
  ], { onCancel })

  let policyValue
  if (type === PolicyTypeEnum.SIGNATURE) {
    policyValue = await prompts([
      {
        type: 'select',
        name: 'value',
        message: `What is your ${policyName} value in channel?`,
        choices: [
          {
            title: `Any ${identity} signature of initial member`,
            value: `OR ${signaturePolicyValue(orgNameList, identity)}`,
          },
          {
            title: `All ${identity} signature of initial member`,
            value: `AND ${signaturePolicyValue(orgNameList, identity)}`,
          },
        ],
        initial: 0,
      },
    ], { onCancel })
  } else {
    policyValue = await prompts([
      {
        type: 'select',
        name: 'value',
        message: `What is your ${policyName} value in channel?`,
        choices: [
          {
            title: `Any ${adminAndEndorsementChanger(identity)} signature in channel`,
            value: `ANY ${adminAndEndorsementChanger(identity)}`,
          },
          {
            title: `Majority ${adminAndEndorsementChanger(identity)} signature in channel`,
            value: `MAJORITY ${adminAndEndorsementChanger(identity)}`,
          },
        ],
        initial: 0,
      },
    ], { onCancel })
  }

  return { type, value: policyValue.value }
}
