# 安全性通報流程 (Security Policies and Procedures)

本文件規範 BDK 專案的安全性問題處理原則

This document outlines security procedures and general policies for the BDK
project.

- [漏洞通報 (Reporting a Bug)](#reporting-a-bug)
- [資訊揭露 (Disclosure Policy)](#disclosure-policy)

## 漏洞通報 (Reporting a Bug)

BDK 團隊嚴肅看待所以資安漏洞並由衷感謝您增進 BDK 的安全性與即時的漏洞通報。

請以 email 形式向 [核心團隊](MAINTAINERS.md) 通報安全性漏洞

收到您的電子郵件的 maintainer 將在48小時內回覆您的電子郵件，並說明更進一步的處理措施。在收到我們的初步回覆後，我們的團隊將盡快修復與公佈進展情況，並可能要求您提供額外的資訊。

若是該模組不是由我們團隊所管理，請將漏洞通報給相對應的組織。

The BDK team and community take all security bugs in BDK seriously. Thank you for improving the security of BDK. We appreciate your efforts and responsible disclosure and will make every effort to acknowledge your contributions.

Report security bugs by emailing the [核心團隊](MAINTAINERS.md).

The maintainer who receives your email will acknowledge your email within 48 hours, and will send a more detailed response within 48 hours indicating the next steps in handling your report. After the initial reply to your report, our team will endeavor to keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

Report security bugs in third-party modules to the person or team maintaining the module.

## 資訊揭露 (Disclosure Policy)

當 BDK 的團隊收到漏洞通報，他將被分配給一位主要處理人，其將協調處理進度並進行以下步驟:

- 確認問題以及受影響版本
- 檢查原始碼並找出相似問題
- 修復所有還在維護中的版本，並盡快將其釋出

When our team receives a security bug report, it will assign it to a primary handler. This person will coordinate the fix and release process, involving the following steps:

- Confirm the problem and determine the affected versions.
- Audit code to find any potential similar problems.
- Prepare fixes for all releases still under maintenance. These fixes will be released as fast as possible.
