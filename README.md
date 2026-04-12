Markdown
# 🍟 FCUP Broadcast Control System (薯条杯赛事导播总控系统)

![Version](https://img.shields.io/badge/version-1.0.0--beta-f4c320?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![OBS WebSocket](https://img.shields.io/badge/OBS_WebSocket-v5-black?style=for-the-badge&logo=obsstudio)

FCUP Broadcast Control System 是一套专为《守望先锋》(Overwatch) 赛事设计的**双轨制电竞转播包装系统**。它将高强度的“赛事数据控制台”与供 OBS 捕获的“高帧率实况渲染层”进行了物理隔离，并深度集成了 OBS WebSocket 控制，为现场导播提供演播室级别的流媒体制播体验。

## ✨ 核心特性 (Core Features)

* 🎛️ **双轨物理隔离 (Dual-Screen Architecture)**
  * **Console Workspace (操作台)**：响应式多密度 UI（支持 1080P 至 4K 监视器），集成全部赛况控制逻辑。
  * **Overlay Scenes (渲染层)**：纯净的数据接收端，包含入场动画、计分板、赛程池等，专供 OBS 浏览器源捕获，深度优化 CSS 硬件加速 (60FPS+)。
  * **毫秒级同步**：基于 `localStorage` 的跨窗口状态总线，实现控制台与渲染画面的零延迟通信。
* ⏱️ **全局容错引擎 (Time-Machine History)**
  * 为加减分、换人、切图等高危操作提供最高 20 步的全局 Undo (撤销) 保护机制。
* 🔌 **OBS 底层联动 (Hardware Integration)**
  * 内置 OBS WebSocket，支持在网页端直接遥控 OBS 场景切换、硬切回放 (Highlights) 与媒体源 (Video Playback) 播放。
* 🏆 **全覆盖赛事模块 (Complete Tournament Modules)**
  * **Live HUD**: 实时计分板、BP 状态、攻防选边、语音频道监听指示、自动轮播 Ticker。
  * **Map Pool**: 支持 BO3/BO5/BO7 的比赛地图序列编辑，与赛事全局图池概览。
  * **Roster**: 可视化选手大名单，支持坐标与缩放微调，原生 Blob URL 无损人像挂载。
  * **Cover Generator**: 内置海报生成器，结合 `html2canvas` 一键导出对阵前瞻图。

## 📁 目录结构 (Project Structure)

```text
src/
├── assets/          # 静态资源 (Logo、选手立绘、地图背景等)
├── components/
│   ├── auth/        # 系统鉴权、闪屏与配置检视页
│   ├── common/      # 基础 UI 库 (SharedUI, 弹窗等)
│   ├── controls/    # 【核心】控制台各类数据编辑器 (Live, MapPool, Roster...)
│   ├── layout/      # 控制台框架结构与右侧备份边栏
│   └── scenes/      # 【核心】专供 OBS 捕获的渲染源 (MatchLiveHUD, WinnerScene...)
├── constants/       # 全局配置 (颜色令牌、默认数据、守望先锋地图/英雄数据库)
├── contexts/        # 状态总线 (MatchContext, OBSContext)
├── hooks/           # 自定义钩子 (状态中心、时光机、视图控制、快捷键)
└── utils/           # 辅助函数库
🚀 部署与使用 (Getting Started)

OBS 捕获设置 (OBS Setup)
在 OBS 中添加两个浏览器源 (Browser Source)：

渲染源 (Overlay)：指向 https://console.fries-cup.com/#overlay

宽度: 1920

高度: 1080

勾选: "通过 OBS 控制音频" (若需捕捉网页播放的回放声音)

操作源 (可选/第二显示器打开)：直接在导播电脑的 Chrome 浏览器中打开 console.fries-cup.com。系统会自动进入鉴权页与操作台。

🛠️ 路线图与待优化项 (Roadmap & Known Issues)
(注：以下为 Beta 阶段重点性能攻坚方向)

[ ] I/O 节流阀 (I/O Throttling)：重构 useMatchState 中的 localStorage.setItem，引入防抖机制，解决高频打字和拖拽时的 React 主线程阻塞问题。

[ ] 渲染隔离 (Render Isolation)：为 LiveEditor 和 RosterEditor 等重型表单组件内部的列表渲染套用 React.memo，阻断不必要的连带重绘雪崩。

[ ] 内存安全 (Memory Management)：在 Roster / Stats 面板的图片本地上传逻辑中，增加 URL.revokeObjectURL 机制，防止 Blob URL 堆积导致 OOM (内存泄漏)。

[ ] 媒体自动播放安全 (AutoPlay Policy)：为所有 <video> 标签在挂载瞬间显式声明 muted 属性，绕过现代浏览器的自动播放静音限制。

[ ] Vite 资产路径对齐：统一 import.meta.glob 与硬编码字符串路径的打包逻辑，建议将高频更换的赛事素材统一移入 /public 目录。

👨‍💻 作者 (Author)
MICHAELSKY5 - Built for the FRIES CUP