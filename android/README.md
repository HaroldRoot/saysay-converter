# 说说还原器 · Android 版

把 [saysay-converter](../) 这个静态网页打包成一个**完全离线、无网络权限**的轻量 Android app。

## 设计要点

- **WebView 壳**：app 启动后用 WebView 加载本地 assets，UI / 行为与网页 100% 一致。
- **构建期复制资源**：根目录的 [index.html](../index.html) / [app.js](../app.js) / [mapping.json](../mapping.json) / [LICENSE](../LICENSE) 由 Gradle 的 `copyWebAssets` 任务在 `preBuild` 阶段拷贝到 `app/src/main/assets/web/`，**不在仓库里维护两份**。这些被复制的文件已被根目录 `.gitignore` 排除。
- **零 `INTERNET` 权限**：[AndroidManifest.xml](app/src/main/AndroidManifest.xml) 故意不申请网络权限。app 在物理上无法联网——网页里的百度统计脚本会静默失败，用户输入的说说内容绝无可能离开设备。
- **`WebViewAssetLoader` 而不是 `file://`**：用 `https://appassets.androidplatform.net/` 虚拟域名加载，这样 [app.js](../app.js) 里的 `fetch('mapping.json')` 不需要改一行就能工作。
- **APK 体积**：release 构建预计 2-3 MB（仅依赖 androidx.webkit + 一个 Activity，启用了 R8 收缩）。
- **`minSdk = 26`（Android 8.0+）**：覆盖绝大多数在用设备，且支持纯 XML adaptive icon，免去维护一堆 PNG。

## 本地构建

需要 JDK 17+ 和 Android SDK（platform-tools + platforms;android-34 + build-tools;34.0.0）。

```bash
cd android

# Debug 构建：调试版本，不签名
./gradlew assembleDebug
# 产物：app/build/outputs/apk/debug/app-debug.apk

# Release 构建：生产版本，需要签名（见下文）
./gradlew assembleRelease
# 产物：app/build/outputs/apk/release/app-release.apk
```

第一次构建时 Gradle 会自动下载 8.7 发行版（约 130 MB，缓存到 `~/.gradle/`）。

### 签名 release APK

1. 生成 keystore（**只做一次，妥善保管**）：
   ```bash
   keytool -genkey -v -keystore release.keystore -alias saysay \
           -keyalg RSA -keysize 2048 -validity 36500
   ```
2. 在 `android/keystore.properties`（已被 gitignore）里填：
   ```properties
   storeFile=../release.keystore
   storePassword=...
   keyAlias=saysay
   keyPassword=...
   ```
3. 在 `app/build.gradle.kts` 的 `android { ... }` 块加 `signingConfigs`，并把 `release` buildType 的 `signingConfig` 指过去（首次发版时再加，免得空配置占位）。

## 发布到 GitHub Release

1. 本地用 Android Studio 或 `./gradlew assembleRelease` 出一个签了名的 `app-release.apk`，重命名为 `saysay-converter-vX.Y.Z.apk`。
2. `git tag vX.Y.Z && git push --tags`。
3. 在 GitHub 上基于该 tag 创建 release，把 APK 作为附件上传。
4. 之后再回到 `main` 分支，在 [index.html](../index.html) 加一个「下载 Android 版」按钮，链接指向 `https://github.com/HaroldRoot/saysay-converter/releases/latest`。

后续可以加一个 GitHub Actions workflow 自动签名 + 发布，但建议先手动走通一次再上 CI。

## 验证 checklist

- [ ] `./gradlew assembleDebug` 成功，`assets/web/` 出现 `index.html`、`app.js`、`mapping.json`。
- [ ] 真机/模拟器安装后能看到熟悉的暖米色界面，无白闪。
- [ ] 默认示例文本点「转换成 emoji」能正常出 emoji（验证 `fetch('mapping.json')` 通过 `WebViewAssetLoader` 跑通）。
- [ ] 复制按钮、清空按钮、Ctrl+Enter 快捷键都正常。
- [ ] **打开飞行模式**重启 app，所有功能照常工作。
- [ ] 系统设置 → 应用信息 → 权限：列表为空（无网络权限）。
- [ ] release APK 体积在 2-3 MB 区间。

## 目录结构

```
android/
├── build.gradle.kts          # 根 Gradle 配置
├── settings.gradle.kts       # 模块声明
├── gradle.properties         # JVM / AndroidX 开关
├── gradle/wrapper/           # Gradle wrapper（gradle-wrapper.jar 约 43 KB）
├── gradlew, gradlew.bat      # Gradle wrapper 脚本
└── app/
    ├── build.gradle.kts      # app 模块配置 + copyWebAssets 任务
    ├── proguard-rules.pro
    └── src/main/
        ├── AndroidManifest.xml        # 无 INTERNET 权限
        ├── java/io/github/haroldroot/saysay/MainActivity.kt
        └── res/
            ├── values/{strings,colors,themes}.xml
            ├── xml/{backup,data_extraction}_rules.xml
            ├── drawable/ic_launcher_foreground.xml
            └── mipmap-anydpi-v26/ic_launcher{,_round}.xml
```
