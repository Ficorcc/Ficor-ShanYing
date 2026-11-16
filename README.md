# Ficor's Astro — 山映主题的成品站点

把 WordPress 主题 [山映 ShanYing](https://github.com/gentpan/shanying)（作者：西风 / xifeng.net，GPL-2.0-or-later）
整体移植为 **Astro** 主题：前台视觉与交互逐像素还原，PHP 模板层重写为 Astro 组件，
`admin-ajax.php` 顶替为 `/api/ajax` 服务端接口。

> 这是 **ficor.cn 的成品站点**：包含 65 篇文章、友链 / 说说 / 评论 / 订阅源数据，
> 站点信息已指向 `https://ficor.cn`。
> 需要一个**干净的、可复用的主题包**（无文章、站点信息为占位值），去隔壁的 `主题文件/`。

**当前内容**：65 篇文章（2015 / 2016 / 2019 / 2025 / 2026 五年），分类为 文章 / 感悟 / 技术 / 旅行。

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 生产构建（Cloudflare Workers 产物）
npm run deploy   # wrangler deploy
```

---

## 技术形态

| 项 | 方案 |
| :-- | :-- |
| 渲染 | **混合渲染** —— 内容页静态化，`/moments/`、`/essay/[slug]`、`/guestbook`、`/search` 与 `/api/*` 按请求渲染 |
| 适配器 | `@astrojs/cloudflare`（Workers，**默认**）/ `@astrojs/node`（standalone，`SHANYING_PLATFORM=node`） |
| 内容源 | Astro Content Collections（`src/content/essay/*.md`） |
| 主题样式 | 直接复用原生产物 `public/assets/css/main.css`（603KB，含完整 reset 与深浅配色变量） |
| 主题脚本 | 直接复用原生产物 `public/assets/js/main.js`（1.09MB，**零改动**） |
| 前端 API | 统一路由 `/api/ajax?action=feng_xxx`，响应保持 WP 的 `{ success, data }` 双层信封 |

> 为什么复用构建产物而不是重写样式？
> 山映的核心样式与交互是「双轨资源制」：`main.css` / `main.js` 由分册拼接而成，
> `main.js` 内部按 `data-shanying-modules` 白名单门控 21 个模块，且与 DOM 上的
> class / data 属性深度耦合。复用产物是唯一能保证行为完全一致的做法。

### 渲染边界

带运行期数据的页面必须按请求渲染，否则「发了评论 / 说说，前台却看不到」：

| 路由 | 方式 | 原因 |
| :-- | :-- | :-- |
| `/`、`/essay/`、`/archives/`、`/tags/`、`/friends/`、`/subscribe/`、`/about/` … | 静态化 | 内容来自 CMS，构建期烘焙 |
| `/moments/` | SSR | 说说可运行期发布 |
| `/essay/[slug]` | SSR | 评论可运行期新增，提交后软导航回本页 |
| `/guestbook/` | SSR | 同上 |
| `/search` | SSR | 按查询词实时过滤 |
| `/404` | SSR | 文章页 slug 找不到时要 `Astro.rewrite('/404')`；预渲染路由在服务端没有组件实例，rewrite 会抛 500 |
| `/api/*`、`/admin` | SSR | 接口与管理页 |

写操作落到平台相关的存储后端（Node → `var/store.json`，Cloudflare → KV），
页面按请求渲染时把 CMS 静态内容与运行期内容合并。

---

## 目录结构

```text
.
├── public/assets/            # 主题原生资源（css / js / images / fonts / models / vendor）
├── docs/frontend-contract.md # 前端 JS ↔ 服务端接口契约（移植必读）
├── var/store.json            # 运行时写操作存储（Node 平台；留言 / 说说 / 站点信息）
├── wrangler.jsonc            # Cloudflare Workers 配置（Worker 名 / KV 绑定 / 兼容标志）
└── src/
    ├── config/
    │   ├── site.ts           # 站点信息：标题、域名、作者、导航
    │   └── feed.json         # 订阅源列表
    ├── content/
    │   └── essay/            # 文章 Markdown（Content Collection）
    ├── data/
    │   ├── comments.json     # 评论
    │   ├── links.ts          # 友链
    │   └── memos.json        # 说说
    ├── layouts/BaseLayout.astro
    ├── lib/
    │   ├── theme.ts          # 主题开关（配色、问候语、宠物、节气……）
    │   ├── icons.ts          # 图标库
    │   ├── render.ts         # HTML 片段渲染器
    │   ├── talks.ts          # 说说聚合（CMS + 运行期）
    │   ├── comments.ts       # 评论聚合（CMS + 运行期）
    │   ├── pet.ts            # 桌面宠物的成长值规则
    │   ├── store.ts          # 运行时存储统一入口
    │   └── store/
    │       ├── types.ts              # 存储的数据形状与默认值
    │       ├── backend.node.ts       # Node 后端：var/store.json
    │       └── backend.cloudflare.ts # Cloudflare 后端：Workers KV
    ├── components/           # Header / Footer / Dashboard / MusicPlayer / Hero / PetWidget / …
    ├── pages/
    │   ├── api/ajax.ts       # 23 个 action 调度器
    │   ├── api/admin.ts      # 管理页写接口
    │   ├── admin/            # Astro 管理页
    │   └── …                 # 首页 / 文章 / 归档 / 说说 / 友链 / 订阅 / 留言 / …
    └── styles/global.css     # 主题管不到的部分（字体平滑 / noscript / 打印）
```

---

## 常用命令

| 命令 | 作用 |
| :-- | :-- |
| `npm run dev` | 本地开发（Node 运行时，文件存储），默认 <http://localhost:4321> |
| `npm run dev:cf` | 本地开发（Cloudflare workerd 运行时，KV 存储） |
| `npm run build` | 生产构建（Cloudflare Workers 产物），输出 `dist/client` + `dist/server` |
| `npm run build:node` | 生产构建（Node standalone 产物） |
| `npm run preview` | 用 workerd 预览构建产物 |
| `npm run deploy` | 部署到 Cloudflare Workers（`wrangler deploy`） |
| `npx astro check` | 类型与模板检查 |
| `npx astro dev --background` | 后台启动 dev server（`status` / `logs` / `stop` 管理） |

---

## 部署到 Cloudflare

> **注意**：Astro 7 的 `@astrojs/cloudflare` 适配器**已移除 Cloudflare Pages 支持**，
> 官方建议迁移到 **Cloudflare Workers**。本项目按 Workers 形态构建。

```bash
npm install
npm run build          # 产出 dist/client（静态资源）+ dist/server（Worker 入口）
npx wrangler deploy    # 部署到 Workers
```

部署前先登录：

```bash
npx wrangler login
```

KV namespace **不用手动建**：第一次部署时 `wrangler.jsonc` 里只写绑定名、不写 `id`，
wrangler 会自动开通好并把 id 回填到配置里（KV id 不是密钥，可以直接入库）。
`SHANYING_STORE` 是本站的运行期数据，`SESSION` 是 Astro session 用的（适配器强制要求）。

`wrangler.jsonc` 里的关键项：

| 项 | 说明 |
| :-- | :-- |
| `name` | Worker 名字，也是 `*.workers.dev` 的第一段 |
| `kv_namespaces[SHANYING_STORE]` | 运行期数据（留言 / 说说 / 宠物进度 / 浏览量）的存储 |
| `compatibility_flags` | `nodejs_compat` |

### 本站当前的线上形态

| 项 | 值 |
| :-- | :-- |
| Worker 名 | `ficor-shanying` |
| 线上地址 | `https://ficor-shanying.ficor.workers.dev` |
| 正式域名 | `https://ficor.cn`（Zone `ficor.cn`，Worker route `ficor.cn/*`） |
| 账号 | Ficor（Account ID `f869cc66cc3e3180823145c967c5481f`） |
| 运行期数据 | KV namespace `ficor-shanying-shanying-store`（id `0a8c4a9bcd4d43baac19442b2827e914`） |
| Astro session | KV namespace `ficor-shanying-session`（id `ead6cce60d9842be8a949a5d12a3dbce`） |

域名绑定用的是 **Worker route**（`POST /zones/{zone}/workers/routes`，pattern `ficor.cn/*`），
配合一条已代理的 CNAME：`ficor.cn` → `ficor-shanying.ficor.workers.dev`。

> 为什么不是 Workers 自定义域名（custom domain）？
> 自定义域名要求该主机名下没有其它 DNS 记录，而 zone 里原本有一条指向已下线的
> Pages 项目的 CNAME；把它的目标改成 Worker 地址、交给 route 接管，
> 就不用动 DNS 也能继续服务，且不会出现解析空窗。
> （旧 Pages 项目 `ficor-shanying` 及其 GitHub 自动部署已下线。）

### Git 自动部署

仓库里的 `.github/workflows/deploy.yml` 会在 push 到 `main` 时自动构建并部署：

- `CLOUDFLARE_ACCOUNT_ID` 已作为仓库 **variable** 配好；
- 还需要在仓库 **Secrets** 里加一个 `CLOUDFLARE_API_TOKEN`
  （Cloudflare 控制台 → 帐户 API 令牌 → 权限选 `Workers Scripts: Edit`
  + `Workers KV Storage: Edit` + `Account: Read`）。
- 没配这个 secret 时，工作流**只构建不部署**，任务依然通过，不会红叉。

`wrangler login` 拿到的 OAuth token 只有几小时有效期，**不适合**当 CI 凭据，
要用控制台签发的 API Token。

---

## 配置要点

### 站点信息
`src/config/site.ts` —— 标题、副标题、描述、域名、作者、导航项。
`url` 同时被 `astro.config.mjs` 读取，改完需重启 dev server。

**当前域名：`https://ficor.cn`**。换域名要改四处：

| 文件 | 字段 |
| :-- | :-- |
| `src/config/site.ts` | `SITE.url` |
| `src/config/feed.json` | `siteUrl`、`feedUrl` |
| `src/data/links.ts` | `siteInfo.url` |
| `src/pages/moments.astro` | `data-page-url` 的兜底常量 |

它决定 canonical、RSS、sitemap 与 `feed.json` 里的绝对地址。
（`public/assets/css/main.css` 里那两处 `xifeng.net` 是原主题作者西风的署名声明，
按 GPL 保留原样，不属于站点域名。）

### 内容与元数据

`src/content/essay/*.md` —— Astro Content Collections 集合 `essay`，扁平存放（CMS 用 `readdir` 读取）。

每篇的 frontmatter 字段：

| 字段 | 说明 |
| :-- | :-- |
| `title` | 标题 |
| `slug` | 路由 `/essay/<slug>`，缺省用文件名 |
| `date` | 发布时间 |
| `author` | 作者，缺省回落到 `SITE.author` |
| `category` | 文章分类（`文章` / `感悟` / `技术` / `旅行`） |
| `tags` | 标签列表 |
| `excerpt` | 摘要短句，用于列表卡片、RSS、meta description、搜索 |
| `summary` | 摘要长句，用于文章页「内容提要」折叠块 |
| `cover` | 封面图（缺省取正文首图） |
| `draft` | `true` 时不发布 |

当前收录 **65 篇**，来自旧站（ficor.net）的导出，按年份分布 2015 / 2016 / 2019 / 2025 / 2026。

### 主题开关
`src/lib/theme.ts` —— 配色方案、问候语、桌面宠物、节气提醒、访客天气等。
对应原 WordPress 后台设置面板（不复刻后台 UI，改为代码配置）。

其中社交账号已从原主题作者的默认值改为本站作者：

| 配置 | 值 |
| :-- | :-- |
| `social_github` | `https://github.com/ficorcc` |
| `social_mastodon` | `https://mastodon.social/@ficor` |
| `social_email` | `ficor@qq.com` |
| `social_x` | 空（无账号时 Hero 不渲染该图标） |

`article_stale_days` 置 0：站内以回溯旧文为主，原先 180 天的「未更新」提示会让每篇都挂横幅。

### 运行时存储位置

写操作（留言 / 说说 / 浏览量 / 访客统计 / 宠物状态 / 游戏成绩）的落点**随平台切换**，
接口是同一个（`src/lib/store.ts`），具体实现由 `astro.config.mjs` 的 `vite.resolve.alias` 切换：

| 平台 | 后端 | 落点 |
| :-- | :-- | :-- |
| Node（`npm run dev` / `build:node`） | `src/lib/store/backend.node.ts` | `<项目根>/var/store.json` |
| Cloudflare（`npm run build`） | `src/lib/store/backend.cloudflare.ts` | KV namespace `SHANYING_STORE`，key `shanying:store` |

Node 版的路径由「向上找 `astro.config.mjs`」推导，而不是按源码文件位置数层级 ——
打包后 `store.ts` 会被塞进 `dist/server/` 的 chunk 里，按层级算会落到 `dist/var/`，
重新构建即丢失数据。也可以用 `SHANYING_STORE_DIR=/data/blog` 指定持久化目录。

Cloudflare 版做了两件事：

- Workers 没有可写文件系统，所以改用 KV；没配 KV 绑定时不报错，
  读按空数据走、写静默丢弃，站点照常可用。
- KV 同一个 key 每秒只能写一次，所以写入做了节流与合并：
  相邻写入至少间隔 1 秒，等待期间到来的新写入会覆盖待写快照，一批突发只落一次盘。

部署到容器或只读环境时，请用 `SHANYING_STORE_DIR` 指向可持久化的卷，
否则运行时数据会随容器销毁而丢失。

### 管理页
`http://localhost:4321/admin` —— 站点信息、说说、留言、订阅源的管理界面。

- 写操作落到 `var/store.json`（**不在 `src/` 内**，避免触发内容集合重建）。
- **管理口令**：环境变量 `SHANYING_ADMIN_TOKEN`（Cloudflare 上是 Worker secret）。
  - 本地：写进项目根目录的 `.env`（已被 `.gitignore` 忽略）；
  - 线上：`npx wrangler secret put SHANYING_ADMIN_TOKEN`。
- 没配置口令时**管理接口整体关闭**（fail closed），不会像以前那样「开发模式全开」。
- 口令有两种用法：直接带 `token` 参数调用 `/api/admin`；或在管理页输入一次，
  换一个 **HttpOnly + SameSite=Lax 的签名会话 Cookie**（7 天有效）。
- 站点信息类改动写在静态页面里，需要**重新构建**才会在前台生效（页面内已提示）。

#### 概览与明细列表

概览里是 7 张统计卡片：**文章 / 说说 / 评论 / 友链 / 订阅源 / 总字数 / 总浏览**，
每一张都可以点，弹出一个明细列表弹窗（`<dialog id="admin-list">`）：

| 卡片 | 弹窗内容 |
| --- | --- |
| 文章 | 标题、日期、分类、字数、浏览与评论数、标签，可直接跳到文章 |
| 说说 | 正文与发布时间，可直接删除 |
| 评论 | 作者、所属文章、正文，可审核 / 删除 |
| 友链 | 名称、描述、订阅地址与站点链接 |
| 订阅源 | 名称、描述、订阅地址与主页链接 |
| 总字数 | 全站总字数 + 按分类的分布条 |
| 总浏览 | 累计浏览量 |

弹窗里的说说 / 评论可以直接操作，删除或审核后列表会自动重绘。
文章、友链、订阅源是构建期数据，只能查看，要在站点里增删得改对应的数据文件后重新构建。

### 前台发布说说

说说页底部工具栏的**铅笔图标就是发布按钮**（原主题在这里放的是「登录后发布说说」的人形图标）：

- **已登录**（`/admin` 登录过，带着管理会话）→ 点它直接打开页内编辑器
  （正文 / 关键词 / 地点），发布后立刻出现在说说列表里；
- **没登录** → 点它直接跳到登录页 `/admin/`，登录完回来再发布；
- 服务端也做了同样的校验：`feng_talk_write` 没有有效会话直接 403，光靠改前端绕不过去；
- 写操作带 `nonce`（会话派生），会话过期会被挡下并提示刷新。

### 桌面宠物

原主题的招牌互动（`feng-pet` + `feng-pet-motion` 两个模块）已完整移植：

- 组件 `src/components/PetWidget.astro`，形象为原主题自带的 `pet-bird.svg`（内联输出，带关节 rig 标记）。
- 成长值规则在 `src/lib/pet.ts`：阶段门槛（初遇 / 熟悉 / 亲近 / 默契 / 伙伴）、
  体型比例、饱食度衰减、投喂配额（每天 3 次、间隔半小时）与原主题一致。
- 互动写进 `var/store.json` 的 `pet` 字段。
- 未配置 AI 时，聊天走「日常问答」，按真实状态作答，不编造。

### 外部能力降级
天气、AI、GitHub 统计等外部能力均可能需要密钥。**拿不到时自动降级**，不会报错：
- 访客天气关闭时 `feng_weather` 返回 `data: null`（不是 404）；
- GitHub 公开事件接口取不到时，`feng_github_stats` 返回「GitHub 暂未同步」。

---

## 前端契约要点（改代码前必读）

完整契约见 `docs/frontend-contract.md`，以下是踩过坑的关键项：

1. **`data-shanying-modules` 必须输出**（在 `<script src="/assets/js/main.js">` 上）。
   缺失会导致 21 个模块全部被跳过，页面只剩 CSS 不动。
2. **`commentLocationEndpoint` 末尾必须带斜杠**（`/api/comment-location/`），
   前端直接把评论 ID 拼在后面。
3. **各页面的 `<script src>` 列表必须完全一致**，
   否则渐进式导航的 `compatible()` 判定失败，回落整页刷新。
4. **不要使用 Astro Islands** —— 会破坏 `xf:mounted` / `xf:before-unmount` 生命周期。
5. **不要引入 Tailwind** —— 其 preflight 会与主题自带 reset 冲突；主题 CSS 已包含完整 reset。
6. Astro 中 `{icon(...)}` 会被转义成字面文本，需用 `<Fragment set:html={icon(...)} />`。
7. API 响应一律 `{ success: bool, data: {...} }`；
   仅 `/api/comment-location/{id}` 例外，直接返回 `{ label, code }`。
8. **属性要挂在正确层级**：前端常用 `form.querySelector('[data-xxx]')`，
   查的是**后代**元素。挂在表单自身上会取不到，模块会静默失效
   （例：`data-feng-comment-endpoint` 必须放在表单内部的隐藏域上）。
9. **一对属性必须同时出现**：如 `data-comment-geo` 与内部的 `[data-geo-label]`、
   `data-hero-music` 与 `[data-hero-music-state]` —— 只加一半会抛 `TypeError`，
   反而打断整个模块。
10. **类名同样是契约**：如 `.feng-related-item`（再读一篇的条目）、
    `.feng-comment` + `.feng-comment__actions`（评论自助编辑）。
    少一个类名，前端会认为「没有内容」而把按钮永久置灰。

---

## 已知偏差

以下差异是**有意为之**或原主题自身即如此，不是移植遗漏：

| 项 | 情况 |
| :-- | :-- |
| WordPress 后台设置面板 | 不复刻。原 98KB `functions.php` 与 4 个后台 CSS/JS 改由 `src/lib/theme.ts` 承担 |
| 最近一周动态区块（`feng-activity`） | 原主题的 `template-parts/activity.php` 是**孤儿模板**（全库无人引用），上游同样不渲染。接口与渲染器已就绪，需要时挂到首页即可启用 |
| 卡片主色 `--feng-card-tone` | 依赖原主题 `.feng-cover-card` 卡片结构；本站文章列表改用 lucide bundle 的列表实现，故未启用 |
| AI 功能（`feng_ai`） | 无密钥时接口返回 501，前端显示「尚未配置」 |
| 静态 `dist/client/404.html` | 因 `/404` 改为 SSR，构建产物里不再有 `404.html`；未知路径由服务端渲染同一套 404 页面并返回 404 状态码 |
| 正文里的 `lared-grid-2/3` | 旧站导出正文带的图片网格类名，**保留原类名不重写内容**，样式在 `src/styles/global.css` 里补（山映主题无对应类） |
| 社交账号默认值 | 原主题默认填的是作者西风自己的账号（gentpan），本站已全部改成本站作者；`social_x` 因无账号置空 |
| Cloudflare Pages | Astro 7 的 `@astrojs/cloudflare` 已移除 Pages 支持，只能部署到 **Cloudflare Workers**（静态资源走 assets binding）。原 Pages 项目需要迁移，见「部署到 Cloudflare」 |
| Cloudflare 上的运行期数据 | Workers 无文件系统，改用 KV namespace `SHANYING_STORE`；KV 每秒单 key 只能写一次，所以写入做了节流与合并 |
| 管理接口与前台发布 | 管理口令 `SHANYING_ADMIN_TOKEN` 未配置时 `/api/admin` **整体关闭**（不再有「开发模式全开」）；登录后换成签名会话 Cookie，前台说说页据此显示发布按钮并允许发布说说 |
| 友链页的配对游戏 | 原主题的「博友配对 / 头像消消乐」游戏区（玩家条、类型标签、头像墙、棋盘、排行榜入口）已按本站需求移除，友链页只保留友链列表与「站点资料 / 申请友链」入口。前端 JS 一行未改（缺节点时各模块自行静默退出），接口 `feng_friend_game` 也原样保留；通用主题包 `主题文件/` 里仍是完整实现 |

---

## 许可与致谢

- 主题视觉与交互版权归原作者 [西风](https://xifeng.net) 所有，
  依 GPL-2.0-or-later 授权使用。
- 本移植版保留原授权声明，源码公开可见时请同步附上许可证。
