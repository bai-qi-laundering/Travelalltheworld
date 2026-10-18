# Travelalltheworld

旅行規劃網頁 App。收藏地點、安排每日景點、紀錄班機及景點間交通時間與費用，並依旅伴與記帳時的自訂匯率結算。

## 使用方式

開啟 GitHub Pages 網站。先在「旅程設定」填出發日期和天數；把景點加入收藏，確認地址與位置，再排進每日行程。班機與交通可以記錄時間、費用和付款人；記帳分帳會合併計算。貼文匯入支援貼上文字，一行一間店；Google Maps 地點網址及含 `name` 欄位的 CSV 也可匯入。匯入的候選地點應由使用者確認。

所有資料儲存在瀏覽器 localStorage。跨裝置請由「分享備份」匯出 JSON，再在另一裝置匯入；分享文字只供閱讀，**沒有即時多人同步**。沒有伺服器或 API 金鑰，社群貼文網址本身不會自動取得貼文內容，也不會直接讀取 Google Maps 私人收藏清單。可使用 Google Takeout 匯出資料、整理成 CSV 後匯入，或貼上店名／地圖網址。

地圖使用 Leaflet 與 OpenStreetMap 瓦片；「搜尋位置」按下後呼叫 OpenStreetMap Nominatim。請確認搜尋結果是否為正確分店。Google Maps 路線按行程順序產生，交通時間與費用由使用者記錄，不宣稱即時交通預估。

## 發布

`index.html` 位於倉庫根目錄。倉庫內的 Pages workflow 會在推送到 `main` 時部署。若 GitHub Pages 尚未啟用，前往 **Settings → Pages**，在 **Build and deployment** 選擇 **GitHub Actions**。網站網址為 [bai-qi-laundering.github.io/Travelalltheworld/](https://bai-qi-laundering.github.io/Travelalltheworld/)。

## 下一步

要讓 LINE 邀請連結讓旅伴同步編輯、讀取 Google Takeout 多種格式、從社群網址擷取全文或做即時路線最佳化，需要後端服務、使用者權限及相應資料來源／API。
