# 使用範例
(English version)(Work In Progress)

## 目錄
- [建立 Blockchain network](#建立-blockchain-network)
- [部署 Chaincode](#部署-chaincode)

## 建立 Blockchain network

Quorum 無須做過多的前置設定，只需確認 bdk 套件是否安裝完成即可。

```bash
bdk hello
```

如果指令已順利安裝，你會看到 `You have installed bdk successfully!!!` 

### 建立 Network

輸入指令，啟動 Quorum 網路互動式介面

```bash
bdk quorum network create -i
```

依序輸入 chain id (預設為1337)、validator 以及 member 的數量，以及填入自己的錢包，如無填入(選擇 false )，則會提供一組公私鑰來作為使用 Quorum 網路的帳號，該組帳號會在創始區塊擁有代幣。

### 建立 Blockscout Explorer

輸入指令，啟動 Blockscout 區塊鏈瀏覽器

```bash
bdk quorum explorer create -i
```

輸入 port ，並稍待片刻，即可使用區塊鏈瀏覽器