# Travelalltheworld

旅遊行程與地點收藏單頁 App，部署於 GitHub Pages。旅程資料儲存在瀏覽器，可在「分享與資料」匯出 JSON 備份。

## Google 地點搜尋設定

1. 在既有 Google Cloud 帳單帳戶底下建立獨立專案，啟用 **Maps JavaScript API** 與 **Places API (New)**。
2. 建立專供網站使用的 API 金鑰，設定「應用程式限制 → 網站」：`https://bai-qi-laundering.github.io/*`。設定「API 限制」只允許上面兩項 API。
3. 在 Google Maps Platform 的配額頁為該專案設定保守的用量限制。一般預算提醒不會停止 API 請求。
4. 在公開網站的「地點收藏 → Google 地點設定」輸入這支受限制的金鑰。金鑰僅存於該瀏覽器的 localStorage，不會進入 GitHub 原始碼或 JSON 備份。瀏覽器請求仍會公開金鑰，因此網域與 API 限制不可省略。

啟用後，匯入的店名會以 Google Places Text Search 查詢。名稱與門牌明確相符時自動連結 Google Place ID；結果有歧義則留待使用者按 ⌖ 選擇。已比對的 Google 地點顯示在 Google 地圖上，照片及評分從本次頁面的 Google 結果呈現。照片網址、評分、營業時間與 Google 座標不寫入備份或 localStorage；再次開啟頁面時會重新取得資料，因此可能產生額外請求。只有 Place ID 長期保留。

未設定金鑰時，既有 OpenStreetMap 地圖與手動搜尋方式仍可使用。公開貼文讀取使用 Jina Reader，連結無法讀取時可貼內文或手動輸入店名。Google Maps Platform 依 SKU 用量計費，請在 Cloud Billing 報表查看實際使用量。

## 帳號、跨裝置同步與 LINE 邀請

靜態 GitHub Pages 本身沒有資料庫；此功能使用 Firebase Authentication（Email／密碼）與 Cloud Firestore。啟用前，既有本機資料和匯出 JSON 功能照常使用。**啟用雲端前，先在原本有資料的瀏覽器匯出 JSON。**

1. 到 Firebase Console 建立專案（可使用同一 Google Cloud 帳單帳戶），加入 Web app，取得網頁設定物件。Firebase 網頁設定不是 Google Places 金鑰，也不是管理員私密金鑰。
2. Authentication → Sign-in method 啟用 Email/Password；Authentication → Settings → Authorized domains 加入 `bai-qi-laundering.github.io`。
3. 建立 Cloud Firestore 資料庫；到 Firestore → Rules 將 `firestore.rules` 全文貼入並發布。**不要使用測試模式的開放規則。**
4. 把 Firebase 網頁設定物件填入 `firebase-config.js` 的 `window.TRAVEL_FIREBASE_CONFIG`，發布到 GitHub Pages。設定物件內通常有 `apiKey`、`authDomain`、`projectId`、`appId`，可含 `messagingSenderId`。Firebase 網頁設定公開是預期行為，資料讀寫由 Firestore 規則及登入狀態保護。
5. 原本有收藏的瀏覽器登入 →「將目前資料存到雲端」。其他瀏覽器或主畫面 App 用**同一帳號**登入，點選雲端旅程。點「LINE 邀請旅伴」並透過 iPhone 分享選 LINE；朋友登入或註冊後開邀請連結即可加入共同編輯。

Google Places 金鑰仍只存放在每個瀏覽器自己的 localStorage，請在每個裝置分別設定。邀請連結如同入場券，持有連結並登入者都可加入；目前沒有移除成員或撤銷邀請的介面，避免分享給不信任的人。Firestore 以整份旅程文件同步，同時編輯同一項可能以最後寫入者為準。請定期匯出 JSON 備份，並留意 Firebase 用量與配額。
