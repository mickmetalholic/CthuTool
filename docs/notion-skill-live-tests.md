# Notion skill 实测记录

从 2026-10-10 开始记录本轮用户逐项发起的实测。一次操作通过不代表整个库的增删查改全部通过。

| 库 | 本轮覆盖 | 状态 |
| --- | --- | --- |
| 游戏 | 查重、创建、模板、默认值、开发商关联、元信息回读、封面失败路径、内置浏览器回退、直链封面 | 创建及封面通过 |
| App | 查重、无模板例外、官网图标、平台和分类、回读 | 创建通过 |
| 电影 | 查重、模板创建、元信息、TMDB 直链封面、人物关联 | 创建通过 |
| 书籍、漫画、音乐、剧集、纪录片、动画、频道、Knowledge | 无 | 待测 |
| 人物／组织 | 6 位 Person 的查重、模板创建、类型/标签及电影关联 | 人物创建通过；Ensemble/Organization 待测 |

## 2026-10-10：加入 Detroit: Become Human

- Skill：`codex/plugins/cthu-codex/skills/notion-manage`，读取 games、game-relations、templates、covers。
- 输入：https://www.igdb.com/games/detroit-become-human--1
- 创建结果：https://app.notion.com/p/3f5afceceb9081979182ec7beec1be07
- IGDB presskit 核对原名、Quantic Dream、2018-05-25，描述明确为 adventure；使用现有 Adventure 选项。
- 读取实时库 schema 和默认模板；模板 ID `49c354ca-caee-4aea-93dc-e49ffa783cc9`。
- 搜索 Detroit 无结果；其他搜索返回无关候选。view 查询报 internal_error；改用参数化 SQL 按精确 IGDB URL、英文名和中文名查重，无匹配。
- 复用已核验的 Quantic Dream 开发商条目；未新增关联记录。
- create_pages 明确传 template_id、不传 content；回读确认灰色 video-game icon、Want to play、名称、来源、Genres、日期和 Developer 正确。
- 未推断购买渠道、评分、价格、游玩时长或个人日期；正文为空。
- IGDB 图片页面 HTTP 403。豆瓣匹配条目 https://www.douban.com/subject/26652745/ 的图片为 https://img3.doubanio.com/lpic/s29705432.jpg 。
- 按流程执行 set-cover.mjs，返回 download_failed / image_http_418；未生成本地图片，未设置封面，也未声称上传成功。
- 结论：创建、模板应用、关系复用、元信息验证通过；自动封面未完成。已覆盖图片下载失败路径，尚未覆盖直链设置成功、原生上传成功和本地文件手动回退成功路径。
- 游戏更新、删除及命中已有条目时的防重复创建仍待测。

### 同日补测：内置浏览器回退

- 用户授权后续 IGDB 常规读取失败时用内置浏览器读取，已加入 games.md，并由 covers.md 引用。
- 内置浏览器成功加载同一 IGDB 页面；读取实际封面 img 的 src：`https://images.igdb.com/igdb/image/upload/t_cover_big/cocot9.webp`。
- 页面再次确认 Adventure、Quantic Dream、2018-05-25，并明确 Series 为空。
- 回读确认目标 Notion 页仍无封面后设置该直链；再次回读确认 external cover URL 完全一致。
- 本例最终结果：创建与封面通过；补充覆盖“HTTP 403 → 内置浏览器读取成功 → 直链设置并回读成功”。原生上传与本地文件手动回退成功路径仍待测。

## 2026-10-10：加入 NetNewsWire

- 官网：https://netnewswire.com/；官方信息确认 Mac、iPhone、iPad 支持，映射现有 MacOS、iOS 选项。
- Notion：https://app.notion.com/p/3f5afceceb908137a512c7a68a984759
- 读取 apps.md 和实时 App Vault schema；名称搜索与参数化 SQL 按名称/官网域名查重均无匹配。
- 数据库未提供模板；按 App 明确的无模板例外创建，未声称应用模板。
- 官网 HTML 声明 shortcut icon：https://netnewswire.com/images/nnw7.0-appicon-ios-dark.png；以外部 URL 设置页面 icon。
- 回读确认 Name、userDefined:URL、Platform、现有 Tag `01.Reading - Snippets Reading`、external icon 均正确。
- cover 为 null，正文为空，未创建 Knowledge 关联；符合 App 无封面要求。
- 结论：App 创建流程通过；更新、删除、重复项命中、模板存在分支仍待测。

## 2026-10-10：加入赌侠2

- 识别为 1991 年《賭俠II上海灘賭聖》，TMDB 53658、IMDb tt0101783；非 1990 年《赌侠》。
- Notion：https://app.notion.com/p/3f5afceceb9081899fd7f2264a50cb6b
- 名称搜索及参数化 SQL 查重无匹配；读取实时电影 schema 与模板。
- 使用原名；TMDB 搜索缓存原名出现 III，与中文原名冲突，结合当前 TMDB 标题、豆瓣原名和 Netflix 香港片名确认 II，不照抄缓存错名。
- 采用 TMDB 香港日期 1991-08-21、Action/Comedy/Fantasy；填写各目录正确 URL 字段。
- 明确套用电影模板，回读确认灰色 movie 图标、Want to watch、Is in Library=false。
- 从匹配 TMDB 页面实际 poster 元素核对 nz1OMsKU8V4svGgOIv271TFmLi5.jpg，设置 w500 直链，回读通过。
- 人物搜索和中英文别名精确 SQL 未找到导演/五位主演；按 movies.md 先创建电影，用户明确授权后新增王晶、周星馳、鞏俐、吳孟達、呂良偉、吳君如。
- 六人均传入实时 user 模板 ID，设置 Person 和对应 Director / Actor/Actress 标签；逐条回读确认模板图标和属性。
- 设置 Director 一人、Cast 五人，再回读确认电影所有字段及封面；未填用户评分或观看日期，未生成正文，人物不设封面。
- 结论：电影创建、封面、经明确授权的人物创建及关联通过。电影更新/删除/已有条目命中、Ensemble/Organization 模板分支待测。
