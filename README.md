# 青甘大环线 2026

8 月 8 日至 14 日七日自驾路线图的加密静态备份。

- GitHub Pages 只发布加密后的 `index.html`。
- 原始地图文件不会提交到仓库。
- 页面使用浏览器原生 Web Crypto 解密。

## 本地重新生成

```powershell
$env:MAP_PASSWORD = "your-password"
node .\build-encrypted.mjs .\source-map.html .\index.html
Remove-Item Env:\MAP_PASSWORD
```
