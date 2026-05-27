# 说说 emoji 还原器 · QZone Toolkit

> 把 QQ 空间说说里的 `[em]e400xxx[/em]` 一键还原成可读、可复制的真实 emoji。

一个零依赖的纯静态网页：粘贴说说原文 → 点击转换 → 复制结果。无后端、无构建步骤、无追踪用户内容。

## 特性

- **一键还原**：将 QQ 空间私有的 `[em]e400xxx[/em]` 标签批量替换为标准 Unicode emoji。
- **本地运行**：`mapping.json` 只在浏览器中读取，输入文本不出本机。
- **键盘友好**：在输入框按 `Ctrl/⌘ + Enter` 立即转换。
- **字数实时计数**：分别显示原文与结果的字符数（按码点统计）。
- **响应式**：桌面端左右双栏对照，移动端上下竖排，整页固定视口、无主滚动条。
- **现代剪贴板**：优先使用 `navigator.clipboard`，自动回退到 `execCommand`。

## 使用

1. 用浏览器打开 [`index.html`](index.html)。
2. 把含有 `[em]e400xxx[/em]` 的说说粘贴进左侧（或顶部）输入框。
3. 点击「转换成 emoji」（或按 `Ctrl/⌘ + Enter`）。
4. 点击「复制结果」拿走干净的文本。
5. 想重新开始？点「清空输入」按钮即可。

由于使用了 `fetch('mapping.json')`，建议通过本地静态服务器访问而不是 `file://` 协议：

```bash
# 任选其一
python -m http.server 8000
npx serve .
```

随后访问 <http://localhost:8000> 。

## 项目结构

```
saysay-converter/
├── index.html      # 页面结构与样式（自包含 CSS，无 CSS 框架依赖）
├── app.js          # 加载映射、转换、复制、清空、计数、快捷键
├── mapping.json    # [em]e400xxx[/em] → emoji 的映射表
├── LICENSE
└── README.md
```

## 设计说明

页面遵循 [`.agents/skills/redesign-existing-projects/SKILL.md`](.agents/skills/redesign-existing-projects/SKILL.md) 中的高级感设计准则：

- **字体**：标题 / 正文使用 Outfit，数据与提示使用 JetBrains Mono；不使用 Inter。
- **配色**：暖米色基底（`#F4EFE6`）配单一焦糖橙重音色（`#B7410E`），不再使用纯白卡片 + 蓝色按钮 + 紫色渐变这套常见的 AI 模板色。
- **质感**：玻璃面板（`backdrop-filter`）+ 全局噪点叠加（SVG turbulence）+ 暖色调投影，避免纯平。
- **布局**：CSS Grid 三段式（标题 / 工作区 / 操作栏），`height: 100dvh; overflow: hidden;` 锁定整页视口；只有文本超出 textarea 时才在 textarea 内部出现细滚动条，浏览器右侧不出现主滚动条。
- **交互态**：每个按钮都有 hover、active、focus-visible 三种状态；通知用顶部胶囊 toast 取代 `alert`。
- **可访问性**：使用语义化的 `<main>`、`<header>`、`<section>`、`<footer>`；`aria-live` 公告 toast 与计数；textarea 关联了隐藏的 `<label>`；键盘可达。

## 开源协议

[MIT](LICENSE)
