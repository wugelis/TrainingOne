# GitHub Pages 自動部署流程說明

本文件說明「Claude Code 企業開發實戰」簡報網頁如何透過 GitHub Actions 自動部署到 GitHub Pages。

- **Repo**：https://github.com/wugelis/TrainingOne （公開）
- **網站網址**：https://wugelis.github.io/TrainingOne/
- **部署內容**：僅 `src/` 資料夾（靜態 HTML 簡報）
- **Workflow 檔案**：`.github/workflows/pages.yml`

---

## 1. 整體流程

```
本機修改 src/ ─► git push 到 main ─► GitHub Actions
                                         │
                          ┌──────────────┴──────────────┐
                          ▼                             ▼
                   validate（檢查）  ──通過──►  deploy（發佈 src/ 到 Pages）
                          ▲
            Pull Request 時只執行這一步，不會發佈
```

| 觸發方式 | 執行內容 |
|---|---|
| push 到 `main` | `validate` → `deploy`（上線） |
| 開 Pull Request 到 `main` | 只執行 `validate`（不上線） |
| 在 Actions 頁面手動執行 (`workflow_dispatch`) | `validate` → `deploy` |

只有 `src/**` 或 `.github/workflows/pages.yml` 有變動時才會觸發，修改 PPT、圖片等其他檔案不會重新部署。

### 為什麼用 GitHub Actions 部署？
Pages 的「Deploy from a branch」只能選根目錄 `/` 或 `/docs`，無法直接選 `/src`。使用 Actions 可以直接發佈 `src/`，不必調整資料夾結構。

---

## 2. 專案結構

```
我的服務項目/
├── .github/workflows/pages.yml   # 部署 workflow
├── .gitignore                    # 排除個人文件（PDF、docx 等）
├── GitHub_Page_Workflow_README.md
├── Claude_Code_企業開發實戰.pptx   # PPT 原始檔（公開）
├── Claude Code 企業包班_01.jpg     # 宣傳圖（公開）
└── src/                          # ← 實際發佈到 Pages 的內容
    ├── index.html
    ├── style.css
    ├── script.js
    └── assets/
        ├── photo.png             # 講師圓形照片
        └── qr.png                # Discord QR Code
```

所有資源路徑皆為**相對路徑**，因此放在 `/TrainingOne/` 子路徑下也能正常載入。

---

## 3. Workflow 說明（`pages.yml`）

### 3.1 觸發條件（`on`）
- `push`（僅 `main` 分支，且路徑為 `src/**` 或 workflow 本身）
- `pull_request`（目標為 `main`，同樣的路徑限制）
- `workflow_dispatch`（手動執行）

### 3.2 全域設定
- `permissions: contents: read`：預設最小權限（唯讀）。
- `concurrency`：同一個分支同一時間只保留一個執行；新的推送會取消尚未完成的舊執行，避免部署互相覆蓋。

### 3.3 Job 1：`validate`（檢查）
| 步驟 | 作用 | 失敗時 |
|---|---|---|
| 檢查必要檔案 | 確認 `index.html`、`style.css`、`script.js`、`assets/photo.png`、`assets/qr.png` 都存在 | 失敗，擋住部署 |
| 提醒尚未填寫的占位文字 | 搜尋 `[例：`、`[請填入`、`[實體 / 線上` 等字樣 | 僅顯示警告，不擋部署 |
| 檢查本機連結 | 使用 `lychee --offline` 檢查 HTML 內的相對連結與圖片路徑 | 失敗，擋住部署 |

> 外部連結（例如 Discord 邀請連結）刻意**不檢查**，避免外部網站暫時性錯誤造成誤判。

### 3.4 Job 2：`deploy`（部署）
- 執行條件：非 Pull Request，且分支為 `main`。
- 依賴：`needs: validate`（檢查通過才會執行）。
- 只有這個 Job 取得 `pages: write` 與 `id-token: write` 權限。
- 步驟：
  1. `actions/checkout@v4`：取得程式碼
  2. `actions/configure-pages@v5`：設定 Pages 環境
  3. `actions/upload-pages-artifact@v3`：將 `src/` 打包上傳
  4. `actions/deploy-pages@v4`：發佈，並輸出網站網址

---

## 4. 首次設定（只需做一次）

### 4.1 啟用 Pages
**方式 A：網頁操作**
Repo → Settings → Pages → Build and deployment → Source 選 **GitHub Actions**

**方式 B：指令**
```bash
gh api -X POST repos/wugelis/TrainingOne/pages -f build_type=workflow
```

> 若尚未啟用就推送，`deploy` 會在 `actions/configure-pages` 這一步失敗，這是正常現象。啟用後重新執行即可。

### 4.2 重新執行失敗的部署
```bash
gh run list -R wugelis/TrainingOne --limit 3        # 取得 run id
gh run rerun <run-id> -R wugelis/TrainingOne --failed
```
也可以在 GitHub 的 Actions 頁籤點選失敗的執行，按 **Re-run failed jobs**。

---

## 5. 日常作業流程

1. 修改 `src/` 內的檔案，直接用瀏覽器開啟 `src/index.html` 預覽。
2. 提交變更（**請逐一指定檔案，不要用 `git add .`**，見第 7 節）：
   ```bash
   git add src/index.html src/style.css
   git commit -m "更新課程資訊"
   git push
   ```
3. 到 repo 的 **Actions** 頁籤查看進度，約 1 分鐘後網站更新。
4. （建議）重大修改先開分支與 Pull Request，確認 `validate` 通過後再合併。

### 回滾
網站出問題時，還原有問題的 commit 後重新推送即可，會自動重新部署：
```bash
git revert <commit-hash>
git push
```

---

## 6. 簡報網頁操作方式

| 操作 | 方式 |
|---|---|
| 下一頁 | `→`、`PageDown`、空白鍵、`Enter`，或手機向左滑 |
| 上一頁 | `←`、`PageUp`、`Backspace`，或手機向右滑 |
| 第一頁 / 最後一頁 | `Home` / `End` |
| 全螢幕 | `f` |
| 直接開某一頁 | 網址加 `#3`，例如 `.../TrainingOne/#3` |

---

## 7. 公開 Repo 注意事項

此 repo 為**公開**，推送前請確認內容皆可公開。

- `.gitignore` 已排除：`*.pdf`、`*.docx`、`*.doc`、`*.xlsx`，以及兩個原始素材圖片（`企業.NET系統品質補助開發顧問服務.jpg`、`顧問服務到底在幹什麼？.png`）。
- 刻意公開的檔案：`Claude_Code_企業開發實戰.pptx`、`Claude Code 企業包班_01.jpg`。
- **請避免使用 `git add .` / `git add -A`**，以免誤加入個人簡歷或定價草稿。
- `.gitignore` 對**已追蹤**的檔案無效。已追蹤的檔案若要停止追蹤：
  ```bash
  git rm --cached <檔名>
  ```
  但檔案仍會留在 git 歷史紀錄中，如需完全清除須改寫歷史（例如 `git filter-repo`）。

---

## 8. 疑難排解

| 現象 | 原因 | 解法 |
|---|---|---|
| `deploy` 在 `configure-pages` 失敗 | Pages 尚未啟用 | 依 4.1 啟用 Pages，再重新執行 |
| `validate` 失敗：找不到必要檔案 | `src/` 內檔案被刪除或改名 | 補回檔案，或更新 workflow 中的檔案清單 |
| `validate` 失敗：lychee 回報連結錯誤 | HTML 內有壞掉的圖片或相對連結 | 依訊息修正路徑 |
| `git push` 回 `HTTP 400`、`unexpected disconnect` | 推送資料超過 git 預設緩衝區（1 MB）或憑證問題 | 執行 `git config --global http.postBuffer 524288000`；必要時以 `gh` 提供憑證：`git -c credential.helper='!gh auth git-credential' push` |
| 網站顯示舊內容 | 瀏覽器快取或部署尚未完成 | 確認 Actions 已成功，並強制重新整理（`Cmd+Shift+R`） |
| 網站出現 404 | Pages 未啟用，或第一次部署尚未完成 | 確認 Settings → Pages 狀態與 Actions 結果 |
| 字型顯示不同 | Google Fonts 被擋或離線 | 會自動退回系統字型（PingFang TC、微軟正黑體） |

---

## 9. 待辦事項

- [ ] 第 4 張投影片「課程形式」仍為占位文字（課程時數、授課方式、人數上限），請在 `src/index.html` 填入實際資訊。
- [ ] （可選）自訂網域：在 `src/` 放入 `CNAME` 檔，並於網域商設定 DNS。
- [ ] （可選）手機直拿版型：目前為固定 16:9 縮放，可另做直向捲動的響應式版本。
