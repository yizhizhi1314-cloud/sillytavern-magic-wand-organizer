# 🪄 SillyTavern 魔棒工具库 2.0

这是一次重新设计，不在旧版上继续打补丁。

## 核心思路

参考 QR 助手的结构，把“发现工具”和“显示工具”彻底分开：

`发现 → 统一数据 → 分类/收藏 → 自己渲染 → 调回原功能 → 持续监听`

### 自动发现

1. **SillyTavern 原生魔棒项目**：扫描 `#extensionsMenu` 中实际存在的 `.extensionsMenuExtensionButton`，不复制原功能。
2. **Tavern Helper / JSSlashRunner**：如果存在 `getAllEnabledScriptButtons()`，自动把已启用脚本按钮纳入工具库。
3. **第三方注册接口**：其他工具可以向 `window.magicWandOrganizerExtensions` 注册 `{ id, name, icon, category, execute }`。
4. **MutationObserver**：原生扩展动态加入按钮后自动重新发现，不需要手工刷新列表。

### 原功能保留

每个工具都保存自己的原始执行入口：

- 原生魔棒工具 → 调用原始 DOM 元素 `.click()`
- Tavern Helper → 发出原脚本按钮事件
- 第三方注册工具 → 调用注册时提供的 `execute()`

本项目不重新实现翻译、绘图、TTS、图库等扩展功能。

## 安装

SillyTavern → 扩展 → 安装扩展 → Git URL：

`https://github.com/yizhizhi1314-cloud/sillytavern-magic-wand-organizer`

安装后刷新酒馆。

## 调试

浏览器控制台执行：

`MagicWandOrganizer.inspect()`

它会返回原生按钮、原生工具、Tavern Helper 工具、第三方注册工具以及最终发现总数。

## 说明

“自动发现所有工具”有一个边界：一个完全不向酒馆注册 UI、API、事件或 DOM 入口的纯后台脚本没有可被调用的工具按钮，因此无法凭空制造一个入口。本项目会尽量通过原生魔棒 DOM、Tavern Helper API 和开放注册接口覆盖实际可操作的工具。