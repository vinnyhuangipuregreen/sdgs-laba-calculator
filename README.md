# 臘八粥食材試算表

BLIA SDGs 社會影響力系統「智慧工具箱」的第一個工具，使用 React、TypeScript、Vite 與 Tailwind CSS。

- [開啟試算表](https://sdgs-action-platform.vercel.app/tools/laba)
- [返回智慧工具箱](https://sdgs-action-platform.vercel.app/#food)

本儲存庫保存完整原始碼：`src/`、`public/`、`tests/` 及建置設定。支援人數／水量連動試算、食材採買清單、兩種計量單位、SOP 計時及 LINE 清單複製。BOM 已備妥的食材，在 LINE 清單前方會標示 `(V)`。

## 本機執行與檢查

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

一般建置輸出至 `dist/`。`node_modules/`、`dist/` 與本機環境設定不提交至 Git。

## 智慧工具箱整合

目前正式入口由 `sdgs-action-platform` 提供，按鈕開啟 `/tools/laba`；頁首的「返回智慧工具箱」由主平台提供。

修改此儲存庫後，先通過測試與建置，再從本專案目錄將相同版本編譯到相鄰的主平台專案，檢查並發布主平台的建置檔案：

```sh
pnpm exec vite build --base=/static/tools/laba/ --outDir=../sdgs-action-platform/app/static/tools/laba
```

只推送本儲存庫不會自動更新主平台內的建置副本。
