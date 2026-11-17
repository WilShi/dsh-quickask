# Quorfloat · DeepSeek 原生视觉重构

## 范围

基于上游 `Azetus/dsh-quorfloat`（MIT，基线 commit `1104506`）做前端二次开发。
当前工作只改独立目录 `dsh-quorfloat-studio`，**没有覆盖或替换** `~/.dsh/profiles/desktop` 中已安装的版本。

目标：

- 保留全局热键、会话/工作区、模型与权限、审批与追问、虚拟化线程等原有能力；
- 优化导航层级、输入聚焦、空会话、对话排版、弹层和设置页；
- 配色严格对齐 DeepSeek Harness 当前对话框，而不是另起一套品牌色。

## 设计评审：四个方向

交互预览位于 design/index.html，可切换明暗主题与空会话/对话状态；已通过 file:// 双击打开与切换测试，不依赖本地服务器。四方向对比图位于 artifacts/design-contact-sheet.png。
预览完整展示工作区 Code、模型 Kimi K3.1 Pro · Max 和权限「工作区内修改」，不发送模型请求。

| 方向 | 重点 | 适用场景 |
|---|---|---|
| A · DeepSeek 原生悬浮 | 输入区下方显示模型与权限，最接近 DSH | 长对话、默认推荐 |
| B · 聚焦输入 | 工作区/模型/权限作为手边 chips | 快速提问、频繁切换配置 |
| C · 双栏工作台 | 左侧工作区/会话/模型，右侧对话 | 多会话并行 |
| D · 豆包式随手问 | 悬浮球、小窗、底部输入、截图提问、主窗口跳转 | 全局呼出、随手问 |

D 的交互参考了[豆包对话浮窗](https://zhuanlan.zhihu.com/p/2029837761193025604)，但品牌、配色与模型上下文仍使用 DeepSeek 体系。
最终方向已由用户选定为 D：豆包式随手问。A 版已通过真实原生运行与完整测试；D 版主面板、官方悬浮球、整屏截图与主窗口动作均已实现并完成 macOS 集成验证。

## DeepSeek 设计令牌映射

来源：本机 DeepSeek Harness 0.2.2-rc.1 的
`@deepseek-ai/dsh-client-ui-theme/lib/client.js` 中 `--dsw-static-*` / `--dsw-alias-*`。

| 用途 | 浅色 | 深色 |
|---|---|---|
| 主强调色 / 发送键 | `#4176e6` | `#5686fe` |
| 强调色 hover | `#5686fe` | `#7aaaff` |
| 主文字 | `#0f1115` | `#f9fafb` |
| 面板 | `#ffffff` | `#232324` |
| 输入与弹层 | `#ffffff` | `#2c2c2e` |
| 次要表面 | `#f5f6f7` | `#353638` |
| 底层表面 | `#f9fafb` | `#1b1b1c` |
| 用户问题 | `#ebeef2` | `#2c2c2e` |
| 强调色浅底 | `#edf3fe` | `#34415b` |
| 一级分隔线 | `#0000000a` | `#ffffff0f` |
| 二级分隔线 | `#0000001a` | `#ffffff1f` |

组件几何同时向 DSH 靠拢：面板 20px、输入卡片 16px、发送键 12px、上下文栏 12px 圆角。
品牌区与悬浮球统一使用 DeepSeek 官方应用图标：`quorfloat/frontend/src/assets/deepseek-official.png`，来源为本机 DeepSeek Harness 的 `Contents/Resources/icon.png`，不再使用 quorfloat 自制图标。

## 结构与交互改动

- 顶栏加入品牌图标，工作区和会话合并为一条轻量上下文导航，设置与关闭保持独立。
- 输入区改为带聚焦态的卡片：DeepSeek 蓝发送键、清晰占位符、保留原有自动增高与 IME 行为。
- 空会话新增轻量引导，不注入建议问题或虚假会话内容。
- 用户问题改为靠右气泡；回答、工作折叠、复制回答、代码块与回答栏重新排版。
- 审批/追问卡、模型与权限菜单、设置页、底部状态栏统一使用同一套 DeepSeek 令牌。
- 补齐 `:focus-visible`、滚动条、选中态与减少动画规则。

## 未改动的边界

- 未修改 Harness 本体、Rust 协议、宿主会话逻辑、NDJSON/JSON-RPC、审批归属与图片安全规则。
- 未改变原生窗口尺寸公式、阴影预留、置顶/失焦策略、热键管理、虚拟化坐标和阅读位置补偿。
- 未发送真实模型请求；视觉 fixture 已删除。

## 主窗口会话导航

- 打开主窗口携带当前 sessionId/workspaceId；原生仍负责激活官方窗口。
- 插件浏览器端通过带 nonce/ack 的导航桥调用 uiWorkspace.openSession(sessionId)，空会话调用 startSession(workspaceId)。
- 不使用 URL 深链或模拟点击；旧请求确认不会误清新请求。
- 同时修复 Host Router 创建时遗漏 prompt content 的问题，图片附件按 content 透传。

## 菜单方向

- 顶部模型与推理等级菜单默认向下展开，其他菜单按触发器上下可用空间自动选择方向。
- 保留底部菜单的空间感知，避免输入区附近的菜单越出窗口。

## 窗口位置

- 默认位置按用户选择为屏幕居中；位置选择仍可切换顶部居中、屏幕居中、左上、右上。
- 设置页提供窗口位置：顶部居中、屏幕居中、左上、右上；选择持久化保存并即时生效。

## 图片附件

- 支持本地选择、拖入和 `⌘V` 粘贴 PNG/JPEG/WebP 图片，不再提供截图或框选入口。
- 大图在浏览器端压缩到 768 KiB 内；输入框显示真实缩略图，可单独移除。
- 发送按 DSH `PromptContentPart` 提交：`{type:'image', mediaType, data, name?}`，不使用路径代替图片。
- 发送成功清空附件；发送失败恢复文字与图片草稿。

## D 版实现

- 顶栏使用 DeepSeek 官方图标；新会话、截图、主窗口、保持展开、设置和关闭均为真实动作入口。
- 上下文行同时展示工作区、会话和完整模型名/推理档位。
- 输入卡片固定在对话下方，内含截图提问、更多和权限选择。
- open_main 在 macOS 激活官方 Harness，在 Windows 激活精确进程名的现有主窗口。
- capture_screenshot 先实现整屏截图，保存到当前/默认工作区并返回路径；不宣称支持框选。
- 悬浮球复用现有热键呼出路径，优先保证非聚焦、可靠呼出；当前固定于主屏右下，未保留拖动能力。
- window.floatingBall 默认 false：只有用户在设置页开启后才显示；球体为圆形。
- 设置页支持选择本地 PNG/JPEG/WebP Logo（最大 512 KiB）及恢复官方图标，偏好持久化保存。
- 新会话通过 agentDefaultModel.currentSelection 显示默认模型，通过 permissionPresets.defaultPreset 显示默认权限；旧会话仍以各自投影为准，缺失时保持空白。

## 验证

已执行并通过：

```sh
npm --prefix quorfloat/frontend run typecheck
npm --prefix quorfloat/frontend test       # 28 passed
npm test                                   # 完整宿主/前端/Rust/桌面集成，exit 0；最终 106 passed / 12 skipped
npm run test:desktop                       # 真实侧车桌面集成 8/8
cargo test                                 # Rust 118 passed（含会话导航 wire）；桌面命令契约 9/9
cargo test --manifest-path quorfloat/Cargo.toml   # 92 passed
cargo build --manifest-path quorfloat/Cargo.toml
cargo doc --no-deps --manifest-path quorfloat/Cargo.toml
```

同时用临时快照检查了深色/浅色、空会话、回答线程和设置页；随后重建并在本机启动真实 Tauri 面板。

## 隔离开发启动

```sh
cd /Users/wilson/Documents/Code/dsh-quorfloat-studio
export PATH="/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin:$PATH"
export CARGO_HOME="$PWD/.cargo-home"
export DSH_QUORFLOAT_HOTKEY="Control+Alt+Shift+Q"
export DSH_QUORFLOAT_WINDOW_START_VISIBLE=1
npm run dev
```

`.dev-home/` 保存隔离状态；独立热键避免与已安装版的 `Alt+Space` 冲突。
注意：dev 会复制模型凭据，但不会自动发模型请求；真实提问仍会产生真实调用与费用。

## 当前限制与 Windows 待验收

- 悬浮球当前为固定位置，未保留拖动能力。
- 截图为整屏捕获，不是框选；按钮不会宣称支持框选。
- Windows 的 open_main 仅激活精确进程名的现有官方主窗口，不支持冷启动。
- 不支持 Linux。

## Windows 待验收

本次只在 macOS arm64 实际运行。Windows x64 还需验证：

1. WebView2 环境中的 `light-dark()`、透明圆角与滚动条；
2. `Alt+Space` 注册、失焦/保持展开、托盘菜单；
3. DPI 缩放、多显示器与窗口位置恢复；
4. 会话、审批、追问、模型/权限菜单与长 Markdown。

## 主要文件

- `quorfloat/frontend/src/styles/tokens.css`
- `quorfloat/frontend/src/components/chrome/TopBar.tsx`
- `quorfloat/frontend/src/components/chrome/ContextBar.tsx`（D 版工作区/会话/完整模型上下文行）
- `quorfloat/frontend/src/components/conversation/Composer.tsx`（沿用原组件，仅样式重构）
- `quorfloat/frontend/src/components/conversation/ConversationPage.tsx`
- `quorfloat/frontend/src/components/conversation/EmptyState.tsx`
- `quorfloat/frontend/src/components/settings/FloatingBallSettings.tsx`（悬浮球开关、圆形预览与 Logo 管理）
- `quorfloat/frontend/src/components/thread/Turn.tsx`
- `quorfloat/frontend/src/logic/i18n/{zh,en}.ts`
- `quorfloat/frontend/src/assets/brand-mark.png`

视觉验收图位于 `artifacts/`（本地交付物，不进入源码包）。
