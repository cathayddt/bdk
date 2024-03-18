# 使用範例
(English version)(Work In Progress)

## 目錄
- [確認 BDK 安裝狀態](#確認-bdk-安裝狀態)
- [建立 Quorum Network](#建立-quorum-network)
- [建立 Blockscout Explorer](#建立-blockscout-explorer)
- [加入 Remote 節點](#加入-remote-節點)
- [備份還原 Node](#備份還原-node)
- [建立 Cluster](#建立-cluster)

## 確認 BDK 安裝狀態

```bash
# 確認 BDK 套件是否安裝完成
bdk hello
```

如果指令已順利安裝，你會看到 `You have installed bdk successfully!!!` 

## 建立 Quorum Network

```bash
# 輸入指令，啟動 Quorum 網路互動式介面
bdk quorum network create -i
```

依序輸入 `chain id`（預設為 81712）、`validator` 以及 `member` 的數量，於 `Using bootnode?` 選項選 `false`，並填入自己的錢包，如無錢包則選擇 `false`，會提供一組公私鑰來作為使用 Quorum 網路的帳號，該組帳號將在創始區塊擁有代幣

## 建立 Blockscout Explorer

```bash
# 輸入指令，啟動 Blockscout 區塊鏈瀏覽器
bdk quorum explorer create -i
```

輸入 `port`，並稍待片刻，即可使用區塊鏈瀏覽器

## 加入 Remote 節點

範例情境：建立擁有三個 Validator 節點的 Quorum 網路，且三個節點分別建置在不同機器。

> `需確認機器的 IP Address 以及 Port 30303 (Validator) 或 Port 30403 (Member) 有互相開放`。

Validator 以及 Member 節點的加入流程相同，此處以 Validator 為例。

### Step 0： 建立 Network

```bash
# 於第一台機器上建立 Validator 數量為 1，Member 數量為 0 的 Quorum 網路。
bdk quorum network create -i
```

### Step 1：產生 Node 設定檔，取得 enodeInfo

```bash
# 分別於第二台及第三台機器產生 Node 設定檔， Validator 數量填入 1，Member 數量填入 0。
bdk quorum network generate -i

# 選擇 node，選擇剛產生的節點，選擇 enodeInfo 保留下來。
bdk quorum network get -i
```

### Step 2：新增節點 (加入第二台機器)

```bash
# 從第一台機器輸入指令，選擇 remote、validator，填入要加入節點(第二台機器)的 enodeInfo、IP Address。
bdk quorum network add -i

# 選擇 network，取得 genesis.json、static-nodes.json 保留下來。
bdk quorum network get -i
```

### Step 3：加入網路

```bash
# 從要加入的機器(第二台機器)輸入指令，選擇要加入的節點(第一台機器)，並依序輸入以下資訊，填入要加入網路的 IP Address、genesis.json、static-nodes.json。
bdk quorum network join -i
```

### Step 4：新增節點 (加入第三台機器)

```bash
# 從第一台機器輸入指令，選擇 remote、validator，填入要加入節點(第三台機器)的 enodeInfo、IP Address。
bdk quorum network add -i

# 選擇 network，取得 genesis.json、static-nodes.json 保留下來。
bdk quorum network get -i
```
```bash
# 從第二台機器輸入指令，選擇 remote、validator，填入要加入節點(第三台機器)的 enodeInfo、IP Address。
bdk quorum network add -i

# 選擇 network，取得 genesis.json、static-nodes.json 保留下來。
bdk quorum network get -i
```

### Step 5：加入網路

```bash
# 從要加入的機器(第三台機器)輸入指令，選擇要加入的節點(第一台或第二台機器)，並依序輸入以下資訊，填入要加入網路的 IP Address、genesis.json、static-nodes.json。
bdk quorum network join -i
```

### Step 6：確認節點狀態

```bash
# 輸入指令，可確認以下節點狀態
bdk quorum network check -i
```
- `isValidator`： 確認節點是否為 Validator，此處三個節點都應回傳 `true`。
- `getValidator`： 獲取 Validator 清單，此處應回傳包含三個 Validator 的地址。
- `peerCount`： 確認節點連接數，此處每個節點應回傳 `2`。
- `chainId`：鏈 ID，此處預設應回傳 `81712`。

## 備份還原 Node

Quorum 網路各節點啟動後，即可做備份的動作，BDK 備份工具可根據使用者的需求備份個別或全部節點，並將備份壓縮檔存入 `~/.bdk/quorum/backup` 資料夾中，達成多台機器還原環境的功能

### 備份 Node

```bash
# 備份現有的 Node （擇一備份）
bdk quorum backup export --interactive
```

```bash
# 備份所有的 Node
bdk quorum backup export --all
```

### 還原 Node

```bash
# 透過指令還原節點，可在清單中選擇需要還原的備份檔
bdk quorum backup import -i
```

```bash
# 還原後需透過以下指令，來啟動該備份的節點
bdk quorum network up --all
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
bdk quorum cluster apply -i
```
- `What is your cloud provider?` 選擇 `GCP/local`
- `What is your chain id?` 選擇 81712
- `How many validator do you want?` 選擇 4
- `How many member do you want?` 選擇 0
- `Do you already own a wallet?` false

這樣你的本地端的 quorum 網路就建立好了，如需連線及可用 `http://localhost:8545` 做連線
```bash
kubectl port-forward -n quorum svc/goquorum-node-validator-1 8545
```

### Step 3. 刪除 K8S 網路
```bash
bdk quorum cluster delete
```
按 'y' 刪除

## 產出 helm values 和資料於本地
如需直接使用 helm repo 來做 helm release 可利用以下 script
```bash
bdk quorum cluster generate -i
```