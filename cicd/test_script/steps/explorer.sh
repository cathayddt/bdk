export_env 'peer' ${PEER_ORG_NAME_ORG0} ${PEER_ORG_DOMAIN_ORG0} 'peer0'
bdk explorer up
sleep 5
curl http://localhost:8080