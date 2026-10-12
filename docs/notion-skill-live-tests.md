# Notion skill 实测记录

从 2026-10-10 开始记录本轮用户逐项发起的实测。一次操作通过不代表整个库的增删查改全部通过。下方按时间保留历史过程，以总表及最新补充为当前结论。

用户已于 2026-10-12 明确免测真实 NOTION_TOKEN 上传：不再列为待办，也不标为实测通过。

| 库 | 本轮覆盖 | 状态 |
| --- | --- | --- |
| 游戏 | 查重、创建、模板、默认值、开发商关联、元信息回读、封面失败路径、内置浏览器回退、直链封面 | 创建及封面通过 |
| App | 查重、无模板例外、官网图标、平台和分类、回读 | 创建通过 |
| 电影 | 查重、模板创建、元信息、TMDB 直链封面、人物关联 | 创建通过 |
| 剧集 | 已有季度查重、分季创建、模板、季度元信息、每季 TMDB 封面、人物选择及关联 | 创建通过 |
| 音乐 | 非古典专辑查重、模板创建、已有乐队关联、元信息、CAA 直链封面、下载及手动回退 | 非古典专辑创建及封面通过；古典音乐待测 |
| 纪录片 | 分季查重、模板创建、季度元信息、TMDB 季度封面、IMDb/TMDB/Douban 链接、定向更新及回读 | 分季创建、链接及封面更新通过 |
| 频道 | 频道身份核验、分页查重、YouTube 模板及自动图标、用户选择标签、回读 | YouTube 创建通过 |
| 书籍 | 中文版查重、模板创建、作者创建及关联、用户指定已读/日期/评分、封面下载回退 | 中文书创建通过；已回读确认文件封面 |
| 漫画 | 大陆版身份核验、查重、模板创建、已有作者关联、默认状态、封面下载回退 | 创建通过；已回读确认文件封面 |
| 动画 | 查重、模板创建、默认状态、IMDb 元信息、浏览器回退、IMDb 直链封面及回读 | 创建、封面及定向改名通过；人物关联待测 |
| Knowledge | 全库分页查重、已有教材复用、Course 模板创建、分类、来源链接及回读 | Course 创建及定向更新通过；其他类型、删除待测 |
| 人物／组织 | Person 查重、模板创建、图标延迟核验及修复、类型/标签、电影及剧集关联 | 人物创建通过；Ensemble/Organization 待测 |

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

## 2026-10-10：火星救援查重与饥饿游戏创建

- 《火星救援》命中已有 The Martian，核对 IMDb tt3659388、TMDB 286217 后返回原页面，未重复创建或改动个人字段。电影已有条目命中分支通过。
- 《饥饿游戏》识别为 2012 年第一部 The Hunger Games（TMDB 70160、IMDb tt1392170）。名称搜索和无过滤视图全部 83 条记录的来源 ID / 名称查重无匹配。
- Notion：https://app.notion.com/p/3f5afceceb9081939b1ef57ad1e97532
- TMDB 常规读取失败，内置浏览器读取成功；采用美国上映日期 2012-03-23，映射 Sci-Fi、Adventure、Action、Thriller。
- 明确应用实时电影模板，回读确认 movie_gray、Want to watch、Is in Library=false；未写评分、观看日期或正文。
- 模板完成后设置页面实际海报直链 https://media.themoviedb.org/t/p/w600_and_h900_face/apa5G43Hha7kH7wJG0gkkHT7FA9.jpg ，回读 external cover 完全一致。update_properties 仅设 cover 时仍需传 properties:{}；首次缺参请求明确失败，修正后成功。
- 直接关联现有 Woody Harrelson、Donald Sutherland。其余导演及 TMDB 首页主要演员共 8 人列为编号选择；用户选择“都不添加”，未创建任何新人物，Director 留空。
- 结论：电影创建、模板、浏览器回退、封面直链、现有人物关联及拒绝新增人物分支通过。

## 2026-10-10：加入赌圣

- 识别为 1990 年《賭聖》，TMDB 40346、IMDb tt0104147；名称搜索和无过滤视图全部 84 条的名称/来源 ID 查重无匹配。
- Notion：https://app.notion.com/p/3f5afceceb90812c8840e732469cd48a
- TMDB 搜索引擎结果不完整，使用内置浏览器站内搜索读取匹配页面，确认原名、香港上映日期 1990-08-18、Action/Comedy 及导演/主要演员。
- 应用实时电影模板后回读确认 movie_gray、Want to watch、Is in Library=false；模板完成后设置实际海报直链，回读 external cover 为 https://media.themoviedb.org/t/p/w600_and_h900_face/nfSoqPX29IAZme5Ydl5P0CHh7EB.jpg 。
- 直接关联现有周星馳、吳孟達、吳君如。其余 6 人按合并角色后的编号列表，使用“都不添加 / 全部添加”按钮及工具自带输入框请求选择。用户输入“劉鎮偉 元奎 張敏”，仅创建这三人，前两人关联 Director 和 Cast，張敏关联 Cast；保留原有三位演员。
- 三人创建均指定实时 Person 模板，设置 Person 和对应角色标签；多次回读图标仍为 null，补上已验证模板的 icons/user_gray，回读确认图标、类型、角色及电影关联正确。模板请求成功，但未声称模板自动图标生效；图标为后续修复。
- 结论：部分人名输入选择、多角色去重、模板图标缺失修复、保留已有关系均通过；最终电影 Director 2 人、Cast 6 人，未选中的三人未创建。

### 人物模板流程复核

- 三条创建请求均逐页传入正确的 Person template_id，未传 content/icon；模板实时存在且具有灰色 user 图标。未发现参数层面的套用错误。
- allow_async:false 不等待模板后台应用完成。此前多轮回读集中在短时间内，仅显式等待 10 秒；不足以排除应用延迟，不能断言模板失败或连接器不复制图标。
- 人物模板正文为空且无可区分的默认属性，Person/角色又由创建请求显式写入，因此这些属性不能证明模板完成。修复图标后也无法再从最终图标判断其是否来自模板。
- 已加强共享流程的间隔回读及超时表述。此次可确认“模板已请求、观察期间图标为空、后续图标修复成功”；后台原因仍未确定，未重套真实条目的模板。

## 2026-10-10：加入医龍四季

- 完整扫描剧集库 111 条已有记录，确认第一季已存在（2006-04-13、11 集、豆瓣 2173108），保留原页面及已看、评分、观看日期和封面；未重复创建。
- 新建第二季 https://app.notion.com/p/3f5afceceb90814b905fcddb1b546657 、第三季 https://app.notion.com/p/3f5afceceb908188a902d3bae96957bd 、第四季 https://app.notion.com/p/3f5afceceb908177bf58dd28bd82b5a5 。
- 名称采用原名 医龍-Team Medical Dragon- 加 Season N，设置 Season Number 2/3/4，日期分别为 2007-10-11、2010-10-14、2014-01-09，集数 11/10/11。采用 Japanese Drama、Drama、Want to watch，不填个人评分或观看日期。
- 三季均逐页指定实时剧集模板，间隔回读确认 tv_gray 自动生效。TMDB 常规读取失败后使用内置浏览器读取系列及各季页面；分别设置对应季度海报直链，回读 external cover 完全一致，未用全剧海报代替。
- TMDB 填各季地址；IMDb tt1118529 为全剧地址。人物按富士电视台各季官方名单匹配，未将全剧演员名单复制至所有季度。
- 已有人物直接关联；其余 13 人使用“都不添加 / 全部添加”及自由输入选择。用户仅选择大塚寧々、高橋一生、谷村美月；前两人关联第二季，后一人关联第三季，未创建未选人物。
- 三位人物均指定 Person 模板，显式填写 Person 与 Actor/Actress；等待后回读确认 user_gray 自动带出，本次无需补图标。人物封面为空。
- 关联前读取当前 Cast 并合并；最终回读第二季 Cast 11 人、第三季 9 人、第四季 6 人，已有关系保留，季度号、集数、模板图标及封面正确。
- 结论：剧集已有季度保留、分季创建、专属封面、选择新增人物及关联通过。剧集删除及其他更新路径仍待测。

### 分季名称分隔符修复

- 用户要求剧名与季之间不加分隔符；skill 与对应 spec 改为单个空格连接原名和 Season N，保留原名本身的标点。
- 无过滤视图分页检查全部 114 条活动剧集记录，只有医龍第二、三、四季含额外分隔符；分别改为 `医龍-Team Medical Dragon- Season 2/3/4`。
- 逐条更新前后回读，只修改 Name；其余属性、人物关联、图标、封面完全一致。剧集定向名称更新分支通过。

### 补齐医龍豆瓣链接及平台链接规则

- 公共创建流程区分元信息来源优先级与平台链接完整性；尽量补齐实时 schema 已有的各平台 URL 字段，无法验证则留空并说明。电影和剧集均明确尝试 TMDB、IMDb、Douban，元信息与封面优先级不变。
- 实时确认电影新增字段为 `Douban`（URL），已更新 movies.md 字段说明。
- 核对医龍第二至四季的豆瓣原名、年份、首播日期和集数后，仅写入 Douban：2270422、5196451、25758765。第四季常规页面读取不稳定，内置浏览器成功核验。
- 三条写后回读均通过；其他属性及原 TMDB 季度封面保持不变。本次未批量回填电影库。

## 2026-10-10：加入 Sherlock 四季

- 完整扫描剧集库 114 条活动记录，名称、别名和来源 ID 均无匹配，创建 Sherlock Season 1–4；每季 3 集，不包含特别篇。
- 四季页面： https://app.notion.com/p/3f5afceceb90817192d5c097e6f7d1e4 、 https://app.notion.com/p/3f5afceceb908146b139d7520e10c47c 、 https://app.notion.com/p/3f5afceceb90813593fbfacac8b00043 、 https://app.notion.com/p/3f5afceceb9081d4b16fc6cf76e99f14 。
- 首播日期分别为 2010-07-25、2012-01-01、2014-01-01、2017-01-01，采用英国日期；Category 为 English Drama，Genres 为 Crime/Drama/Mystery。
- 四条均指定实时剧集模板，等待后回读确认 tv_gray 自动生效、Want to watch、Is in Library=false；未写个人评分、观看日期或正文。
- 内置浏览器核验 TMDB 分季海报，模板完成后设置各季实际图片直链；逐条回读 external cover、图标和元信息全部通过。
- 填写 TMDB 各季链接及豆瓣 3986493、6522269、10455629、25750923；IMDb tt1475582 使用全剧链接，未误用豆瓣所列的单集 IMDb ID。
- 核验分季演职员；18 位主要演员、导演和编剧的 scoped search 未找到确切人物，通过“都不添加 / 全部添加”及自由输入请求选择。用户仅选择 Benedict Cumberbatch、Martin Freeman、Rupert Graves、Mark Gatiss、Andrew Scott；再次查重后仅创建这五人。
- 五人均指定实时 Person 模板，显式填写 Person 与 Actor/Actress；等待后回读确认灰色 user 图标自动生效，无需补图标。四季均关联这五位演员，Mark Gatiss 同时关联四季 Writer，未创建不存在的 Writer 标签。
- 四季写后回读确认 Cast 5 人、Writer 1 人，季度封面和图标保持不变；未选人物未创建。
- 结论：四个新季度创建、模板自动图标、各季封面、三平台链接、部分人物选择及跨季多角色关联均通过。

### 统一剧集季号格式

- 分页检查全部 118 条活动剧集记录，发现 26 条 S01/S02 等旧缩写，与 Season Number 均一致；未发现 Season 01 格式。
- 将这 26 条的季号后缀改成 Season N，不补零，保留原标题文字和加粗格式。rows 模式被当前连接器拒绝后，使用逐页 fetch 核对原标题再定向修改。
- 全部逐条回读通过；除 Name 外的属性、关联、图标、封面均与写前一致。
- dramas.md 和对应 spec 明确禁止 S01、S1、Season 01；本次不将无季号条目或原名中的续作编号推断为季度。

## 2026-10-10：加入 Rise of the Tyrant

- 完整检查 Music Release 无过滤表视图 39 条记录，名称和来源标识无重复。创建 https://app.notion.com/p/3f5afceceb9081b59a45ff9d4f762257 。
- MusicBrainz Release Group cee80c21-1a9b-3d53-add1-e492e7cf67d1 核验原名、Arch Enemy、Album 与最早日期 2007-09-19；直接关联已有且 MusicBrainz Artist ID 匹配的 Arch Enemy。
- Discogs Master 113287 网页及内置浏览器均受限，官方公开 API 成功核验标题、艺术家、2007 年及 Rock / Melodic Death Metal / Thrash；填写两个目录链接和现有分类选项。
- 明确套用实时专辑模板，等待后回读确认 music-album_gray 自动图标、Want to listen 及所填元信息，无正文或个人评分/收听日期。
- 豆瓣 2173753 核验匹配封面 s4717957.jpg；set-cover.mjs 下载遭 HTTP 418，改用内置浏览器 downloadMedia 成功保存 /Users/bytedance/Downloads/s4717957.jpg，验证为 500×500 JPEG。
- 当前环境未设置 NOTION_TOKEN，按规则保留本地文件供手动设置，未把豆瓣直链当作页面封面，也未声称上传完成。
- 结论：音乐库非古典专辑创建、已有乐队关联、模板及元信息回读通过；封面浏览器下载与缺 token 手动回退通过，原生上传尚未实测。

### 音乐封面直链规则及补设

- 用户授权将音乐封面改为 MusicBrainz / Cover Art Archive 优先、Discogs 次之，最后豆瓣文件上传；已更新共享 cover reference 和 spec，元信息来源不变。
- Release Group API 返回已批准 Front 图片 4230676359，匹配 release efaa6d05-49d4-4324-a8e4-13d91e812f52。原图连接重置且浏览器重试失败，Discogs 图片浏览器返回 403；CAA API 提供的 500px 图片实测 HTTP 200 image/jpeg。
- 使用该已验证的 CAA 500px HTTPS 直链补设 Rise of the Tyrant 封面，回读确认 external URL 一致，属性及模板图标不变。本次无需 NOTION_TOKEN，用户无需再手动上传豆瓣图片。

## 2026-10-10：加入空中浩劫第二季

- 完整检查纪录片库 4 条记录，仅有第一季，无第二季重复。创建 https://app.notion.com/p/3f5afceceb9081f7ad14ccb1d34e619f 。
- IMDb 浏览器分集页确认 Air Crash Investigation 第二季 6 集、首集 2005-01-23；豆瓣 25785963 同样显示加拿大首播 2005-01-23。名称使用 Air Crash Investigation Season 2，Type=Season，Series=Air Crash Investigation，Topics=Catastrophe。
- IMDb 使用真实第二季分集页，未误用豆瓣所列第一集 tt0644754。实时 schema 无 Episodes 或 Douban 字段，未擅自增加字段。
- 创建指定实时模板，等待后回读确认灰色 document 图标、Want to watch、Is in Library=false 及元信息；未改第一季。
- IMDb 分集页未找到第二季专属海报，使用匹配的豆瓣第二季封面 p2870241214.webp。脚本下载 HTTP 418，内置浏览器保存 /Users/bytedance/Downloads/p2870241214.webp；未设置 NOTION_TOKEN，封面待用户手动上传。
- 结论：纪录片分季创建、查重、模板及字段回读通过，豆瓣封面下载及手动回退通过；封面尚未写入 Notion。

### 纪录片 TMDB 字段及两季封面

- 用户明确授权新增 TMDB URL 字段；实时 schema 确认新增成功，skill 与 spec 同步记录链接要求。
- 纪录片封面改为 TMDB → IMDb 直链，最后豆瓣下载本地供手动设置；元信息仍优先 IMDb、其次豆瓣。
- TMDB 90-mayday 第二季核对 6 集及 2005-01-23，补写第二季 TMDB 链接，设置其海报 x4AdQgmt04QHcYhAfZ55i1WViBb.jpg；回读确认封面直链和字段正确。
- 用户随后要求更新第一季封面；从同一系列季度列表读取 Season 1 对应 oF4Z7159vBpSPglhETeKP6R41lL.jpg，设置实际 srcset 的 w260_and_h390_face 直链。回读确认第一季所有属性、观看状态及图标不变。
- 两季封面直链分支通过，均无需手动上传。

### 纪录片 Douban 字段及两季链接

- 实时 schema 确认用户新增的 `Douban` 为 URL 字段；skill 与 spec 同步要求创建时尽量补齐 IMDb、TMDB、Douban，元信息来源优先级不变。
- 核对《空中浩劫》第一季（2003）与第二季（2005）的豆瓣条目，分别补入 https://movie.douban.com/subject/3148994/ 与 https://movie.douban.com/subject/25785963/。
- 回读确认两页仅 `Douban` 属性改变，其他属性、TMDB 封面与图标均保持不变。

## 2026-10-10：加入 Kilobyte Chronicles

- YouTube 常规读取受限，内置浏览器确认显示名称、handle 与 canonical channel ID `UCaXluROUgHJFrVxJZFcx4-w`；已加载视频内容为游戏主机及科技产品历史。
- 名称搜索无匹配；分页检查频道视图全部 112 条活动记录，名称、handle 和 channel ID 无匹配。
- 用户选择现有标签 `04.Playing`，未加入建议中的 `06.Tech`。
- 实时确认 YouTube 模板 `822bc8e8-f235-4567-a8e0-b6a518d994a1` 的 Source 和上传图标；创建明确传入 template_id，不传正文或 icon。
- 创建 https://app.notion.com/p/3f5afceceb908120bdbed01827fecd68 ，等待后回读确认名称、主页链接、Source、标签正确，模板自动带出 youtube.png 图标，无需手动修复。
- cover 为 null、正文为空，未新增 Videos 关联。YouTube 频道创建通过；Bilibili/Xiaohongshu 创建、更新及删除仍待测。

## 2026-10-10：加入邪兵谱(全2册)

- 豆瓣 2341128 核对纳兰元初、北方文艺出版社、2007-11、ISBN 9787531722267，按指定全两册版本创建一个条目。
- 名称搜索及书库视图全部 76 条记录无重复；作者搜索无匹配，按书籍规则补建纳兰元初 Person，并关联 Author。
- 书籍 https://app.notion.com/p/3f5afceceb9081f0be6bd4db807e9f8c ，作者 https://app.notion.com/p/3f5afceceb908184b730c11e383a9975 。均显式应用实时模板，等待后回读确认 book-closed_gray / user_gray 自动图标。
- 按用户要求写入 Status=Read、Finished=2024-07-23、Score=5；未写 Rating 公式。填写豆瓣 Reference、Fantasy/Horror，未推断 Access、未生成正文。
- 豆瓣实际封面 s2823646.jpg 脚本下载 HTTP 418；内置浏览器下载成功至 /Users/bytedance/Downloads/s2823646.jpg，验证 303×500 JPEG。环境无 NOTION_TOKEN，保留本地图片供手动设置，页面 cover 仍为空。
- 中文书创建、作者关系、用户个人状态及日期评分、模板自动图标和封面下载回退通过；原生上传仍未实测。

## 2026-10-10：加入地狱星REMINA

- 豆瓣常规读取 HTTP 403，内置浏览器成功确认新星出版社 2021-10 简体中文版、ISBN 9787513344869、单本完结，使用该版本中文出版名。
- 检查漫画视图全部 16 条活动记录，无相同名称、原名或豆瓣来源；复用已关联《人间失格》《伊藤润二短篇精选集》的伊藤潤二作者记录。
- 创建 https://app.notion.com/p/3f5afceceb90810c85d9ff25f9dc3e76 ，明确指定漫画模板；等待后回读确认 book_gray 自动图标、Want to Read、Reference 与 Author 正确，未填写个人评分或获取渠道。
- 实际封面 s34000538.jpg 脚本下载 HTTP 418，内置浏览器成功保存 /Users/bytedance/Downloads/s34000538.jpg。环境未配置 NOTION_TOKEN，封面留待用户手动设置，未使用豆瓣直链。
- 漫画创建、浏览器回退、模板自动图标、已有作者复用与封面本地回退通过；原生上传、更新、删除仍待测。

## 2026-10-12：批量加入剧集及已有记录查重

- 完整检查 Drama Library 118 条活动记录：《炊事班的故事 2》《炊事班的故事 3》《案发现场》已存在，未重复创建或修改个人状态；第三部原记录为 31 集、Watched、Score=4、观看日期 2024-06-14。
- 新建《더 글로리》 https://app.notion.com/p/3f7afceceb9081f4b513db6422e0544d ，按 TMDB 完整一季 16 集记录，首播 2022-12-30，Korean Drama、Drama/Crime；IMDb tt21344706。豆瓣 35314632 只覆盖前 8 集，与 TMDB 范围差异已向用户说明；未把发行上下部误建成两个 TMDB 季。
- 新建《新恋爱时代》 https://app.notion.com/p/3f7afceceb9081959215e2b6b62e63d8 ，TMDB 115619、豆瓣 10581339 核对 36 集、首播 2013-06-10，Chinese Drama。未核实 IMDb，留空；Family/Romance 不在现有 Genres 选项中，未擅自扩展 schema 或错误映射。
- 两页明确传入剧集 template_id，回读确认模板自动带出 tv_gray、Want to watch、Is in Library=false；正文为空，不推断用户评分和观看日期。
- 两页分别设置已在 TMDB DOM 中读取的 uS2dQ7ukij2ifLwjMBzTjqEDg2x.jpg 和 6MmstsmEbe6htiaXm3TDduf28wq.jpg 封面直链，回读确认 external cover 与自动图标。
- 豆瓣常规抓取失败后，内置浏览器成功核对两剧信息。人物搜索未找到对应主要演职员；郑凯与库中郑恺区分处理。已向用户展示 18 位候选与“全部添加／都不添加”按钮，人物创建及关联待用户选择，尚未执行。
- 用户随后选定宋慧喬、林智妍、任重、姚笛；仅补建这四位，前两位关联《더 글로리》，后两位关联《新恋爱时代》的 Cast。回读四个人物均确认 Actor/Actress、正确的 Drama (Cast) 反向关联，以及模板自动带出的 user_gray 图标。
- 此次实时人物 schema 已无 Entity Type 字段，遵循实时 schema 未写入该旧字段；未创建其余未选人物。

## 2026-10-12：加入四畳半神話大系

- 输入豆瓣 4195678，常规读取受限后在内置浏览器核对 2010 年原作动画 11 集，IMDb tt1847445；不包含续作或特典。
- IMDb 浏览器回退成功，作品详情日本首播为 2010-04-22，与豆瓣一致；IMDb 单集列表首集为 4 月 23 日，按整部作品详情写入 4 月 22 日。
- 原名、译名及 IMDb 搜索无匹配；检查动画视图全部 5 条活动记录无重复。创建 https://app.notion.com/p/3f7afceceb9081d5bacdce0bf98661e3 ，Name=四畳半神話大系、Episodes=11、Genres=Comedy。其他 IMDb 类型无相应选项，未扩展 schema；库内无 Douban/TMDB 字段，未另加正文链接。
- 显式应用动画模板，回读确认 movie-clapboard-play_gray 自动图标、Want to watch、Has Document=false，未推断观看状态或评分。
- 读取 IMDb 实际海报 srcset，设置 380×562 图片直链并回读确认 external cover。无需豆瓣下载或原生上传。
- 主要导演、编剧及日语声优搜索无可核实匹配；遵循动画引用仅复用既有人物的规则，未补建或关联人物。创建及封面分支通过，人物关联、更新、删除仍待测。

### 动画名称年份后缀统一

- 用户要求去掉不必要的年份后缀，并将命名规则作为各库公共标准写入 SKILL.md：默认无年份后缀，仅同名作品/重制版等确需消歧时用 ` (YYYY)`；保留官方标题自带年份和季度、卷、版本标识。
- 检查全部 6 条动画记录，去掉《魔法少女まどか☆マギカ》《鋼の錬金術師》《ソードアート・オンライン》的年份后缀；两版《ドラえもん》保留 (1979)/(2005)，《四畳半神話大系》保持原样。
- 回读三条修改记录确认仅 Name 改变，其他属性、封面及图标均保持不变。动画定向更新分支通过；公共规则不触发其他库的未请求批量改名。

## 2026-10-12：Knowledge 加入乔伊吉他教室教材

- 分页检查 Knowledge Vault 全部 387 条活动记录，已有 Troy Stetina — Metal Rhythm Guitar Vol. 1/2，均为 Course、07.Music ▸ Guitar、Backlog；保留原记录，未重复创建。
- 按已有学习教材分类，创建 Metal Lead Guitar Vol. 1/2、Speed Mechanics for Lead Guitar、Heavy Metal Guitar Tricks 四条 Course，Category=07.Music ▸ Guitar，URL 使用已核实的 Hal Leonard 对应书目页。现有 Source 无出版社选项，留空，不修改 taxonomy。
- 新页面：3f7afceceb9081a2ab6cf1b9a425ced3、3f7afceceb9081cbb96be995308ac077、3f7afceceb908129ad37c038965b210e、3f7afceceb908141a46dc2cd1399bc9f。
- 显式使用已读取的 Course 模板，回读确认默认 Course、Backlog、movie-clapboard-play_gray 图标及分类、URL；无封面、无自动正文，不写复习日期、阶段、按钮或公式。
- Knowledge Course 创建分支通过，本轮所有主库均已有实际操作覆盖；并不表示全部类型和 CRUD 分支都已测完。
- 用户随后要求统一既有节奏两册：名称改为 Metal Rhythm Guitar Vol. 1/2，分别补入 Hal Leonard 官方链接 https://www.halleonard.com/product-family/PC17544/metal-rhythm-guitar-vol-1 和 https://www.halleonard.com/product/699320/metal-rhythm-guitar-vol-2 。回读确认名称及链接正确，其他属性不变；Knowledge 定向更新分支通过。

## 2026-10-12：实测 review 修复

- 人物命名固化为香港／台湾人物用已核实繁体中文名，韩国人物优先已核实汉字名，否则用韩文；不靠音译猜汉字。人物实时 schema 再次确认无 Entity Type，skill 不再要求不存在的字段。
- 封面 helper 增加互斥的绝对 local_path 输入，接收内置浏览器下载的图片，保留原文件并经统一大小、文件类型校验后复制到 downloads，继续原生上传或无 token 手动回退。原生 API 仍未做真实 token 实测。
- Netflix 官方称《黑暗荣耀》后半部为 Season 1, Part 2，整季共 16 集：https://www.netflix.com/tudum/articles/the-glory-season-1-release-date-cast-news 。豆瓣浏览器回读确认 35314632 仅 8 集。已清除 Notion 3f7afceceb9081f4b513db6422e0544d 的该部分覆盖链接，回读确认仍为 16 集，其他字段、关联、正文保持不变，未创建第二季。
- 剧集规则明确区分发行部分与季：不以次要平台的“第二季”命名自动拆季，也不把部分覆盖 URL 写为整季链接。
- 补齐纪录片规格 Scenario，并修正 Knowledge 总表的定向更新测试状态。

## 2026-10-12：用户确认与遗留项复核

- 用户要求恢复《黑暗荣耀》的豆瓣第一部分链接 35314632；将其作为完整 16 集条目的明确授权代表链接，保留整季范围及其他属性。skill/spec 同步该例外，不扩展成任意作品都可使用部分链接。
- 真实 token 上传按用户要求免测；现有自动化测试保留，不再要求补做真实上传。
- 补齐规格与 skill 的一致性：纪录片排除自动豆瓣上传；异步模板超时只表示未确认；年份后缀仅用于消歧；人物名称遵循专门文字规则。
- 动画已做定向改名，总表已同步。其他尚未覆盖分支属于可选后续实测，不表示已知缺陷。

- 实时回读《邪兵谱(全2册)》与《地狱星REMINA》均已有 file 类型封面，分别对应 s2823646.jpg、s34000538.jpg；已撤销总表中“封面需手动设置”的遗留状态。该回读仅验证当前封面存在，不作为 helper 真实上传实测。
