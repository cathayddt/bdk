# [orgnew] invoke & query
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ORGNEW_PEER0 -a BMW -a X6 -a blue -a Org2 --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER0} --peer-addresses ${PEER_ORG_URL_ORG0_PEER0} --peer-addresses ${PEER_ORG_URL_ORG1_PEER0} --peer-addresses ${PEER_ORG_URL_ORG2_PEER0} --peer-addresses ${PEER_ORG_URL_ORGNEW_PEER0}
bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryCar -a CAR_ORGNEW_PEER0
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer1'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ORGNEW_PEER1 -a BMW -a X6 -a blue -a Org2 --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER1} --peer-addresses ${PEER_ORG_URL_ORG0_PEER0} --peer-addresses ${PEER_ORG_URL_ORG1_PEER0} --peer-addresses ${PEER_ORG_URL_ORG2_PEER0} --peer-addresses ${PEER_ORG_URL_ORGNEW_PEER1}
bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryCar -a CAR_ORGNEW_PEER1

# [orgnew] Create new-channel
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer0'
bdk channel create -n "new-channel" --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER0} -o ${PEER_ORG_NAME_ORGNEW}
sleep 2
bdk channel join -n "new-channel" --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER0}
bdk channel update-anchorpeer -n "new-channel" --orderer ${ORDERER_ORG_URL_ORGNEW_ORDERER0} -p ${PEER_ORG_PORT_ORGNEW_PEER0}
sleep 2

# [orgnew] Add org0 into new-channel
export_env 'peer' ${PEER_ORG_NAME_ORGNEW} ${PEER_ORG_DOMAIN_ORGNEW} 'peer0'
bdk org peer add -c "new-channel" -n ${PEER_ORG_NAME_ORG0}
bdk channel approve -c "new-channel"
bdk channel update -o ${ORDERER_ORG_URL_ORGNEW_ORDERER0} -c "new-channel"

# [org0] Join new-channel
export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk channel join -n "new-channel" --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0}
sleep 10
bdk channel update-anchorpeer -n "new-channel" --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} -p ${PEER_ORG_PORT_ORG0_PEER0}