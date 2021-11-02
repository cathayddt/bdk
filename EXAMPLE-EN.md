# Example
[(中文版)](EXAMPLE.md)

## Index
- [Create a Blockchain Network](#create-a-blockchain-network)
- [Deploy Chaincode](#deploy-chaincode)
- [加入新建 Channel](#加入新建-channel)
- [加入新 Peer org](#加入新-peer-org)
- [加入新 Orderer org](#加入新-orderer-org)

## Create a Blockchain Network

First of all, you'll need to prepare the file *network-create.json*, and insert the required variables into *network-create.json* . We will then use `cryptogen` to generate the certificates and keys needed for bringing up the blockchain network. Next, we'll need to start the orderer and peer instances. We'll then create an application channel and add the peers into it.

### Prerequisites

Variables required by *network-create.json* are defined in the files *configtx.yaml*, *crypto-config.yaml*, and *docker-compose.yaml*. They can be categorized as variables either for orderer organizations or peer organizations. Please move these files under *~/.bdk* directory after they have been modified.

#### `ordererOrgs`: Settings concerning the initial orderer organization on this blockchain network
- `name` Organization name of the orderer org
- `domain` Domain name of the orderer organization
- `enableNodeOUs` Whether to define memberships explicitly (3 member types: `admin`, `orderer`, `client` instead of the original 2: `admin` and `member`)
- `hostname` Number of orderers and the hostname of each orderer
- `ports` Port settings of each orderer in this orderer organization
  - `port` Opened port of the orderer
  - `isPublishPort` Whether to publish the opened port from the Docker container
  - `operationPort` Port used to check the heartbeat of the instance
  - `isPublishOperationPort` Whether to publish the health-check port from the Docker container

#### `peerOrgs`: Settings concerning the initial peer organization on this blockchain network
- `name` Organization name of the peer org
- `domain` Domain name of the peer organization
- `enableNodeOUs` Whether to define memberships explicitly (3 member types: `admin`, `orderer`, `client` instead of the original 2: `admin` and `member`)
- `peerCount` Number of peers in this peer organization
- `userCount` Number of user identities in this peer organization
- `ports` Port settings of each peer in this peer organization
  - `port` Opened port of the peer
  - `isPublishPort` Whether to publish the opened port from the Docker container
  - `operationPort` Port used to check the heartbeat of the instance
  - `isPublishOperationPort` Whether to publish the health-check port from the Docker container

```json
 {
  "ordererOrgs": [
    {
      "name": "BenOrderer",
      "domain": "orderer.ben.cathaybc.com",
      "enableNodeOUs": true,
      "hostname": [
        "orderer0",
        "orderer1"
      ],
      "ports": [
        {
          "port": 7050,
          "isPublishPort": true,
          "operationPort": 8443,
          "isPublishOperationPort": true
        },
        {
          "port": 7150,
          "isPublishPort": true,
          "operationPort": 8543,
          "isPublishOperationPort": true
        }
      ]
    }
  ],
  "peerOrgs": [
    {
      "name": "Org1",
      "domain": "org1.example.com",
      "enableNodeOUs": true,
      "peerCount": 2,
      "userCount": 1,
      "ports": [
        {
          "port": 7051,
          "isPublishPort": true,
          "operationPort": 9443,
          "isPublishOperationPort": true
        },
        {
          "port": 7051,
          "isPublishPort": false,
          "operationPort": 9443,
          "isPublishOperationPort": false
        }
      ]
    },
    {
      "name": "Org1",
      "domain": "org1.example.com",
      "enableNodeOUs": true,
      "peerCount": 2,
      "userCount": 1,
      "ports": [
        {
          "port": 7051,
          "isPublishPort": true,
          "operationPort": 9443,
          "isPublishOperationPort": true
        },
        {
          "port": 7051,
          "isPublishPort": false,
          "operationPort": 9443,
          "isPublishOperationPort": false
        }
      ]
    }
  ]
}
```

### Step 1: Generate the required files of the blockchain network

Creates directory *BDK_NETWORK_NAME* under *~/.bdk*. Generates *crypto-config.yaml* to let `cryptogen` command generate certificates and keys for orderers and peers. Copies their tls-ca certificates to the *tlsca* directory under the folder mentioned prior, and generates *configtx.yaml* using `configtxgen`, which is used to generate *genesis.block*. Peer and orderer compose files are then generated.

```bash
bdk network create -f ~/.bdk/network-create.json --create-full
```

### Step 2: Start orderer and peer instances

Starts orderers or peers in organizations

```bash
# Start orderer instances
bdk orderer up -n orderer0.example.com -n orderer1.example.com

# Start peer instances
bdk peer up -n peer0.org1.example.com -n peer1.org1.example.com -n peer0.org2.example.com
```

### Step 3: Create a channel

Modifies variables *BDK_ORG_NAME* and *BDK_ORG_DOMAIN* included in file *~/.bdk/.env*. Creates an [application channel](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_overview.html?highlight=channel) with the name *test*. In order to allow new peer organizations to join the network with only one approval (this is not recommended in production environments), we modify the application channel's channel admin policy to allow approval after signature from one member. This is done by setting `--channelAdminPolicyStyle` to `Any-Member-in-Channel`.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Create a new channel with peer0 in Org1
bdk channel create -n test --orderer orderer0.example.com:7050 -o Or1 -o Org2 --channelAdminPolicyStyle "Any-Member-in-Channel"
```

### Step 4: Add Org1 and Org2 into the channel

Adds Org1 and Org2 into the application channel named *test* . Note that each peer has to individually join the channel, so modifications to variables  *BDK_ORG_NAME, BDK_ORG_DOMAIN*, and *BDK_HOSTNAME* in *~/.bdk/.env* are needed

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Add peer0 in Org1 into the channel
bdk channel join -n test --orderer orderer0.example:7050

# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# Add peer1 in Org1 into the channel
bdk channel join -n test --orderer orderer0.example:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Add peer0 in Org2 into the channel
bdk channel join -n test --orderer orderer0.example.com:7050
```

### Step 5：Update anchor peers on the channel

Updates the settings of Org1 和 Org2 on the application channel named *test* 的 Application Channel. Pleas note that modifications to *BDK_ORG_NAME* and *BDK_ORG_DOMAIN* in *~/.bdk/.env* are needed

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Update anchor peer on Org1
bdk channel update-anchorpeer -n test --orderer orderer1.example.com:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Update anchor peer on Org2
bdk channel update-anchorpeer -n test --orderer orderer0.example.com:7050
```

## Deploy Chaincode

### Step 1: Package the chaincode

Packages the chaincode source code along with the required modules into a *.tar* package called *fabcar* with version 1.

```bash
bdk chaincode package -n fabcar -v 1 -p ./chaincode/fabcar/go
```

### Step 2: Approve the chaincode from Org1 and Org2

 Installs and approves the chaincode labelled fabcar_1. Parameter `-a` is passed to restrict lifecycle chaincode deployment to run up to the step of `peer chaincode lifecycle approveformyorg`, parameter `-I` is used to specify that the chaincode requires initialization before it can be used.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Install and approve chaincode on peer0 in Org1
bdk chaincode deploy -C test -l fabcar_1 -I -a --orderer orderer0.example.com:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Install and approve chaincode on peer0 in Org2
bdk chaincode deploy -C test -l fabcar_1 -I -a --orderer orderer0.example.com:7050
```

### Step 3: Install chaincode on peer1 in Org1

Installs chaincode on peer1 in Org1

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# Install chaincode on peer1 in Org1
bdk chaincode install -l fabcar_1
```

### Step 4: Deploy chaincode from Org1

Deploys the chaincode labelled *fabcar_1*. Parameter `-c` is passed to restrict lifecycle chaincode deployment to run up to the step of  `peer chaincode lifecycle commit`.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

bdk chaincode deploy -C test -l fabcar_1 -I -c --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151
```

### Step 5: Initial chaincode from Org1

Run `bdk chaincode invoke` to initialize the chaincode labelled *fabcar_1*. Parameter `-f` is passed to select the function used in chaincode initialization.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

bdk chaincode invoke -C test -n fabcar_1 -I -f InitLedger --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151
```

### Step 6: Invoke and query transactions from Org1 and Org2

Use `bdk chaincode invoke` to invoke transactions on the chaincode labelled *fabcar_1*. Parameter `-f` is passed to select the function used in chaincode invocation, parameter `-a` is used to specify the variables required by the chaincode function. Queries can be conducted by using `bdk chaincode query`.

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Invoke a transaction
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG1_PEER0 -a BMW -a X6 -a blue -a Org1 --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151

# Query data
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG1_PEER0

# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# Invoke a transaction
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG1_PEER1 -a BMW -a X6 -a blue -a Org1 --orderer orderer0.example.com:7050 --peer-addresses peer1.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151

# Query data
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG1_PEER1

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Invoke a transaction
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG2_PEER0 -a BMW -a X6 -a blue -a Org2 --orderer orderer1.example.com:7150 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151

# Query data
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG2_PEER0
```
<!--
=================================
|| Translated Up to This Point ||
=================================
 -->

## 加入新建 Channel

### Step 1：建立 Channel

首先更改在 *~/.bdk/.env* 組織的名稱 *BDK_ORG_NAME* 與 Domain 名稱 *BDK_ORG_DOMAIN* 設定，再來建立一個名稱為 *test* 的 [Application Channel](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_overview.html?highlight=channel)，可以使用 `--channelAdminPolicyStyle` 選擇基本的選項 `All-Initial-Member`

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Org1 的 peer0 建立新的 channel
bdk channel create -n test --orderer orderer0.example.com:7050 -o Or1 -o Org2
```

### Step 2：Org1 和 Org2 加入 Channel

Org1 和 Org2 加入名稱為 *test* 的 Application Channel，由於加入 Application Chanel 是以 Peer 單位加入，所以每次加入都要記得更改在 *~/.bdk/.env* 的 *BDK_ORG_NAME 、 BDK_ORG_DOMAIN* 、 *BDK_HOSTNAME* 的設定

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Org1 的 peer0 加入 channel
bdk channel join -n test --orderer orderer0.example:7050

# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# Org1 的 peer1 加入 channel
bdk channel join -n test --orderer orderer0.example:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Org2 的 peer0 加入 channel
bdk channel join -n test --orderer orderer0.example.com:7050
```

### Step 3：Org1 和 Org2 更新在 Channel 上的 Anchor peer 設定

更新 Org1 和 Org2 在名稱為 *test* 的 Application Channel 上的設定，注意更新時，要記得更改在 *~/.bdk/.env* 的 *BDK_ORG_NAME 、 BDK_ORG_DOMAIN* 的設定

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# 更新 Org1 的 anchor peer
bdk channel update-anchorpeer -n test --orderer orderer1.example.com:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Org2 的 peer0 加入 channel
bdk channel update-anchorpeer -n test --orderer orderer0.example.com:7050
```

## 加入新 Peer org

首先要準備檔案 *org-peer-create.json*，將所需要的參數放入到 *org-peer-create.json* 中，之後使用 `cryptogen` 的方式產生憑證和私鑰，準備 Peer 的組織所需要的相關文件，之後將 Org3 的資訊加入到 Application channel 設定檔中，啟動新組織 Org3 的 Peer 並且把他加入到名稱為 `test` 的 Channel 中，再測試以 Org3 發起交易和查詢交易資訊

### 預先準備的檔案

 *org-peer-create.json* 檔案中是 *configtx.yaml* 、 *crypto-config.yaml* 、 *docker-compose.yaml* 所需要的參數，將檔案放在當前目錄下

`**name**` Peer 的組織名稱

`**domain**` Peer 組織的 domain 名稱

`**enableNodeOUs**` 在此 Peer 組織中是否要細分身份，原先只分為 `admin` 和 `member` ，細分後會為 `admin` 、 `peer` 和 `client`

`**peerCount**` Peer 組織中 Peer 的個數

`**userCount**` Peer 組織中 user 身份的個數

`**ports**` Peer 組織中 Peer 的 port 設置

|— `**port**` 架設 Peer 的 port

|— `**isPublishPort**` 架設 Peer 的 port 是否要從 docker container 對外開放

|— `**operationPort**` 測試 Peer heart beat 的 port

|__ `**isPublishOperationPort**` 測試 Peer heart beat 的 port 是否要從 docker container 對外開放

```json
[
    {
      "name": "Eric",
      "domain": "eric.cathaybc.com",
      "enableNodeOUs": true,
      "peerCount": 3,
      "userCount": 1,
      "ports": [
        {
          "port": 7351,
          "isPublishPort": true,
          "operationPort": 9743,
          "isPublishOperationPort": true
        },
        {
          "port": 7351,
          "isPublishPort": false,
          "operationPort": 9743,
          "isPublishOperationPort": false
        },
        {
          "port": 7351,
          "isPublishPort": false,
          "operationPort": 9743,
          "isPublishOperationPort": false
        }
      ]
    }
  ]
```

### Step 1：建立名稱為 Org3 的 Peer org

產生 *crypto-config.yaml* 讓 `cryptogen` 指令產生 Peer 的憑證和私鑰，將其 TLS Ca 憑證複製到 Blockchain network 資料夾下的 *tlsca* 資料夾中，並且產生 *configtx.yaml* 使用 `configtxgen` 指令產生 Peer org 的 json 設定檔，之後建立 Peer 的連線的設定檔案和 Peer 和 *docker-compose.yaml* 檔案

```bash
bdk org peer create -f ./org-peer-create.json --create-full
```

### Step 2：Org1 將 Org3 加入 Channel 中

由 Org1 組織身份將 Org3 加入 Application Channel

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

bdk org peer add -o orderer0.org1.example.com:7050 -c test -n Eric
```

### Step 3：啟動 Org3 機器

啟動 Org3 的 Peer 機器

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

bdk peer up -n peer0.org3.example.com -n peer1.org3.example.com
```

### Step 4：Org3 加入 Channel

Org1 加入名稱為 *test* 的 Application Channel，由於加入 Application Chanel 是以 Peer 單位加入，所以每次加入都要記得更改在 *~/.bdk/.env* 的 *BDK_ORG_NAME 、 BDK_ORG_DOMAIN* 、 *BDK_HOSTNAME* 的設定

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

bdk channel join -n test --orderer orderer0.example.com:7050

# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer1'

bdk channel join -n test --orderer orderer0.example.com:7050
```

### Step 5：Org3 部署 Chaincode

安裝並且同意標籤名稱為 fabcar_1 的 Chaincode，由於使用前面的 Blockchain network，所以此次只做到 `peer chaincode lifecycle approveformyorg`，使用 `-a` 來限制 Lifecycle chaincode 的部署 Chaincode 步驟只做到 `peer chaincode lifecycle approveformyorg` ，使用 `-I` 來標示此次 Chaincode 需要初始化才能使用，之後在 Org3 的 peer1 安裝名稱為 fabcar_1 的 Chaincode

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

# Org3 的 peer0 安裝、同意 Chaincode
bdk chaincode deploy -C test -l fabcar_1 -I -a --orderer orderer0.example.com:7050

# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

# Org3 的 peer1 安裝 Chaincode
bdk chaincode install -l fabcar_1
```

### Step 6：Org3 發起交易且查詢

使用 `bdk chaincode invoke` 和名稱為 fabcar_1 的 Chaincode 發起交易，使用 `-f` 選擇 Chaincode 上初始化的 function，使用 `-a` 輸入 Chainocde function 所需要的參數，之後可以使用 `bdk chaincode query` 和 Chaincode 查詢資訊

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

# 發起交易
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG3_PEER0 -a BMW -a X6 -a blue -a Org3 --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151 --peer-addresses peer0.org3.example.com:7251

# 查詢資訊
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG3_PEER0

# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer1'

# 發起交易
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG3_PEER1 -a BMW -a X6 -a blue -a Org3 --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151 --peer-addresses peer1.org3.example.com:7251

# 查詢資訊
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG3_PEER1
```

## 加入新 Orderer org

### Step 1：建立新的 Orderer org

```bash
bdk org orderer create --interactive
```

### Step 2：Orderer org 加入 system channel

```bash
# export BDK_ORG_NAME='OrdererOrg'
# export BDK_ORG_DOMAIN='example.com'
# export BDK_HOSTNAME='orderer0'

bdk org orderer add system --interactive
```

### Step 3：Orderer org 加入 channel

```bash
# export BDK_ORG_NAME='OrdererOrg'
# export BDK_ORG_DOMAIN='example.com'
# export BDK_HOSTNAME='orderer0'

bdk org orderer add app --interactive
```
