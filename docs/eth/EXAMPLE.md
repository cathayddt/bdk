# 使用範例
(English version)(Work In Progress)

## 目錄
- [確認 BDK 安裝狀態](#確認-bdk-安裝狀態)
- [建立 Besu/Quorum Network](#建立-Besu/Quorum-network)
- [建立 Blockscout Explorer](#建立-blockscout-explorer)
- [加入 Remote 節點](#加入-remote-節點)
- [備份還原 Node](#備份還原-node)
- [建立 Cluster](#建立-cluster)
- [部屬 ERC20 合約](#部屬-erc20-合約)

## 確認 BDK 安裝狀態

```bash
# 確認 BDK 套件是否安裝完成
bdk hello
```

如果指令已順利安裝，你會看到 `You have installed bdk successfully!!!` 

## 建立 Besu/Quorum Network

```bash
# 輸入指令，啟動 Besu/Quorum 網路互動式介面
bdk eth network create -i
```

依序輸入 `network type` (Besu/Quorum)、`chain id`（預設為 81712）、`validator` 以及 `member` 的數量，於 `Using bootnode?` 選項選 `false`，並填入自己的錢包，如無錢包則選擇 `false`，會提供一組公私鑰來作為使用 Besu/Quorum 網路的帳號，該組帳號將在創始區塊擁有代幣

## 建立 Blockscout Explorer

```bash
# 輸入指令，啟動 Blockscout 區塊鏈瀏覽器
bdk eth explorer create -i
```

輸入 `port`，並稍待片刻，即可使用區塊鏈瀏覽器

## 加入 Remote 節點

範例情境：建立擁有三個 Validator 節點的 Besu/Quorum 網路，且三個節點分別建置在不同機器。

> `需確認機器的 IP Address 以及 Port 30303 (Validator) 或 Port 30403 (Member) 有互相開放`。

Validator 以及 Member 節點的加入流程相同，此處以 Validator 為例。

### Step 0： 建立 Network

```bash
# 於第一台機器上建立 Validator 數量為 1，Member 數量為 0 的 Besu/Quorum 網路。
bdk eth network create -i
```

### Step 1：產生 Node 設定檔，取得 enodeInfo

```bash
# 分別於第二台及第三台機器產生 Node 設定檔， Validator 數量填入 1，Member 數量填入 0。
bdk eth network generate -i

# 選擇 node，選擇剛產生的節點，選擇 enodeInfo 保留下來。
bdk eth network get -i
```

### Step 2：新增節點 (加入第二台機器)

```bash
# 從第一台機器輸入指令，選擇 remote、validator，填入要加入節點(第二台機器)的 enodeInfo、IP Address。
bdk eth network add -i

# 選擇 network，取得 genesis.json、static-nodes.json 保留下來。
bdk eth network get -i
```

### Step 3：加入網路

```bash
# 從要加入的機器(第二台機器)輸入指令，選擇要加入的節點(第一台機器)，並依序輸入以下資訊，填入要加入網路的 IP Address、genesis.json、static-nodes.json。
bdk eth network join -i
```

### Step 4：新增節點 (加入第三台機器)

```bash
# 從第一台機器輸入指令，選擇 remote、validator，填入要加入節點(第三台機器)的 enodeInfo、IP Address。
bdk eth network add -i

# 選擇 network，取得 genesis.json、static-nodes.json 保留下來。
bdk eth network get -i
```
```bash
# 從第二台機器輸入指令，選擇 remote、validator，填入要加入節點(第三台機器)的 enodeInfo、IP Address。
bdk eth network add -i

# 選擇 network，取得 genesis.json、static-nodes.json 保留下來。
bdk eth network get -i
```

### Step 5：加入網路

```bash
# 從要加入的機器(第三台機器)輸入指令，選擇要加入的節點(第一台或第二台機器)，並依序輸入以下資訊，填入要加入網路的 IP Address、genesis.json、static-nodes.json。
bdk eth network join -i
```

### Step 6：確認節點狀態

```bash
# 輸入指令，可確認以下節點狀態
bdk eth network check -i
```
#### Quorum
- `isValidator`： 確認節點是否為 Validator，此處三個節點都應回傳 `true`。
- `getValidator`： 獲取 Validator 清單，此處應回傳包含三個 Validator 的地址。
- `peerCount`： 確認節點連接數，此處每個節點應回傳 `2`。
- `chainId`：鏈 ID，此處預設應回傳 `81712`。

#### Besu
- `admin_nodeInfo`： 確認節點是否成功啟動，此處應回傳節點相關資訊。
- `getValidator`： 獲取 Validator 清單，此處應回傳包含三個 Validator 的地址。
- `peerCount`： 確認節點連接數，此處每個節點應回傳 `2`。
- `chainId`：鏈 ID，此處預設應回傳 `81712`。

## 備份還原 Node

Besu/Quorum 網路各節點啟動後，即可做備份的動作，BDK 備份工具可根據使用者的需求備份個別或全部節點，並將備份壓縮檔存入 `~/.bdk/eth/backup` 資料夾中，達成多台機器還原環境的功能

### 備份 Node

```bash
# 備份現有的 Node （擇一備份）
bdk eth backup export --interactive
```

```bash
# 備份所有的 Node
bdk eth backup export --all
```

### 還原 Node

```bash
# 透過指令還原節點，可在清單中選擇需要還原的備份檔
bdk eth backup import -i
```

```bash
# 還原後需透過以下指令，來啟動該備份的節點
bdk eth network up --all
```

## 建立 Cluster

先確保電腦安裝以下套件 `kubectl`, `helm`, `docker`
```bash
kubectl version
helm version
docker version
```
該範例以 `minikube` 做為本機建立的範例

### Step 1. 建立本地 Cluster

```bash
minikube start --memory 11384 --cpus 2
# 確認目前的 cluster 為 minikube
kubectl config current-context
```

### Step 2. 建立 K8S 網路
```bash
bdk eth cluster apply -i
```
- `What is your network?` 選擇 `Besu` 或 `Quorum`
- `What is your cloud provider?` 選擇 `GCP/local`
- `What is your chain id?` 選擇 81712
- `How many validator do you want?` 選擇 4
- `How many member do you want?` 選擇 0
- `Do you already own a wallet?` false

這樣你的本地端的 besu/quorum 網路就建立好了，如需連線及可用 `http://localhost:8545` 做連線
#### Quorum 網路可使用 `svc/goquorum-node-validator-1` 連線
```bash
kubectl port-forward -n quorum svc/goquorum-node-validator-1 8545
```
#### Besu 網路可使用 `svc/besu-node-validator-1` 連線
```bash
kubectl port-forward -n besu svc/besu-node-validator-1 8545
```

### Step 3. 刪除 K8S 網路
```bash
bdk eth cluster delete -i
```
- `What is your network?` 選擇 `Besu` 或 `Quorum`
- 按 `y` 或 `yes` 刪除

## 產出 helm values 和資料於本地
如需直接使用 helm repo 來做 helm release 可利用以下 script
```bash
bdk eth cluster generate -i
```
- `What is your network?` 選擇 `Besu` 或 `Quorum`

## 部屬 ERC20 合約
### 建立 ERC20 合約
在本地端建立一個新的檔案 `MyToken.sol`，並貼上以下程式碼：
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
```
請自行下載ERC20.sol合約放入`./contracts/token/ERC20/ERC20.sol`
### 編譯 ERC20 合約
```bash
#透過以下命令編譯合約
bdk eth contract compile -i
```
根據提示選擇以下項目：
- `What is the folder path of compile contract?` 輸入合約所在資料夾 `/home/../contracts`
- `What is the name of deploy contract?` 選擇 `MyToken.sol`
- `What is the compile function?` 選擇 `Load remote solc`自動下載所需合約版本編譯合約
 > ✅ 編譯成功後，會在 `/home/../contracts/build` 資料夾中產生對應的 JSON 檔案。

### 部屬合約
```bash
bdk eth contract deploy -i
```
根據提示選擇以下項目：
- `What is your network?` 選擇 `Besu` 或 `Quorum`
- `What is the folder path of deploy contract?` 輸入合約所在資料夾 `../../contracts/build` 編譯後合約存放在build資料夾中
- `What is the name of deploy contract?` 選擇 `MyToken.json`
- `Please enter name (string)` 輸入Token名稱
- `Please enter symbol (string)` 輸入Token符號
- `Please enter initialSupply (uint256)` 輸入Token初始發行量
- `What is the account private key of deploy contract?` 輸入部署合約的帳號私鑰

### 查詢合約地址
```bash
bdk eth contract get -i
```
根據提示選擇以下項目：
- `What is your network?` 選擇 `Besu` 或 `Quorum`
- `What is the name of deploy contract?` 選擇 `MyToken_時間戳記`