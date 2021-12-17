#! /bin/bash -ve

export NODE_ENV=production # testing  development  production
export BDK_NETWORK_NAME=shell-network-cryptogen

. ./cicd/test_script/steps/set-params.sh

# Network create
bdk network create -f ./cicd/test_script/network-create.json --create-full


# =====================================================
. ./cicd/test_script/steps/peer-and-orderer-up.sh
. ./cicd/test_script/steps/channel.sh
. ./cicd/test_script/steps/explorer.sh
. ./cicd/test_script/steps/chaincode.sh
# =====================================================

# create new peer org
bdk org peer create -f ./cicd/test_script/org-peer-create.json --create-full

# create new orderer org
bdk org orderer create -f cicd/test_script/org-orderer-create.json --genesis-file-name newest_genesis --create-full

# =====================================================
. ./cicd/test_script/steps/add-new-peer-org.sh
. ./cicd/test_script/steps/add-new-orderer-org.sh
. ./cicd/test_script/steps/test-new-org.sh
# =====================================================

sleep 5
docker ps -a

echo "cryptogen.sh Done.Good job!"
