# 使用範例
(English version)(Work In Progress)

## 目錄
- [建立 Blockchain network](#建立-blockchain-network)
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

依序輸入 chain id (預設為1337)、validator 以及 member 的數量，以及填入自己的錢包，如無填入(選擇 false )，則會提供一組公私鑰來作為使用 Quorum 網路的帳號，該組帳號會在創始區塊擁有代幣

### 建立 Blockscout Explorer

輸入指令，啟動 Blockscout 區塊鏈瀏覽器

```bash
bdk quorum explorer create -i
```

輸入 port ，並稍待片刻，即可使用區塊鏈瀏覽器

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