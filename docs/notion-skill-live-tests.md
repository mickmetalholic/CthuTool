# Notion skill 实测记录

从 2026-10-10 开始记录本轮用户逐项发起的实测。一次操作通过不代表整个库的增删查改全部通过。

| 库 | 本轮覆盖 | 状态 |
| --- | --- | --- |
| 游戏 | 查重、创建、模板、默认值、开发商关联、元信息回读、封面失败路径、内置浏览器回退、直链封面 | 创建及封面通过 |
| 书籍、漫画、音乐、电影、剧集、纪录片、动画、频道、Knowledge、App | 无 | 待测 |
| 人物／组织 | 无 | 待关联操作实测 |

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
