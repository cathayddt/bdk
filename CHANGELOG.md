# Changelog

這份文件將記錄 BDK 專案的變更日誌

All notable changes to BDK project will be documented here.

[1.0.0]: https://github.com/cathayddt/bdk/releases/tag/v1.0.0

[1.0.1]: https://github.com/cathayddt/bdk/releases/tag/v1.0.1

[1.0.2]: https://github.com/cathayddt/bdk/releases/tag/v1.0.2

[1.0.3]: https://github.com/cathayddt/bdk/releases/tag/v1.0.3

[1.0.4]: https://github.com/cathayddt/bdk/releases/tag/v1.0.4

## [1.0.4][1.0.4] - 2022-02-

### new

- Unit test (#47)

### changed

- Refactor: computeUpdateConfigTx (#54)
- Refactor: rename updateAnchorPeerSteps fetchChannelBlock to fetchChannelConfig (#55)
- Refactor: remove createChannelConfigSteps (#57)
- Refactor: channelService fetchChannelConfig have default signType value (#58)

### fixed

- Fix bug: should createChannelArtifactFolder before convertChannelConfigtxToTx (#56)

## [1.0.3][1.0.3] - 2022-01-24

### new

- Discover for `bdk chaincode approve`, `bdk chaincode commit`, and `bdk chaincode invoke` #48

### fixed

- ICA expiry time #41
- approve and update don't use arrow function #45

## [1.0.2][1.0.2] - 2022-01-03

### new

- Add CICD workflows with sonarqube #12
- New command: `bdk org peer add-system-channel` #18
- New command: `bdk channel decode-envelop` #42

### changed

- Upgrade package-lock.json to lockfileVersion 2 #15
- Fix npm link step in "npm run start:dev" && "npm run build:console" #16
- Replace 'config-yaml/configtxOrgs.json' with 'config-yaml/orgs/[peer/orderer]-[orgName].json #17
- Logger output level "stdout" "stderr" #30
- Rewrite integration script #32
- Integration command: `bdk peer/orderer approve/update` to `bdk channel approve/update` #37

### fixed

- Fix dockerode pull issue #10
- Fix Document #11 #14 #26
- Fix bug: command use 'peer' rather than OrgTypeEnum.PEER #19
- Fix: orderer/peer up & down need hostname.toLowerCase() #27
- Fix connection config profile  #28
- Fix command: `bdk explorer` #29
- Fix `bdk network create` generate file `org definition json` #44

## [1.0.1][1.0.1] - 2021-11-29

### new

- Add CICD workflows

### changed

- Docker image prerequisites

### fixed

- Fix ca file permission issues

## [1.0.0][1.0.0] - 2021-11-02

### new

- 初始專案原始碼 (Initial project code)

<!-- Template -->
<!--
## [X.X.X][X.X.X] - YYYY-MM-DD
### new
- CU-xxxxxx 中文敘述 (english description)
### changed
- CU-xxxxxx 中文敘述 (english description)
### fixed
- CU-xxxxxx 中文敘述 (english description)

[X.X.X]: https://link-to-release-X.X.X
 -->
