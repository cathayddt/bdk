# 使用範例
(English version)(Work In Progress)

## 目錄
- [建立 Blockchain network](#建立-blockchain-network)
- [加入 Remote 節點](#加入-remote-節點)
- [備份還原 Node](#備份還原-node)

## 建立 Blockchain network

Quorum 無須做過多的前置設定，只需確認 BDK 套件是否安裝完成即可

```bash
bdk hello
```

如果指令已順利安裝，你會看到 `You have installed bdk successfully!!!` 

### 建立 Network

輸入指令，啟動 Quorum 網路互動式介面

```bash
bdk quorum network create -i
```

依序輸入 chain id (預設為 81712)、validator 以及 member 的數量，以及填入自己的錢包，如無填入(選擇 false )，則會提供一組公私鑰來作為使用 Quorum 網路的帳號，該組帳號會在創始區塊擁有代幣

### 建立 Blockscout Explorer

輸入指令，啟動 Blockscout 區塊鏈瀏覽器

```bash
bdk quorum explorer create -i
```

輸入 port ，並稍待片刻，即可使用區塊鏈瀏覽器

## 加入 Remote 節點

Validator 以及 Member 節點的加入流程相同，此處以 Validator 為例。

範例情境：建立擁有三個 Validator 節點的 Quorum 網路，且三個節點分別建置在不同機器，`需確認機器之間的 Port 30303 (Validator) 或 Port 30403 (Member) 有互相開放`。

### 建立 Network

首先於第一台機器上建立 Validator 數量為 1，Member 數量為 0 的 Quorum 網路。

```bash
bdk quorum network create -i
```

### 產生 Node 設定檔，取得 enodeInfo

接著分別於第二台及第三台機器透過 `bdk quorum network generate -i` 指令建立 Validator 數量為 1，Member 數量為 0，產生 Quorum Network 所需的相關設定檔案。

隨後使用 `bdk quorum network get -i` 取得剛產生的節點 `enodeInfo` 保留下來。

### 新增節點

進到第一台機器輸入 `bdk quorum network add -i` ，選擇 `remote`、`validator`，填入第二個節點的 `enodeInfo`、第二台機器的 `IP Address`。

輸入 `bdk quorum network get -i`，取得 `genesis.json`、`static-nodes.json` 這兩項資訊並保留下來。

### 加入網路

進到第二台機器輸入 `bdk quorum network join -i` ，選擇要加入的節點，並依序輸入第一台機器的 `IP Address`、`genesis.json`、`static-nodes.json` 資訊後，第二個節點便可順利加入網路。

欲加入第三台機器的節點，則需在第一台及第二台機器完成前述 `新增節點` 的動作，再於第三台機器完成 `加入網路`，第三個節點便可順利加入網路。

### 確認節點狀態

加入網路後，可透過 `bdk quorum network check -i` 指令，確認節點狀態：
- `isValidator`： 確認節點是否為 Validator，此處三個節點都應回傳 `true`。
- `getValidator`： 獲取 Validator 清單，此處應回傳包含三個 Validator 的地址。
- `peerCount`： 確認節點連接數，此處每個節點應回傳 `2`。
- `chainId`：鏈 ID，此處預設應回傳 `81712`。

## 備份還原 Node

Quorum 網路各節點啟動後，即可做備份的動作，BDK 備份工具可根據使用者的需求備份個別或全部節點，並將備份壓縮檔存入 `~/.bdk/quorum/backup` 資料夾中，達成多台機器還原環境的功能

### 備份現有的 Node （擇一備份）

```bash
bdk quorum backup export --interactive
```

### 備份所有的 Node

```bash
bdk quorum backup export --all
```

### 還原 Node

透過 `bdk backup` 指令還原節點，可在清單中選擇需要還原的備份檔

```bash
bdk quorum backup import -i
```

還原後需透過以下指令，來啟動該備份的節點

```bash
bdk quorum network up --all
```