# COSCUP 2026 Registration Insights

COSCUP × UbuCon Asia 2026 報名資料的單頁視覺化網站。網站是純靜態 Vite / React 專案，
由 GitHub Pages 部署，開啟時會讀取固定的 Google Sheet JSON 網址，並每 5 分鐘重新同步。

## 推薦的資料架構

```text
KKTIX 完整 CSV（私人，含姓名與 Email）
        ↓ 放入指定 Google Drive 資料夾
Apps Script 每 15 分鐘匯入最新完整快照
        ↓
私人 Google Sheet「報名資料」
        ├─ 預設 /exec：彙總 JSON，供網站圖表讀取
        └─ /exec?view=raw：移除姓名與 Email 的逐筆開放資料
```

Google Sheet 保留完整的私人來源資料，但公開端點不輸出姓名與 Email。程式另有敏感欄名防護，
並會遮蔽逐筆內容中意外出現的 Email、手機與身分證格式。不要直接使用 Google Sheet 的
「發佈到網路」，因為那會繞過這層公開資料過濾。

## 設定 Google Sheet 自動更新

1. 建立目標 Google Sheet，以及一個只供工作人員使用的 Google Drive 匯入資料夾。
2. 開啟「擴充功能 → Apps Script」。
3. 將 [google-apps-script/Code.gs](google-apps-script/Code.gs) 貼到 `Code.gs`。
4. 設定檔案開頭的兩個值：

```js
const TARGET_SPREADSHEET_ID = "Google Sheet 網址 /d/ 後面的 ID";
const KKTIX_IMPORT_FOLDER_ID = "Google Drive 資料夾網址 /folders/ 後面的 ID";
```

5. 在 Apps Script 函式選單手動執行一次 `importLatestKktixCsv` 並授權，確認「報名資料」分頁已更新。
6. 再手動執行一次 `installKktixImportTrigger`。此後每 15 分鐘會檢查資料夾內最新的 CSV。
7. 若已經有 `/exec` 網址，按「部署 → 管理部署 → 編輯 → 新增版本 → 部署」；初次設定才使用「新增部署 → 網路應用程式」：
   - 執行身分：我
   - 具有存取權的使用者：所有人
8. 複製結尾為 `/exec` 的網址，在瀏覽器開啟一次，確認看到彙總 JSON。
9. 編輯 `public/data-source.json`：

```json
{
  "url": "https://script.google.com/macros/s/xxxxxxxx/exec",
  "format": "json"
}
```

10. 提交並 push。網站會在開啟或 5 分鐘輪詢時取得最新數字，不需重新部署。

### 每次從 KKTIX 更新

KKTIX 匯出檔視為「目前全部報名資料」的完整快照，因此匯入會取代「報名資料」分頁，
不會直接附加以免重複。最簡單的流程是安裝 Google Drive 電腦版，把瀏覽器下載位置設為上述
同步資料夾；也可以下載後手動移入該 Drive 資料夾。新檔案出現後，最晚約 15 分鐘自動匯入。

若同一個 Drive 檔案被更新內容，程式會比較檔案 ID、修改時間與大小後重新匯入。

## 網站的開放資料介接

網站底部「開放資料」使用同一個 Apps Script 網址，提供移除姓名與 Email 後的逐筆資料：

- JSON：`https://script.google.com/macros/s/xxxxxxxx/exec?view=raw&format=json`
- CSV：`https://script.google.com/macros/s/xxxxxxxx/exec?view=raw&format=csv`

JSON 是一筆報名一個物件的陣列；CSV 保留 KKTIX 問卷欄位。兩種格式都不包含姓名與 Email，
可供社群程式、試算表、筆記本與其他視覺化專案介接。

圖表用彙總端點仍為：

- JSON：`https://script.google.com/macros/s/xxxxxxxx/exec?format=json`
- CSV：`https://script.google.com/macros/s/xxxxxxxx/exec?format=csv`

不要將私人 Google Sheet 直接發佈到網路。

## GitHub Pages 部署

`.github/workflows/pages.yml` 會在 `main` 每次 push 時執行測試、建置並部署 `dist/`。

第一次需在 GitHub 倉庫開啟：

1. `Settings → Pages`
2. `Build and deployment → Source`
3. 選擇 `GitHub Actions`

注意：GitHub Pages 網站預設是公開的；私人倉庫是否能開啟 Pages 取決於 GitHub 方案與組織政策。

## 本機開發

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

- `npm run build`：產生 GitHub Pages 靜態檔案。
- `npm test`：驗證靜態部署、Google Sheet 資料流與 CSV 解析。
- `npm run lint`：執行 ESLint。
