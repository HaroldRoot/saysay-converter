# 更新 Android app 的流程

本文档描述当网页代码（特别是 [mapping.json](../mapping.json)）发生变化后，如何把新版本打包成 APK 并发布。

> **架构提醒**：app 是一个 WebView 壳，启动时加载 **打包进 APK 的** [assets/web/](app/src/main/assets/) 下的网页副本。Gradle 的 `copyWebAssets` 任务在每次构建的 `preBuild` 阶段把仓库根目录的网页文件拷进去——所以**只要重新构建一次，最新的网页和映射表就会被一起打进新的 APK**，源代码层面不需要做任何改动。
>
> 但 APK 一旦装到用户手机上就**完全离线、无法自动更新**。要把新映射推给已安装用户，目前唯一的办法是发布新 APK 让他们手动下载安装。这是 [无 INTERNET 权限](app/src/main/AndroidManifest.xml) 这个安全承诺的代价，已知问题，未来再讨论解决方案（思路见文末）。

---

## 一次完整的更新发布流程

假设当前已发布版本是 `v1.0.0`（versionCode `1`），要发布的新版本是 `v1.0.1`（versionCode `2`），且只是修了 mapping。

### 1. 在 `main` 分支改网页

照常修改 [mapping.json](../mapping.json) / [index.html](../index.html) / [app.js](../app.js)，commit、push 到 `main`，让 GitHub Pages 跟着更新。这一步和你日常维护网页没区别。

### 2. 把网页改动同步到 `android` 分支

```bash
git checkout android
git merge main
# 如果有冲突，正常解决；通常不会有，因为 android 分支只往 android/ 子目录加文件
```

> 如果你只在 `main` 改网页、从不在 `android` 分支改网页，`merge main` 应该永远是 fast-forward，不会有冲突。

### 3. 在 `android` 分支 bump 版本号

编辑 [app/build.gradle.kts](app/build.gradle.kts) 里 `defaultConfig` 块的两个字段：

```kotlin
defaultConfig {
    applicationId = "io.github.haroldroot.saysay"
    minSdk = 26
    targetSdk = 34
    versionCode = 2          // ← 每次发版必须 +1，否则用户的手机不会识别为更新
    versionName = "1.0.1"    // ← 用户看得见的版本号，遵循 semver
}
```

**两个字段的区别：**

- `versionCode` 是 Android 系统比较版本新旧的依据，**必须是单调递增的整数**。如果新 APK 的 versionCode ≤ 已安装版本，系统会拒绝更新（除非用户先卸载）。
- `versionName` 是给人看的字符串，可以是任何格式，但建议用 `主版本.次版本.修订版本`（[semver](https://semver.org/lang/zh-CN/)）：
  - **修订版**（`1.0.0` → `1.0.1`）：仅 bug 修复 / 加映射规则等，对用户透明的小改动。
  - **次版本**（`1.0.x` → `1.1.0`）：新增功能但保持向后兼容。
  - **主版本**（`1.x.x` → `2.0.0`）：重大变化或破坏性改动。

提交版本号 bump：

```bash
git add android/app/build.gradle.kts
git commit -m ":bookmark: Bump version to v1.0.1"
```

### 4. 出 release APK

```bash
cd android
./gradlew clean assembleRelease
```

- `clean` 会把上一次构建的 `assets/web/` 删掉，确保这次复制的是仓库当前最新的网页文件。
- `assembleRelease` 会跑 `copyWebAssets` → 编译 → R8 收缩 → 用 [keystore.properties](keystore.properties) 里配置的 keystore 签名。

产物在 `app/build/outputs/apk/release/app-release.apk`。

### 5. 自检（强烈建议）

在装新 APK 之前，**先在真机或模拟器上验证**：

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

- `-r` = replace，模拟"用户从应用商店收到更新"的场景。如果版本号 bump 错了（versionCode 没递增），这一步会直接报错——这是个好的早期信号。
- 安装后启动 app，**重点测试这次新加的映射**，确认能正确转换。
- 打开飞行模式再启动一次，确认离线照常工作。

### 6. 重命名并发布

```bash
# 重命名（参考现有的命名规范）
mv app/build/outputs/apk/release/app-release.apk \
   app/build/outputs/apk/release/saysay-converter-v1.0.1.apk

# 推 commits（包括 merge 和 bump）
git push origin android

# 打 tag 并推送（tag 名建议和 versionName 一致）
git tag v1.0.1
git push origin v1.0.1
```

然后到 GitHub 网页：

1. **Releases** → **Draft a new release**。
2. 选刚才推上去的 `v1.0.1` tag。
3. Release title 写 `v1.0.1`，描述里列出本次更新内容（"新增 `[em]e400867[/em]` → 😭 映射"之类的）。
4. 把 `saysay-converter-v1.0.1.apk` 拖到附件区。
5. **Publish release**。

发完后：`https://github.com/HaroldRoot/saysay-converter/releases/latest` 会自动指向 v1.0.1，网页上「下载 Android 版」按钮（如果已经加了）的链接不需要改。

---

## 应急更新清单（精简版）

熟练以后可以照这个最短路径来：

```bash
# 1. 同步网页改动
git checkout android && git merge main

# 2. bump 版本号（手动改 app/build.gradle.kts 里的 versionCode 和 versionName）

# 3. 构建并签名
cd android && ./gradlew clean assembleRelease

# 4. 验证
adb install -r app/build/outputs/apk/release/app-release.apk

# 5. 重命名 + 推 tag
mv app/build/outputs/apk/release/app-release.apk \
   app/build/outputs/apk/release/saysay-converter-vX.Y.Z.apk
cd .. && git push origin android && git tag vX.Y.Z && git push origin vX.Y.Z

# 6. 在 GitHub 网页创建 release，上传 APK
```

---

## 常见问题

### Q: 我忘了 bump versionCode，已经签了 APK 上传了怎么办？

用户手机上的旧版本不会被识别为可更新，但**不会有任何报错**——这是最坑的情况，因为静默失败。补救：

1. 删掉 GitHub Release 上的旧附件。
2. 在 [build.gradle.kts](app/build.gradle.kts) 里把 versionCode 再 +1。
3. 重新 `./gradlew clean assembleRelease`。
4. 把新 APK 重新上传到同一个 Release（不需要重打 tag）。

### Q: 我不想动 `versionName`，只是改了 mapping，能不能只 bump versionCode？

可以，但**不推荐**。versionName 不变意味着用户在「设置 → 应用信息」里看到的版本号没变，他们无法判断自己是不是最新。即使只改了 mapping，也建议把 versionName 从 `1.0.0` bump 到 `1.0.1`。

### Q: 用户说他装了新版还是看不到新映射？

排查顺序：

1. **APK 里的 mapping 是不是新的？** 用 `unzip -p saysay-converter-vX.Y.Z.apk assets/web/mapping.json | head` 直接看 APK 内嵌的 mapping.json。如果里面没有新映射，说明构建时 `copyWebAssets` 没跑——通常是因为没有先 `clean`，旧的 `assets/web/` 还在缓存。
2. **用户是不是真的装了新版？** 让他在「设置 → 应用 → 说说还原器 → 应用信息」里确认 versionName。

### Q: 我希望 app 能自动检查/拉取最新 mapping，不用每次都发新 APK，怎么做？

这是个真问题。现在不做的核心理由：app 没申请 `INTERNET` 权限，这是写在 [README.md](README.md) 里给用户的安全承诺（"输入文本绝不出本机"）。要支持在线更新就得开网络权限，离线性的硬保证就破了。

未来如果要做，几种思路（按破坏离线承诺的程度排序）：

1. **用户主动导入 `mapping.json`**：app 加一个「从文件导入新映射表」按钮，用户手动从网页版下载 mapping.json 再导入。**完全不需要网络权限**，最干净。
2. **半在线**：申请 `INTERNET` 权限，但只允许访问 `mapping.json` 一个 URL，且明确告知用户。需要在 README 重新表述安全承诺。
3. **完全在线**：不再是离线 app，等于 PWA。不推荐——直接用网页就行了。

方案 1 是最值得做的方向，但本身也是个独立的 feature，等首版稳定后再单独立项。
