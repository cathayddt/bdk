export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk channel create -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} -o ${PEER_ORG_NAME_ORG0} -o ${PEER_ORG_NAME_ORG1} -o ${PEER_ORG_NAME_ORG2} \
--channel-admin-policy-style "Majority-Member-in-Channel" \
--lifecycle-endorsement-style "Majority-Member-in-Channel" \
--endorsement-style "Majority-Member-in-Channel"
sleep 2

export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk channel join -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0}
bdk channel update-anchorpeer -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} -p ${PEER_ORG_PORT_ORG0_PEER0}

export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer1'
bdk channel join -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0}

export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer2'
bdk channel join -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0}

export_env 'peer' ${PEER_ORG_NAME_ORG1} ${PEER_ORG_DOMAIN_ORG1} 'peer0'
bdk channel join -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG1_ORDERER0}
bdk channel update-anchorpeer -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG1_ORDERER0} -p ${PEER_ORG_PORT_ORG1_PEER0}

export_env 'peer' ${PEER_ORG_NAME_ORG2} ${PEER_ORG_DOMAIN_ORG2} 'peer0'
bdk channel join -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER1}
bdk channel update-anchorpeer -n ${CHANNEL_NAME} --orderer ${ORDERER_ORG_URL_ORG0_ORDERER1} -p ${PEER_ORG_PORT_ORG2_PEER0}