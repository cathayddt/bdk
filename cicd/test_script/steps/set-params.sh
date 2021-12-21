ORDERER_ORG_NAME_ORG0=$(jq --raw-output '.ordererOrgs[0].name' ./cicd/test_script/network-create.json)
ORDERER_ORG_NAME_ORG1=$(jq --raw-output '.ordererOrgs[1].name' ./cicd/test_script/network-create.json)
ORDERER_ORG_NAME_ORGNEW=$(jq --raw-output '.[0].name' ./cicd/test_script/org-orderer-create.json)
ORDERER_ORG_DOMAIN_ORG0=$(jq --raw-output '.ordererOrgs[0].domain' ./cicd/test_script/network-create.json)
ORDERER_ORG_DOMAIN_ORG1=$(jq --raw-output '.ordererOrgs[1].domain' ./cicd/test_script/network-create.json)
ORDERER_ORG_DOMAIN_ORGNEW=$(jq --raw-output '.[0].domain' ./cicd/test_script/org-orderer-create.json)

PEER_ORG_NAME_ORG0=$(jq --raw-output '.peerOrgs[0].name' ./cicd/test_script/network-create.json)
PEER_ORG_NAME_ORG1=$(jq --raw-output '.peerOrgs[1].name' ./cicd/test_script/network-create.json)
PEER_ORG_NAME_ORG2=$(jq --raw-output '.peerOrgs[2].name' ./cicd/test_script/network-create.json)
PEER_ORG_NAME_ORGNEW=$(jq --raw-output '.[0].name' ./cicd/test_script/org-peer-create.json)
PEER_ORG_DOMAIN_ORG0=$(jq --raw-output '.peerOrgs[0].domain' ./cicd/test_script/network-create.json)
PEER_ORG_DOMAIN_ORG1=$(jq --raw-output '.peerOrgs[1].domain' ./cicd/test_script/network-create.json)
PEER_ORG_DOMAIN_ORG2=$(jq --raw-output '.peerOrgs[2].domain' ./cicd/test_script/network-create.json)
PEER_ORG_DOMAIN_ORGNEW=$(jq --raw-output '.[0].domain' ./cicd/test_script/org-peer-create.json)

CHANNEL_NAME='bdk-channel'

CHAINCODE_NAME='fabcar'
CHAINCODE_LABEL="${CHAINCODE_NAME}_1"

export_env() {
  export BDK_ORG_TYPE=$1
  export BDK_ORG_NAME=$2
  export BDK_ORG_DOMAIN=$3
  export BDK_HOSTNAME=$4
}


ORDERER_ORG_HOSTNAME_ORG0_ORDERER0=$(jq --raw-output '.ordererOrgs[0].hostname[0]' ./cicd/test_script/network-create.json)
ORDERER_ORG_HOSTNAME_ORG0_ORDERER1=$(jq --raw-output '.ordererOrgs[0].hostname[1]' ./cicd/test_script/network-create.json)
ORDERER_ORG_HOSTNAME_ORG1_ORDERER0=$(jq --raw-output '.ordererOrgs[1].hostname[0]' ./cicd/test_script/network-create.json)
ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0=$(jq --raw-output '.[0].hostname[0]' ./cicd/test_script/org-orderer-create.json)
ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1=$(jq --raw-output '.[0].hostname[1]' ./cicd/test_script/org-orderer-create.json)
ORDERER_ORG_PORT_ORG0_ORDERER0=$(jq --raw-output '.ordererOrgs[0].ports[0].port' ./cicd/test_script/network-create.json)
ORDERER_ORG_PORT_ORG0_ORDERER1=$(jq --raw-output '.ordererOrgs[0].ports[1].port' ./cicd/test_script/network-create.json)
ORDERER_ORG_PORT_ORG1_ORDERER0=$(jq --raw-output '.ordererOrgs[1].ports[0].port' ./cicd/test_script/network-create.json)
ORDERER_ORG_PORT_ORGNEW_ORDERER0=$(jq --raw-output '.[0].ports[0].port' ./cicd/test_script/org-orderer-create.json)
ORDERER_ORG_PORT_ORGNEW_ORDERER1=$(jq --raw-output '.[0].ports[1].port' ./cicd/test_script/org-orderer-create.json)
ORDERER_ORG_URL_ORG0_ORDERER0="${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}.${ORDERER_ORG_DOMAIN_ORG0}:${ORDERER_ORG_PORT_ORG0_ORDERER0}"
ORDERER_ORG_URL_ORG0_ORDERER1="${ORDERER_ORG_HOSTNAME_ORG0_ORDERER1}.${ORDERER_ORG_DOMAIN_ORG0}:${ORDERER_ORG_PORT_ORG0_ORDERER1}"
ORDERER_ORG_URL_ORG1_ORDERER0="${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}.${ORDERER_ORG_DOMAIN_ORG1}:${ORDERER_ORG_PORT_ORG1_ORDERER0}"
ORDERER_ORG_URL_ORGNEW_ORDERER0="${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}.${ORDERER_ORG_DOMAIN_ORGNEW}:${ORDERER_ORG_PORT_ORGNEW_ORDERER0}"
ORDERER_ORG_URL_ORGNEW_ORDERER1="${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}.${ORDERER_ORG_DOMAIN_ORGNEW}:${ORDERER_ORG_PORT_ORGNEW_ORDERER1}"


PEER_ORG_PORT_ORG0_PEER0=$(jq --raw-output '.peerOrgs[0].ports[0].port' ./cicd/test_script/network-create.json)
PEER_ORG_PORT_ORG0_PEER1=$(jq --raw-output '.peerOrgs[0].ports[1].port' ./cicd/test_script/network-create.json)
PEER_ORG_PORT_ORG0_PEER2=$(jq --raw-output '.peerOrgs[0].ports[2].port' ./cicd/test_script/network-create.json)
PEER_ORG_PORT_ORG1_PEER0=$(jq --raw-output '.peerOrgs[1].ports[0].port' ./cicd/test_script/network-create.json)
PEER_ORG_PORT_ORG2_PEER0=$(jq --raw-output '.peerOrgs[2].ports[0].port' ./cicd/test_script/network-create.json)
PEER_ORG_PORT_ORGNEW_PEER0=$(jq --raw-output '.[0].ports[0].port' ./cicd/test_script/org-peer-create.json)
PEER_ORG_URL_ORG0_PEER0="peer0.${PEER_ORG_DOMAIN_ORG0}:${PEER_ORG_PORT_ORG0_PEER0}"
PEER_ORG_URL_ORG0_PEER1="peer1.${PEER_ORG_DOMAIN_ORG0}:${PEER_ORG_PORT_ORG0_PEER1}"
PEER_ORG_URL_ORG0_PEER2="peer2.${PEER_ORG_DOMAIN_ORG0}:${PEER_ORG_PORT_ORG0_PEER2}"
PEER_ORG_URL_ORG1_PEER0="peer0.${PEER_ORG_DOMAIN_ORG1}:${PEER_ORG_PORT_ORG1_PEER0}"
PEER_ORG_URL_ORG2_PEER0="peer0.${PEER_ORG_DOMAIN_ORG2}:${PEER_ORG_PORT_ORG2_PEER0}"
PEER_ORG_URL_ORGNEW_PEER0="peer0.${PEER_ORG_DOMAIN_ORGNEW}:${PEER_ORG_PORT_ORGNEW_PEER0}"