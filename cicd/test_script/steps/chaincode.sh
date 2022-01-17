# package
bdk chaincode package -n fabcar -v 1 -p ./chaincode/fabcar/go

# deploy
export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk chaincode install -l ${CHAINCODE_LABEL}
bdk chaincode approve -C ${CHANNEL_NAME} -l ${CHAINCODE_LABEL} -I --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} # without discover
export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer1'
bdk chaincode install -l ${CHAINCODE_LABEL}
export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer2'
bdk chaincode install -l ${CHAINCODE_LABEL}

export_env 'peer' ${PEER_ORG_NAME_ORG1} ${PEER_ORG_DOMAIN_ORG1} 'peer0'
bdk chaincode install -l ${CHAINCODE_LABEL}
bdk chaincode approve -C ${CHANNEL_NAME} -l ${CHAINCODE_LABEL} -I # discover

export_env 'peer' ${PEER_ORG_NAME_ORG2} ${PEER_ORG_DOMAIN_ORG2} 'peer0'
bdk chaincode install -l ${CHAINCODE_LABEL}
bdk chaincode approve -C ${CHANNEL_NAME} -l ${CHAINCODE_LABEL} -I # discover
bdk chaincode commit -C ${CHANNEL_NAME} -l ${CHAINCODE_LABEL} -I # discover

# invoke init
export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -I -f InitLedger # discover

# [Org0] invoke & query
export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ORG0_PEER0 -a BMW -a X6 -a blue -a Org1 --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} --peer-addresses ${PEER_ORG_URL_ORG0_PEER0} --peer-addresses ${PEER_ORG_URL_ORG1_PEER0} --peer-addresses ${PEER_ORG_URL_ORG2_PEER0}
bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryCar -a CAR_ORG0_PEER0

export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer1'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ORG0_PEER1 -a BMW -a X6 -a blue -a Org1 --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} --peer-addresses ${PEER_ORG_URL_ORG0_PEER1} --peer-addresses ${PEER_ORG_URL_ORG1_PEER0} --peer-addresses ${PEER_ORG_URL_ORG2_PEER0}
bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryCar -a CAR_ORG0_PEER1

export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer2'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ORG0_PEER2 -a BMW -a X6 -a blue -a Org1 --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} --peer-addresses ${PEER_ORG_URL_ORG0_PEER2} --peer-addresses ${PEER_ORG_URL_ORG1_PEER0} --peer-addresses ${PEER_ORG_URL_ORG2_PEER0}
bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryCar -a CAR_ORG0_PEER2

# [Org1] invoke & query
export_env 'peer' ${PEER_ORG_NAME_ORG1} ${PEER_ORG_DOMAIN_ORG1} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ORG1_PEER0 -a BMW -a X6 -a blue -a Org2 --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} --peer-addresses ${PEER_ORG_URL_ORG0_PEER0} --peer-addresses ${PEER_ORG_URL_ORG1_PEER0} --peer-addresses ${PEER_ORG_URL_ORG2_PEER0}
bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryCar -a CAR_ORG1_PEER0

# [Org2] invoke & query
export_env 'peer' ${PEER_ORG_NAME_ORG2} ${PEER_ORG_DOMAIN_ORG2} 'peer0'
bdk chaincode invoke -C ${CHANNEL_NAME} -n ${CHAINCODE_NAME} -f CreateCar -a CAR_ORG3_PEER0 -a BMW -a X6 -a blue -a Org3 --orderer ${ORDERER_ORG_URL_ORG0_ORDERER0} --peer-addresses ${PEER_ORG_URL_ORG0_PEER0} --peer-addresses ${PEER_ORG_URL_ORG1_PEER0} --peer-addresses ${PEER_ORG_URL_ORG2_PEER0}
bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryCar -a CAR_ORG3_PEER0

bdk chaincode query -C ${CHANNEL_NAME} -n fabcar -f QueryAllCars
