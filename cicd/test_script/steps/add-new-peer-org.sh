# export & import org json config
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer0'
bdk org config export -o ./cicd/test_script/tmp/export-new-peer.json
export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk org config import -f ./cicd/test_script/tmp/export-new-peer.json

# ==================================================================

# [org0 orderer] add orgnew into system-channel
export_env 'orderer' ${ORDERER_ORG_NAME_ORG0} ${ORDERER_ORG_DOMAIN_ORG0} ${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}
bdk org peer add-system-channel -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -n ${PEER_ORG_NAME_ORGNEW}
bdk channel decode-envelope -c "system-channel"

# [org0 orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORG0} ${ORDERER_ORG_DOMAIN_ORG0} ${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}
bdk channel approve -c "system-channel"
bdk channel decode-envelope -c "system-channel"

# [org1 orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORG1} ${ORDERER_ORG_DOMAIN_ORG1} ${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}
bdk channel approve -c "system-channel"
bdk channel decode-envelope -c "system-channel"

# [org1 orderer] update
export_env 'orderer' ${ORDERER_ORG_NAME_ORG1} ${ORDERER_ORG_DOMAIN_ORG1} ${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}
bdk channel update -o ${ORDERER_ORG_URL_ORG1_ORDERER0} -c "system-channel"
sleep 2

# ==================================================================

# [org0] add orgnew in
export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk org peer add -c ${CHANNEL_NAME} -n ${PEER_ORG_NAME_ORGNEW}
bdk channel decode-envelope -c ${CHANNEL_NAME}

# [org0] approve
export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}

# [org1] approve
export_env 'peer' ${PEER_ORG_NAME_ORG1} ${PEER_ORG_DOMAIN_ORG1} 'peer0'
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}

# [org2] approve
export_env 'peer' ${PEER_ORG_NAME_ORG2} ${PEER_ORG_DOMAIN_ORG2} 'peer0'
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}

# [org2] update
export_env 'peer' ${PEER_ORG_NAME_ORG2} ${PEER_ORG_DOMAIN_ORG2} 'peer0'
bdk channel update -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c ${CHANNEL_NAME}

# [orgnew] peer up
bdk peer up -n peer0.${PEER_ORG_DOMAIN_ORGNEW} -n peer1.${PEER_ORG_DOMAIN_ORGNEW}
sleep 2

# [orgnew] join channel
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer0'
bdk channel join -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0}
sleep 10
bdk channel update-anchorpeer -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} -p ${PEER_ORG_PORT_ORGNEW_PEER0}
sleep 5
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer1'
bdk channel join -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0}
sleep 5

# [orgnew] deploy chaincode
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer0'
bdk chaincode install -l ${CHAINCODE_LABEL}
bdk chaincode approve -C ${CHANNEL_NAME} -l ${CHAINCODE_LABEL} -I # discover

# [orgnew] install only
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer1'
bdk chaincode install -l ${CHAINCODE_LABEL}


