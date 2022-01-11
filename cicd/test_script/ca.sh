#! /bin/bash -ve

export NODE_ENV=production # testing  development  production
export BDK_NETWORK_NAME=shell-network-ca

. ./cicd/test_script/steps/set-params.sh

RCA_DOMAIN='rca.cathaybc.com'
RCA_PORT='7054'
ICA_DOMAIN_ORG0='ica.org0.cathaybc.com'
ICA_PORT_ORG0='7154'
ICA_DOMAIN_ORG1='ica.org1.cathaybc.com'
ICA_PORT_ORG1='7254'
ICA_DOMAIN_ORG2='ica.org2.cathaybc.com'
ICA_PORT_ORG2='7354'
ICA_DOMAIN_ORGNEW='ica.orgnew.cathaybc.com'
ICA_PORT_ORGNEW='7454'

# RCA
bdk ca up -n ${RCA_DOMAIN} -p ${RCA_PORT} --csr-cn ${RCA_DOMAIN} --csr-hosts ${RCA_DOMAIN} --csr-expiry 87600h --csr-pathlength 1
sleep 2
bdk ca enroll -t client -u ${RCA_DOMAIN} -p ${RCA_PORT} --client-id admin --client-secret adminpw --role rca --org-hostname ${RCA_DOMAIN}

# [org0] ICA
bdk ca register -t ica -a admin -u ${RCA_DOMAIN} -p ${RCA_PORT} --client-id ${ICA_DOMAIN_ORG0} --client-secret org0icapw
bdk ca up -n ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --ica-parentserver-cn ${RCA_DOMAIN} --ica-parentserver-url "https://${ICA_DOMAIN_ORG0}:org0icapw@${RCA_DOMAIN}:${RCA_PORT}" --ica-enrollment-host ${ICA_DOMAIN_ORG0} --ica-enrollment-profile ca
sleep 2

# [org1] ICA
bdk ca register -t ica -a admin -u ${RCA_DOMAIN} -p ${RCA_PORT} --client-id ${ICA_DOMAIN_ORG1} --client-secret org1icapw
bdk ca up -n ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --ica-parentserver-cn ${RCA_DOMAIN} --ica-parentserver-url "https://${ICA_DOMAIN_ORG1}:org1icapw@${RCA_DOMAIN}:${RCA_PORT}" --ica-enrollment-host ${ICA_DOMAIN_ORG1} --ica-enrollment-profile ca
sleep 2

# [org2] ICA
bdk ca register -t ica -a admin -u ${RCA_DOMAIN} -p ${RCA_PORT} --client-id ${ICA_DOMAIN_ORG2} --client-secret org2icapw
bdk ca up -n ${ICA_DOMAIN_ORG2} -p ${ICA_PORT_ORG2} --ica-parentserver-cn ${RCA_DOMAIN} --ica-parentserver-url "https://${ICA_DOMAIN_ORG2}:org2icapw@${RCA_DOMAIN}:${RCA_PORT}" --ica-enrollment-host ${ICA_DOMAIN_ORG2} --ica-enrollment-profile ca
sleep 2

# ------------------------------------------------------------------------------------------------

# [org0] orderer
bdk ca enroll -t client -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id admin --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORG0}
# - orderer org
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id Admin@${ORDERER_ORG_DOMAIN_ORG0} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id Admin@${ORDERER_ORG_DOMAIN_ORG0} --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORG0}
# - orderer0
bdk ca register -t orderer -a admin -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id "${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}.${ORDERER_ORG_DOMAIN_ORG0}" --client-secret org0ordererpw
bdk ca enroll -t orderer -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id "${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}.${ORDERER_ORG_DOMAIN_ORG0}" --client-secret org0ordererpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORG0}
# - orderer1
bdk ca register -t orderer -a admin -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id "${ORDERER_ORG_HOSTNAME_ORG0_ORDERER1}.${ORDERER_ORG_DOMAIN_ORG0}" --client-secret org0ordererpw
bdk ca enroll -t orderer -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id "${ORDERER_ORG_HOSTNAME_ORG0_ORDERER1}.${ORDERER_ORG_DOMAIN_ORG0}" --client-secret org0ordererpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORG0}

# [org1] orderer
bdk ca enroll -t client -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id admin --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORG1}
# - orderer org
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id Admin@${ORDERER_ORG_DOMAIN_ORG1} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id Admin@${ORDERER_ORG_DOMAIN_ORG1} --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORG1}
# - orderer0
bdk ca register -t orderer -a admin -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id "${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}.${ORDERER_ORG_DOMAIN_ORG1}" --client-secret org1ordererpw
bdk ca enroll -t orderer -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id "${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}.${ORDERER_ORG_DOMAIN_ORG1}" --client-secret org1ordererpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORG1}

# ------------------------------------------------------------------------------------------------

# [org0] peer
bdk ca enroll -t client -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id admin --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG0}
# - peer org
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id Admin@${PEER_ORG_DOMAIN_ORG0} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id Admin@${PEER_ORG_DOMAIN_ORG0} --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG0}
# - peer0
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id peer0.${PEER_ORG_DOMAIN_ORG0} --client-secret org0peerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id peer0.${PEER_ORG_DOMAIN_ORG0} --client-secret org0peerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG0}
# - peer1
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id peer1.${PEER_ORG_DOMAIN_ORG0} --client-secret org0peerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id peer1.${PEER_ORG_DOMAIN_ORG0} --client-secret org0peerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG0}
# - peer2
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id peer2.${PEER_ORG_DOMAIN_ORG0} --client-secret org0peerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ORG0} -p ${ICA_PORT_ORG0} --client-id peer2.${PEER_ORG_DOMAIN_ORG0} --client-secret org0peerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG0}

# [org1] peer
bdk ca enroll -t client -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id admin --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG1}
# - peer org
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id Admin@${PEER_ORG_DOMAIN_ORG1} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id Admin@${PEER_ORG_DOMAIN_ORG1} --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG1}
# - peer0
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id peer0.${PEER_ORG_DOMAIN_ORG1} --client-secret org1peerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ORG1} -p ${ICA_PORT_ORG1} --client-id peer0.${PEER_ORG_DOMAIN_ORG1} --client-secret org1peerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG1}

# [org2] peer
bdk ca enroll -t client -u ${ICA_DOMAIN_ORG2} -p ${ICA_PORT_ORG2} --client-id admin --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG2}
# - peer org
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_ORG2} -p ${ICA_PORT_ORG2} --client-id Admin@${PEER_ORG_DOMAIN_ORG2} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_ORG2} -p ${ICA_PORT_ORG2} --client-id Admin@${PEER_ORG_DOMAIN_ORG2} --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG2}
# - peer0
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ORG2} -p ${ICA_PORT_ORG2} --client-id peer0.${PEER_ORG_DOMAIN_ORG2} --client-secret org2peerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ORG2} -p ${ICA_PORT_ORG2} --client-id peer0.${PEER_ORG_DOMAIN_ORG2} --client-secret org2peerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORG2}

# ================================================================================================

# Network create
bdk network create -f ./cicd/test_script/network-create.json --genesis --connection-profile --docker-compose

# =====================================================
. ./cicd/test_script/steps/peer-and-orderer-up.sh
. ./cicd/test_script/steps/channel.sh
. ./cicd/test_script/steps/explorer.sh
. ./cicd/test_script/steps/chaincode.sh
# =====================================================

# [ORGNEW] ICA
bdk ca register -t ica -a admin -u ${RCA_DOMAIN} -p ${RCA_PORT} --client-id ${ICA_DOMAIN_ORGNEW} --client-secret orgnewicapw
bdk ca up -n ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --ica-parentserver-cn ${RCA_DOMAIN} --ica-parentserver-url "https://${ICA_DOMAIN_ORGNEW}:orgnewicapw@${RCA_DOMAIN}:${RCA_PORT}" --ica-enrollment-host ${ICA_DOMAIN_ORGNEW} --ica-enrollment-profile ca
sleep 2

# [orgnew] orderer
bdk ca enroll -t client -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id admin --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORGNEW}
# - orderer org
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id Admin@${ORDERER_ORG_DOMAIN_ORGNEW} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id Admin@${ORDERER_ORG_DOMAIN_ORGNEW} --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORGNEW}
# - orderer0
bdk ca register -t orderer -a admin -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}.${ORDERER_ORG_DOMAIN_ORGNEW}" --client-secret orgnewordererpw
bdk ca enroll -t orderer -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}.${ORDERER_ORG_DOMAIN_ORGNEW}" --client-secret orgnewordererpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORGNEW}
# - orderer1
bdk ca register -t orderer -a admin -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}.${ORDERER_ORG_DOMAIN_ORGNEW}" --client-secret orgnewordererpw
bdk ca enroll -t orderer -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}.${ORDERER_ORG_DOMAIN_ORGNEW}" --client-secret orgnewordererpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_ORGNEW}
# - create orderer org
bdk org orderer create -f cicd/test_script/org-orderer-create.json --genesis-file-name newest_genesis --configtxJSON --docker-compose

# [orgnew] peer
bdk ca enroll -t client -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id admin --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORGNEW}
# - peer org
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id Admin@${PEER_ORG_DOMAIN_ORGNEW} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id Admin@${PEER_ORG_DOMAIN_ORGNEW} --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORGNEW}
# - peer0
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id peer0.${PEER_ORG_DOMAIN_ORGNEW} --client-secret orgnewpeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id peer0.${PEER_ORG_DOMAIN_ORGNEW} --client-secret orgnewpeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORGNEW}
# - peer1
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id peer1.${PEER_ORG_DOMAIN_ORGNEW} --client-secret orgnewpeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ORGNEW} -p ${ICA_PORT_ORGNEW} --client-id peer1.${PEER_ORG_DOMAIN_ORGNEW} --client-secret orgnewpeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ORGNEW}
# - create peer org
bdk org peer create -f ./cicd/test_script/org-peer-create.json --configtxJSON --connection-profile --docker-compose

# =====================================================
. ./cicd/test_script/steps/add-new-peer-org.sh
. ./cicd/test_script/steps/add-new-orderer-org.sh
. ./cicd/test_script/steps/test-new-org.sh
# =====================================================

sleep 5
docker ps -a

echo "ca.sh Done.Good job!"
