# D 版安装与回滚记录

## 当前安装

- 安装位置：`~/.dsh/profiles/desktop/node_modules/@wilshi/dsh-quickask/`
- 安装包：`bundles/dsh-quickask-0.1.10-darwin.tgz`
- 默认配置：`window.floatingBall: false`、`window.ballLogo: ""`
- 原生侧车：`~/.dsh/profiles/desktop/node_modules/@wilshi/dsh-quickask/bin/dsh-quorfloat`

安装使用 DSH 自带 `dsh plugin --profile desktop add <tgz>`，不是手工替换二进制。

## 窗口位置与图片附件

- 默认屏幕居中；设置页可切换顶部居中、屏幕居中、左上、右上。
- 图片支持本地选择、拖入和 `⌘V` 粘贴；显示缩略图，可移除；按 DSH image content 提交。
- 不再提供截图或框选入口。

## 验证状态

- Rust：116/116。
- 前端：23/23，类型检查与 Vite 构建通过。
- 真实侧车桌面集成：8/8。
- 最终完整 npm test：通过；最后一组 106 项通过、12 项按平台跳过。
- 原生五阶段：默认无球窗 → 官方圆形 → 自定义圆形 → 恢复官方 → 关闭无窗口。
- Windows 尚未实机验证；悬浮球当前固定位置，未保留拖动能力；截图是整屏，不是框选。

当前 DSH 宿主尚未完整重启，因此不能把当前安装版的默认关闭行为宣称为已验收。
请按 **⌘Q 完全退出 DeepSeek Harness，再重新打开**，然后进入悬浮窗设置启用悬浮球和选择 Logo。

## 备份

- 原版 0.1.10 安装前：`backups/desktop-pre-d/`
- 悬浮球偏好更新前：`backups/desktop-before-ball-preferences/`
- 最终安装状态：`backups/desktop-final-d/`

备份只包含 profile 的 `package.json`、`pnpm-lock.yaml`、`cordis.patch.yml`、`cordis.yml`、`pnpm-workspace.yaml`，不包含会话、凭据或模型配置。

## 回滚到原版 0.1.10

先完全退出 DSH，再执行：

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add dsh-quorfloat@0.1.10
```

需要恢复最终 D 版时：

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add "/Users/wilson/Documents/Code/dsh-quickask-studio/bundles/dsh-quickask-0.1.10-darwin.tgz"
```

每次更换后都要完全退出并重新打开 DSH，确保新原生侧车加载。
