# AGENTS.md

本文件用于沉淀本仓库的协作约定，供后续 AI 助手与协作者共同遵守。内容以用户明确提出的要求为准，未确认的事项一律标注「待补充」，不做推测性规定。

## 一、提交规则

- 每一次改动都必须形成一次独立的提交：完成一项修改后立即执行提交，不允许把改动留在工作区或暂存区。收工时仓库不应存在未提交的悬空改动。
- 提交前先确认本次改动范围清晰；一次提交只包含一个主题，不把无关改动混在同一次提交中。
- 提交信息需准确说明改动目的，遵循团队 Git 规范（Conventional Commits）。
- 每次改动完成后由 AI 直接生成提交信息并执行提交，无需逐次等待用户确认。

## 二、技术栈

公司专注于全端软件解决方案（iOS/Android/Web/Desktop/嵌入式）及 AI 能力集成（NLP/ML/生成式模型）。

### 2.1 总原则

- 公司以 monorepo 形式开发。
- 以下为公司常用技术栈，不构成强制约束：具体选型需根据项目实际情况而定。文中「首选」「次选」「不建议」等标注是栈内的选择倾向，选型时结合项目实际判断。
- 本文件只记录技术项，不记录版本号；原文未给出的版本不做补充。

### 2.2 前端与客户端

#### 网页端（或 PWA）

核心基建：

- TypeScript + Vite + Tailwind CSS / SCSS + Storybook + tsup

框架选型：

| 框架 | 配套技术 |
| --- | --- |
| React（首选） | React Router + Zustand + Shadcn/UI + TanStack Query + TanStack Form + Zod |
| Svelte（次选） | Svelte Store + Svelte Router + Melt UI + TanStack Query + Felte + Zod |
| SolidJS | Solid Store + Solid Router + Solid Form + Kobalte + TanStack Query + Zod |
| Vue | Vue Router + Vue Query + Pinia + Headless UI + VeeValidate + Zod |

样式方面核心基建写为「Tailwind CSS / SCSS」，具体取舍以 2.5 工程化与通用规范中的样式管理约定为准：以 Tailwind CSS 为主，视情况可结合 SCSS，但不建议。

#### 移动端

| 类别 | 技术 |
| --- | --- |
| 原生开发 - iOS | Swift + SwiftUI + Combine |
| 原生开发 - Android | Kotlin + Jetpack Compose |
| 跨平台/半原生 - React Native | React 体系 + React Navigation |
| 小程序/混合开发 - TaroJS | React 体系 |

#### 桌面端

- 框架：Tauri（首选）/ Electron
- 技术栈：React 体系 + Rust（Tauri 后端）/ NodeJS（Electron 后端）

### 2.3 服务端

#### 服务端分层架构

- Web 业务层：Node.js + MidwayJS + TypeScript + TypeORM
- 高性能/特定场景：
  - Rust：Axum / Clap + Tokio + SQLx（高并发/底层）
  - Golang：Chi / Cobra + PGx（中高并发/底层）
  - LUA：OpenResty/脚本逻辑（网关/特定业务）
- 基础设施：K8S + Docker + RabbitMQ（首选）/ Kafka（配合 CDC 工具使用）+ PostgreSQL + Redis

#### 数据存储

| 用途 | 技术 |
| --- | --- |
| 核心数据库 | PostgreSQL |
| 分析数据库 | ClickHouse / StarRocks（首选） |
| 本地存储 | SQLite（前端/设备端轻量级存储） |
| 缓存 | Redis |

### 2.4 硬件开发（IoT）

- 平台：ESP32 / Arduino / 嵌入式 Linux
- 语言：
  - C/C++（Arduino/ESP-IDF）
  - MicroPython / Python
  - Rust（Embedded）
  - Golang（TinyGo）
  - LUA（NodeMCU/Embedded）
- 通信：MQTT

### 2.5 工程化与通用规范

| 类别 | 内容 |
| --- | --- |
| 包管理/Monorepo | Turborepo + Changesets + pnpm |
| 代码与提交规范 | ESLint + Prettier + Husky |
| 测试体系 - 前端 | Vitest |
| 测试体系 - 后端 | Mocha / 原生测试框架（Go/Rust） |
| 样式管理 | Tailwind CSS 为主，视情况可结合 SCSS（但不建议） |
| 构建工具 | Vite（应用）、tsup（库） |
| 安全 | OAuth 2.0 with PKCE + OIDC + DPoP + FAPI L2 + Refresh Token Rotation + TLS 1.2+ |

## 三、代码与文档约定

- 交付物用于正式场景：不使用 emoji 或装饰性符号，状态用纯文字描述。
- ASCII/Unicode 字符画所需的框线字符与箭头可保留作为图示记号。
- 代码注释与文档语言：待补充。

## 四、目录与文件管理

- 主工作目录：/Users/macmima1234/Documents/Temp-BoomCat
- 临时脚本、草稿、调试输出、缓存等中间产物不得混入正式交付目录，具体存放位置：待补充。

## 五、Git 远程与分支

- 配置或修改远程仓库地址时，统一使用仓库页面上的 SSH 地址（git@github.com:...），不使用 HTTPS 地址。
- 分支命名规范：待补充。
- 合并与发布流程：待补充。

## 六、验证与质量要求

- 声明任务完成前需实际执行验证并确认结果，不接受未验证的完成结论。
- 构建、测试、检查命令：待补充。

## 七、待补充事项

- 各技术栈的具体版本约束：待补充（技术项已见第二节，原文未给出版本号）。
- 目录结构说明：待补充（已知采用 monorepo，目录划分未确定）。
- 依赖安装与本地运行方式：待补充（工具链为 pnpm + Turborepo，具体命令未确定）。
- 环境变量与密钥管理方式：待补充。
- 提交信息示例与范围（scope）约定：待补充。
- 其他团队约定：待补充。
