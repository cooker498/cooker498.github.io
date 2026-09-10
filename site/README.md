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

提交到 `master` 分支后，GitHub Actions 会自动重建并发布站点。文件名决定文章地址，例如 `ddia-chapter-1.md` 对应 `/post/ddia-chapter-1/`。
