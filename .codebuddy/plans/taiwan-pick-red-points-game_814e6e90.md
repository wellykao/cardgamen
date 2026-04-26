---
name: taiwan-pick-red-points-game
overview: 开发「台湾捡红点」网页卡牌游戏，Vue3+TypeScript技术栈，对标斗地主UI交互风格，4人对局（1人+3AI），含完整大厅/房间UI、牌桌游戏、操作日志、延时动画、计分结算等全部功能。
design:
  architecture:
    framework: vue
    component: tdesign
  styleKeywords:
    - 斗地主经典棋牌风格
    - 深绿牌桌
    - 金色点缀
    - 木质边框
    - 传统扑克
    - 沉浸式
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 28px
      weight: 700
    subheading:
      size: 18px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#C41E3A"
      - "#D4AF37"
      - "#8B0000"
    background:
      - "#1B5E20"
      - "#2E7D32"
      - "#1A1A2E"
    text:
      - "#FFFFFF"
      - "#F5F5DC"
      - "#FFD700"
    functional:
      - "#4CAF50"
      - "#FF5252"
      - "#FFC107"
todos:
  - id: init-project-engine
    content: 初始化Vue3+TS+Vite项目，安装全部依赖，实现核心引擎模块（types/constants/Card/Deck/RuleEngine/ScoreEngine/TurnManager/GameState/AIPlayer）
    status: completed
  - id: store-animation-system
    content: 实现Pinia状态管理（gameStore/lobbyStore/settingsStore）+动画队列控制器（useAnimationQueue）+音效/计时composable
    status: completed
    dependencies:
      - init-project-engine
  - id: lobby-room-ui
    content: 开发登录页、大厅页、房间等待页（LoginView/LobbyView/RoomView及lobby组件），完成模拟匹配流程
    status: completed
    dependencies:
      - store-animation-system
  - id: game-table-ui
    content: 开发游戏主页面全量UI（GameView/GameTable/CardItem/PlayerHand/TableCenter/PlayerSeat/TurnTimer/ActionPanel），串联完整对局交互流程
    status: completed
    dependencies:
      - store-animation-system
  - id: log-scoring-system
    content: 实现操作日志面板（OperationLog）+实时计分面板（ScoreBoard/ScorePopup），集成分步延时判定与分数浮动提示
    status: completed
    dependencies:
      - game-table-ui
  - id: settlement-victory
    content: 开发结算页（SettlementView/ResultPanel/ScoreDetail），实现三种胜利条件判定逻辑与结算动画
    status: completed
    dependencies:
      - log-scoring-system
  - id: polish-responsive
    content: 完善规则弹窗、设置面板、音效集成、移动端响应式适配、视觉特效打磨
    status: completed
    dependencies:
      - settlement-victory
---

## 产品概述

台湾捡红点——4人休闲棋牌网页游戏，UI/交互/布局/操作手感完全对标欢乐斗地主经典风格。单机+AI对手模式，含完整大厅房间流程模拟。

## 核心功能

- 登录/大厅/创建房间/四人匹配（模拟联机流程，实际3个AI对手）
- 完整发牌（每人6张手牌+桌面4张公共牌）、弃牌重置、第4人底牌特权
- 全自动合法收牌判定：两张凑10回收（A-9）、同点对子回收（10/J/Q/K），禁止多张组合
- 回合管理：出1张手牌→判定收牌→翻1张新牌→再判定→回合结束，不可跳过
- 翻牌延时动画+分步判定（出牌停顿0.6-0.8秒、收牌慢放、翻牌慢速展示）
- 右侧操作流水日志面板（实时记录每步动作：出牌、收牌、翻牌、凑10、对子、分变、回合切换）
- 实时计分（A特殊分值、红色牌计分、黑色仅黑桃A计分，总分240固定）
- 三种胜利条件判定+完整结算面板（240分直接胜/0分直接胜/常规分高者胜）
- 规则弹窗、设置面板、音效、斗地主风格视觉特效
- 网页端+移动端响应式适配

## 技术栈

- 前端框架：Vue3 + TypeScript + Vite
- 状态管理：Pinia
- 路由：Vue Router 4
- 样式：Tailwind CSS（定制斗地主主题色）
- 组件库：TDesign Vue Next（基础组件Modal/Button/Toast等，游戏组件全部自定义）
- 动画：Vue Transition + CSS Animation + requestAnimationFrame
- 卡牌资源：开源Vector Playing Cards SVG（52张+1牌背）
- 音效：Howler.js

## 实现方案

### 整体策略

采用分层架构，将游戏引擎（纯TS逻辑层）与Vue表现层彻底分离。引擎层不依赖任何Vue API，可在Node环境独立运行和测试。Vue层通过Pinia store桥接引擎状态与UI渲染。

### 核心架构

```
┌─────────────────────────────────────────┐
│              Vue 表现层                   │
│  Views → Components → Composables        │
│       ↕ Pinia Store (桥接)               │
├─────────────────────────────────────────┤
│            游戏引擎层 (纯TS)              │
│  GameState → TurnManager → RuleEngine    │
│  Deck → Card → ScoreEngine → AIPlayer    │
├─────────────────────────────────────────┤
│          动画控制器 (独立模块)             │
│  AnimationQueue → DelayStep → Callback   │
└─────────────────────────────────────────┘
```

### 关键技术决策

1. **动画队列系统**：采用Promise链式队列，每个操作步骤（出牌→判定→收牌→翻牌→判定）强制插入延时，确保玩家看清每一步。使用`async/await`控制流程，避免回调地狱。
2. **引擎与UI分离**：RuleEngine纯函数式设计，输入桌面状态+出牌，输出所有合法组合。便于单元测试和AI决策。
3. **AI策略**：贪心算法，优先收取高分红色牌，其次凑10，无匹配时打出最低分手牌。
4. **收牌判定逻辑**：出牌/翻牌后，遍历桌面所有牌与当前牌两两判定（sum=10或同点），所有合法对全部收取，包括当前牌+所有匹配的桌面牌。
5. **响应式布局**：CSS Grid + Tailwind断点，移动端纵向压缩牌桌，手牌区域自适应宽度，日志面板可折叠。

### 性能与可靠性

- 牌桌动画使用CSS transform/opacity，避免layout thrashing
- Pinia store使用`$patch`批量更新状态，减少不必要的响应式触发
- 动画队列支持中断（如用户中途离开），避免内存泄漏
- AI思考时间模拟0.8-1.5秒随机延时，避免零延迟出牌

## 目录结构

```
cardgame/
├── public/
│   ├── cards/                        # 开源扑克牌SVG资源（52张+牌背）
│   └── sounds/                       # 音效文件（出牌、收牌、翻牌、胜利等）
├── src/
│   ├── assets/
│   │   └── styles/
│   │       ├── variables.css         # [NEW] CSS变量：主题色、牌桌尺寸、动画时长
│   │       └── global.css            # [NEW] 全局样式：重置、字体、牌桌背景
│   ├── components/
│   │   ├── common/                   # [NEW] 通用UI组件
│   │   │   ├── BaseButton.vue        # 斗地主风格按钮
│   │   │   ├── BaseModal.vue         # 通用弹窗（基于TDesign Dialog定制）
│   │   │   ├── BaseAvatar.vue        # 玩家头像组件
│   │   │   └── BaseToast.vue         # 分数变动提示
│   │   ├── lobby/                    # [NEW] 大厅组件
│   │   │   ├── RoomList.vue          # 房间列表
│   │   │   ├── CreateRoomModal.vue   # 创建房间弹窗
│   │   │   └── MatchAnimation.vue    # 匹配动画
│   │   ├── game/                     # [NEW] 游戏桌面组件
│   │   │   ├── GameTable.vue         # 牌桌主布局（绿色桌面+四方位）
│   │   │   ├── CardItem.vue          # 单张牌（正面/背面/选中/动画态）
│   │   │   ├── PlayerHand.vue        # 玩家手牌区（横排/扇形）
│   │   │   ├── TableCenter.vue       # 桌面公共牌区域
│   │   │   ├── PlayerSeat.vue        # 玩家座位（头像+昵称+分数+牌数+回合标识）
│   │   │   ├── OperationLog.vue      # 右侧操作日志面板
│   │   │   ├── ScoreBoard.vue        # 实时计分面板
│   │   │   ├── TurnTimer.vue         # 出牌倒计时
│   │   │   ├── ActionPanel.vue       # 出牌操作区
│   │   │   └── ScorePopup.vue        # 加减分浮动提示
│   │   └── settlement/               # [NEW] 结算组件
│   │       ├── ResultPanel.vue       # 结算面板（排名+分数+加减分）
│   │       └── ScoreDetail.vue       # 个人分数明细
│   ├── composables/
│   │   ├── useAnimationQueue.ts      # [NEW] 动画队列控制器（Promise链+延时）
│   │   ├── useSound.ts              # [NEW] 音效播放（Howler.js封装）
│   │   └── useGameTimer.ts          # [NEW] 倒计时逻辑
│   ├── engine/                       # [NEW] 核心游戏引擎（纯TS，无Vue依赖）
│   │   ├── types.ts                 # 核心类型定义（Card, Suit, Rank, Player, GamePhase等）
│   │   ├── constants.ts             # 游戏常量（计分表、牌数、延时参数等）
│   │   ├── Card.ts                  # Card类（花色、点数、分值、显示名）
│   │   ├── Deck.ts                  # Deck类（洗牌、发牌、翻牌、底牌管理）
│   │   ├── RuleEngine.ts            # 收牌规则引擎（凑10判定、对子判定、合法组合查找）
│   │   ├── ScoreEngine.ts           # 计分引擎（单张分值、总分计算、胜负判定）
│   │   ├── TurnManager.ts           # 回合管理（出牌顺序、权限锁定、回合流转）
│   │   ├── GameState.ts             # 游戏状态机（阶段切换：发牌→弃牌检查→对局→结算）
│   │   └── AIPlayer.ts             # AI决策（贪心策略：优先收红牌、高分牌）
│   ├── stores/
│   │   ├── gameStore.ts             # [NEW] 主游戏状态（Pinia：牌桌、手牌、回合、动画）
│   │   ├── lobbyStore.ts            # [NEW] 大厅状态（房间列表、匹配状态）
│   │   └── settingsStore.ts         # [NEW] 设置（音量、动画速度、昵称）
│   ├── views/
│   │   ├── LoginView.vue            # [NEW] 登录页（输入昵称+头像选择）
│   │   ├── LobbyView.vue            # [NEW] 大厅页（房间列表+创建房间+快速匹配）
│   │   ├── RoomView.vue             # [NEW] 房间等待页（4人齐后倒计时开局）
│   │   ├── GameView.vue             # [NEW] 游戏主页面（整合所有game组件）
│   │   └── SettlementView.vue       # [NEW] 结算页（排名+分数+再来一局）
│   ├── router/
│   │   └── index.ts                 # [NEW] 路由配置
│   ├── App.vue                      # [NEW] 根组件
│   └── main.ts                      # [NEW] 入口（Vue3+Pinia+Router+TDesign注册）
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── env.d.ts
```

## 关键代码结构

```typescript
// engine/types.ts - 核心类型定义
enum Suit { Spade, Heart, Diamond, Club }
enum Rank { A=1, Two=2, Three=3, Four=4, Five=5, Six=6, Seven=7, Eight=8, Nine=9, Ten=10, Jack=11, Queen=12, King=13 }
enum GamePhase { Idle, Dealing, DiscardCheck, Playing, Settlement }

interface Card {
  id: string; suit: Suit; rank: Rank;
  points: number;      // A=1, 2-9=原值, 10/J/Q/K=10
  scoreValue: number;  // 计分用：黑桃A=30, 红桃A/方块A=20, 梅花A=0, 红2-8=面值, 红9/10/J/Q/K=10, 其余0
  isRed: boolean;
}

interface CollectPair {
  playedCard: Card; tableCard: Card; type: 'sum10' | 'pair';
}

// engine/RuleEngine.ts - 收牌判定核心
function findValidPairs(playedCard: Card, tableCards: Card[]): CollectPair[]
// 输入打出的牌+桌面牌，返回所有合法配对（凑10或同点对子）

// composables/useAnimationQueue.ts - 动画队列
interface AnimStep { action: string; delay: number; data?: any; }
function enqueue(step: AnimStep): Promise<void>
function enqueueBatch(steps: AnimStep[]): Promise<void>
// 串行执行动画步骤，每步强制delay毫秒停留
```

## 设计风格

仿欢乐斗地主经典棋牌风格，深绿色牌桌背景、木质边框、金色点缀，营造沉浸式牌局氛围。

## 页面规划（5页）

### 1. 登录页

- **背景块**：深色渐变背景，中心牌桌图案装饰
- **登录卡片块**：毛玻璃卡片居中，头像选择+昵称输入+确认按钮
- **装饰块**：扑克牌散落动画装饰

### 2. 大厅页

- **顶部导航栏**：游戏Logo+玩家信息+设置按钮
- **功能入口块**：快速匹配大按钮+创建房间+规则说明
- **房间列表块**：房间卡片网格（房间号、人数、状态）
- **底部信息栏**：在线人数、版本号

### 3. 房间等待页

- **桌面预览块**：四方位座位（已加入显示头像、空位显示等待动画）
- **房间信息块**：房间号、房主、准备状态
- **操作块**：准备/取消按钮

### 4. 游戏主页面（核心）

- **顶部栏**：4玩家头像+昵称+实时分数+回合高亮指示
- **左侧区域**：上方两AI玩家手牌（背面、牌数）
- **中央区域**：桌面公共牌（正面展示），出牌/收牌动画区
- **右侧面板**：操作流水日志（可滚动，最新在底），计分面板
- **底部区域**：自己手牌（正面横排扇形、点击选中高亮上移、出牌按钮），AI下方手牌（背面）
- **浮动元素**：倒计时环形进度、加减分弹幕、收牌飞行动画

### 5. 结算页

- **排名展示块**：1-4名排名卡片，冠军金色高亮+特效
- **分数明细块**：每人收牌明细、各牌分值、加减分对比基准60
- **胜利条件块**：高亮触发哪种胜利条件
- **操作块**：再来一局+返回大厅按钮

## 交互细节

- 手牌点击选中：卡牌上移15px+金色边框高亮
- 出牌动画：手牌飞向桌面中央（0.3s ease-out），到位后停顿0.6-0.8s
- 收牌动画：匹配牌对发光→滑向收取玩家（0.5s ease-in）
- 翻牌动画：牌背→3D翻转→正面（0.6s），翻后停顿0.4s再判定
- 分数变动：+10/-5等数字从玩家头像浮出上飘消失
- 回合切换：当前玩家头像金色光环脉冲

## Agent Extensions

### SubAgent

- **code-explorer**: 在项目搭建完成后，用于跨文件搜索验证模块间引用关系和依赖路径是否正确，确保引擎层与Vue层的桥接接口一致