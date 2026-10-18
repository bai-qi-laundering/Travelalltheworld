# Travelalltheworld

旅遊行程與地點收藏單頁 App，部署於 GitHub Pages。旅程資料儲存在瀏覽器，可在「分享與資料」匯出 JSON 備份。

## Google 地點搜尋設定

1. 在既有 Google Cloud 帳單帳戶底下建立獨立專案，啟用 **Maps JavaScript API** 與 **Places API (New)**。
2. 建立專供網站使用的 API 金鑰，設定「應用程式限制 → 網站」：`https://bai-qi-laundering.github.io/*`。設定「API 限制」只允許上面兩項 API。
3. 在 Google Maps Platform 的配額頁為該專案設定保守的用量限制。一般預算提醒不會停止 API 請求。
4. 在公開網站的「地點收藏 → Google 地點設定」輸入這支受限制的金鑰。金鑰僅存於該瀏覽器的 localStorage，不會進入 GitHub 原始碼或 JSON 備份。瀏覽器請求仍會公開金鑰，因此網域與 API 限制不可省略。

啟用後，匯入的店名會以 Google Places Text Search 查詢。名稱與門牌明確相符時自動連結 Google Place ID；結果有歧義則留待使用者按 ⌖ 選擇。已比對的 Google 地點顯示在 Google 地圖上，照片及評分從本次頁面的 Google 結果呈現。照片網址、評分、營業時間與 Google 座標不寫入備份或 localStorage；再次開啟頁面時會重新取得資料，因此可能產生額外請求。只有 Place ID 長期保留。

未設定金鑰時，既有 OpenStreetMap 地圖與手動搜尋方式仍可使用。公開貼文讀取使用 Jina Reader，連結無法讀取時可貼內文或手動輸入店名。Google Maps Platform 依 SKU 用量計費，請在 Cloud Billing 報表查看實際使用量。
