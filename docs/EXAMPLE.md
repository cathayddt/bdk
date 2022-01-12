# 使用範例
[(English version)](EXAMPLE-EN.md)

## 目錄
- [建立 Blockchain network](#建立-blockchain-network)
- [部署 Chaincode](#部署-chaincode)
- [加入新建 Channel](#加入新建-channel)
- [加入新 Peer org](#加入新-peer-org)
- [加入新 Orderer org](#加入新-orderer-org)

## 建立 Blockchain network

首先要準備檔案*network-create.json* ，將所需要的參數放入到*network-create.json* 中，之後使用 `cryptogen` 的方式產生憑證和私鑰並且準備 Blockchain network 所需要的相關文件，再來啟動 Orderer 和 Peer 的機器並且建立一個 Application channel，最後將 Peer 加入到 Application channel 中

### 預先準備的檔案

 *network-create.json* 檔案中是 *configtx.yaml* 、 *crypto-config.yaml* 、 *docker-compose.yaml* 所需要的參數，分為 Orderer org 和 Peer org 的參數，將檔案放在 *~/.bdk* 資料夾底下

#### `ordererOrgs` 在此 Blockchain network 初始的 Orderer 組織設定
- `name` Orderer 的組織名稱
- `domain` Orderer 組織的 domain 名稱
- `enableNodeOUs` 在此 Orderer 組織中是否要細分身份，原先只分為 `admin` 和 `member` ，細分後會為 `admin` 、 `orderer` 和 `client`
- `hostname` Orderer 的個數及各個 hostname 名稱
- `ports` Orderer 組織中 Orderer 的 port 設置
  - `port` 架設 Orderer 的 port
  - `isPublishPort` 架設 Orderer 的 port 是否要從 docker container 對外開放
  - `operationPort` 測試 Orderer heart beat 的 port
  - `isPublishOperationPort` 測試 Orderer heart beat 的 port 是否要從 docker container 對外開放

#### `peerOrgs` 在此 Blockchain network 初始的 Peer 組織設定
- `**name**` Peer 的組織名稱
- `**domain**` Peer 組織的 domain 名稱
- `**enableNodeOUs**` 在此 Peer 組織中是否要細分身份，原先只分為 `admin` 和 `member` ，細分後會為 `admin` 、 `peer` 和 `client`
- `**peerCount**` Peer 組織中 Peer 的個數
- `**userCount**` Peer 組織中 user 身份的個數
- `**ports**` Peer 組織中 Peer 的 port 設置
  - `**port**` 架設 Peer 的 port
  - `**isPublishPort**` 架設 Peer 的 port 是否要從 docker container 對外開放
  - `**operationPort**` 測試 Peer heart beat 的 port
  - `**isPublishOperationPort**` 測試 Peer heart beat 的 port 是否要從 docker container 對外開放

```json
{
  "ordererOrgs": [
    {
      "name": "Org0Orderer",
      "domain": "orderer.org0.example.com",
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
      "name": "Org0",
      "domain": "org0.example.com",
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

### Step 1：產生 Blockchain network 相關的檔案

首先在 *~/.bdk* 資料夾底下以 *~/.bdk* 中 *BDK_NETWORK_NAME* 名稱建立資料夾，再來產生 *crypto-config.yaml* 讓 `cryptogen` 指令產生 Orderer 和 Peer 的憑證和私鑰，將其 TLS Ca 憑證複製到 Blockchain network 資料夾下的 *tlsca* 資料夾中，並且產生 *configtx.yaml* 使用 `configtxgen` 指令產生創始區塊 *genesis.block* ，之後建立 Peer 的連線的設定檔案和 Peer 和 Orderer *docker-compose.yaml* 檔案

```bash
bdk network create -f ~/.bdk/network-create.json --create-full
```

### Step 2：啟動 Orderer 和 Peer 的機器

分別啟動組織中各個 Orderer 或是 Peer 的機器

```bash
# 啟動 orderer 的機器
bdk orderer up -n orderer0.example.com -n orderer1.example.com

# 啟動 peer 的機器
bdk peer up -n peer0.org1.example.com -n peer1.org1.example.com -n peer0.org2.example.com
```

### Step 3：建立 Channel

首先更改在 *~/.bdk/.env* 組織的名稱 *BDK_ORG_NAME* 與 Domain 名稱 *BDK_ORG_DOMAIN* 設定，再來建立一個名稱為 *test* 的 [Application Channel](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_overview.html?highlight=channel)，為了讓之後加入新的 Peer 組織加入只需要一個組織同意即可，我們將 Channel admin policy 設定為只需要任何在 Channel 中的成員簽名即可，使用 `--channelAdminPolicyStyle` 設定成 `Any-Member-in-Channel` ，改變 Application Channel 中的 Channel Admin Policy

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Org1 的 peer0 建立新的 channel
bdk channel create -n test --orderer orderer0.example.com:7050 -o Or1 -o Org2 --channelAdminPolicyStyle "Any-Member-in-Channel"
```

### Step 4：Org1 和 Org2 加入 Channel

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

### Step 5：Org1 和 Org2 更新在 Channel 上的 Anchor peer 設定

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

## 部署 Chaincode

### Step 1：打包 Chaincode

將路徑上的 Chaincode 的原始碼和所需要的相關套件，命名為 *fabcar* 和版本 1，編譯完後打包成 *.tar* 檔案

```bash
bdk chaincode package -n fabcar -v 1 -p ./chaincode/fabcar/go
```

### Step 2：Org1 和 Org2 安裝、同意 Chaincode

 安裝並且同意標籤名稱為 fabcar_1 的 Chaincode，使用 `-a` 來限制 Lifecycle chaincode 的部署 Chaincode 步驟只做到 `peer chaincode lifecycle approveformyorg` ，使用 `-I` 來標示此次 Chaincode 需要初始化才能做使用

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# Org1 的 peer0 安裝、同意 Chaincode
bdk chaincode install -l fabcar_1
bdk chaincode approve -C test -l fabcar_1 -I --orderer orderer0.example.com:7050

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# Org2 的 peer0 安裝、同意 Chaincode
bdk chaincode install -l fabcar_1
bdk chaincode approve -C test -l fabcar_1 -I --orderer orderer0.example.com:7050
```

### Step 3：Org1 的 peer1 安裝 Chaincode

安裝 Chaincode 在 Org1 的 peer1 上

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# Org1 的 peer1 安裝 Chaincode
bdk chaincode install -l fabcar_1
```

### Step 4：Org1 部署 Chaincode

部署標籤名稱為 fabcar_1 的 Chaincode，使用 `-c` 只做 Lifecycle chaincode 部署 Chaincode 步驟只做 `peer chaincode lifecycle commit` 的步驟

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

bdk chaincode commit -C test -l fabcar_1 -I --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151
```

### Step 5：Org1 初始化 Chaincode

使用 `bdk chaincode invoke` 來初始化名稱為 fabcar_1 的 Chaincode，使用 `-f` 選擇 Chaincode 上初始化的 function

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

bdk chaincode invoke -C test -n fabcar_1 -I -f InitLedger --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151
```

### Step 6：Org1 和 Org2 發起交易並且查詢寫入的資料

使用 `bdk chaincode invoke` 和名稱為 fabcar_1 的 Chaincode 發起交易，使用 `-f` 選擇 Chaincode 上初發起交易使用的 function，使用 `-a` 輸入 Chaincode function 所需要的參數，之後可以使用 `bdk chaincode query` 和 Chaincode 查詢資訊

```bash
# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer0'

# 發起交易
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG1_PEER0 -a BMW -a X6 -a blue -a Org1 --orderer orderer0.example.com:7050 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151

# 查詢資訊
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG1_PEER0

# export BDK_ORG_NAME='Org1'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='peer1'

# 發起交易
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG1_PEER1 -a BMW -a X6 -a blue -a Org1 --orderer orderer0.example.com:7050 --peer-addresses peer1.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151

# 查詢資訊
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG1_PEER1

# export BDK_ORG_NAME='Org2'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='peer0'

# 發起交易
bdk chaincode invoke -C test -n fabcar -f CreateCar -a CAR_ORG2_PEER0 -a BMW -a X6 -a blue -a Org2 --orderer orderer1.example.com:7150 --peer-addresses peer0.org1.example.com:7051 --peer-addresses peer0.org2.example.com:7151

# 查詢資訊
bdk chaincode query -C test -n fabcar -f QueryCar -a CAR_ORG2_PEER0
```

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
      "name": "Orgnew",
      "domain": "orgnew.example.com",
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

bdk org peer add -o orderer0.org1.example.com:7050 -c test -n Orgnew
```

### Step 3：啟動 Org3 機器

啟動 Org3 的 Peer 機器

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

bdk peer up -n peer0.org3.example.com -n peer1.org3.example.com
```

### Step 4:Org3 加入 system-channel
由 Org1Orderer 組織身份將 Org3 加入 System Channel 並同意

```bash
# export BDK_ORG_TYPE='orderer'
# export BDK_ORG_NAME='Org1Orderer'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='orderer0'

bdk org peer add-system-channel -o orderer0.org1.example.com:7050 -n Orgnew
bdk channel approve -c system-channel
```

由 Org2Orderer 組織身份同意 system-channel 的更新
```bash
# export BDK_ORG_TYPE='orderer'
# export BDK_ORG_NAME='Org2Orderer'
# export BDK_ORG_DOMAIN='org2.example.com'
# export BDK_HOSTNAME='orderer0'

bdk org peer add-system-channel -o orderer0.org1.example.com:7050 -n Orgnew
bdk channel approve -c system-channel
```

由 Org1Orderer 組織身份更新 system-channel

```bash
# export BDK_ORG_TYPE='orderer'
# export BDK_ORG_NAME='Org1Orderer'
# export BDK_ORG_DOMAIN='org1.example.com'
# export BDK_HOSTNAME='orderer0'

bdk channel update -o orderer0.org1.example.com:7050 -c system-channel
```

### Step 5：Org3 加入 Channel

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

### Step 6：Org3 部署 Chaincode

安裝並且同意標籤名稱為 fabcar_1 的 Chaincode，由於使用前面的 Blockchain network，所以此次只做到 `peer chaincode lifecycle approveformyorg`，使用 `-a` 來限制 Lifecycle chaincode 的部署 Chaincode 步驟只做到 `peer chaincode lifecycle approveformyorg` ，使用 `-I` 來標示此次 Chaincode 需要初始化才能使用，之後在 Org3 的 peer1 安裝名稱為 fabcar_1 的 Chaincode

```bash
# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

# Org3 的 peer0 安裝、同意 Chaincode
bdk chaincode install -l fabcar_1
bdk chaincode approve -C test -l fabcar_1 -I --orderer orderer0.example.com:7050

# export BDK_ORG_NAME='Org3'
# export BDK_ORG_DOMAIN='org3.example.com'
# export BDK_HOSTNAME='peer0'

# Org3 的 peer1 安裝 Chaincode
bdk chaincode install -l fabcar_1
```

### Step 7：Org3 發起交易且查詢

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
