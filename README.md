# MiniMax Claude HUD

**实时显示你的 MiniMax API 额度消耗** — 5小时滑动窗口 + 7天周额度，终端输入框下方一目了然。

Claude Code 插件，为 MiniMax API 用户打造。

![HUD Preview](claude-hud-preview-5-2.png)

---

## 一分钟安装

```bash
# 1. 添加插件市场
/plugin marketplace add lemonpopdo/claude-hud-for-minimax

# 2. 安装插件
/plugin install claude-hud-for-minimax

# 3. 配置（输入 API Key 后一路回车）
/minimax-hud:setup
```

重启 Claude Code，HUD 就出现了。

> **Windows 用户** 如果提示找不到 JavaScript 运行时，先运行：
> ```powershell
> winget install OpenJS.NodeJS.LTS
> ```
> 然后重启终端，再执行上面的命令。

> **Linux 用户** 如果遇到 `EXDEV` 错误，设置临时目录后启动：
> ```bash
> mkdir -p ~/.cache/tmp && TMPDIR=~/.cache/tmp claude
> ```

---

## 你看到的是什么

```
[MiniMax:M2.5] │ my-project git:(main*)
Context █████░░░░░ 45% │ MiniMax:M2.5 5h: ████░░░░░░ 40% (200/500, resets 1h) │ 7d: █████████░ 90% (4.5k/5k, resets 3d)
```

| 显示内容 | 含义 |
|---------|------|
| `Context ████░░` | 上下文窗口使用率，绿→黄→红渐变预警 |
| `MiniMax:M2.5 5h:` | 当前模型（可切换），5小时滑动窗口已用 200/500 |
| `7d:` | 7天滚动配额，已用 4.5k/5k |
| `resets 1h` | 距离窗口重置还剩多少时间 |

### 可选显示（默认隐藏，通过 `/minimax-hud:configure` 开启）

```
◐ Edit: auth.ts | ✓ Read ×3        ← 正在运行的工具
✓ explore: 查找认证代码 (2m 15s)    ← 子 Agent 状态
▸ 修复认证 Bug (2/5)                ← Todo 进度
```

---

## 为什么需要这个插件

MiniMax API 没有官方面板查看实时用量。你只能：

- 等 API 返回 `429 Rate Limit Exceeded` 错误才知道额度用完了
- 登录 MiniMax 平台手动刷新页面
- 完全凭感觉使用

MiniMax Claude HUD 把这个黑盒变成了 HUD 底部的一行实时数字。

**核心功能：**
- 实时显示 5h 滑动窗口和 7d 周额度
- 支持选择要监控的模型（多模型用户）
- 上下文窗口使用率 + 颜色预警
- 工具 / Agent / Todo 实时跟踪
- 原生 token 数据（非估算），随 Claude Code 版本更新

---

## 配置

### 首次配置

```bash
/minimax-hud:setup
```
向导会引导你输入 API Key，测试 HUD 能否运行。

### 随时自定义

```bash
/minimax-hud:configure
```
- 选择布局：展开多行 / 单行紧凑
- 选择预设：Full（全开）/ Essential（工具+Git）/ Minimal（仅核心）
- 开启/关闭各项功能
- **新增：选择要显示配额的模型**

### 单独更新 API Key

```bash
/minimax-hud:set-apikey
```

### 手动配置

编辑 `~/.claude/plugins/minimax-claude-hud/config.json`：

```json
{
  "lineLayout": "expanded",
  "pathLevels": 1,
  "display": {
    "showMiniMaxQuota": true,
    "miniMaxQuotaBarEnabled": true,
    "miniMaxQuotaShowWeekly": true,
    "modelName": null,
    "showTools": false,
    "showAgents": false,
    "showTodos": false
  }
}
```

| 配置项 | 默认值 | 说明 |
|-------|--------|------|
| `display.showMiniMaxQuota` | `true` | 是否显示 MiniMax 额度 |
| `display.miniMaxQuotaBarEnabled` | `true` | 显示进度条 |
| `display.miniMaxQuotaShowWeekly` | `true` | 同时显示7天额度 |
| `display.modelName` | `null` | `null` = 自动检测，也可指定具体模型名 |

---

## 常见问题

### 额度不显示？

1. 确认 API Key 已设置：`/minimax-hud:set-apikey`
2. 确认 Key 有剩余额度：https://platform.minimaxi.com/
3. 重启 Claude Code（设置 Key 后必须重启）

### 怎么获取 API Key？

访问 https://platform.minimaxi.com/，在 API Key 管理页面获取。

### HUD 不出现？

- 完整退出 Claude Code（不只是关闭标签页），然后重新运行 `claude`
- macOS 用户：确保完全退出后重新打开终端

---

## 技术原理

```
Claude Code → stdin JSON → claude-hud → stdout → 终端状态栏
           ↘ transcript.jsonl（工具、Agent、Todo 活动）
```

利用 Claude Code 原生 `statusline` API，无需 tmux 或独立窗口，所有终端均可使用。每约 300ms 更新一次。

---

## 开发

```bash
git clone https://github.com/lemonpopdo/claude-hud-for-minimax
cd claude-hud-for-minimax
npm ci && npm run build
npm test
```

---

## License

MIT

[![Star History](https://api.star-history.com/svg?repos=lemonpopdo/claude-hud-for-minimax&type=Date)](https://star-history.com/#lemonpopdo/claude-hud-for-minimax&Date)
