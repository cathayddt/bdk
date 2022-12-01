# Quorum 指令文件

(English version)(Work In Progress)

## 目錄

- [Network](#network)
- [Explorer](#explorer)
- [Backup](#backup)

## Network

### `bdk quorum network create`

Description: 產生 Quorum network 所需的相關設定檔案

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk quorum network delete`

Description: 刪除現有的 Quorum Network.

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |

### `bdk quorum network up`

Description: 啟動現有的 Quorum Network.

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |
| -a, --all             | boolean | 是否啟動所有節點                  |          |         |

### `bdk quorum network down`

Description: 停止現有的 Quorum Network.

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |

## Explorer

### `bdk quorum explorer create`

Description: 產生 Quorum Explorer 所需的相關設定檔案

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答 |          |         |

### `bdk quorum explorer delete`

Description: 刪除現有的 Quorum Explorer.

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |

## Backup

### `bdk quorum backup export`

Description: 匯出現有的 Quorum Network.

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |
| -a, --all             | boolean | 是否備份所有資料                  |          |         |

### `bdk quorum backup import`

Description: 匯入現有的 Quorum Network.

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |
