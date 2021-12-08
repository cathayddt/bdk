# export & import org json config
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk org config export -o ./cicd/test_script/tmp/export-new-orderer.json
export_env 'orderer' ${ORDERER_ORG_NAME_ORG0} ${ORDERER_ORG_DOMAIN_ORG0} ${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}
bdk org config import -f ./cicd/test_script/tmp/export-new-orderer.json


# [org0 orderer] add new orderer into system channel
export_env 'orderer' ${ORDERER_ORG_NAME_ORG0} ${ORDERER_ORG_DOMAIN_ORG0} ${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}
bdk org orderer add -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c "system-channel" -n ${ORDERER_ORG_NAME_ORGNEW}
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
bdk channel update -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c "system-channel"
sleep 5

# [org0 orderer] fetch latest block in system channel
export_env 'orderer' ${ORDERER_ORG_NAME_ORG0} ${ORDERER_ORG_DOMAIN_ORG0} ${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}
bdk channel fetch -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -n "system-channel" --config-style Latest-Block -f newest_genesis

# [orgnew orderer] Orderer up
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk orderer up -n "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}.${ORDERER_ORG_DOMAIN_ORGNEW}" -n "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}.${ORDERER_ORG_DOMAIN_ORGNEW}"
sleep 20

# [orgnew orderer] add orderer0 into system channel
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk orderer consenter add -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c "system-channel" -n ${ORDERER_ORG_NAME_ORGNEW} -h ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk channel decode-envelope -c "system-channel"
# [orgnew orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk channel approve -c "system-channel"
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
bdk channel update -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c "system-channel"
sleep 5
# [orgnew orderer] restart orderer
# TODO: add restart command
docker restart "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}.${ORDERER_ORG_DOMAIN_ORGNEW}"
sleep 20

# [orgnew orderer] add orderer1 into system channel
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}
bdk orderer consenter add -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c "system-channel" -n ${ORDERER_ORG_NAME_ORGNEW} -h ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}
bdk channel decode-envelope -c "system-channel"
# [orgnew orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk channel approve -c "system-channel"
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
bdk channel update -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c "system-channel"
sleep 5
# [orgnew orderer] restart orderer
# TODO: add restart command
docker restart "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}.${ORDERER_ORG_DOMAIN_ORGNEW}"
sleep 20

# [org0 orderer] add new orderer into application channel
export_env 'orderer' ${ORDERER_ORG_NAME_ORG0} ${ORDERER_ORG_DOMAIN_ORG0} ${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}
bdk org orderer add -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c ${CHANNEL_NAME} -n ${ORDERER_ORG_NAME_ORGNEW}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [org0 orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORG0} ${ORDERER_ORG_DOMAIN_ORG0} ${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [org1 orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORG1} ${ORDERER_ORG_DOMAIN_ORG1} ${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [org1 orderer] update
export_env 'orderer' ${ORDERER_ORG_NAME_ORG1} ${ORDERER_ORG_DOMAIN_ORG1} ${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}
bdk channel update -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c ${CHANNEL_NAME}

# [orgnew orderer] add orderer0 into application channel
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk orderer consenter add -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c ${CHANNEL_NAME} -n ${ORDERER_ORG_NAME_ORGNEW} -h ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [orgnew orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [org0 orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORG0} ${ORDERER_ORG_DOMAIN_ORG0} ${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [org1 orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORG1} ${ORDERER_ORG_DOMAIN_ORG1} ${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [org1 orderer] update
export_env 'orderer' ${ORDERER_ORG_NAME_ORG1} ${ORDERER_ORG_DOMAIN_ORG1} ${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}
bdk channel update -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c ${CHANNEL_NAME}
sleep 5
# [orgnew orderer] restart orderer
# TODO: add restart command
docker restart "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}.${ORDERER_ORG_DOMAIN_ORGNEW}"
sleep 20

# [orgnew orderer] add orderer1 into application channel
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}
bdk orderer consenter add -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c ${CHANNEL_NAME} -n ${ORDERER_ORG_NAME_ORGNEW} -h ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [orgnew orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORGNEW} ${ORDERER_ORG_DOMAIN_ORGNEW} ${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER0}
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [org0 orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORG0} ${ORDERER_ORG_DOMAIN_ORG0} ${ORDERER_ORG_HOSTNAME_ORG0_ORDERER0}
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [org1 orderer] approve
export_env 'orderer' ${ORDERER_ORG_NAME_ORG1} ${ORDERER_ORG_DOMAIN_ORG1} ${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}
bdk channel approve -c ${CHANNEL_NAME}
bdk channel decode-envelope -c ${CHANNEL_NAME}
# [org1 orderer] update
export_env 'orderer' ${ORDERER_ORG_NAME_ORG1} ${ORDERER_ORG_DOMAIN_ORG1} ${ORDERER_ORG_HOSTNAME_ORG1_ORDERER0}
bdk channel update -o ${ORDERER_ORG_URL_ORG0_ORDERER0} -c ${CHANNEL_NAME}
sleep 5
# [orgnew orderer] restart orderer
# TODO: add restart command
docker restart "${ORDERER_ORG_HOSTNAME_ORGNEW_ORDERER1}.${ORDERER_ORG_DOMAIN_ORGNEW}"
sleep 20

