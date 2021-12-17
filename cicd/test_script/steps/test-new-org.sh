# [orgnew] invoke & query
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ORGNEW_PEER0 -a BMW -a X6 -a blue -a Org2 --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER0} --peer-addresses ${PEER_ORG_URL_ORG0_PEER0} --peer-addresses ${PEER_ORG_URL_ORG1_PEER0} --peer-addresses ${PEER_ORG_URL_ORG2_PEER0} --peer-addresses ${PEER_ORG_URL_ORGNEW_PEER0}
bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryCar -a CAR_ORGNEW_PEER0
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer1'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ORGNEW_PEER1 -a BMW -a X6 -a blue -a Org2 --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER1} --peer-addresses ${PEER_ORG_URL_ORG0_PEER0} --peer-addresses ${PEER_ORG_URL_ORG1_PEER0} --peer-addresses ${PEER_ORG_URL_ORG2_PEER0} --peer-addresses ${PEER_ORG_URL_ORGNEW_PEER1}
bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryCar -a CAR_ORGNEW_PEER1

# [orgnew] Create channel
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer0'
bdk channel create -n "new-channel" --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER0} -o ${PEER_ORG_NAME_ORG0} -o ${PEER_ORG_NAME_ORG1} -o ${PEER_ORG_NAME_ORG2} -o ${PEER_ORG_NAME_ORGNEW}
sleep 2

bdk channel join -n "new-channel" --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER0}
bdk channel update-anchorpeer -n "new-channel" --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER0} -p ${PEER_ORG_PORT_ORGNEW_PEER0}

