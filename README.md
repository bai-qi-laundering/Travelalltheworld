# Travelalltheworld

旅遊行程與地點收藏單頁 App，部署於 GitHub Pages。旅程資料儲存在瀏覽器，可在「分享與資料」匯出 JSON 備份。

## Google 地點搜尋設定

1. 在既有 Google Cloud 帳單帳戶底下建立獨立專案，啟用 **Maps JavaScript API** 與 **Places API (New)**。
2. 建立專供網站使用的 API 金鑰，設定「應用程式限制 → 網站」：`https://bai-qi-laundering.github.io/*`。設定「API 限制」只允許上面兩項 API。
3. 在 Google Maps Platform 的配額頁為該專案設定保守的用量限制。一般預算提醒不會停止 API 請求。
4. 在公開網站的「地點收藏 → Google 地點設定」輸入這支受限制的金鑰。金鑰僅存於該瀏覽器的 localStorage，不會進入 GitHub 原始碼或 JSON 備份。瀏覽器請求仍會公開金鑰，因此網域與 API 限制不可省略。

啟用後，匯入的店名會以 Google Places Text Search 查詢。名稱與門牌明確相符時自動連結 Google Place ID；結果有歧義則留待使用者按 ⌖ 選擇。已比對的 Google 地點顯示在 Google 地圖上，照片及評分從本次頁面的 Google 結果呈現。照片網址、評分、營業時間與 Google 座標不寫入備份或 localStorage；再次開啟頁面時會重新取得資料，因此可能產生額外請求。只有 Place ID 長期保留。

未設定金鑰時，既有 OpenStreetMap 地圖與手動搜尋方式仍可使用。公開貼文讀取使用 Jina Reader，連結無法讀取時可貼內文或手動輸入店名。Google Maps Platform 依 SKU 用量計費，請在 Cloud Billing 報表查看實際使用量。

## 個人 Google 雲端備份

不使用 Firebase。旅程由瀏覽器保留本機副本，使用者授權後寫入**自己的 Google Drive 隱藏應用程式資料區**（appDataFolder）。這個資料夾不會顯示在一般雲端硬碟檔案列表，也不會共享給朋友。PDF 行程與分帳單是單獨匯出的檔案，可透過 iPhone 分享選 LINE。

1. 在 Google Cloud Console 中的同一專案啟用 **Google Drive API**。
2. 設定 OAuth 同意畫面（Google Auth Platform），應用程式名稱、聯絡方式與範圍 `https://www.googleapis.com/auth/drive.appdata`；若應用程式仍是「測試中」，加入自己 Google 帳號作為測試使用者。
3. 建立 **OAuth 用戶端 ID → 網頁應用程式**，已授權的 JavaScript 來源填 `https://bai-qi-laundering.github.io`（只有來源，沒有專案路徑或結尾斜線）。
4. 把產生的 **用戶端 ID** 放入 `drive-config.js` 的 `window.TRAVEL_DRIVE_CLIENT_ID`。OAuth 用戶端 ID 可以公開；**不要放 OAuth 用戶端密碼或 Google Places API 金鑰**。
5. 在原本有收藏的瀏覽器先「匯出 JSON」留底，再「連接我的 Google 雲端 → 將目前資料存到雲端」。主畫面 App 或另一瀏覽器連接同一 Google 帳號後選「從雲端載入」。只有選定版本後才會開啟自動備份。

瀏覽器版 Google 授權權杖會到期，而且主畫面 App 與 Safari 的登入空間不同。重新開啟頁面後可能需要點一次「連接我的 Google 雲端」；沒有連接時修改仍會存到目前瀏覽器，重連後先決定要載入雲端或上傳本機。兩台裝置同時修改不同副本不會自動合併，選上傳會覆蓋雲端，請先確認。Google Places 金鑰仍各裝置自行設定，不會寫入 Drive。

PDF 功能使用瀏覽器生成行程表或分帳單，支援 iPhone 分享檔案；若分享介面不可用會下載 PDF，再從「檔案」App 分享到 LINE。正式 Google OAuth 連線及 iPhone PDF 分享需在填入用戶端 ID 後實機測試。
