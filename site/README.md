# 神秘的糖屋

个人技术博客的 Astro 源码。站点由 GitHub Actions 构建并发布到 GitHub Pages。

## 本地运行

```bash
npm install
npm run dev
```

## 发布文章

在 `src/content/blog/` 新建 Markdown 文件，填写以下 frontmatter：

```yaml
---
title: "文章标题"
description: "用于首页和搜索引擎的摘要"
date: 2026-09-10
category: "架构设计"
tags: ["DDIA", "分布式系统"]
draft: false
---
```

提交到 `master` 分支后，GitHub Actions 会自动重建并发布站点。文件名决定文章地址，例如 `example-post.md` 对应 `/post/example-post/`。

## 从 Notion 自动发布

站点会由 GitHub Actions 每 15 分钟查询一次 Notion 文章数据库，并发布状态为 `Published`（或 `已发布`、`发布`、`公开`）的页面。工作流也可以在 GitHub Actions 页面手动运行。

Notion 数据库建议包含以下字段：

```text
标题       Title
Slug       Text
状态       Select
摘要       Text
发布日期   Date
更新日期   Date（可选）
分类       Select
标签       Multi-select
```

在仓库的 `Settings → Secrets and variables → Actions` 中添加：

```text
NOTION_TOKEN
NOTION_DATA_SOURCE_ID
```

Integration 必须被添加到这个数据库，并拥有读取内容权限。同步脚本使用 Notion 的 Markdown API 读取正文，同时把 Notion 托管的图片下载到站点的 `public/notion-media/`，所以不会在发布后因临时链接过期而丢图。

自动生成的文章使用数据库中的 `Slug` 作为网址，例如 `redis-cache` 会发布到 `/post/redis-cache/`。自动文件和媒体文件已加入 `.gitignore`，不会覆盖仓库中手写的文章。
