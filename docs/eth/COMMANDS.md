# Besu/Quorum 指令文件

(English version)(Work In Progress)

## 目錄

- [Network](#network)
- [Explorer](#explorer)
- [Backup](#backup)
- [Contract](#contract)

## Network

### `bdk eth network add`

Description: 新增 Besu/Quorum Node

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk eth network check`

Description: 確認 Besu/Quorum Node 資訊

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk eth network create`

Description: 產生 Besu/Quorum Network 所需的相關設定檔案並建立網路

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk eth network delete`

Description: 刪除現有的 Besu/Quorum Network

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |

### `bdk eth network down`

Description: 停止現有的 Besu/Quorum Network

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |

### `bdk eth network generate`

Description: 產生 Besu/Quorum Network 所需的相關設定檔案

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk eth network get`

Description: 取得 Besu/Quorum 檔案資訊

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk eth network join`

Description: 選擇現有節點加入 Besu/Quorum Network

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk eth network up`

Description: 啟動現有的 Besu/Quorum Network

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |
| -a, --all             | boolean | 是否啟動所有節點                  |          |         |

## Explorer

### `bdk eth explorer create`

Description: 產生 Besu/Quorum Explorer 所需的相關設定檔案

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答 |          |         |

### `bdk eth explorer delete`

Description: 刪除現有的 Besu/Quorum Explorer.

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |

## Backup

### `bdk eth backup export`

Description: 匯出現有的 Besu/Quorum Network

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |
| -a, --all             | boolean | 是否備份所有資料                  |          |         |

### `bdk eth backup import`

Description: 匯入現有的 Besu/Quorum Network

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

## Cluster

### `bdk eth cluster apply`

Description: 產生 Besu/Quorum Cluster 所需的相關設定檔案並建立網路

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |

### `bdk eth cluster delete`

Description: 刪除現有的 Besu/Quorum Cluster 網路

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk eth cluster generate`

Description: 產生 Besu/Quorum Cluster 所需的相關設定檔案

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

## Contract

### `bdk eth contract compile`

Description: 編譯智能合約

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk eth contract deploy`

Description: 部屬智能合約到 Besu/Quorum Network

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |

### `bdk eth contract get`

Description: 取得Besu/Quorum Network 智能合約地址

|        Options        |  Type   |          Description           | Required | Default |
| --------------------- | :-----: | ------------------------------ | :------: | ------- |
| --help                | boolean | Show help                      |          |         |
| --version             | boolean | Show version number            |          |         |
| -i, --interactive     | boolean | 是否使用 Cathay BDK 互動式問答    |          |         |