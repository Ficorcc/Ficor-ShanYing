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
npm run build    # 产出静态页 + 服务端 bundle
npm run preview  # 跑构建产物
```

---

## 技术形态

| 项 | 方案 |
| :-- | :-- |
| 渲染 | **混合渲染** —— 内容页静态化，`/moments/`、`/essay/[slug]`、`/guestbook`、`/search` 与 `/api/*` 按请求渲染 |
| 适配器 | `@astrojs/node`（standalone） |
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

写操作统一落到 `var/store.json`，页面按请求渲染时把 CMS 静态内容与运行期内容合并。

---

## 目录结构

```text
.
├── public/assets/            # 主题原生资源（css / js / images / fonts / models / vendor）
├── docs/frontend-contract.md # 前端 JS ↔ 服务端接口契约（移植必读）
├── var/store.json            # 运行时写操作存储（留言 / 说说 / 站点信息）
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
    │   ├── store.ts          # var/store.json 读写
    │   └── …
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
| `npm run dev` | 本地开发，默认 <http://localhost:4321> |
| `npm run build` | 生产构建，输出 `dist/` |
| `npx astro preview` | 预览构建产物 |
| `npx astro check` | 类型与模板检查 |
| `npx astro dev --background` | 后台启动 dev server（`status` / `logs` / `stop` 管理） |

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

写操作统一落到**项目根目录**的 `var/store.json`（不在 `src/` 内，避免触发内容集合重建）。

路径由「向上找 `astro.config.mjs`」推导，而不是按源码文件位置数层级 —— 打包后 `store.ts`
会被塞进 `dist/server/` 的 chunk 里，按层级算会落到 `dist/var/`，重新构建即丢失数据。

| 场景 | 落点 |
| :-- | :-- |
| `npm run dev` | `<项目根>/var/store.json` |
| `node dist/server/entry.mjs`（任意目录启动） | `<项目根>/var/store.json` |
| 设置 `SHANYING_STORE_DIR=/data/blog` | 直接用该目录（部署到持久化卷时用） |

部署到容器或只读环境时，请用 `SHANYING_STORE_DIR` 指向可持久化的卷，
否则运行时数据会随容器销毁而丢失。

### 管理页
`http://localhost:4321/admin` —— 站点信息、说说、留言、订阅源的管理界面。

- 写操作落到 `var/store.json`（**不在 `src/` 内**，避免触发内容集合重建）。
- 设置环境变量 `SHANYING_ADMIN_TOKEN` 后，所有写操作需携带 token；
  未设置时视为本地开发模式，直接放行。
- 站点信息类改动写在静态页面里，需要**重新构建**才会在前台生效（页面内已提示）。

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
| 静态 `dist/client/404.html` | 因 `/404` 改为 SSR，构建产物里不再有 `404.html`；未知路径由 Node 适配器渲染同一套 404 页面并返回 404 状态码 |
| 正文里的 `lared-grid-2/3` | 旧站导出正文带的图片网格类名，**保留原类名不重写内容**，样式在 `src/styles/global.css` 里补（山映主题无对应类） |
| 社交账号默认值 | 原主题默认填的是作者西风自己的账号（gentpan），本站已全部改成本站作者；`social_x` 因无账号置空 |

---

## 许可与致谢

- 主题视觉与交互版权归原作者 [西风](https://xifeng.net) 所有，
  依 GPL-2.0-or-later 授权使用。
- 本移植版保留原授权声明，源码公开可见时请同步附上许可证。
