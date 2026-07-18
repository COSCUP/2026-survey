# COSCUP 2026 Registration Insights

COSCUP × UbuCon Asia 2026 報名資料的單頁視覺化網站。網站是純靜態 Vite / React 專案，
由 GitHub Pages 部署，開啟時會讀取固定的 Google Sheet JSON 網址，並每 5 分鐘重新同步。

## 推薦的資料架構

```text
Google Sheet 報名資料
        ↓ Apps Script 只做彙總
固定 /exec JSON 網址
        ↓ 網頁開啟時讀取
GitHub Pages 視覺化
```

Apps Script 只輸出各圖表的統計數字，不輸出逐筆回答。這比「將整張 Sheet 發佈為 CSV」安全，
因為 GitHub Pages 與任何可由網頁直接讀取的 Google 網址通常都是公開的。

## 設定 Google Sheet 自動更新

1. 在 Google Sheet 建立名為「報名資料」的工作表，欄位名稱保留從報名系統匯出的原始標題。
2. 開啟「擴充功能 → Apps Script」。
3. 將 [google-apps-script/Code.gs](google-apps-script/Code.gs) 貼到 `Code.gs`，確認 `SHEET_NAME` 符合工作表名稱。
4. 按「部署 → 新增部署 → 網路應用程式」：
   - 執行身分：我
   - 具有存取權的使用者：所有人
5. 複製結尾為 `/exec` 的網址，在瀏覽器開啟一次，確認看到 JSON。
6. 編輯 `public/data-source.json`：

```json
{
  "url": "https://script.google.com/macros/s/xxxxxxxx/exec",
  "format": "json"
}
```

7. 提交並 push 這個設定。此後只要更新 Google Sheet，網站就會在下次開啟或 5 分鐘輪詢時取得新數字，不需重新部署。

## 網站的開放資料介接

網站底部有「開放資料」區塊，使用同一個 Apps Script 網址提供兩種彙總格式：

- JSON：`https://script.google.com/macros/s/xxxxxxxx/exec?format=json`
- CSV：`https://script.google.com/macros/s/xxxxxxxx/exec?format=csv`

CSV 採長表格式，欄位為 `dataset,label,value,detail,updated_at`。兩個網址都只包含彙總數字，
可供社群程式、試算表、筆記本與其他視覺化專案介接。

### 若確定要用公開 CSV

網站也支援 Google Sheet「發佈到網路」產生的 CSV：

```json
{
  "url": "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv",
  "format": "csv"
}
```

只有在該工作表完全沒有個人資料、時間軌或不適合公開的逐筆回答時，才應使用此方式。

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
