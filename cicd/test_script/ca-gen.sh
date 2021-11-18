#!/bin/bash -ve

export NODE_ENV=testing # development  production
export BDK_NETWORK_NAME=shell-network-ca
export DOCKER_LOGGING=false
export BDK_ORG_TYPE=peer

ICA_DOMAIN_BEN='ica.ben.cathaybc.com'
ICA_DOMAIN_GRACE='ica.grace.cathaybc.com'
ICA_DOMAIN_EUGENE='ica.eugene.cathaybc.com'
ICA_DOMAIN_ERIC='ica.eric.cathaybc.com'

ORDERER_ORG_DOMAIN_BEN=$(jq --raw-output '.ordererOrgs[0].domain' ./cicd/test_script/network-create.json)
ORDERER_ORG_DOMAIN_GRACE=$(jq --raw-output '.ordererOrgs[1].domain' ./cicd/test_script/network-create.json)

PEER_ORG_DOMAIN_BEN=$(jq --raw-output '.peerOrgs[0].domain' ./cicd/test_script/network-create.json)
PEER_ORG_DOMAIN_GRACE=$(jq --raw-output '.peerOrgs[1].domain' ./cicd/test_script/network-create.json)
PEER_ORG_DOMAIN_EUGENE=$(jq --raw-output '.peerOrgs[2].domain' ./cicd/test_script/network-create.json)
PEER_ORG_DOMAIN_ERIC=$(jq --raw-output '.[0].domain' ./cicd/test_script/org-peer-create.json)

CHANNEL_NAME='ryan'

CHAINCODE_NAME='fabcar'
CHAINCODE_LABLE="${CHAINCODE_NAME}_1"

export_env() {
  export BDK_ORG_TYPE=$1
  export BDK_ORG_NAME=$2
  export BDK_ORG_DOMAIN=$3
  export BDK_HOSTNAME=$4
}

bdk network delete -f
docker run --rm -v $HOME/.bdk:/tmp/.bdk alpine:latest sh -c 'rm -rf /tmp/.bdk/'${BDK_NETWORK_NAME}'/* | true'

# RCA
bdk ca up -n rca -p 7054 --rca-cn rca --rca-hosts rca --rca-expiry 87600h --rca-pathlength 1
sleep 2
bdk ca enroll -t client -u rca -p 7054 --client-id admin --client-secret adminpw --role rca --org-hostname rca

# [ben] ICA
bdk ca register -t ica -a admin -u rca -p 7054 --client-id ${ICA_DOMAIN_BEN} --client-secret benicapw
bdk ca up -n ${ICA_DOMAIN_BEN} -p 8054 --rca-cn ${ICA_DOMAIN_BEN} --rca-hosts ${ICA_DOMAIN_BEN} --rca-expiry 87600h --rca-pathlength 0 --ica-parentserver-cn rca --ica-parentserver-url https://${ICA_DOMAIN_BEN}:benicapw@rca:7054 --ica-enrollment-host ${ICA_DOMAIN_BEN} --ica-enrollment-profile ca
sleep 2
bdk ca enroll -t client -u ${ICA_DOMAIN_BEN} -p 8054 --client-id admin --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_BEN}
bdk ca enroll -t client -u ${ICA_DOMAIN_BEN} -p 8054 --client-id admin --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_BEN}

# [grace] ICA
bdk ca register -t ica -a admin -u rca -p 7054 --client-id ${ICA_DOMAIN_GRACE} --client-secret graceicapw
bdk ca up -n ${ICA_DOMAIN_GRACE} -p 9054 --rca-cn ${ICA_DOMAIN_GRACE} --rca-hosts ${ICA_DOMAIN_GRACE} --rca-expiry 87600h --rca-pathlength 0 --ica-parentserver-cn rca --ica-parentserver-url https://${ICA_DOMAIN_GRACE}:graceicapw@rca:7054 --ica-enrollment-host ${ICA_DOMAIN_GRACE} --ica-enrollment-profile ca
sleep 2
bdk ca enroll -t client -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id admin --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_GRACE}
bdk ca enroll -t client -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id admin --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_GRACE}

# [eugene] ICA
bdk ca register -t ica -a admin -u rca -p 7054 --client-id ${ICA_DOMAIN_EUGENE} --client-secret eugeneicapw
bdk ca up -n ${ICA_DOMAIN_EUGENE} -p 10054 --rca-cn ${ICA_DOMAIN_EUGENE} --rca-hosts ${ICA_DOMAIN_EUGENE} --rca-expiry 87600h --rca-pathlength 0 --ica-parentserver-cn rca --ica-parentserver-url https://${ICA_DOMAIN_EUGENE}:eugeneicapw@rca:7054 --ica-enrollment-host ${ICA_DOMAIN_EUGENE} --ica-enrollment-profile ca
sleep 2
bdk ca enroll -t client -u ${ICA_DOMAIN_EUGENE} -p 10054 --client-id admin --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_EUGENE}

# ------------------------------------------------------------------------------------------------

# [ben] orderer0
bdk ca register -t orderer -a admin -u ${ICA_DOMAIN_BEN} -p 8054 --client-id orderer0.${ORDERER_ORG_DOMAIN_BEN} --client-secret benordererpw
bdk ca enroll -t orderer -u ${ICA_DOMAIN_BEN} -p 8054 --client-id orderer0.${ORDERER_ORG_DOMAIN_BEN} --client-secret benordererpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_BEN}

# [ben] orderer1
bdk ca register -t orderer -a admin -u ${ICA_DOMAIN_BEN} -p 8054 --client-id orderer1.${ORDERER_ORG_DOMAIN_BEN} --client-secret benordererpw
bdk ca enroll -t orderer -u ${ICA_DOMAIN_BEN} -p 8054 --client-id orderer1.${ORDERER_ORG_DOMAIN_BEN} --client-secret benordererpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_BEN}

# [ben] ---------- orderer org ----------
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_BEN} -p 8054 --client-id Admin@${ORDERER_ORG_DOMAIN_BEN} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_BEN} -p 8054 --client-id Admin@${ORDERER_ORG_DOMAIN_BEN} --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_BEN}

# [grace] orderer0
bdk ca register -t orderer -a admin -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id orderer0.${ORDERER_ORG_DOMAIN_GRACE} --client-secret graceordererpw
bdk ca enroll -t orderer -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id orderer0.${ORDERER_ORG_DOMAIN_GRACE} --client-secret graceordererpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_GRACE}

# [grace] ---------- orderer org ----------
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id Admin@${ORDERER_ORG_DOMAIN_GRACE} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id Admin@${ORDERER_ORG_DOMAIN_GRACE} --client-secret adminpw --role orderer --org-hostname ${ORDERER_ORG_DOMAIN_GRACE}

# ------------------------------------------------------------------------------------------------

# [ben] peer0
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_BEN} -p 8054 --client-id peer0.${PEER_ORG_DOMAIN_BEN} --client-secret benpeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_BEN} -p 8054 --client-id peer0.${PEER_ORG_DOMAIN_BEN} --client-secret benpeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_BEN}

# [ben] peer1
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_BEN} -p 8054 --client-id peer1.${PEER_ORG_DOMAIN_BEN} --client-secret benpeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_BEN} -p 8054 --client-id peer1.${PEER_ORG_DOMAIN_BEN} --client-secret benpeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_BEN}

# [ben] peer2
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_BEN} -p 8054 --client-id peer2.${PEER_ORG_DOMAIN_BEN} --client-secret benpeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_BEN} -p 8054 --client-id peer2.${PEER_ORG_DOMAIN_BEN} --client-secret benpeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_BEN}

# [ben] ---------- peer org ----------
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_BEN} -p 8054 --client-id Admin@${PEER_ORG_DOMAIN_BEN} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_BEN} -p 8054 --client-id Admin@${PEER_ORG_DOMAIN_BEN} --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_BEN}

# [grace] peer0
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id peer0.${PEER_ORG_DOMAIN_GRACE} --client-secret gracepeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id peer0.${PEER_ORG_DOMAIN_GRACE} --client-secret gracepeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_GRACE}

# [grace] peer1
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id peer1.${PEER_ORG_DOMAIN_GRACE} --client-secret gracepeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id peer1.${PEER_ORG_DOMAIN_GRACE} --client-secret gracepeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_GRACE}

# [grace] peer2
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id peer2.${PEER_ORG_DOMAIN_GRACE} --client-secret gracepeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id peer2.${PEER_ORG_DOMAIN_GRACE} --client-secret gracepeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_GRACE}

# [grace] peer3
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id peer3.${PEER_ORG_DOMAIN_GRACE} --client-secret gracepeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id peer3.${PEER_ORG_DOMAIN_GRACE} --client-secret gracepeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_GRACE}

# [grace] ---------- peer org ----------
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id Admin@${PEER_ORG_DOMAIN_GRACE} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_GRACE} -p 9054 --client-id Admin@${PEER_ORG_DOMAIN_GRACE} --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_GRACE}

# [eugene] peer0
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_EUGENE} -p 10054 --client-id peer0.${PEER_ORG_DOMAIN_EUGENE} --client-secret eugenepeerpw
bdk ca enroll -t peer -u ${ICA_DOMAIN_EUGENE} -p 10054 --client-id peer0.${PEER_ORG_DOMAIN_EUGENE} --client-secret eugenepeerpw --role peer --org-hostname ${PEER_ORG_DOMAIN_EUGENE}

# [eugene] ---------- peer org ----------
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_EUGENE} -p 10054 --client-id Admin@${PEER_ORG_DOMAIN_EUGENE} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_EUGENE} -p 10054 --client-id Admin@${PEER_ORG_DOMAIN_EUGENE} --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_EUGENE}

# ================================================================================================

# Network create
bdk network create -f ./cicd/test_script/network-create.json --genesis --connection-config --docker-compose

bdk orderer up -n orderer0.${ORDERER_ORG_DOMAIN_BEN} -n orderer0.${ORDERER_ORG_DOMAIN_GRACE} -n orderer1.${ORDERER_ORG_DOMAIN_BEN}
sleep 2

bdk peer up -n peer0.${PEER_ORG_DOMAIN_BEN} -n peer0.${PEER_ORG_DOMAIN_EUGENE} -n peer0.${PEER_ORG_DOMAIN_GRACE} -n peer1.${PEER_ORG_DOMAIN_BEN} -n peer1.${PEER_ORG_DOMAIN_GRACE} -n peer2.${PEER_ORG_DOMAIN_BEN} -n peer2.${PEER_ORG_DOMAIN_GRACE} -n peer3.${PEER_ORG_DOMAIN_GRACE}
sleep 2

# ==========================================================================================
export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer0'
bdk channel create -n ryan --orderer orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -o Ben -o Grace -o Eugene --channelAdminPolicyStyle "Any-Member-in-Channel"
sleep 2

bdk channel join -n ryan --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150
bdk channel update-anchorpeer -n ryan --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 -p 7051

export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer1'
bdk channel join -n ryan --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150

export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer2'
bdk channel join -n ryan --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150

# -----------------------------------
export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer0'
bdk channel join -n ryan --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250
bdk channel update-anchorpeer -n ryan --orderer orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -p 7151

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer1'
bdk channel join -n ryan --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer2'
bdk channel join -n ryan --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer3'
bdk channel join -n ryan --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250

# -----------------------------------
export_env 'peer' 'Eugene' ${PEER_ORG_DOMAIN_EUGENE} 'peer0'
bdk channel join -n ryan --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150
bdk channel update-anchorpeer -n ryan --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250 -p 7251

# ==========================================================================================
# package
bdk chaincode package -n fabcar -v 1 -p ./chaincode/fabcar/go

# deploy
export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer0'
bdk chaincode deploy -C ${CHANNEL_NAME} -l ${CHAINCODE_LABLE} -I -a --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer0'
bdk chaincode deploy -C ${CHANNEL_NAME} -l ${CHAINCODE_LABLE} -I -a --orderer orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050

export_env 'peer' 'Eugene' ${PEER_ORG_DOMAIN_EUGENE} 'peer0'
bdk chaincode deploy -C ${CHANNEL_NAME} -l ${CHAINCODE_LABLE} -I -a --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150

# commit
export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer0'
bdk chaincode deploy -C ${CHANNEL_NAME} -l ${CHAINCODE_LABLE} -I -c --orderer orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151

# invoke init
export_env 'peer' 'Eugene' ${PEER_ORG_DOMAIN_EUGENE} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -I -f InitLedger --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151

# [ben] install only
export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer1'
bdk chaincode install -l ${CHAINCODE_LABLE}

export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer2'
bdk chaincode install -l ${CHAINCODE_LABLE}

# [grace] install only
export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer1'
bdk chaincode install -l ${CHAINCODE_LABLE}

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer2'
bdk chaincode install -l ${CHAINCODE_LABLE}

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer3'
bdk chaincode install -l ${CHAINCODE_LABLE}

# [Ben] invoke & query
export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_BEN_PEER0 -a BMW -a X6 -a blue -a Ben --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n fabcar -f QueryCar -a CAR_BEN_PEER0

export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer1'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_BEN_PEER1 -a BMW -a X6 -a blue -a Ben --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n fabcar -f QueryCar -a CAR_BEN_PEER1

export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer2'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_BEN_PEER2 -a BMW -a X6 -a blue -a Ben --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n fabcar -f QueryCar -a CAR_BEN_PEER2

# [Grace] invoke & query
export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_GRACE_PEER0 -a BMW -a X6 -a blue -a Grace --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n fabcar -f QueryCar -a CAR_GRACE_PEER0

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer1'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_GRACE_PEER1 -a BMW -a X6 -a blue -a Grace --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n fabcar -f QueryCar -a CAR_GRACE_PEER1

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer2'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_GRACE_PEER2 -a BMW -a X6 -a blue -a Grace --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n fabcar -f QueryCar -a CAR_GRACE_PEER2

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer3'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_GRACE_PEER3 -a BMW -a X6 -a blue -a Grace --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n fabcar -f QueryCar -a CAR_GRACE_PEER3

# [Eugene] invoke & query
export_env 'peer' 'Eugene' ${PEER_ORG_DOMAIN_EUGENE} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_EUGENE_PEER0 -a BMW -a X6 -a blue -a Eugene --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n fabcar -f QueryCar -a CAR_EUGENE_PEER0


# ==================================================================
# [eric] ICA
bdk ca register -t ica -a admin -u rca -p 7054 --client-id ${ICA_DOMAIN_ERIC} --client-secret ericicapw
bdk ca up -n ${ICA_DOMAIN_ERIC} -p 11054 --rca-cn ${ICA_DOMAIN_ERIC} --rca-hosts ${ICA_DOMAIN_ERIC} --rca-expiry 87600h --rca-pathlength 0 --ica-parentserver-cn rca --ica-parentserver-url https://${ICA_DOMAIN_ERIC}:ericicapw@rca:7054 --ica-enrollment-host ${ICA_DOMAIN_ERIC} --ica-enrollment-profile ca
sleep 2
bdk ca enroll -t client -u ${ICA_DOMAIN_ERIC} -p 11054 --client-id admin --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ERIC}

# [eric] peer0
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ERIC} -p 11054 --client-id peer0.${PEER_ORG_DOMAIN_ERIC} --client-secret ericicapw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ERIC} -p 11054 --client-id peer0.${PEER_ORG_DOMAIN_ERIC} --client-secret ericicapw --role peer --org-hostname ${PEER_ORG_DOMAIN_ERIC}

# [eric] peer1
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ERIC} -p 11054 --client-id peer1.${PEER_ORG_DOMAIN_ERIC} --client-secret ericicapw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ERIC} -p 11054 --client-id peer1.${PEER_ORG_DOMAIN_ERIC} --client-secret ericicapw --role peer --org-hostname ${PEER_ORG_DOMAIN_ERIC}

# [eric] peer2
bdk ca register -t peer -a admin -u ${ICA_DOMAIN_ERIC} -p 11054 --client-id peer2.${PEER_ORG_DOMAIN_ERIC} --client-secret ericicapw
bdk ca enroll -t peer -u ${ICA_DOMAIN_ERIC} -p 11054 --client-id peer2.${PEER_ORG_DOMAIN_ERIC} --client-secret ericicapw --role peer --org-hostname ${PEER_ORG_DOMAIN_ERIC}

# [eric] ---------- peer org ----------
bdk ca register -t admin -a admin -u ${ICA_DOMAIN_ERIC} -p 11054 --client-id Admin@${PEER_ORG_DOMAIN_ERIC} --client-secret adminpw
bdk ca enroll -t user -u ${ICA_DOMAIN_ERIC} -p 11054 --client-id Admin@${PEER_ORG_DOMAIN_ERIC} --client-secret adminpw --role peer --org-hostname ${PEER_ORG_DOMAIN_ERIC}

# ==================================================================
# [Eric] create new org
bdk org peer create -f ./cicd/test_script/org-peer-create.json --configtxJSON --connection-config --docker-compose

# [Eric] export & import org json config
export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer0'
bdk org config export -o ./cicd/test_script/tmp/export-Eric.json

bdk org config import -f ./cicd/test_script/tmp/export-Eric.json

# [Ben] add Eric org in
export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer0'
bdk org peer add -c ${CHANNEL_NAME} -n Eric
bdk org peer approve -c $CHANNEL_NAME
bdk org peer update -c $CHANNEL_NAME -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050

# [Eric]
export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer0'
bdk peer up -n peer0.${PEER_ORG_DOMAIN_ERIC} -n peer1.${PEER_ORG_DOMAIN_ERIC} -n -n peer2.${PEER_ORG_DOMAIN_ERIC}
sleep 2

# [Eric] join channel
bdk channel join -n ${CHANNEL_NAME} --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150
sleep 30
bdk channel update-anchorpeer -n ${CHANNEL_NAME} --orderer orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -p 7351
sleep 5

export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer1'
bdk channel join -n ${CHANNEL_NAME} --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150
sleep 5

export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer2'
bdk channel join -n ${CHANNEL_NAME} --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150
sleep 5

# ==================================================================

# [Eric] deploy chaincode
export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer0'
bdk chaincode deploy -C ${CHANNEL_NAME} -l ${CHAINCODE_LABLE} -I -a --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250

# [Eric] install only
export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer1'
bdk chaincode install -l ${CHAINCODE_LABLE}

export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer2'
bdk chaincode install -l ${CHAINCODE_LABLE}

# [Eric] invoke & query
export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ERIC_PEER0 -a BMW -a X6 -a blue -a Ben --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151 --peer-addresses peer0.${PEER_ORG_DOMAIN_ERIC}:7351
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_ERIC_PEER0

export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer1'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ERIC_PEER1 -a BMW -a X6 -a blue -a Eric --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151 --peer-addresses peer0.${PEER_ORG_DOMAIN_ERIC}:7351
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_ERIC_PEER1

export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer2'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ERIC_PEER1 -a BMW -a X6 -a blue -a Eric --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151 --peer-addresses peer0.${PEER_ORG_DOMAIN_ERIC}:7351
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_ERIC_PEER1

# ==================================================================

# [Eugene] [Test Eric] invoke & query
export_env 'peer' 'Eugene' ${PEER_ORG_DOMAIN_EUGENE} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_EUGENE_PEER0_02 -a AUDI -a TT -a black -a Eugene --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_ERIC}:7351 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_EUGENE_PEER0_02

sleep 5
docker ps -a

echo "ca-gen.sh Done.Good job!"
