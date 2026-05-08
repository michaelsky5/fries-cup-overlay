# 🍟 FCUP Broadcast Control System  
## 薯条杯赛事导播总控系统

![Version](https://img.shields.io/badge/version-1.0.0--beta-f4c320?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![OBS WebSocket](https://img.shields.io/badge/OBS_WebSocket-v5-black?style=for-the-badge&logo=obsstudio)
![Status](https://img.shields.io/badge/status-Broadcast%20Ready-2a2a2a?style=for-the-badge)

**FCUP Broadcast Control System** 是一套为《守望先锋》社区赛事设计的网页端导播控制与赛事包装系统。

它的核心目标不是单纯做一个计分板，而是构建一套完整的赛事导播工作站：从比分控制、地图池管理、BAN 位展示、首发阵容、赛后数据、解说席、视频播放，到 OBS Overlay 输出与快捷键操作，全部集中在同一个控制系统中完成。

本项目最初为 **FRIES CUP / 薯条杯** 赛事打造，适用于小型赛事、社区锦标赛、线上杯赛和多场景 OBS 转播工作流。

---

## 核心定位

```txt
Console Workspace 负责控制。
Overlay Scene 负责播出。
OBS 负责最终捕获与推流。
```

系统采用控制端与播出端分离的设计：

- **Console Workspace / 导播控制台**  
  面向导播使用，负责编辑、切场、比分、BAN、地图、阵容、视频、数据图文等全部操作。

- **Overlay Scene / OBS 渲染层**  
  面向 OBS 浏览器源捕获，只负责接收状态并渲染干净的 16:9 直播画面。

- **State Bus / 状态总线**  
  使用本地状态、`localStorage`、跨窗口同步和 OBS WebSocket 进行状态传递。

---

## 功能概览

### 1. 比赛实况 / Live HUD

- 实时比分控制
- 当前地图显示
- BO3 / BO5 / BO7 地图序列支持
- 队名、简称、队标、队标底色管理
- 选手名牌显示开关
- BAN 位显示与 BAN 阶段图层
- 攻防方状态显示
- 语音监听频道状态显示
- 底部 Ticker 滚动条
- 自动入场信息触发

---

### 2. 地图池 / Map Pool

- 当前比赛地图序列编辑
- 全局赛事地图池编辑
- 支持 Control / Escort / Hybrid / Push / Flashpoint / Clash
- 支持按模式禁用地图类型
- 支持每张地图独立记录：
  - 地图类型
  - 地图名称
  - 选图方
  - 胜者
  - BAN 位
  - 攻防互换
- 支持全量地图池展示与比赛序列展示

---

### 3. 阵容系统 / Roster

- A / B 两队独立阵容管理
- 5–7 名选手支持
- 选手字段：
  - 昵称
  - BattleTag
  - 职责
  - 英雄
  - 英雄图像
  - 缩放
  - 亮度
  - 坐标微调
- 支持队伍预设保存与载入
- 支持经理与教练信息
- 支持俱乐部名称展示
- 支持将指定队伍阵容直接切入直播

---

### 4. 解说与采访 / Caster & Interview

- 解说席信息编辑
- 最多 4 名解说 / 嘉宾 / 赛管
- 支持头像路径与本地上传
- 支持采访框：
  - 具体选手发言
  - 队伍代表发言
  - 全队发言
- 支持自动读取队伍与选手信息
- 支持手动覆盖采访对象与身份

---

### 5. 倒计时与赛程 / Countdown

- 全屏倒计时画面
- 视频背景模式
- 自定义主标题、副标题、底部状态
- 赛程板编辑
- 最多 4 条 Upcoming Match
- 支持队伍 logo、时间、阶段、比分展示

---

### 6. 赛后数据 / Stats

- 图片上传模式
- 数据模板模式
- PRO 自动裁切模式
- 支持 OCR 辅助录入
- 支持统计项：
  - 总消灭
  - 总助攻
  - 总死亡
  - 总伤害
  - 总治疗
  - 总承伤 / 阻挡
- 支持 A / B 队数据互换
- 支持模板字段显示开关

---

### 7. 数据图文 / Data Graphics

系统内置多种数据包装画面：

- 选手聚焦 / Player Spotlight
- 选手对位 / Player Matchup
- 队伍对比 / Team Comparison
- 地图剖析 / Map Profile
- 排行榜单 / Leaderboard

数据图文模块适合用于：

- 赛前包装
- 中场分析
- 赛后总结
- 社媒截图
- 直播间转场素材

---

### 8. 视频与高光 / Video & Highlight

- 视频素材库
- 播放队列
- 当前播放视频控制
- Web 渲染模式
- OBS Local 模式
- 高光片段素材库
- 高光播放队列

适合作为：

- 暖场视频
- 英雄预览
- 赛事宣传片
- 赛后回放包装

---

### 9. 封面生成 / Broadcast Cover

- 通用封面
- 对阵封面
- 品牌封面
- 支持导出图片
- 支持队伍预设读取
- 支持解说、赛管、阶段、赛制、时间信息

适合生成：

- 比赛前瞻图
- 直播封面
- 社交媒体宣发图
- Matchday 海报

---

### 10. 快捷键系统 / Global Shortcuts

系统支持全局快捷键：

- TAKE
- 切换 LIVE / CASTERS / MAP POOL / ROSTER / WINNER
- A / B 队加减分
- A / B 队判胜
- 下一张 / 上一张地图
- 重置比分
- 开关 Ticker
- 开关 BAN 面板
- 开关选手名牌
- 切换语音监听
- 打开快捷键设置
- 锁定 / 解锁 Pro 模式

快捷键会避开输入框、弹窗和编辑状态，避免直播中误触。

---

## 系统模式

### Basic Mode / 基础模式

适合临场导播快速使用。

默认开放：

- LIVE
- MAP POOL
- COUNTDOWN
- STATS

### Pro Mode / 专业模式

适合完整赛事包装制作。

开放全部模块：

- LIVE
- MAP POOL
- ROSTER
- STATS
- DATA GRAPHICS
- CASTERS
- COUNTDOWN
- HIGHLIGHT
- VIDEO
- TEAM DB
- COVER

---

## 项目结构

```txt
src/
├── App.jsx
│   └── 应用入口、Overlay 判断、OBS 同步、全局路由、快捷键注入
│
├── assets/
│   └── logos/
│       └── 队标与赛事 Logo 资源
│
├── components/
│   ├── auth/
│   │   ├── IntroSplashScreen.jsx
│   │   ├── NoticeScreen.jsx
│   │   └── LoginModeScreen.jsx
│   │
│   ├── common/
│   │   ├── FriesModal.jsx
│   │   └── SharedUI.jsx
│   │
│   ├── layout/
│   │   ├── ConsoleWorkspace.jsx
│   │   └── RightSidebar.jsx
│   │
│   ├── controls/
│   │   ├── LiveEditor.jsx
│   │   ├── MapPoolEditor.jsx
│   │   ├── RosterEditor.jsx
│   │   ├── CasterEditor.jsx
│   │   ├── CountdownEditor.jsx
│   │   ├── StatsEditor.jsx
│   │   ├── VideoEditor.jsx
│   │   ├── HighlightEditor.jsx
│   │   ├── CoverEditor.jsx
│   │   ├── TeamDBEditor.jsx
│   │   ├── ShortcutSettingsModal.jsx
│   │   └── graphics/
│   │       ├── PlayerSpotlightPanel.jsx
│   │       ├── PlayerComparisonPanel.jsx
│   │       ├── TeamComparisonPanel.jsx
│   │       ├── MapProfilePanel.jsx
│   │       └── LeaderboardPanel.jsx
│   │
│   └── scenes/
│       ├── MatchLiveHUD.jsx
│       ├── MapPoolScene.jsx
│       ├── RosterScene.jsx
│       ├── CasterScene.jsx
│       ├── CountdownScene.jsx
│       ├── StatsScene.jsx
│       ├── VideoScene.jsx
│       ├── HighlightScene.jsx
│       ├── WinnerScene.jsx
│       ├── BroadcastCoverScene.jsx
│       ├── StingerTransition.jsx
│       └── graphics/
│           ├── PlayerSpotlightScene.jsx
│           ├── PlayerComparisonScene.jsx
│           ├── TeamComparisonScene.jsx
│           ├── MapProfileScene.jsx
│           └── LeaderboardScene.jsx
│
├── constants/
│   ├── defaultData.js
│   ├── gameData.js
│   ├── logos.js
│   └── styles.js
│
├── contexts/
│   ├── MatchContext.jsx
│   └── OBSContext.jsx
│
├── hooks/
│   ├── useMatchState.js
│   ├── useHistory.js
│   ├── useSceneController.js
│   ├── useKeyboardShortcuts.js
│   └── useViewport.js
│
├── locales/
│   ├── en/translation.json
│   └── zh/translation.json
│
└── utils/
    ├── index.js
    ├── editorUi.js
    └── imageHelper.js
```

---

## 关键架构

### 1. `useMatchState`

全局比赛状态中心。

负责：

- 初始化 `defaultData`
- 读取本地缓存
- 清理失效 `blob:` URL
- 合并旧缓存与新默认字段
- 防抖保存到 `localStorage`
- 跨标签页同步状态

---

### 2. `useHistory`

全局撤销系统。

负责：

- 保存操作前快照
- 最多保留 20 步历史
- 支持 Undo
- 使用深拷贝避免历史记录被引用污染

---

### 3. `useSceneController`

场景切换控制器。

负责：

- Program Scene
- Preview Scene
- Stinger Transition
- 自动入场触发
- TAKE 操作
- 切场历史记录

---

### 4. `MatchContext`

控制台组件与 Scene 组件之间的全局上下文。

提供：

- `matchData`
- `updateData`
- `updateWithHistory`
- `handleUndo`
- `showModal`
- `setPreviewScene`
- `takeScene`

---

### 5. `OBSContext`

OBS WebSocket 接入层。

负责：

- OBS 连接
- 连接状态
- 状态广播
- Overlay 同步
- 后续可扩展 OBS 场景与媒体源控制

---

## OBS 使用方式

### 1. 添加 Overlay 浏览器源

在 OBS 中添加一个 Browser Source：

```txt
URL: https://console.fries-cup.com/#overlay
Width: 1920
Height: 1080
```

如果使用 4K 输出：

```txt
Width: 3840
Height: 2160
```

系统会根据 `outputMode` 自动缩放内部 1920 × 1080 画布。

---

### 2. 使用 OBS WebSocket 自动连接

如果需要让 Overlay 自动连接 OBS WebSocket，可以使用：

```txt
https://console.fries-cup.com/?pwd=YOUR_PASSWORD#overlay
```

OBS 端需要开启：

```txt
Tools → WebSocket Server Settings
```

并启用：

- Enable WebSocket server
- Enable authentication

---

### 3. 导播控制台

控制台页面直接打开：

```txt
https://console.fries-cup.com/
```

推荐在导播电脑或第二块屏幕中打开。

---

## 本地开发

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

---

## 资源规范

### 队标

队标放置于：

```txt
src/assets/logos/
```

支持格式：

```txt
png / jpg / jpeg / webp / svg
```

系统会通过 `import.meta.glob` 自动扫描并生成 `LOGO_LIST`。

---

### 英雄头像

英雄头像建议放置于：

```txt
public/assets/heroes/tank/
public/assets/heroes/damage/
public/assets/heroes/support/
```

阵容英雄图建议放置于：

```txt
public/assets/roster/tank/
public/assets/roster/damage/
public/assets/roster/support/
```

命名应与 `gameData.js` 中的英雄 key 保持一致，例如：

```txt
winston.png
tracer.png
kiriko.png
```

---

### 地图背景

地图背景建议放置于：

```txt
public/assets/maps/
```

推荐按模式分类：

```txt
public/assets/maps/Control/
public/assets/maps/Escort/
public/assets/maps/Hybrid/
public/assets/maps/Push/
public/assets/maps/Flashpoint/
public/assets/maps/Clash/
```

---

### 视频素材

视频素材可使用：

```txt
public/assets/videos/
```

也可以使用外部 HTTPS URL。

示例：

```txt
/assets/videos/warmup.mp4
https://example.com/video.mp4
```

---

## 多语言支持

系统支持：

- 中文
- 英文

翻译文件位于：

```txt
src/locales/zh/translation.json
src/locales/en/translation.json
```

主要覆盖：

- 登录与模式选择
- 控制台
- 右侧状态栏
- Live Editor
- Map Pool Editor
- Roster Editor
- Stats Editor
- Team DB
- Video / Highlight
- Data Graphics
- Shortcuts
- 地图名
- 英雄名

---

## 数据安全与恢复

系统包含多层保护：

### 1. 自动保存

比赛数据会自动保存到本地 `localStorage`。

### 2. Undo

高危操作会记录历史快照，支持撤销。

### 3. Snapshot

右侧栏支持手动快照保存与恢复。

### 4. Import / Export

可以导出完整比赛配置，也可以从 JSON 导入配置。

### 5. Blob 清理

系统会自动清理刷新后失效的本地 `blob:` 图片链接，避免旧缓存导致画面异常。

---

## 推荐直播工作流

### 开播前

1. 打开控制台
2. 设置输出分辨率
3. 进入 Pro Mode
4. 导入或配置战队数据库
5. 设置 A / B 队信息
6. 设置地图池与比赛赛制
7. 设置解说与倒计时
8. 打开 OBS Overlay 浏览器源
9. 测试 TAKE、比分、BAN、Ticker、Winner Scene
10. 保存 Snapshot

---

### 比赛中

推荐流程：

```txt
倒计时 → 解说席 → 地图池 → 首发阵容 → LIVE → 单图结算 → 下一图
```

每张地图结束后：

```txt
TEAM A WIN / TEAM B WIN
```

系统会自动：

- 写入当前地图胜者
- 重算总比分
- 更新 Winner Scene
- 保持可撤销历史

---

### 赛后

1. 推送 Winner Scene
2. 录入或上传赛后数据
3. 切 Stats Scene
4. 生成数据图文
5. 导出封面或宣传图
6. 保存最终 Snapshot
7. 导出完整配置 JSON

---

## 当前稳定性说明

当前版本已经包含：

- 自动保存防抖
- 旧缓存字段补齐
- Undo 深拷贝快照
- Overlay 状态同步
- 自动入场触发
- `winner / winnerSide` 兼容
- 中英文 scene id 映射
- 阵容预设 logo 兼容
- 图片处理基础容错
- 快捷键弹窗与输入框防误触

---

## Roadmap

后续计划包括：

- [ ] 更完整的 OBS 媒体源控制
- [ ] Replay Buffer 高光自动接入
- [ ] 更细粒度的 Team DB 数据校验
- [ ] Roster 图片资源管理优化
- [ ] 数据图文模块接入真实赛季数据库
- [ ] Overlay 独立部署页面拆分
- [ ] 移动端控制台布局优化
- [ ] 更多赛事品牌模板
- [ ] 自动生成赛后报告
- [ ] 与 Fries Cup League Center 数据打通

---

## 注意事项

- 不建议在直播中随意使用 HARD RESET。
- 使用 Import Config 前建议先保存 Snapshot。
- 本地上传图片在刷新页面后可能失效，正式直播建议使用稳定 public 资源路径。
- OBS Browser Source 建议固定 1920 × 1080 或 3840 × 2160。
- 不建议使用浏览器缩放影响 Overlay 页面比例。
- 直播前请完整测试一次：
  - 切场
  - 加分
  - 判胜
  - BAN 位
  - 自动入场
  - Winner Scene
  - 视频播放
  - Undo

---

## Author

**MICHAELSKY5**

Built for **FRIES CUP / 薯条杯**.

```txt
A PROJECT BUILT BY MICHAELSKY5 FOR THE FRIES CUP BROADCAST SYSTEM.
```