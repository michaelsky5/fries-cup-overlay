# FCUP React 导播 / Overlay 工具项目说明

## 1. 项目目标

这套项目是一套 React 电竞赛事导播 / Overlay 控制台工具，当前目标是：

* 把原本非常大的 `App.jsx` 逐步拆成可维护的组件结构
* 统一控制台在不同分辨率 / 不同信息密度下的 UI 表现
* 保持 Overlay 播出逻辑与 Console 控制逻辑清晰分层
* 让后续新增功能时，不再频繁回到单文件巨型维护模式

当前已完成的阶段重点是：

* 主壳层拆分
* density 样式系统贯通
* 主要 editor 统一接入 `density / densityTokens / createEditorUi`
* 历史残留文件清理
* `VIDEO / HIGHLIGHT` 编辑器补回

---

## 2. 目录职责概览

### `App.jsx`

总入口。

负责：

* 组装全局状态 hooks
* 初始化 `MatchContext`
* 区分 Notice / Login / Workspace 三种主界面
* 区分 Console 路由与 `#overlay` 播出路由
* 连接各个 scene、workspace、modal、history、keyboard shortcut

可以理解为：

**总调度中心 / 根容器**

---

### `components/layout/ConsoleWorkspace.jsx`

主控制台工作区。

负责：

* 顶部系统状态条
* Scene Routing Center
* 左侧 Scene Selector
* 中间 monitor + editor 区
* 右侧 `RightSidebar`
* 将 `density / densityTokens / isDense / isUltra` 继续传给各 editor

可以理解为：

**控制台页面骨架**

---

### `components/common/SharedUI.jsx`

通用 UI 组件集合。

当前主要包括：

* `ShellPanel`
* `Field`
* `TogglePill`
* `TabButton`
* `QuickStat`
* `SectionHint`
* `MonitorFrame`
* `AutoFitScene`

职责：

* 统一面板、字段、按钮、状态块、监看窗口等基础表现
* 接入 `density`，让基础组件自动适配不同密度

可以理解为：

**通用基础 UI 层**

---

### `constants/styles.js`

全局颜色 / 基础样式 / density token 源头。

主要负责：

* `COLORS`
* `UI`
* `panelBase`
* `inputStyle / selectStyle / btnStyle / actionBtn / outlineBtn`
* `DENSITY_TOKENS`
* `getDensityTokens(density)`

可以理解为：

**设计系统底层配置**

---

### `utils/editorUi.js`

编辑器通用样式工厂。

当前负责输出：

* `ui.input`
* `ui.select`
* `ui.btn`
* `ui.outlineBtn`
* `ui.actionBtn`
* `ui.softOutlineBtn`

作用：

* 把 editor 中重复的 `compactInput / compactBtn / compactOutlineBtn` 统一抽掉
* 让不同 editor 的输入框 / 按钮尺寸来源统一

可以理解为：

**editor 专用样式工厂**

---

### `components/controls/*`

控制台编辑器区。

当前主要 editor：

* `LiveEditor.jsx`
* `TeamDBEditor.jsx`
* `MapPoolEditor.jsx`
* `CasterEditor.jsx`
* `CountdownEditor.jsx`
* `VideoEditor.jsx`
* `HighlightEditor.jsx`
* `StatsEditor.jsx`
* `RosterEditor.jsx`

职责：

* 编辑各个 scene 所需字段
* 不直接负责播出渲染
* 只负责控制数据

可以理解为：

**各业务模块的控制面板层**

---

### `components/scenes/*`

播出页场景组件。

当前主要 scene：

* `MatchLiveHUD`
* `CountdownScene`
* `CasterScene`
* `MapPoolScene`
* `VideoScene`
* `HighlightScene`
* `StatsScene`
* `RosterScene`
* `StingerTransition`

职责：

* 使用 `matchData` 渲染最终播出画面
* 提供给 Overlay 页面和 Console monitor 预览使用

可以理解为：

**播出渲染层**

---

### `hooks/*`

状态和交互逻辑。

当前主干：

* `useMatchState.js`：核心状态读写、本地存储同步
* `useHistory.js`：撤销历史
* `useSceneController.js`：preview / program / take 切换
* `useViewport.js`：响应式分辨率与 density 判断
* `useKeyboardShortcuts.js`：快捷键逻辑

可以理解为：

**状态逻辑层 / 行为控制层**

---

### `contexts/MatchContext.jsx`

上下文共享层。

作用：

* 给各 editor / sidebar / modal 提供统一访问 `matchData`、`updateData`、`history` 等能力

可以理解为：

**页面级共享状态入口**

---

## 3. 分层关系

推荐把项目理解成下面这条链：

`styles.js` → `SharedUI / editorUi` → `controls / layout` → `App.jsx`

和另一条链：

`matchData` → `scenes` → `overlay / monitors`

更具体一点：

* `styles.js` 提供 design token
* `SharedUI.jsx` 和 `editorUi.js` 消费 token
* `ConsoleWorkspace.jsx` 和各 `Editor` 消费 UI 组件与样式工厂
* `App.jsx` 把所有状态 / 视图拼起来
* `Scene` 只读 `matchData` 渲染最终播出结果

---

## 4. `matchData` 字段分区说明

下面是当前最重要的字段分区。

### A. 全局 / 路由 / 通用

* `globalScene`
* `outputMode`
* `stingerLogo`
* `showTicker`
* `tickerText`
* `tickerMode`

---

### B. LIVE

* `teamA`
* `teamB`
* `logoA`
* `logoB`
* `logoBgA`
* `logoBgB`
* `scoreA`
* `scoreB`
* `playersA`
* `playersB`
* `subIndexA`
* `subIndexB`
* `showPlayers`
* `showBans`
* `bansA`
* `bansB`
* `activeComms`

---

### C. MAP POOL / MATCH FLOW

* `info`
* `matchFormat`
* `currentMap`
* `mapLineup`
* `mapPoolDisplayMode`
* `showOverviewCurrent`
* `eventMapPool`
* `enabledMapTypes`

---

### D. CASTERS / STAFF

* `casters`
* `casterDisplayMode`
* `staffTitle`
* `staffSubtitle`
* `staffMembers`

---

### E. COUNTDOWN

* `countdownMode`
* `countdownSeconds`
* `infoCupName`
* `infoSubtitle`
* `matchStageDescription`
* `upcomingMatches`

---

### F. VIDEO

* `videoLibrary`
* `videoPlaylist`
* `activeVideoPath`
* `videoMuted`

---

### G. HIGHLIGHT

* `highlightLibrary`
* `highlightPlaylist`
* `activeHighlightPath`
* `highlightMuted`

---

### H. STATS

* `statsMode`
* `statsImagePath`
* `statsImageTempUrl`
* `statsTemplateData`

---

### I. ROSTER

* `rosterTeamTarget`
* `rosterPlayersA`
* `rosterPlayersB`
* `rosterStaffA`
* `rosterStaffB`
* `rosterPresetLibrary`

---

### J. Team Preset / 老预设链

* `teamPresets`

说明：

这部分是旧的战队预设系统，和现在的 `rosterPresetLibrary` 有一定功能重叠。
后续如果确认不再需要，可以考虑逐步统一或清理。

---

## 5. 当前已经完成的工程化成果

### 已完成

* `App.jsx` 巨型结构已经拆出主壳层
* `ConsoleWorkspace.jsx` 成为主控制台骨架
* `RightSidebar.jsx` 已接入 density
* `SharedUI.jsx` 的核心组件已接入 density
* `Field / SectionHint` 已接 density
* 多数 editor 已改成接收：

  * `density`
  * `densityTokens`
  * `isDense`
  * `isUltra`
* `createEditorUi()` 已落地到多个 editor
* 历史残留文件已清理一轮
* `VIDEO / HIGHLIGHT` 编辑器已补回

---

## 6. 当前仍然值得记住的注意点

### 1. `matchData` 还在继续变大

后面如果功能继续扩展，最容易失控的是字段堆积。

建议未来有机会时，把默认数据按模块拆注释或分区整理清楚。

### 2. `teamPresets` 和 `rosterPresetLibrary` 有一定重叠

后续要决定是否保留双系统，还是统一成一套。

### 3. 热更新偶尔会因为 hook 变动抽风

特别是开发中改过自定义 hook 内部 hook 数量时，最好直接硬刷新。

---

## 7. 下一阶段建议

### 近一步建议

1. 做一轮最终真实回归测试
2. 确认 `VIDEO / HIGHLIGHT` 场景真的各读各的字段
3. 检查 `defaultData` 是否还残留明显废字段

### 再下一阶段建议

1. 整理 `defaultData.js`
2. 梳理 `teamPresets` 与 `rosterPresetLibrary`
3. 考虑更正式的配置版本管理 / 备份恢复面板

---

## 8. 一句话记忆版

这套项目现在的主结构可以简单记成：

* `App.jsx`：总入口
* `ConsoleWorkspace.jsx`：控制台骨架
* `SharedUI.jsx + styles.js + editorUi.js`：样式系统
* `controls/*`：编辑器
* `scenes/*`：播出画面
* `hooks/*`：状态与交互逻辑
* `MatchContext`：共享状态入口

当前已从“能跑”进入“可维护”阶段。
