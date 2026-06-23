# Email Requirement Intake Form (FHL demo)

> Graph Connector 邮件通知需求收集表单。单文件前端 `index.html`（MSAL SSO + 香草 JS）+ 同事的 Azure Function 后端 `api-src/`。

## Git / 部署（关键，结构有点绕）

- 工作分支：`dev-huichunli`（个人 demo 分支，**不要碰 `main`**）
- 两个 remote：
  - `origin` = `github.com/ms-anggao/...`（同事的；我只有 **Write** 权限，非 admin）→ 无 `CLAUDE.md`，驱动线上 demo
  - `mine` = `github.com/melusiness/...`（我自己的私有备份）→ **全量**，含 `CLAUDE.md`
- 线上 demo：`https://ms-anggao.github.io/Email-requirement-intake-form/`
  - 同事已把 repo 的 **Pages source 切到 `dev-huichunli`**（admin-only，已上线 2026-06）
  - **demo 完需提醒同事把 Pages 切回 `main`**
- 我的 GitHub 账户：`melusiness`（gh CLI 已登录）

### 两台机器工作流（经常换机器用）

- **`mine` 是全量备份的 single source**（含代码 + `CLAUDE.md`）；`origin` 故意不含 `CLAUDE.md`
- 另一台机器**首次设置**（从自己的仓库克隆，才有 `CLAUDE.md`）：
  ```powershell
  git clone https://github.com/melusiness/Email-requirement-intake-form.git
  cd Email-requirement-intake-form
  git checkout dev-huichunli
  git remote add origin https://github.com/ms-anggao/Email-requirement-intake-form.git
  ```
- **日常工作流**：
  ```powershell
  git pull mine dev-huichunli       # 开工前先拉自己的最新
  # ...改代码...
  git add -A; git commit -m "说明"
  git push mine dev-huichunli       # 必推：全量备份
  git push origin dev-huichunli     # 仅当需要更新线上 demo 时（会进同事 repo，不带 CLAUDE.md 才对）
  ```
- ⚠️ 别从 `origin` 拉来当主线，否则会丢 `CLAUDE.md`

## 重要技术现实

- **localhost 连不上真实后端**（后端 CORS 不允许 localhost）→ 这是 LOCAL TEST MODE 守卫存在的根因
- `index.html` 有 localhost 守卫：DEV MODE 跳过 SSO、提交时拦截不写后端
- `redirectUri` 写死同事网址；方案 A（网址不变）刚好不用改
- 后端无密钥硬编码（用 env `AzureWebJobsStorage`）

## 已实现功能（在 `dev-huichunli`）

- AI Draft Assistant、demo 一键填充按钮
- **Progress Tracker**（提交详情页）：
  `Submitted → Pre-check → [Compliance ∥ Security 并行] → MEO Review(带链接) → MEO Send → Sent`
  - 纯前端，数据 shape 后端就绪：`{status, at, reason, link}`（status = pending/in_progress/passed/failed）
  - 失败显示红色 Reason；MEO 链接只允许 http(s)（防 XSS）
  - **每条 submission 按 id 确定性映射到 7 个典型场景**（`PIPELINE_SCENARIOS` + `hashId`）：同条稳定、异条多样，便于 demo
  - 时间戳用相对当天 `ago(days,hh,mm)` 计算，永远显示"最近几天"
  - 7 个场景：① 全绿已发送 ② 并行审查中 ③ 安全失败 ④ MEO审核中 ⑤ MEO发送失败 ⑥ 刚提交 ⑦ 合规失败+安全进行中
  - ❌ 已删除 Demo Console（用户实测不喜欢）；不再用 localStorage 存追踪状态
  - 想让某条提交固定显示某场景：调 `hashId` 映射或按 templateName 特判

## 本地预览

```powershell
python -m http.server 8000   # 然后开 http://localhost:8000/index.html（DEV 模式自动登录）
```
- 注意：localhost 下 My Submissions 列表加载不出来（后端 CORS），追踪器可单独注入测试
