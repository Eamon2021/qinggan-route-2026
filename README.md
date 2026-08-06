# 青甘自驾路线图 2026

- 根目录保留原七日版。
- `v2/` 是逐段校准后的六日版，不覆盖原页面。
- `v2/route-geometry.json` 保存道路轨迹，页面中的路段可直接高亮定位；西宁站首尾路段使用 OSM 道路路由，其余路段沿用高德复核结果。
- 发布目录只包含加密页面；原始地图文件不会提交到仓库。
- 页面使用浏览器原生 Web Crypto 解密，密码不会上传。

## 构建原七日版

```powershell
$env:MAP_PASSWORD = "your-password"
node .\build-encrypted.mjs .\source-map.html .\index.html
Remove-Item Env:\MAP_PASSWORD
```

## 构建六日版

```powershell
$env:MAP_PASSWORD = "your-password"
node .\build-v2.mjs .\six-day-source.html .\v2\index.html
Remove-Item Env:\MAP_PASSWORD
```
