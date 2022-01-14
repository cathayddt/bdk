# 指令文件

[(English version)](COMMANDS-EN.md)

## 目錄

- [CA](#ca)
- [Chaincode](#chaincode)
- [Channel](#channel)
- [Config](#config)
- [Explorer](#explorer)
- [Network](#network)
- [Orderer](#orderer)
- [Org](#org)
- [Peer](#peer)

## CA

### `bdk ca up`

Description: Bring up CA.

| Options                  |  Type   | Description                                                    | Required | Default                          |
| ------------------------ | :-----: | -------------------------------------------------------------- | :------: | -------------------------------- |
| --help                   | boolean | Show help                                                      |          |
| --version                | boolean | Show version number                                            |          |
| -i, --interactive        | boolean | call interactive wizard                                        |          |
| -n, --ca-name            | string  | (CA) service name                                              |    V     |
| -p, --port               | number  | (CA) service port                                              |    V     | 7054                             |
| --admin-user             | string  | (CA) admin user name                                           |          | "admin"                          |
| --admin-pass             | string  | (CA) admin password                                            |          | "adminpw"                        |
| --ca-certfile            | string  | (CA) service certfile                                          |          |
| --ca-keyfile             | string  | (CA) service keyfile                                           |          |
| --tls-certfile           | string  | (TLS) certfile for ca service                                  |          |
| --tls-keyfile            | string  | (TLS) keyfile for ca service                                   |          |
| --sign-enrollment-expiry | string  | (Signing) Expiry for downstream entity enrollments             |    V     | "8760h"                          |
| --sign-ca-expiry         | string  | (Signing) Expiry for downstream CA enrollments                 |    V     | "43800h"                         |
| --sign-tls-expiry        | string  | (Signing) Expiry for downstream TLS enrollments                |    V     | "8760h                           |
| --csr-cn                 | string  | (CSR) Common name for CSR if this is an CA                     |          |
| --csr-hosts              | string  | (CSR) Hosts for CSR if this is an CA                           |          |
| --csr-expiry             | string  | (CSR) Certificate expiry for CSR if this is an CA              |          | "131400h"                        |
| --csr-pathlength         | number  | (CSR) Pathlength for CSR if this is an CA                      |          | 0                                |
| --ica-parentserver-url   | string  | (ICA) Parentserver connection info for ICA if this is an ICA   |          | "https://<id>:<secret>@hostname" |
| --ica-parentserver-cn    | string  | (ICA) Parentserver CA common name for ICA if this is an ICA    |          |
| --ica-enrollment-host    | string  | (ICA) Host to enroll certificates for ICA if this is an ICA    |          |
| --ica-enrollment-profile | string  | (ICA) Profile to enroll certificates for ICA if this is an ICA |          | "ca"                             |
| --ica-tls-certfile       | boolean | (ICA) TLS certfile for parent server if this is an ICA         |          |
| --role                   | string  | (ICA) Org type orderer/peer for ICA if this is an ICA          |    V     |

### `bdk ca down`

Description: Bring down CA.

| Options           |  Type   | Description                    | Required | Default |
| ----------------- | :-----: | ------------------------------ | :------: | ------- |
| --help            | boolean | Show help                      |          |
| --version         | boolean | Show version number            |          |
| -i, --interactive | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| --ca-name         | string  | Name of the CA server          |    V     |

### `bdk ca register`

Description: Register member.

| Options             |  Type   | Description                        | Required | Default |
| ------------------- | :-----: | ---------------------------------- | :------: | ------- |
| --help              | boolean | Show help                          |          |
| --version           | boolean | Show version number                |          |
| -i, --interactive   | boolean | 是否使用 Cathay BDK 互動式問答     |          |
| -t, --type          | string  | registration type                  |    V     | "user"  |
| -a, --admin         | string  | your identity (ica/rca admin name) |    V     | "admin" |
| -u, --upstream      | string  | registration upstream host         |    V     |
| -p, --upstream-port | number  | registration upstream port         |    V     | 7054    |
| --client-id         | string  | client id to register              |    V     |
| --client-secret     | string  | secret for client id registered    |    V     |

### `bdk ca enroll`

Description: Enroll certificates.

| Options             |  Type   | Description                                 | Required | Default  |
| ------------------- | :-----: | ------------------------------------------- | :------: | -------- |
| --help              | boolean | Show help                                   |          |
| --version           | boolean | Show version number                         |          |
| -i, --interactive   | boolean | 是否使用 Cathay BDK 互動式問答              |          |
| -t, --type          | string  | enrollment type                             |    V     | "client" |
| -u, --upstream      | string  | enrollment upstream host                    |    V     |
| -p, --upstream-port | number  | enrollment upstream port                    |    V     | 7054     |
| --client-id         | string  | client id to enroll with                    |    V     |
| --client-secret     | string  | secret corresponding to client id specified |    V     |
| -r, --role          | string  | ca type rca, peer org or orderer org        |    V     | "rca"    |
| -h, --org-hostname  | string  | enroll org hostname                         |    V     |

## Chaincode

### `bdk chaincode approve`

Description: 代表環境變數中 BDK_ORG_NAME 的 Peer org 同意 Chaincode

|        Options        |  Type   |                      Description                      | Required | Default |
| --------------------- | :-----: | ----------------------------------------------------- | :------: | ------- |
| --help                | boolean | Show help                                             |          |         |
| --version             |         | boolean Show version number                           |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答                        |          |         |
| -C, --channel-id      | string  | 選擇欲同意 Chaincode 在的 Channel 名稱                |    V     |         |
| -l, --chaincode-label | string  | Chaincode package 的標籤名稱                          |    V     |         |
| -I, --init-required   | boolean | Chaincode 是否需要初始化                              |          |         |
| --orderer             | string  | 選擇 Orderer 同意 Chaincode  (若未輸入則使用discover) |          |         |

### `bdk chaincode commit`

Description: 代表環境變數中 BDK_ORG_NAME 的 Peer org 發布 Chaincode

|        Options        |  Type   |                     Description                      | Required | Default |
| --------------------- | :-----: | ---------------------------------------------------- | :------: | ------- |
| --help                | boolean | Show help                                            |          |         |
| --version             | boolean | Show version number                                  |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答                       |          |         |
| -C, --channel-id      | string  | 選擇欲發布 Chaincode 在的 Channel 名稱               |          |         |
| -l, --chaincode-label | string  | Chaincode package 的標籤名稱                         |          |         |
| -I, --init-required   | boolean | Chaincode 是否需要初始化                             |          |         |
| --orderer             | string  | 選擇 Orderer 同意 Chaincode (若未輸入則使用discover) |          |         |
| --peer-addresses      |  array  | 需要簽名的 Peer address (若未輸入則使用discover)     |          |         |

### `bdk chaincode install`

Description: 安裝 Chaincode

| Options               |  Type   | Description                    | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |
| --version             | boolean | Show version number            |          |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -l, --chaincode-label | string  | Chaincode package 的標籤名稱   |          |

### `bdk chaincode invoke`

Description: 執行 Chaincode function

|         Options          |  Type   |                     Description                      | Required | Default |
| ------------------------ | :-----: | ---------------------------------------------------- | :------: | ------- |
| --help                   | boolean | Show help                                            |          |         |
| --version                | boolean | Show version number                                  |          |         |
| -i, --interactive        | boolean | 是否使用 Cathay BDK 互動式問答                       |          |         |
| -C, --channel-id         | string  | 選擇欲執行 Chaincode 在的 Channel 名稱               |          |         |
| -n, --chaincode-name     | string  | 欲執行 Chaincode 的名稱                              |          |         |
| -I, --is-init            | boolean | 是否要初始化 Chaincode                               |          | false   |
| -f, --chaincode-function | string  | 執行 Chaincode 的 function                           |          |         |
| -a, --args               |  array  | 執行 Chaincode 需要的參數                            |          |         |
| --orderer                | string  | 選擇 Orderer 執行 Chaincode (若未輸入則使用discover) |          |         |
| --peer-addresses         |  array  | 需要簽名的 Peer address (若未輸入則使用discover)     |          |         |

### `bdk chaincode package`

Description: 打包 Chaincode 輸出成 tar 檔案

| Options                 |  Type   | Description                       | Required | Default |
| ----------------------- | :-----: | --------------------------------- | :------: | ------- |
| --help                  | boolean | Show help                         |          |
| --version               | boolean | Show version number               |          |
| -i, --interactive       | boolean | 是否使用 Cathay BDK 互動式問答    |          |
| -n, --chaincode-name    | string  | 欲打包 Chaincode 的名稱           |          |
| -v, --chaincode-version | number  | 打包 Chaincode 的版本             |          | 1       |
| -p, --path              | string  | 打包 Chaincode 檔案的檔案路徑位置 |          | "."     |

### `bdk chaincode query`

Description: query chaincode function

| Options                  |  Type   | Description                                          | Required | Default |
| ------------------------ | :-----: | ---------------------------------------------------- | :------: | ------- |
| --help                   | boolean | Show help                                            |          |
| --version                | boolean | Show version number                                  |          |
| -i, --interactive        | boolean | 是否使用 Cathay BDK 互動式問答                       |          |
| -C, --channel-id         | string  | The channel on which this command should be executed |          |
| -n, --chaincode-name     | string  | Name of the chaincode                                |          |
| -f, --chaincode-function | string  | Function of the chaincode                            |          |
| -a, --args               |  array  | Constructor message for the chaincode in JSON format |          |

## Channel

### `bdk channel create`

Description: 建立新的 Channel 在 Blockchain network

| Options                                  |  Type   | Description                                                                                                   | Required | Default                |
| ---------------------------------------- | :-----: | ------------------------------------------------------------------------------------------------------------- | :------: | ---------------------- |
| --help                                   | boolean | Show help                                                                                                     |          |
| --version                                | boolean | Show version number                                                                                           |          |
| -i, --interactive                        | boolean | 是否使用 Cathay BDK 互動式問答                                                                                |          |
| -n, --name                               | string  | 建立 Channel 的名稱                                                                                           |          |
| -o, --orgNames                           |  array  | 加入新建立 Channel 的 Peer Org 名稱                                                                           |          |
| --channel-admin-policy-style, --as       | string  | 選擇新建立 Channel 中基本的 Channel Admin Policy 選項（像是用在新 Peer Org 加入在 Channel 中的 Policy）       |          |
| --channel-admin-policy-type, --at string |         | 選擇新建立 Channel 中的 Channel Admin Policy 型態                                                             |          | "ImplicitMeta"         |
| -a, --channel-admin-policy-value         | string  | 新建立 Channel 中的 Channel Admin Policy 值                                                                   |          | "MAJORITY Admins"      |
| --lifecycle-endorsement-style, --ls      | string  | 選擇新建立 Channel 中基本的 Lifcycle Endorsement Policy 選項（用在部署新的 Chaincode 在 Channel 中的 Policy） |          |
| --lifecycle-endorsement-type, --lt       | string  | 選擇新建立 Channel 中的 Lifcycle Endorsement Policy 型態                                                      |          | "ImplicitMeta"         |
| -l, --lifecycle-endorsement-value        | string  | 新建立 Channel 中的 Lifcycle Endorsement Policy 值                                                            |          | "MAJORITY Endorsement" |
| --endorsement-style, --es                | string  | 選擇新建立 Channel 中基本的 Endorsement Policy 選項（用在發送交易在 Channel 中的 Policy）                     |          |
| --endorsement-type, --et                 | string  | 選擇新建立 Channel 中的 Endorsement Policy 型態                                                               |          | "ImplicitMeta"         |
| -e, --endorsement-value                  | string  | 新建立 Channel 中的 Endorsement Policy 值                                                                     |          | "MAJORITY Endorsement" |
| --orderer                                | string  | 選擇 Orderer 建立 Channel                                                                                     |          |

### `bdk channel fetch`

Description: 取得 Channel 上資訊

| Options                |  Type   | Description                       | Required | Default |
| ---------------------- | :-----: | --------------------------------- | :------: | ------- |
| --help                 | boolean | Show help                         |          |
| --version              | boolean | Show version number               |          |
| -i, --interactive      | boolean | 是否使用 Cathay BDK 互動式問答    |          |
| -o, --orderer          | string  | 選擇 Orderer 建立 Channel         |          |
| -n, --name             | string  | 建立 Channel 的名稱               |          |
| -t, --config-style     | string  | 欲匯出的 block 種類               |          |
| -f, --output-file-name | string  | 匯出取得 Channel 上資訊的檔案名稱 |          |

### `bdk channel join`

Description: 加入在 Blockchain network 中的 Channel

| Options           |  Type   | Description                     | Required | Default |
| ----------------- | :-----: | ------------------------------- | :------: | ------- |
| --help            | boolean | Show help                       |          |
| --version         | boolean | Show version number             |          |
| -i, --interactive | boolean | 是否使用 Cathay BDK 互動式問答  |          |
| -n, --name        | string  | 欲加入 Channel 的名稱           |          |
| --orderer         | string  | 選擇加入 Channel 使用的 Orderer |          |

### `bdk channel ls`

Description: [TODO] List all channel in network

| Options | Type | Description | Required | Default |
| ------- | :--: | ----------- | :------: | ------- |

### `bdk channel update-anchorpeer`

Description: 更新在 Channel 中 Anchor peer 的資訊

| Options           |  Type   | Description                                                                | Required | Default |
| ----------------- | :-----: | -------------------------------------------------------------------------- | :------: | ------- |
| --help            | boolean | Show help                                                                  |          |
| --version         | boolean | Show version number                                                        |          |
| -i, --interactive | boolean | 是否使用 Cathay BDK 互動式問答                                             |          |
| -n, --name        | string  | 更新 Anchor peer 資訊在 Channel 的名稱                                     |          |
| --orderer         | string  | 使用 Orderer 更新在 Channel 中 Anchor peer 資訊的 Domain name 和 Port 號碼 |          |
| -p, --port        | number  | 更新 Peer 的 Port 號碼                                                     |          | 7051    |

### `bdk channel approve`

Description: 代表環境變數中 BDK_ORG_NAME 的 Org 同意設定檔更動並且簽章

| Options            |  Type   | Description                    | Required | Default |
| ------------------ | :-----: | ------------------------------ | :------: | ------- |
| --help             | boolean | Show help                      |          |
| --version          | boolean | Show version number            |          |
| -i, --interactive  | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -c, --channel-name | string  | Channel 的名稱                 |          |

### `bdk channel update`

Description: 更新 Channel 的設定檔

| Options            |  Type   | Description                    | Required | Default |
| ------------------ | :-----: | ------------------------------ | :------: | ------- |
| --help             | boolean | Show help                      |          |
| --version          | boolean | Show version number            |          |
| -i, --interactive  | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -o, --orderer      | string  | 選擇使用的 Orderer             |          |
| -c, --channel-name | string  | Channel 的名稱                 |          |

### `bdk channel decode-envelope`

Description: 解析 Approve 或 Update 的信封內容

|      Options       |  Type   |          Description           | Required | Default |
| ------------------ | :-----: | ------------------------------ | :------: | ------- |
| --help             | boolean | Show help                      |          |         |
| --version          | boolean | Show version number            |          |         |
| -i, --interactive  | boolean | 是否使用 Cathay BDK 互動式問答 |          |         |
| -c, --channel-name | string  | Channel 的名稱                 |          |         |
| -V, --verify       | boolean | 驗證組織內容的正確性           |          |         |

## Config

### `bdk config init`

Description: 初始環境變數

| Options   |  Type   | Description         | Required | Default |
| --------- | :-----: | ------------------- | :------: | ------- |
| --help    | boolean | Show help           |          |
| --version | boolean | Show version number |          |

### `bdk config ls`

Description: 列出所有 Cathay BDK 此時環境變數

| Options   |  Type   | Description         | Required | Default |
| --------- | :-----: | ------------------- | :------: | ------- |
| --help    | boolean | Show help           |          |
| --version | boolean | Show version number |          |

### `bdk config set`

Description: 增加 / 更改環境變數

| Options           |  Type   | Description                     | Required | Default |
| ----------------- | :-----: | ------------------------------- | :------: | ------- |
| --help            | boolean | Show help                       |          |
| --version         | boolean | Show version number             |          |
| -i, --interactive | boolean | 是否使用 Cathay BDK 互動式問答  |          |
| -k, --key         | string  | key of environmental variable   |          |
| -v, --value       | string  | value of environmental variable |          |

## Explorer

### `bdk explorer up`

Description: stop blockchain explorer.

| Options            |  Type   | Description                    | Required | Default |
| ------------------ | :-----: | ------------------------------ | :------: | ------- |
| --help             | boolean | Show help                      |          |
| --version          | boolean | Show version number            |          |
| -i, --interactive  | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -p, --peer-address | string  | 連接 Peer 的 address 和 port   |          |

### `bdk explorer down`

Description: 啟動 Blockchain explorer

| Options   |  Type   | Description         | Required | Default |
| --------- | :-----: | ------------------- | :------: | ------- |
| --help    | boolean | Show help           |          |
| --version | boolean | Show version number |          |

### `bdk explorer update`

Description: 更新 Blockchain explorer 連接的 Peer

| Options            |  Type   | Description                    | Required | Default |
| ------------------ | :-----: | ------------------------------ | :------: | ------- |
| --help             | boolean | Show help                      |          |
| --version          | boolean | Show version number            |          |
| -i, --interactive  | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -p, --peer-address | string  | 連接 Peer 的 address 和 port   |          |

## Network

### `bdk network create`

Description: 產生 Blockchain network 所需的相關設定檔案

| Options             |  Type   | Description                                                                                                                                                            | Required | Default |
| ------------------- | :-----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | ------- |
| --help              | boolean | Show help                                                                                                                                                              |          |
| --version           | boolean | Show version number                                                                                                                                                    |          |
| -f, --file          | string  | 需要的參數設定 json 檔案路徑                                                                                                                                           |          |
| -i, --interactive   | boolean | 是否使用 Cathay BDK 互動式問答                                                                                                                                         |          | false   |
| --create-full       | boolean | 是否產生 Blockchain network 所需要的所有相關設定檔案（包含使用 cryptogen 產生憑證和私鑰、產生創始區塊、產生 Peer 連接設定檔案、產生 Peer/Orderer docker-compose 檔案） |          | false   |
| --cryptogen         | boolean | 是否使用 cryptogen 產生憑證和私鑰                                                                                                                                      |          | false   |
| --genesis           | boolean | 是否產生創始區塊                                                                                                                                                       |          | false   |
| --connection-profile | boolean | 是否產生 Peer 連接設定檔案                                                                                                                                             |          | false   |
| --docker-compose    | boolean | 是否產生 Peer/Orderer docker-compose 檔案                                                                                                                              |          | false   |
| --test-network      | boolean | 建立測試用的 Blockchain Network                                                                                                                                        |          | false   |

### `bdk network delete`

Description: 刪除現有的 Blockchain network

| Options            |  Type   | Description                               | Required | Default |
| ------------------ | :-----: | ----------------------------------------- | :------: | ------- |
| --help             | boolean | Show help                                 |          |
| --version          | boolean | Show version number                       |          |
| -n, --network-name | string  | 欲刪除 Blockchain network 的名稱          |          |
| -f, --force        | boolean | 是否不需要再次確認刪除 Blockchain network |          | false   |

## Orderer

### `bdk orderer add`

Description: 在 Orderer org 新增 Orderer

| Options                 |  Type   | Description                    | Required | Default |
| ----------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                  | boolean | Show help                      |          |
| --version               | boolean | Show version number            |          |
| -i, --interactive       | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -h, --orderer-hostnames |  array  | 新增 Orderer 的 Hostname       |          |

### `bdk orderer consenter add`

Description: 加入新 Consenter 資訊在 Channel 中

| Options            |  Type   | Description                           | Required | Default |
| ------------------ | :-----: | ------------------------------------- | :------: | ------- |
| --help             | boolean | Show help                             |          |
| --version          | boolean | Show version number                   |          |
| -i, --interactive  | boolean | 是否使用 Cathay BDK 互動式問答        |          |
| -o, --orderer      | string  | 選擇使用的 Orderer                    |          |
| -c, --channel-name | string  | Orderer Org 加入 Channel 的名稱       |          |
| -n, --org-name     | string  | 欲加入 Channel 中 Orderer Org 的名稱  |          |
| -h, --hostname     | string  | 欲加入 Channel 中 Orderer 的 hostname |          |

### `bdk orderer down`

Description: 關閉 Orderer org 的機器並且刪除其 volume 資料

| Options                  |  Type   | Description                                       | Required | Default |
| ------------------------ | :-----: | ------------------------------------------------- | :------: | ------- |
| --help                   | boolean | Show help                                         |          |
| --version                | boolean | Show version number                               |          |
| -i, --interactive        | boolean | 是否使用 Cathay BDK 互動式問答                    |          |
| -n, --orderer-host-names |  array  | 關閉機器並且刪除其 volume 資料 Orderer Org 的名稱 |          |

### `bdk orderer ls`

[TODO] List all orderer org

| Options | Type | Description | Required | Default |
| ------- | :--: | ----------- | :------: | ------- |

### `bdk orderer remove`

[TODO] Remove orderer

| Options | Type | Description | Required | Default |
| ------- | :--: | ----------- | :------: | ------- |

### `bdk orderer up`

Description: 啟動 Orderer org 的機器

| Options                  |  Type   | Description                    | Required | Default |
| ------------------------ | :-----: | ------------------------------ | :------: | ------- |
| --help                   | boolean | Show help                      |          |
| --version                | boolean | Show version number            |          |
| -i, --interactive        | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -n, --orderer-host-names |  array  | 啟動機器 Orderer org 的名稱    |          | []      |

## Org

### `bdk org config export`

Description: 匯出 Org 的 json 設定檔

| Options   |  Type   | Description         | Required | Default |
| --------- | :-----: | ------------------- | :------: | ------- |
| --help    | boolean | Show help           |          |
| --version | boolean | Show version number |          |
| -o, --out | string  | 匯出的檔案          |          |

### `bdk org config import`

Description: 匯入 Org 的 json 設定檔

| Options           |  Type   | Description                    | Required | Default |
| ----------------- | :-----: | ------------------------------ | :------: | ------- |
| --help            | boolean | Show help                      |          |
| --version         | boolean | Show version number            |          |
| -i, --interactive | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -f, --file-list   |  array  | 需要的參數設定 json 檔案路徑   |          |

### `bdk org orderer add`

Description: 加入新 Orderer org 在 Channel 中

| Options            |  Type   | Description                          | Required | Default |
| ------------------ | :-----: | ------------------------------------ | :------: | ------- |
| --help             | boolean | Show help                            |          |
| --version          | boolean | Show version number                  |          |
| -i, --interactive  | boolean | 是否使用 Cathay BDK 互動式問答       |          |
| -o, --orderer      | string  | 選擇使用的 Orderer                   |          |
| -c, --channel-name | string  | Orderer Org 加入 Channel 的名稱      |          |
| -n, --org-name     | string  | 欲加入 Channel 中 Orderer Org 的名稱 |          |


### `bdk org orderer create`

Description: 產生欲加入 Blockchin network 的 Orderer org 所需的相關設定檔案

| Options                 |  Type   | Description                                                                                                                                                                   | Required | Default |
| ----------------------- | :-----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | ------- |
| --help                  | boolean | Show help                                                                                                                                                                     |
| --version               | boolean | Show version number                                                                                                                                                           |
| -i, --interactive       | boolean | 是否使用 Cathay BDK 互動式問答                                                                                                                                                |
| -f, --file              | string  | 需要的參數設定 json 檔案路徑                                                                                                                                                  |
| -g, --genesis-file-name | string  | Orderer 機器讀取的創始區塊的檔案名稱                                                                                                                                          |
| --create-full           | boolean | 是否產生 Hyperledger Fabric 所需要的所有相關設定檔案（包含使用 cryptogen 產生憑證和私鑰、使用 configtx.yaml 產生 Orderer org 的 json 檔案、產生 Orderer docker-compose 檔案） |          | false   |
| --cryptogen             | boolean | 是否使用 cryptogen 產生憑證和私鑰                                                                                                                                             |          | false   |
| --configtxJSON          | boolean | 是否使用 configtx.yaml 產生 Orderer Org 的 json 檔案                                                                                                                          |          | false   |
| --connection-profile     | boolean | 是否產生 Orderer 連接設定檔案                                                                                                                                                 |          | false   |
| --docker-compose        | boolean | 是否產生 Orderer docker-compose 檔案                                                                                                                                          |          | false   |

### `bdk org peer add`

Description: 加入新 Peer org 在 Channel 中

| Options             |  Type   | Description                       | Required | Default |
| ------------------- | :-----: | --------------------------------- | :------: | ------- |
| --version           | boolean | Show version number               |          |
| -i, --interactive   | boolean | 是否使用 Cathay BDK 互動式問答    |          |
| -c, --channel-name  | string  | Peer Org 加入 Channel 的名稱      |          |
| -n, --peer-org-name | string  | 欲加入 Channel 中 Peer Org 的名稱 |          |

### `bdk org peer create`

Description: 產生欲加入 Channel 的 Peer org 所需的相關設定檔案

| Options             |  Type   | Description                                                                                                                                                                                             | Required | Default |
| ------------------- | :-----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | ------- |
| --help              | boolean | Show help                                                                                                                                                                                               |          |
| --version           | boolean | Show version number                                                                                                                                                                                     |          |
| -f, --file          | string  | 需要的參數設定 json 檔案路徑                                                                                                                                                                            |          |
| -i, --interactive   | boolean | 是否使用 Cathay BDK 互動式問答                                                                                                                                                                          |          |
| --create-full       | boolean | 是否產生 Hyperledger Fabric 所需要的所有相關設定檔案（包含使用 cryptogen 產生憑證和私鑰、使用 configtx.yaml 產生 Peer org 的 json 檔案、產生 Peer 連接設定檔案、產生 Peer/Orderer docker-compose 檔案） |          | false   |
| --cryptogen         | boolean | 是否使用 cryptogen 產生憑證和私鑰                                                                                                                                                                       |          | false   |
| --configtxJSON      | boolean | 是否使用 configtx.yaml 產生 Peer Org 的 json 檔案                                                                                                                                                       |          | false   |
| --connection-profile | boolean | 是否產生 Peer 連接設定檔案                                                                                                                                                                              |          | false   |
| --docker-compose    | boolean | 是否產生 Peer docker-compose 檔案                                                                                                                                                                       |          | false   |

## Peer

### `bdk peer add`

Description: 在 Peer Org 中新增新的 Peer

| Options           |  Type   | Description                    | Required | Default |
| ----------------- | :-----: | ------------------------------ | :------: | ------- |
| --help            | boolean | Show help                      |          |
| --version         | boolean | Show version number            |          |
| -i, --interactive | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -c, --peer-count  | number  | 在 Peer Org 中新增的 Peer 個數 |          |

### `bdk peer down`

Description: 關閉 Peer org 的機器並且刪除其 volume 資料

| Options               |  Type   | Description                                    | Required | Default |
| --------------------- | :-----: | ---------------------------------------------- | :------: | ------- |
| --help                | boolean | Show help                                      |          |
| --version             | boolean | Show version number                            |          |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答                 |          |
| -n, --peer-host-names |  array  | 關閉機器並且刪除其 volume 資料 Peer Org 的名稱 |

### `bdk peer ls`

Description: [TODO]

| Options | Type | Description | Required | Default |
| ------- | :--: | ----------- | :------: | ------- |

### `bdk peer remove`

Description: [TODO] Remove one peer in org

| Options | Type | Description | Required | Default |
| ------- | :--: | ----------- | :------: | ------- |

### `bdk peer up`

Description: 啟動 Peer org 的機器

| Options               |  Type   | Description                    | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |
| --version             | boolean | Show version number            |          |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答 |          |
| -n, --peer-host-names |  array  | 啟動機器 Peer org 的名稱       |          |
