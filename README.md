🏆 FCUP Broadcast Control System (FCUP 赛事导播总控系统)
一个专为电子竞技（特别是《守望先锋》）打造的统一化、高性能 Web 导播工作站。提供赛事总控、推流路由、场景切换、数据追踪以及 OBS 远程联动等全链路解决方案。

本系统采用极致的“工业/赛博”设计美学（黑/黄/白 高对比度），并在底层进行了深度性能优化，确保在长时高压的赛事直播环境下提供丝滑、零延迟的操作体验。

✨ 核心特性 (Key Features)
⚡ 极致性能与硬件加速

深度应用 React.memo 阻断无效重绘。

独创 AutoFitScene 机制，通过直接劫持原生 DOM transform 启用 GPU 硬件加速，完美绕过 React 渲染周期，实现推流画面的零延迟自适应缩放。

🌍 原生双语支持 (i18n)

内置完整的中文 (zh) 与英文 (en) 词典。

支持 UI 层面的无缝切换，同时支持将多语言文本作为数据变量直接渲染至推流画面（如中英双语阶段标签）。

🎮 全景赛事控制 (Live Control)

比分与状态：实时比分、当前地图、赛制追踪。

BP 系统 (Ban/Pick)：可视化的地图池 BP 与英雄禁用逻辑，支持先手/后手及红蓝换边。

动态阵容 (Roster)：场上选手/替补状态一键切换，高光 (Key Player) 标记，实时同步推流。

🤖 OCR 像素级数据提取 (Smart Stats)

集成 Tesseract.js，支持通过截图、拖拽或剪贴板 (Ctrl+V) 上传赛后结算图。

自动裁切、灰度处理并识别双方队伍的 击杀/助攻/死亡/伤害/治疗/减伤 数据，一键应用至数据面板。

📡 OBS 深度联动 (OBS WebSocket)

内置 WebSocket 客户端，支持跨设备（如 iPad）远程遥控运行在导播机的 OBS。

一键下发媒体源播放指令（如高光集锦、选手宣传片）。

💾 时空回溯级别的状态管理 (Time-Travel State)

全局历史：支持操作的撤销 (Undo) 与重做，防止误触。

数据快照：支持每 30 秒自动保存 (Autosave) 或手动留存数据快照，随时穿梭回档。

📸 一键海报生成 (Canvas Export)

集成 html2canvas，根据当前的对阵、比分、解说阵容，一键生成 1080P/4K 级赛事预告图/结算图并导出下载。

🏗️ 架构与模块 (Architecture & Modules)
系统采用高度模块化的设计，左侧为快速场景直推区 (Auto-Take Deck) 与监视器 (Monitors)，右侧为数据总库与日志 (Right Sidebar)，中央为核心功能区：

Live Editor (直播核心)：掌控实时比分、语音监听频道 (Comms)、选手替换与动态触发器。

Map Pool Editor (地图池)：配置赛事全局地图池，控制比赛进程、选图、胜者以及英雄 Ban 位。

Roster Editor (阵容库)：管理双方队伍名单、教练组、战网 ID 以及选手资产（立绘缩放、亮度、坐标微调）。

Caster Editor (解说席)：配置最多 4 名解说的信息及头像资产。

Countdown Editor (倒计时)：控制赛前倒计时、跑马灯 (Ticker) 以及后续的赛程预告板。

Highlight & Video Editor (流媒体)：管理本地视频素材库，建立播放队列 (Playlist) 并直接向 OBS 下发播放指令。

Stats Editor (赛后数据)：结合 OCR 技术，快速录入并核对赛后数据模板。

Cover Editor (封面引擎)：配置通用/对阵模式的品牌视觉，一键导出高清宣传图。

Team DB Editor (战队总库)：JSON 格式的战队数据导入/导出，方便跨赛季管理。

🚀 快速开始 (Getting Started)
环境要求
Node.js >= 16.x

npm 或 yarn

安装与运行
Bash
# 1. 克隆仓库
git clone https://github.com/your-username/fries-cup-overlay.git

# 2. 进入目录
cd fries-cup-overlay

# 3. 安装依赖
npm install
# 或者
yarn install

# 4. 启动开发服务器 (默认端口 3000)
npm start
# 或者
yarn start
部署到生产环境
Bash
npm run build
📡 OBS 联动指南 (OBS Setup Guide)
在运行 OBS 的电脑上，打开 工具 -> WebSocket 服务器设置。

勾选 启用 WebSocket 服务器 和 启用身份验证，设置密码（例如：123456）。

在 OBS 中添加一个尺寸为 1920x1080 的 浏览器源 (Browser Source)。

将该源的 URL 设置为（需替换为你部署的地址和密码）：
https://your-domain.com/?pwd=你的密码#overlay

在其他设备（如平板电脑）上打开系统，在顶部导航栏输入 OBS 电脑的局域网 IP 与密码，点击 CONNECT 即可开始遥控。

🛠️ 技术栈 (Tech Stack)
UI 框架: React (Hooks, Context API, React.memo)

国际化: i18next, react-i18next

图像处理: tesseract.js (OCR), html2canvas (DOM 转图像)

通信: obs-websocket-js (OBS 远程控制)

样式: 内联 CSS 结合高定制化常量 (src/constants/styles.js)，无外部 UI 库依赖，极致轻量。

🤝 贡献与许可 (License)
本项目采用 MIT 许可证。保留所有对 FCUP 品牌视觉资产（Logo、字体排版方案等）的最终解释权。