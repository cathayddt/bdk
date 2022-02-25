# Blockchain Deployment Kit

提供指令快速建立、管理、監控 hyperledger fabric blockchain，最大的特色是可以使用互動式的問答，讓使用者可以依續性的問答來完成指令所需要的指令，在每個 BDK 指令的後面，加入 `-i` 或是 `--interactive` 的參數，來使用互動式問答

BDK streamlines the normally complicated process of creating a Hyperledger Fabric blockchain with command-line tools and npm packages. Creating, managing, monitoring a blockchain network has never been easier. We support interactive prompts which can be triggered with `-i` or `--interactive` behind all cli commands

e.g.

```bash
bdk network create -i
```

![bdk network create -i](images/bdk-network-create.gif)
![bdk channel create -i](images/bdk-channel-create.gif)

## 版本 (Releases)

|      Latest      |      Stable      |
| ---------------- | ---------------- |
| [v1.0.4][v1.0.4] | [v1.0.4][v1.0.4] |

[v1.0.3]: https://github.com/cathayddt/bdk/releases/tag/v1.0.3

[更新內容 (Changelog)](CHANGELOG.md)

## 文件 (Documentation)

- 指令文件 CLI Documentation (Work in Progress)
- [使用範例 (Examples)](docs/EXAMPLE.md)
- [核心API文件 (Core API Documentation)](link-to-api-documentation)
- [開發指南 (Contributing)](CONTRIBUTING.md)
- [資安通報 (Security Issues)](SECURITY.md)

## 安裝流程 (Getting Started)

### 環境 (Prerequisites)

- [npm + nodejs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) node >= 12 npm >= 6
- [docker](https://docs.docker.com/engine/install)
- [docker-compose](https://docs.docker.com/compose/install) >= 1.27
- eslint (vscode plugin, dev-only)

### 主程式安裝 (Installation)

#### 直接安裝 (Direct Install)

```bash
npm config set @cathayddt:registry=https://npm.pkg.github.com

# https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
npm config set //npm.pkg.github.com/:_authToken=[SET-YOUR-TOKEN]

npm install -g @cathayddt/bdk@latest

# 初始化 (initialize)
bdk config init
```

#### 從原始碼安裝 (Install from Source)

```bash
git clone https://github.com/cathayddt/bdk.git
cd bdk

npm install

npm run build:console
```

## 設定 (Configuration)

### 設定自動完成 (Configure AutoComplete)

```bash
bdk completion
```

腳本 (script source is as follows)

```bash
###-begin-bdk-completions-###
#
# yargs command completion script
#
# Installation: bdk completion >> ~/.zshrc
#    or bdk completion >> ~/.zsh_profile on OSX.
#
_bdk_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" bdk --get-yargs-completions "${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _bdk_yargs_completions bdk
###-end-bdk-completions-###
```

## Hello BDK

使用以下的指令，可以確認 BDK 已安裝完成並且可以開始操作使用

Use the following command to verify that BDK has completed installation and is now ready to be used.

```bash
bdk hello
```

## 建立一個 Test Network (Create a test network)

使用以下指令，可以建立一個簡單的 Hyperledger Fabric 網路

Use the following command to create a simple Hyperledger Fabric Network.

```bash
  bdk network create --test-network
```

## LICENSE

[Apache2.0](LICENSE)
