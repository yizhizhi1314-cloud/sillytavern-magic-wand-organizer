# 🪄 SillyTavern 魔棒快捷菜单收纳器

把 SillyTavern 左下角扩展菜单整理成更好点、更适合手机的可视化弹窗。

## 这次是「酒馆原生扩展」

现在可以直接在 SillyTavern 的：

**扩展 → 安装扩展 → 粘贴 Git URL**

安装，不需要 Tampermonkey / Violentmonkey。

Git URL：

https://github.com/yizhizhi1314-cloud/sillytavern-magic-wand-organizer

SillyTavern 会通过 Git 下载这个仓库，并读取根目录的 `manifest.json` 自动安装。

## 功能

- 🔍 工具搜索
- 🗂️ 自动分类
- ⭐ 收藏常用工具
- 🌓 浅色 / 深色 / 自动主题
- 📱 手机端底部抽屉布局
- ⌨️ Ctrl/Cmd + K 快速打开
- Esc 或点击背景关闭
- 尽量调用 SillyTavern 原来的菜单按钮，不重复实现原功能

## 安装

1. 打开 SillyTavern「扩展」面板。
2. 选择「安装扩展」。
3. 粘贴上面的 Git URL。
4. 点击安装。
5. 安装完成后刷新 SillyTavern。

> 注意：SillyTavern 的第三方扩展安装使用 Git，因此运行酒馆的环境需要可用 Git。

## 排错

浏览器控制台执行：

```
MagicWandOrganizer.inspect()
```

正常应看到 `buttonFound: true` 和 `menuFound: true`。

## 许可证

MIT
