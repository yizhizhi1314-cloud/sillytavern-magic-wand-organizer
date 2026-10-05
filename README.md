# 🪄 SillyTavern 魔棒工具库 3.0

这一版重新采用“原生菜单优先”的结构。

## 核心原则

**不接管、不拦截、不替换原生魔法棒按钮。**

SillyTavern 原生的 `#extensionsMenuButton` 继续负责打开/关闭 `#extensionsMenu`。整理器只观察菜单状态，在原生菜单已经打开后，把其中可发现的工具整理成搜索、分类、收藏界面。

因此，如果整理器发生异常，原生菜单仍有机会正常工作；只有在自己的界面成功渲染后，才会隐藏原来的菜单项。

## 发现来源

- 原生 `.extensionsMenuExtensionButton`
- Tavern Helper `getAllEnabledScriptButtons()`
- `window.magicWandOrganizerExtensions` 第三方注册接口

## 执行原则

整理器不重新实现扩展功能。点击整理后的工具时，调用原来的 DOM 按钮或原来的脚本事件。

## 手机优先

UI 直接放在 SillyTavern 原生 `#extensionsMenu` 内，不再创建全屏遮罩，也不抢输入框焦点。

## 安装

在 SillyTavern → 扩展 → 安装扩展中使用：

`https://github.com/yizhizhi1314-cloud/sillytavern-magic-wand-organizer`

安装后刷新页面。

## 诊断

控制台可执行：

`MagicWandOrganizer.inspect()`

返回原生按钮、原生菜单、发现数量以及 `nativeButtonUntouched: true`。

## 兼容边界

没有任何 UI、DOM、事件或公开 API 入口的纯后台脚本，无法被可靠地凭空制造成一个可点击工具。
