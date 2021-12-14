# 貢獻程式 (Contributing)

請在貢獻程式碼前，先透過 issue 、電子郵件或是其他方式與核心團隊討論溝通。

請參閱並遵守本專案的[規範](CODE_OF_CONDUCT.md)

When contributing to BDK project, please first discuss the change you wish to make via issue,
email, or any other method with the maintainers of this repository before making a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

## PR流程 (Pull Request Process)

1. 請確保相依模組/套件與建置檔案已經移除，並且檔案配置符合下方專案結構 (Please ensure any install or build dependencies are removed before starting the process and that your code commits adhere to the project structure)
2. 請更新所有相關的文件檔案，加入程式更新內容，包括新增的環境變數、連接埠、檔案變更及其他參數 (Update the relevant markdown files with details regarding changes to the code, this includes and is not limit to new environment variables, exposed ports, useful file locations and container parameters)
3. 請更新所有文件中的版號，我們使用[SemVer](http://semver.org/)規範 (Increase the version numbers in any example or markdown files to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/))
4. 請參考[PR樣板](.github/PULL_REQUEST_TEMPLATE.md)撰寫說明 (Please draft your pull request in accordance to [this template](.github/PULL_REQUEST_TEMPLATE.md))
5. 在兩位開發者同意後可以將 PR 核准，如果您沒有此操作權限，可以請第二位 reviewer 將其核准 (You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you)

## 專案結構 (Project Structure)

所有專案程式碼都在 src/ 資料夾下，本專案主要開發語言為[Typescript](https://www.typescriptlang.org/)

All project code is located under the src/ folder. The main development language of this repository is [Typescript](https://www.typescriptlang.org/)

- src/command/: (指令處理，不處理程式邏輯) cli interface used for command line interaction and processing, no code logic should be implemented here
- src/service/: (主要程式邏輯處理) main code logic is handled here
- src/model/: (命令提示範本與程式邏輯的type) prompt templates and service types are implemented here
- src/instance/: (網路成員class的定義) network component classes are implemented here
- src/util: (通用邏輯定義) utility functions are defined here
