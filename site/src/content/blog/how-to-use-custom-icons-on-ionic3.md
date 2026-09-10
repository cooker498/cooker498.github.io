---
title: "如何在ionic3中使用自定义图标"
description: "在 Ionic 3 中生成并使用自定义 SVG 图标字体。"
date: 2018-05-09
category: "APP开发"
tags: ["ionic"]
draft: false
---
<p><a href="https://stackoverflow.com/questions/38462885/add-custom-icon-in-ionic-2">本教程受网上博客启发，传送门</a></p>

<h2 id="获取icons">获取icons</h2>

<p>首先，你必须得到你的svg图标，如果你已经准备好了图标，你可以跳过这一步</p>

<p>图标资源网站推荐  <a href="http://www.iconfont.cn/">iconfont</a>、<a href="https://thenounproject.com/">thenounproject</a></p>

<h2 id="生成你的新字体">生成你的新字体</h2>

<p>下载好需要的图标后，我们将使用一个应用<a href="https://icomoon.io/app/">Icon Moon</a>,这个应用的基本用途是将SVG图标转换为浏览器可以理解的字体。这个应用中也包含了一些图标（大部分是免费的），因此如果你还没有找到你的SVG文件，可以从这里找。</p>

<p>好了，第一步我们需要引入SVG文件</p>

<p><img src="https://wx3.sinaimg.cn/mw690/0060lm7Tly1fr54hc87ppj31hc0req5n.jpg" alt="iconmoon1"></p>

<p>引入后看起来像下面这样</p>

<p><img src="https://wx3.sinaimg.cn/mw690/0060lm7Tly1fr54mw1fd2j31hc0rcdi3.jpg" alt="https://wx3.sinaimg.cn/mw690/0060lm7Tly1fr54mw1fd2j31hc0rcdi3.jpg"></p>

<p>下一步选择需要生成字体的图标并点击页面下方的Genernate Font 按钮</p>

<p><img src="https://wx4.sinaimg.cn/mw690/0060lm7Tly1fr54so9v7zj31hc0req57.jpg" alt="https://wx4.sinaimg.cn/mw690/0060lm7Tly1fr54so9v7zj31hc0req57.jpg"></p>

<p>我们将会看到一个图标配置窗口，点击下载，得到一个压缩包</p>

<h2 id="设置css文件">设置CSS文件</h2>

<p>下载好iconmoon.zip文件后，打开它，将fonts解压到<code>src/assets/</code>，将<code>style.css</code>解压到<code>src/theme/</code>并将<code>style.css</code>重命名为<code>icons.css</code>.</p>

<p>然后，为了引入<code>icons.css</code>,在<code>app.scss</code>加入下面代码 <code>@import "../theme/icons"</code></p>

<p>打开<code>icons.scss</code>,改成下面的形式</p>

<pre><code class="language-scss">@font-face {
    font-family: 'icomoon';
    src:  url('fonts/icomoon.eot?tmmgio');
    src:  url('fonts/icomoon.eot?tmmgio#iefix') format('embedded-opentype'),
      url('../assets/fonts/icomoon.ttf?tmmgio') format('truetype'),
      url('../assets/fonts/icomoon.woff?tmmgio') format('woff'),
      url('../assets/fonts/icomoon.svg?tmmgio#icomoon') format('svg');
    font-weight: normal;
    font-style: normal;
  }
  
  [class^="icon-"], [class*=" icon-"] {
    /* use !important to prevent issues with browser extensions that change fonts */
    font-family: 'icomoon' !important;
    speak: none;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    vertical-align: middle;
    /* Better Font Rendering =========== */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  @mixin makeIcon($arg, $val, $col) {
    .ai-#{$arg}:before ,
    .ion-ios-ai-#{$arg}:before ,
    .ion-ios-ai-#{$arg}-outline:before ,
    .ion-md-ai-#{$arg}:before ,
    .ion-md-ai-#{$arg}-outline:before  {
      content: $val;
      font-size: 26px;
      color: $col;
    }
  }
@include makeIcon(YellowRing, '\e900',#D15B55);
@include makeIcon(RedRing, '\e901',#66B081);
</code></pre>

<p><strong>请仔细阅读下面的说明，否则ion-icons将无法工作</strong></p>

<p>因为某种原因，如果添加了自定义的icons，系统默认的icons将无法正常显示。我们不能不找到<code>variables.scss</code>文件并将<code>@import "ionic.ionicons";</code>改为<code>@import "ionicons";</code></p>

<p>我们完成了，现在我们的工程可以完全适配系统图标和自定义图标。使用方法是一样的，示例如下</p>

<pre><code class="language-typescript">&lt;ion-icon name='ai-YellowRing'&gt;&lt;/ion-icon&gt;
</code></pre>
