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

首先在 *~/.bdk/fabric* 資料夾底下以 *~/.bdk/fabric* 中 *BDK_FABRIC_NETWORK_NAME* 名稱建立資料夾，再來產生 *crypto-config.yaml* 讓 `cryptogen` 指令產生 Orderer 和 Peer 的憑證和私鑰，將其 TLS Ca 憑證複製到 Blockchain network 資料夾下的 *tlsca* 資料夾中，並且產生 *configtx.yaml* 使用 `configtxgen` 指令產生創始區塊 *genesis.block* ，之後建立 Peer 的連線的設定檔案和 Peer 和 Orderer *docker-compose.yaml* 檔案

```bash
bdk fabric network create -f create.json --create-full
```

### Step 2：啟動 Orderer 和 Peer 的機器

分別啟動組織中各個 Orderer 或是 Peer 的機器

```bash
# 啟動 orderer 的機器
bdk fabric orderer up -i
```
選擇 orderer0.orderer.org0.example.com, orderer1.orderer.org0.example.com
```bash
# 啟動 peer 的機器
bdk fabric peer up -i
```
選擇 peer0.org0.example.com, peer0.org1.example.com, peer1.org0.example.com, peer1.org1.example.com

### Step 3：建立 Channel

首先更改在 *~/.bdk/.env* 組織的名稱 *BDK_ORG_NAME* 與 Domain 名稱 *BDK_ORG_DOMAIN* 設定，再來建立一個名稱為 *test* 的 [Application Channel](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_overview.html?highlight=channel)，為了讓之後加入新的 Peer 組織加入只需要一個組織同意即可，我們將 Channel admin policy 設定為只需要任何在 Channel 中的成員簽名即可，使用 `--channelAdminPolicyStyle` 設定成 `Any-Member-in-Channel` ，改變 Application Channel 中的 Channel Admin Policy

```bash
# Org0 的 peer0 建立新的 channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel create -i
```
選擇 
- test
- orderer0.orderer.org0.example.com:7050
- Org0, Org1
- ImplicitMeta
- Any Admins signature in channel

### Step 4：Org0 和 Org1 加入 Channel

Org0 和 Org1 加入名稱為 *test* 的 Application Channel，由於加入 Application Chanel 是以 Peer 單位加入，所以每次加入都要記得更改在 *~/.bdk/.env* 的 *BDK_ORG_NAME 、 BDK_ORG_DOMAIN* 、 *BDK_HOSTNAME* 的設定

```bash
# Org0 的 peer0 加入 channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel join -i
```
選擇
- test
- orderer0.orderer.org0.example.com:7050
```bash
# Org0 的 peer1 加入 channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
選擇 
- test
- orderer0.orderer.org0.example.com:7050
```bash
# Org1 的 peer1 加入 channel
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
選擇 
- test
- orderer0.orderer.org0.example.com:7050

### Step 5：Org0 和 Org1 更新在 Channel 上的 Anchor peer 設定

更新 Org0 和 Org1 在名稱為 *test* 的 Application Channel 上的設定，注意更新時，要記得更改在 *~/.bdk/.env* 的 *BDK_ORG_NAME 、 BDK_ORG_DOMAIN* 的設定

```bash
# 更新 Org0 的 anchor peer
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel update-anchorpeer -i
```
選擇
- test
- orderer0.orderer.org0.example.com:7050
- 7051
```bash
# Org1 的 peer1 加入 channel
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel update-anchorpeer -i
```
選擇
- test
- orderer0.orderer.org0.example.com:7050
- 7051

## 部署 Chaincode

### Step 1：打包 Chaincode

將路徑上的 Chaincode 的原始碼和所需要的相關套件，命名為 *fabcar* 和版本 1，編譯完後打包成 *.tar* 檔案

```bash
# 在執行chaincode指令前需要先把套件載入專案掛進 vendor
cd chaincode/fabcar/go
go mod vendor

bdk fabric chaincode package -i
```
選擇
- fabcar
- 1
- ./chaincode/fabcar/go

### Step 2：Org0 和 Org1 安裝、同意 Chaincode

 安裝並且同意標籤名稱為 fabcar_1 的 Chaincode，使用 `-a` 來限制 Lifecycle chaincode 的部署 Chaincode 步驟只做到 `peer chaincode lifecycle approveformyorg` ，使用 `-I` 來標示此次 Chaincode 需要初始化才能做使用

```bash
# Org0 的 peer0 安裝、同意 Chaincode
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode install -i
```
選擇
- fabcar
- 1
```bash
bdk fabric chaincode approve -i
```
選擇 
- test
- fabcar
- 1
- true
- Yes
- orderer0.orderer.org0.example.com:7050
```bash
# Org1 的 peer1 安裝、同意 Chaincode
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric chaincode install -i
```
選擇
- fabcar
- 1
```bash
bdk fabric chaincode approve -i
```
選擇
- test
- fabcar
- 1
- true
- Yes
- orderer0.orderer.org0.example.com:7050

### Step 3：Org0 的 peer1 安裝 Chaincode

安裝 Chaincode 在 Org0 的 peer1 上

```bash
# Org0 的 peer1 安裝 Chaincode
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric chaincode install -i
```
選擇
- fabcar
- 1

### Step 4：Org0 部署 Chaincode

部署標籤名稱為 fabcar_1 的 Chaincode，使用 `-c` 只做 Lifecycle chaincode 部署 Chaincode 步驟只做 `peer chaincode lifecycle commit` 的步驟

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode commit -i
```
選擇
- test
- fabcar
- 1
- true
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051

### Step 5：Org0 初始化 Chaincode

使用 `bdk fabric chaincode invoke` 來初始化名稱為 fabcar_1 的 Chaincode，使用 `-f` 選擇 Chaincode 上初始化的 function

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode invoke -i
```
選擇
- test
- fabcar
- InitLedger
- (略過) 
- true
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051

### Step 6：Org0 和 Org1 發起交易並且查詢寫入的資料

使用 `bdk fabric chaincode invoke` 和名稱為 fabcar_1 的 Chaincode 發起交易，使用 `-f` 選擇 Chaincode 上初發起交易使用的 function，使用 `-a` 輸入 Chaincode function 所需要的參數，之後可以使用 `bdk fabric chaincode query` 和 Chaincode 查詢資訊

```bash
# 發起交易
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode invoke -i
```
選擇
- test
- fabcar
- CreateCar
- CAR_ORG1_PEER0,BMW,X6,blue,Org0
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051
```bash
# 查詢資訊
bdk fabric chaincode query -i
```
選擇
- test
- fabcar
- QueryCar
- CAR_ORG1_PEER0
```bash
# 發起交易
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric chaincode invoke -i
```
選擇
- test
- fabcar
- CreateCar
- CAR_ORG1_PEER1,BMW,X6,blue,Org0
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051
```bash
# 查詢資訊
bdk fabric chaincode query -i
```
選擇
- test
- fabcar
- QueryCar
- CAR_ORG1_PEER1
```bash
# 發起交易
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric chaincode invoke -i
```
選擇
- test
- fabcar
- CreateCar
- CAR_ORG1_PEER2,BMW,X6,blue,Org1
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- peer0.org0.example.com:7051, peer1.org1.example.com:7051
```bash
# 查詢資訊
bdk fabric chaincode query -i
```
選擇
- test
- fabcar
- QueryCar
- CAR_ORG1_PEER2

## 加入新建 Channel

### Step 1：建立 Channel

首先更改在 *~/.bdk/.env* 組織的名稱 *BDK_ORG_NAME* 與 Domain 名稱 *BDK_ORG_DOMAIN* 設定，再來建立一個名稱為 *test1* 的 [Application Channel](https://hyperledger-fabric.readthedocs.io/en/release-2.2/create_channel/create_channel_overview.html?highlight=channel)，可以使用 `--channelAdminPolicyStyle` 選擇基本的選項 `All-Initial-Member`

```bash
# Org0 的 peer0 建立新的 channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel create -i
```
選擇
- test1
- orderer0.orderer.org0.example.com:7050
- Org0, Org1
- Signature
- All admin signature of initial member

### Step 2：Org0 和 Org1 加入 Channel

Org0 和 Org1 加入名稱為 *test* 的 Application Channel，由於加入 Application Chanel 是以 Peer 單位加入，所以每次加入都要記得更改在 *~/.bdk/.env* 的 *BDK_ORG_NAME 、 BDK_ORG_DOMAIN* 、 *BDK_HOSTNAME* 的設定

```bash
# Org0 的 peer0 加入 channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel join -i
```
選擇
- test1
- orderer0.orderer.org0.example.com:7050
```bash
# Org0 的 peer1 加入 channel
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
選擇
- test1
- orderer0.orderer.org0.example.com:7050
```bash
# Org1 的 peer1 加入 channel
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
選擇
- test1
- orderer0.orderer.org0.example.com:7050

### Step 3：Org0 和 Org1 更新在 Channel 上的 Anchor peer 設定

更新 Org0 和 Org1 在名稱為 *test1* 的 Application Channel 上的設定，注意更新時，要記得更改在 *~/.bdk/.env* 的 *BDK_ORG_NAME 、 BDK_ORG_DOMAIN* 的設定

```bash
# 更新 Org0 的 anchor peer
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel update-anchorpeer -i
```
選擇
- test1
- orderer0.orderer.org0.example.com:7050
- 7051
```bash
# Org1 的 peer1 加入 channel
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel update-anchorpeer -i
```
選擇
- test1
- orderer0.orderer.org0.example.com:7050
- 7051

## 使用 Snapshot 加入 Channel

### Step 1 : 選擇已在 channel 內的 peer 執行 submitSnapshot

```bash
# Org0 中的 peer0 已在 Channel 內 (channel name: test)
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

選擇
- Operation : submitRequest
- Channel Name : test
- Block Number : 0 (立即執行 snapshot) or N (N個block後再執行 snapshot)
p.s. 完成的快照會被複製到本地端的 .bdk/fabric/{networkName}/peerOrganizations/{domain}/peers/peer{number}.{domain}/snapshots/completed/{channelName}/{blockHeight} 下

### Step 2 (Optional) : 查看已提交的 snapshot request
```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

選擇
- Operation : listPending
- Channel Name : test

此指令會列出所有正在 pending 的 snapshot request (在submitRequest時 block number為0的 request不會顯示)

### Step 3 (Optional) : 刪除多餘的 snapshot request

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

選擇
- Operation : cancelRequest
- Channel Name : test
- Block Number : N (block N 的 snapshot request 將被刪除)

刪除後可再次執行 listPending 來查看 snapshot request 是否已被刪除

### Step 4 : 用 joinBySnapshot 將新的 peer 加入 channel

```bash
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org1.example.com:8051

bdk fabric channel snapshot -i
```

選擇
- Operation : joinBySnapshot
- Snapshot Path : .bdk/fabric/bdk-fabric-network/peerOrganizations/org0.example.com/peers/peer0.org0.example.com/snapshots/completed/test/0/ （範例）（輸入被copy在本地的snapshot目錄的絕對路徑）

### Step 5 : 確認新的 peer 是否加入 channel

```bash
# 到 peer0.org1.example.com 的 container 內下指令 peer channel list 或 peer channel getinfo 查看是否已被加入 channel
peer channel list
peer channel getinfo -c {channelName}
```

## 加入新 Peer org

首先要準備檔案 *org-peer-create.json*，將所需要的參數放入到 *org-peer-create.json* 中，之後使用 `cryptogen` 的方式產生憑證和私鑰，準備 Peer 的組織所需要的相關文件，之後將 Orgnew 的資訊加入到 Application channel 設定檔中，啟動新組織 Orgnew 的 Peer 並且把他加入到名稱為 `test` 的 Channel 中，再測試以 Orgnew 發起交易和查詢交易資訊

### 重要流程說明

**完整的新 Peer 組織加入流程包含以下關鍵步驟：**

1. **生成組織憑證和配置文件** - 使用 `bdk fabric org peer create` 
2. **生成頻道配置更新** - 使用 `bdk fabric org peer add-channel` 
3. **⚠️ 關鍵步驟：提交配置更新到 orderer** - 使用 `peer channel update` 命令
4. **啟動新組織的 peer 容器**
5. **所有 peer 個別加入頻道** - 使用 `bdk fabric channel join`

**注意事項：**
- Step 2 只是生成配置更新文件，**必須執行 Step 2.1 提交到 orderer 才會生效**
- 沒有執行 Step 2.1 的話，新組織的 peer 會出現 `FORBIDDEN` 錯誤
- 配置更新需要有管理權限的組織（如 Org0）來提交

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
      "peerCount": 2,
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
        }
      ]
    }
  ]
```

### Step 1：建立名稱為 Orgnew 的 Peer org

產生 *crypto-config.yaml* 讓 `cryptogen` 指令產生 Peer 的憑證和私鑰，將其 TLS Ca 憑證複製到 Blockchain network 資料夾下的 *tlsca* 資料夾中，並且產生 *configtx.yaml* 使用 `configtxgen` 指令產生 Peer org 的 json 設定檔，之後建立 Peer 的連線的設定檔案和 Peer 和 *docker-compose.yaml* 檔案

```bash
bdk fabric org peer create -f ./org-peer-create.json --create-full
```

### Step 2：將 Orgnew 加入 Channel 配置中

由 Org0 組織身份將 Orgnew 加入 Application Channel 配置

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric org peer add -i
```
選擇
- test
- Orgnew

**重要：此步驟只是生成配置更新文件，還需要下一步提交到 orderer 才能生效**

### Step 2.1：提交配置更新到 Orderer

**關鍵步驟**：將配置更新提交到 orderer 使其生效。使用 BDK 的 `channel update` 指令即可完成此步驟。

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel update -c test -o orderer0.orderer.org0.example.com:7050
```

**或使用互動式模式：**
```bash
bdk fabric channel update -i
```
選擇
- test
- orderer0.orderer.org0.example.com:7050

**注意事項**：
- 此步驟必須由有管理權限的組織（如 Org0）執行
- 執行成功後，新組織才真正被加入到頻道配置中
- 此步驟成功後，新組織的 peer 才能加入頻道

### Step 3：啟動 Orgnew 機器

啟動 Orgnew 的 Peer 機器

```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric peer up -i
```
選擇 peer0.orgnew.example.com, peer1.orgnew.example.com

### Step 4：Orgnew 加入 system-channel

由 Org0Orderer 組織身份將 Orgnew 加入 System Channel 並同意

```bash
export BDK_ORG_TYPE='orderer'
export BDK_ORG_NAME='Org0Orderer'
export BDK_ORG_DOMAIN='orderer.org0.example.com'
export BDK_HOSTNAME='orderer0'

bdk fabric org peer add-system-channel -i
```
選擇
- Orgnew
- orderer0.orderer.org0.example.com:7050
```bash
bdk fabric channel approve -i
```
選擇 system-channel

### Step 5：所有 Orgnew peer 加入 Channel

Orgnew 的所有 peer 加入名稱為 *test* 的 Application Channel。由於加入 Application Channel 是以 Peer 單位加入，所以每個 peer 都需要單獨加入。

#### Peer0 加入頻道
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric channel join -i
```
選擇
- test
- orderer0.orderer.org0.example.com:7050

#### Peer1 加入頻道
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer1'

bdk fabric channel join -i
```
選擇
- test
- orderer0.orderer.org0.example.com:7050

#### 驗證所有 peer 都已成功加入頻道
可以使用以下命令驗證每個 peer 都已加入頻道：

```bash
# 檢查 peer0
docker exec peer0.orgnew.example.com peer channel list

# 檢查 peer1  
docker exec peer1.orgnew.example.com peer channel list
```

### Step 6：Orgnew 部署 Chaincode

安裝並且同意標籤名稱為 fabcar_1 的 Chaincode，由於使用前面的 Blockchain network，所以此次只做到 `peer chaincode lifecycle approveformyorg`，使用 `-a` 來限制 Lifecycle chaincode 的部署 Chaincode 步驟只做到 `peer chaincode lifecycle approveformyorg` ，使用 `-I` 來標示此次 Chaincode 需要初始化才能使用，之後在 Orgnew 的 peer1 安裝名稱為 fabcar_1 的 Chaincode

```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

# Orgnew 的 peer0 安裝、同意 Chaincode
bdk fabric chaincode install -i
```
選擇
- fabcar
- 1
```bash
bdk fabric chaincode approve -i
```
選擇
- test
- fabcar
- 1
- true
- Yes
- orderer0.orderer.org0.example.com:7050
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer1'

# Orgnew 的 peer1 安裝 Chaincode
bdk fabric chaincode install -i
```
選擇
- fabcar
- 1

### Step 7：Orgnew 發起交易且查詢

使用 `bdk fabric chaincode invoke` 和名稱為 fabcar_1 的 Chaincode 發起交易，使用 `-f` 選擇 Chaincode 上初始化的 function，使用 `-a` 輸入 Chainocde function 所需要的參數，之後可以使用 `bdk fabric chaincode query` 和 Chaincode 查詢資訊

```bash
# 發起交易
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer0'

bdk fabric chaincode invoke -i
```
選擇
- test
- fabcar
- CreateCar
- CAR_ORGNEW_PEER0, BMW, X6, blue, Orgnew
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- all
```bash
# 查詢資訊
bdk fabric chaincode query -i
```
選擇
- test
- fabcar
- QueryCar
- CAR_ORGNEW_PEER0
```bash
export BDK_ORG_NAME='Orgnew'
export BDK_ORG_DOMAIN='orgnew.example.com'
export BDK_HOSTNAME='peer1'

# 發起交易
bdk fabric chaincode invoke -i
```
選擇
- test
- fabcar
- CreateCar
- CAR_ORGNEW_PEER1, BMW, X6, blue, Orgnew
- false
- Yes
- orderer0.orderer.org0.example.com:7050
- Yes
- all
```bash
# 查詢資訊
bdk fabric chaincode query -i
```
選擇
- test
- fabcar
- QueryCar
- CAR_ORGNEW_PEER1

### 常見問題與故障排除

#### 問題 1：peer 加入頻道時出現 FORBIDDEN 錯誤

**現象：**
```
Error: can't read the block: &{FORBIDDEN}
```

**原因：** 配置更新沒有提交到 orderer，新組織還沒有真正被加入到頻道配置中。

**解決方案：** 確保執行了 Step 2.1 的配置更新提交步驟。

#### 問題 2：證書路徑錯誤

**現象：**
```
Cannot run peer because cannot init crypto, specified path does not exist
```

**解決方案：** 檢查並使用正確的容器內路徑：
- MSP 路徑：`/tmp/peerOrganizations/orgnew.example.com/users/Admin@orgnew.example.com/msp`
- TLS CA 證書：複製到容器中的正確位置

#### 問題 3：TLS 憑證驗證失敗

**現象：**
```
tls: failed to verify certificate: x509: certificate signed by unknown authority
```

**解決方案：** 使用正確的 orderer TLS CA 證書：
```bash
docker cp ~/.bdk/fabric/bdk-fabric-network/ordererOrganizations/orderer.org0.example.com/tlsca/tlsca.orderer.org0.example.com-cert.pem peer0.org0.example.com:/tmp/
```

#### 問題 4：驗證配置更新是否生效

**檢查方法：**
```bash
# 檢查頻道配置是否包含新組織
peer channel fetch config -o orderer0.orderer.org0.example.com:7050 -c test --tls --cafile /path/to/orderer/ca.crt

# 使用 configtxlator 解碼查看
configtxlator proto_decode --input config.pb --type common.Config --output config.json
```

## 加入新 Orderer org

### Step 1：建立新的 Orderer org

```bash
bdk fabric org orderer create --interactive
```
選擇
- 1
- Org1Orderer
- org1orderer.example.com
- True
- orderer0
- 7050
- True
- 8443
- True
- new.genesis
- Yes, please generate them for me with cryptogen
- Yes, please generate orderer org config json file
- yes

### Step 2：Orderer org 加入 system channel

```bash
export BDK_ORG_TYPE='orderer'
export BDK_ORG_NAME='Org1Orderer'
export BDK_ORG_DOMAIN='org1orderer.example.com'
export BDK_HOSTNAME='orderer0'
# system-channel
bdk fabric org orderer add --interactive
```

### Step 3：Orderer org 加入 channel

```bash
export BDK_ORG_TYPE='orderer'
export BDK_ORG_NAME='Org1Orderer'
export BDK_ORG_DOMAIN='org1orderer.example.com'
export BDK_HOSTNAME='orderer0'
# application 
bdk fabric org orderer add --interactive
```

## 使用 Snapshot 加入 Channel

### Step 1 : 選擇已在 channel 內的 peer 執行 submitSnapshot

```bash
# Org0 中的 peer0 已在 Channel 內 (channel name: test)
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

選擇
- Operation : submitRequest
- Channel Name : test
- Block Number : 0 (立即執行 snapshot) or N (N個block後再執行 snapshot)
p.s. 完成的快照會被複製到本地端的 .bdk/fabric/{networkName}/peerOrganizations/{domain}/peers/peer{number}.{domain}/snapshots/completed/{channelName}/{blockHeight} 下

### Step 2 (Optional) : 查看已提交的 snapshot request
```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

選擇
- Operation : listPending
- Channel Name : test

此指令會列出所有正在 pending 的 snapshot request (在submitRequest時 block number為0的 request不會顯示)

### Step 3 (Optional) : 刪除多餘的 snapshot request

```bash
export BDK_ORG_NAME='Org0'
export BDK_ORG_DOMAIN='org0.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org0.example.com:7051

bdk fabric channel snapshot -i
```

選擇
- Operation : cancelRequest
- Channel Name : test
- Block Number : N (block N 的 snapshot request 將被刪除)

刪除後可再次執行 listPending 來查看 snapshot request 是否已被刪除

### Step 4 : 用 joinBySnapshot 將新的 peer 加入 channel

```bash
export BDK_ORG_NAME='Org1'
export BDK_ORG_DOMAIN='org1.example.com'
export BDK_HOSTNAME='peer0'
export PEER_ADDRESS=peer0.org1.example.com:8051

bdk fabric channel snapshot -i
```

選擇
- Operation : joinBySnapshot
- Snapshot Path : .bdk/fabric/bdk-fabric-network/peerOrganizations/org0.example.com/peers/peer0.org0.example.com/snapshots/completed/test/0/ （範例）（輸入被copy在本地的snapshot目錄的絕對路徑）

### Step 5 : 確認新的 peer 是否加入 channel

```bash
# 到 peer0.org1.example.com 的 container 內下指令 peer channel list 或 peer channel getinfo 查看是否已被加入 channel
peer channel list
peer channel getinfo -c {channelName}
```
