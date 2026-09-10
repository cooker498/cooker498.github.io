---
title: "Hugo從安裝到部署"
description: "在 Windows 平台安装、配置并部署 Hugo 静态博客。"
date: 2018-04-10
category: "工具使用"
tags: ["hugo"]
draft: false
---
<h2 id="windows平臺安裝hugo-翻譯自hugo官方文檔">windows平臺安裝Hugo （翻譯自Hugo官方文檔）</h2>

<ol>
<li><p>前往<a href="https://github.com/gohugoio/hugo/releases/" title="Title">hugo發行版</a>主頁。</p></li>

<li><p>​最新的發行版公佈在頁面頂部，下拉到頁面底部查看下載列表，這些都是zip文件。</p></li>

<li><p>在每一個版本的末尾找到windows文件，（因爲是更具字母表排序），根據你32位或64位的windows系統下載32位或64位的文件。</p></li>

<li><p>將下載好的zip文件移動到你創建的任一盤符:Hugo\bin 文件下(如 <code>C:\Hugo\bin</code>)。</p></li>

<li><p>雙擊zip文件將它解壓到前面創建的<code>Hugo\bin</code>目錄下，windows默認會解壓到當前目錄，除非你指定了其他的解壓目錄</p></li>

<li><p>你現在應該有三個文件:hugo 的可執行文件（例如 <code>hugo_0.18_windows_amd64.exe</code>), <code>license.md</code>, 和 <code>readme.md</code>。（你現在可以刪除zip文件了。） 將hugo可執行文件(<code>hugo_0.18_windows_amd64.exe</code>)重命名為<code>hugo.exe</code>更易於使用。</p></li>
</ol>

<p>現在你需要將hugo加入你的windows PATH 設置中</p>

<h2 id="使用hugo創建站點-翻譯自hugo官網">使用Hugo創建站點（翻譯自Hugo官網）</h2>

<ul>
<li>在<code>c:\hugo\</code> 下新建sites文件夾</li>
<li>創建一個新站點</li>
</ul>

<pre><code class="language-bash">cd sites
hugo new site demo
</code></pre>

<ul>
<li>配置主题</li>
</ul>

<pre><code class="language-bash">cd themes
git clone https://github.com/spf13/hyde.git
</code></pre>

<ul>
<li>運行Hugo</li>
</ul>

<pre><code class="language-bash">cd ..
hugo server --theme=tyde --buildDrafts --watch
</code></pre>

<p>瀏覽器打開<a href="http://localhost:1313">http://localhost:1313</a></p>

<h2 id="部署hugo到github-page">部署Hugo到GitHub page</h2>

<ul>
<li>在你的GitHub創建一個倉庫，命名為<code>&lt;你的github用戶名&gt;.github.io</code>(如 <code>sss.github.io</code>)</li>
<li>在站點根目錄執行Hugo命令</li>
</ul>

<pre><code class="language-bash">cd c:\Hugo\site\demo
hugo -D --theme=hyde --baseUrl="http://sss.github.io/"
</code></pre>

<ul>
<li>如果一切順利，在demo文件夾下會生成public目錄，將public目錄下的所有文件推送到剛創建的倉庫的master分支</li>
</ul>

<pre><code class="language-bash">cd public
git init
git remote add origin https://github.com/sss/sss.github.io.git
git add -A
git commit -m "first commit"
git push -u origin master
</code></pre>

<ul>
<li>瀏覽器訪問<a href="http://sss.github.io/">http://sss.github.io/</a></li>
</ul>
