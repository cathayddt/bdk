#!/bin/bash -ve

export NODE_ENV=testing # development  production
export BDK_NETWORK_NAME=shell-network-cryptogen
export DOCKER_LOGGING=false
export BDK_ORG_TYPE=peer

ORDERER_ORG_DOMAIN_BEN=$(jq --raw-output '.ordererOrgs[0].domain' ./cicd/test_script/network-create.json)
ORDERER_ORG_DOMAIN_GRACE=$(jq --raw-output '.ordererOrgs[1].domain' ./cicd/test_script/network-create.json)
ORDERER_ORG_DOMAIN_ERIC=$(jq --raw-output '.[0].domain' ./cicd/test_script/org-orderer-create.json)

PEER_ORG_DOMAIN_BEN=$(jq --raw-output '.peerOrgs[0].domain' ./cicd/test_script/network-create.json)
PEER_ORG_DOMAIN_GRACE=$(jq --raw-output '.peerOrgs[1].domain' ./cicd/test_script/network-create.json)
PEER_ORG_DOMAIN_EUGENE=$(jq --raw-output '.peerOrgs[2].domain' ./cicd/test_script/network-create.json)
PEER_ORG_DOMAIN_ERIC=$(jq --raw-output '.[0].domain' ./cicd/test_script/org-peer-create.json)

SYSTEM_CHANNEL_NAME='system-channel'
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

# Network create
bdk network create -f ./cicd/test_script/network-create.json --create-full

bdk orderer up -n orderer0.${ORDERER_ORG_DOMAIN_BEN} -n orderer0.${ORDERER_ORG_DOMAIN_GRACE} -n orderer1.${ORDERER_ORG_DOMAIN_BEN}
sleep 2

bdk peer up -n peer0.${PEER_ORG_DOMAIN_BEN} -n peer0.${PEER_ORG_DOMAIN_EUGENE} -n peer0.${PEER_ORG_DOMAIN_GRACE} -n peer1.${PEER_ORG_DOMAIN_BEN} -n peer1.${PEER_ORG_DOMAIN_GRACE} -n peer2.${PEER_ORG_DOMAIN_BEN} -n peer2.${PEER_ORG_DOMAIN_GRACE} -n peer3.${PEER_ORG_DOMAIN_GRACE}
sleep 2

# ==========================================================================================
export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer0'
bdk channel create -n ${CHANNEL_NAME} --orderer orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -o Ben -o Grace -o Eugene --channelAdminPolicyStyle "Any-Member-in-Channel"
sleep 2

bdk channel join -n ${CHANNEL_NAME} --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150
bdk channel update-anchorpeer -n ${CHANNEL_NAME} --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 -p 7051

# TODO peer1 不 join 確認是不是會報錯
export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer1'
bdk channel join -n ${CHANNEL_NAME} --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150

export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer2'
bdk channel join -n ${CHANNEL_NAME} --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150

# -----------------------------------
export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer0'
bdk channel join -n ${CHANNEL_NAME} --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250
bdk channel update-anchorpeer -n ${CHANNEL_NAME} --orderer orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -p 7151

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer1'
bdk channel join -n ${CHANNEL_NAME} --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer2'
bdk channel join -n ${CHANNEL_NAME} --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer3'
bdk channel join -n ${CHANNEL_NAME} --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250

# -----------------------------------
export_env 'peer' 'Eugene' ${PEER_ORG_DOMAIN_EUGENE} 'peer0'
bdk channel join -n ${CHANNEL_NAME} --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150
bdk channel update-anchorpeer -n ${CHANNEL_NAME} --orderer orderer0.${ORDERER_ORG_DOMAIN_GRACE}:7250 -p 7251

# ==========================================================================================
# package
bdk chaincode package -n ${CHAINCODE_NAME} -v 1 -p ./chaincode/fabcar/go

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

# [ben] install only # TODO 其他 peer 不安裝會失敗嗎？
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
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_BEN_PEER0

export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer1'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_BEN_PEER1 -a BMW -a X6 -a blue -a Ben --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_BEN_PEER1

export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer2'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_BEN_PEER2 -a BMW -a X6 -a blue -a Ben --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_BEN_PEER2

# [Grace] invoke & query
export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_GRACE_PEER0 -a BMW -a X6 -a blue -a Grace --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_GRACE_PEER0

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer1'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_GRACE_PEER1 -a BMW -a X6 -a blue -a Grace --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_GRACE_PEER1

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer2'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_GRACE_PEER2 -a BMW -a X6 -a blue -a Grace --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_GRACE_PEER2

export_env 'peer' 'Grace' ${PEER_ORG_DOMAIN_GRACE} 'peer3'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_GRACE_PEER3 -a BMW -a X6 -a blue -a Grace --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_GRACE_PEER3

# [Eugene] invoke & query
export_env 'peer' 'Eugene' ${PEER_ORG_DOMAIN_EUGENE} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_EUGENE_PEER0 -a BMW -a X6 -a blue -a Eugene --orderer orderer1.${ORDERER_ORG_DOMAIN_BEN}:7150 --peer-addresses peer0.${PEER_ORG_DOMAIN_BEN}:7051 --peer-addresses peer0.${PEER_ORG_DOMAIN_EUGENE}:7251 --peer-addresses peer0.${PEER_ORG_DOMAIN_GRACE}:7151
bdk chaincode query -C ryan -n ${CHAINCODE_NAME} -f QueryCar -a CAR_EUGENE_PEER0

# ==================================================================

# [Eric] create new org
bdk org peer create -f ./cicd/test_script/org-peer-create.json --create-full

# [Eric] export & import org json config
export_env 'peer' 'Eric' ${PEER_ORG_DOMAIN_ERIC} 'peer0'
bdk org config export -o ./cicd/test_script/tmp/export-Eric.json

bdk org config import -f ./cicd/test_script/tmp/export-Eric.json

# [Ben] add Eric org in
export_env 'peer' 'Ben' ${PEER_ORG_DOMAIN_BEN} 'peer0'
bdk org peer add -c ${CHANNEL_NAME} -n Eric

# [Ben] approve
bdk org peer approve -c ${CHANNEL_NAME}

# [Ben] update
bdk org peer update  -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${CHANNEL_NAME}

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

# ==================================================================

# [EricOrderer] Orderer org create
bdk org orderer create -f cicd/test_script/org-orderer-create.json --genesis-file-name newest_genesis --create-full

# ==========================================================================================
# [BenOrderer] EricOrderer org add in system-channel
export_env 'orderer' 'BenOrderer' ${ORDERER_ORG_DOMAIN_BEN} 'orderer0'
bdk org orderer add -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${SYSTEM_CHANNEL_NAME} -n EricOrderer
sleep 2
bdk org orderer approve -c ${SYSTEM_CHANNEL_NAME}
sleep 2

# [GraceOrderer] Orderer org approve in system-channel
export_env 'orderer' 'GraceOrderer' ${ORDERER_ORG_DOMAIN_GRACE} 'orderer0'
bdk org orderer approve -c ${SYSTEM_CHANNEL_NAME}
sleep 2

# [BenOrderer] Orderer org update in system-channel
export_env 'orderer' 'BenOrderer' ${ORDERER_ORG_DOMAIN_BEN} 'orderer0'
bdk org orderer update -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${SYSTEM_CHANNEL_NAME}
sleep 2

# ==========================================================================================

# [BenOrderer] fetch latest block in system-channel
export_env 'orderer' 'BenOrderer' ${ORDERER_ORG_DOMAIN_BEN} 'orderer0'
bdk channel fetch -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -n ${SYSTEM_CHANNEL_NAME} --config-style Latest-Block -f newest_genesis

# [EricOrderer] Orderer up
bdk orderer up -n orderer0.${ORDERER_ORG_DOMAIN_ERIC} -n orderer1.${ORDERER_ORG_DOMAIN_ERIC}
sleep 30

# ==========================================================================================

# [EricOrderer] orderer0 of EricOrderer add in system-channel
export_env 'orderer' 'EricOrderer' ${ORDERER_ORG_DOMAIN_ERIC} 'orderer0'
bdk orderer consenter add -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${SYSTEM_CHANNEL_NAME} -n EricOrderer -h orderer0
sleep 2
bdk org orderer approve -c ${SYSTEM_CHANNEL_NAME}
sleep 2

# [GraceOrderer] Orderer org approve in system-channel
export_env 'orderer' 'GraceOrderer' ${ORDERER_ORG_DOMAIN_GRACE} 'orderer0'
bdk org orderer approve -c ${SYSTEM_CHANNEL_NAME}
sleep 2

# [BenOrderer] Orderer org update in system-channel
export_env 'orderer' 'BenOrderer' ${ORDERER_ORG_DOMAIN_BEN} 'orderer0'
bdk org orderer update -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${SYSTEM_CHANNEL_NAME}
sleep 2

# [EricOrderer] orderer1 of EricOrderer add in system-channel
export_env 'orderer' 'EricOrderer' ${ORDERER_ORG_DOMAIN_ERIC} 'orderer0'
bdk orderer consenter add -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${SYSTEM_CHANNEL_NAME} -n EricOrderer -h orderer1
sleep 2
bdk org orderer approve -c ${SYSTEM_CHANNEL_NAME}
sleep 2

# [GraceOrderer] Orderer org approve in system-channel
export_env 'orderer' 'GraceOrderer' ${ORDERER_ORG_DOMAIN_GRACE} 'orderer0'
bdk org orderer approve -c ${SYSTEM_CHANNEL_NAME}
sleep 2

# [BenOrderer] Orderer org update in system-channel
export_env 'orderer' 'BenOrderer' ${ORDERER_ORG_DOMAIN_BEN} 'orderer0'
bdk org orderer update -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${SYSTEM_CHANNEL_NAME}
sleep 2


# ==========================================================================================

# [BenOrderer] EricOrderer org add in channel
export_env 'orderer' 'BenOrderer' ${ORDERER_ORG_DOMAIN_BEN} 'orderer0'
bdk org orderer add -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${CHANNEL_NAME} -n EricOrderer
sleep 2
bdk org orderer approve -c ${CHANNEL_NAME}
sleep 2

# [GraceOrderer] Orderer org approve in channel
export_env 'orderer' 'GraceOrderer' ${ORDERER_ORG_DOMAIN_GRACE} 'orderer0'
bdk org orderer approve -c ${CHANNEL_NAME}
sleep 2

# [BenOrderer] Orderer org update in channel
export_env 'orderer' 'BenOrderer' ${ORDERER_ORG_DOMAIN_BEN} 'orderer0'
bdk org orderer update -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${CHANNEL_NAME}
sleep 2

# [BenOrderer] orderer1 of EricOrderer add in channel
bdk orderer consenter add -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${CHANNEL_NAME} -n EricOrderer -h orderer0
sleep 2
bdk org orderer approve -c ${CHANNEL_NAME}
sleep 2

# [GraceOrderer] Orderer org approve in channel
export_env 'orderer' 'GraceOrderer' ${ORDERER_ORG_DOMAIN_GRACE} 'orderer0'
bdk org orderer approve -c ${CHANNEL_NAME}
sleep 2

# [BenOrderer] Orderer org update in channel
export_env 'orderer' 'BenOrderer' ${ORDERER_ORG_DOMAIN_BEN} 'orderer0'
bdk org orderer update -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${CHANNEL_NAME}

# [BenOrderer] orderer1 of EricOrderer add in channel
bdk orderer consenter add -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${CHANNEL_NAME} -n EricOrderer -h orderer1
sleep 2
bdk org orderer approve -c ${CHANNEL_NAME}
sleep 2

# [GraceOrderer] Orderer org approve in channel
export_env 'orderer' 'GraceOrderer' ${ORDERER_ORG_DOMAIN_GRACE} 'orderer0'
bdk org orderer approve -c ${CHANNEL_NAME}
sleep 2

# [BenOrderer] Orderer org update in channel
export_env 'orderer' 'BenOrderer' ${ORDERER_ORG_DOMAIN_BEN} 'orderer0'
bdk org orderer update -o orderer0.${ORDERER_ORG_DOMAIN_BEN}:7050 -c ${CHANNEL_NAME}


sleep 5
docker ps -a

echo "crypto-gen.sh Done.Good job!"
