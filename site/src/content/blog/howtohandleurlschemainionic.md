---
title: "如何在ionic中处理url schema 和 如果在ionic app中打开其他app并传递参数"
description: "在 Ionic 应用中处理 URL Scheme，并从一个应用唤起另一个应用传递参数。"
date: 2018-06-25
category: "APP开发"
tags: ["ionic"]
draft: false
---
<h2 id="在ionic-app中处理url-schema-android">在ionic app中处理URL SCHEMA（ANDROID）</h2>

<ul>
<li>安装插件</li>
</ul>

<pre><code class="language-bash">ionic cordova plugin add ionic-plugin-deeplinks --variable URL_SCHEME=myapp --variable DEEPLINK_SCHEME=https --variable DEEPLINK_HOST=example.com --variable ANDROID_PATH_PREFIX=/
npm install --save @ionic-native/deeplinks
</code></pre>

<p>将myapp换成当前app的名称， 将example 换成需要跳转app 的域名</p>

<ul>
<li>修改app.module.ts，将插件引入ionic工程</li>
</ul>

<pre><code class="language-typescript">import { Deeplinks } from '@ionic-native/deeplinks';

...

@NgModule({
  ...

  providers: [
    ...
    Deeplinks
    ...
  ]
  ...
})
</code></pre>

<ul>
<li>修改app.component.ts</li>
</ul>

<p>在app.component.ts 中写入如下代码，注意须在platform.ready中</p>

<p>其他app调用当前app的链接示例  <a href="myapp://app/account">myapp://app/account</a>  myapp 是前面定义的 URL_SCHEME app不可修改 accont换成实际的账号</p>

<p>注意三个地方：</p>

<ul>
<li>‘<code>/:account': 'LoginPage'</code>：定义能够触发match代码的url链接,这里只会响应<code>myapp://app/account</code></li>
<li><code>(match) =&gt; {}</code>：外部应用调用该应用的url和预设url符合时触发的代码</li>
<li><code>match.$args</code>：用来获取url中的参数，是json字符串</li>
</ul>

<pre><code class="language-typescript">import { Deeplinks } from '@ionic-native/deeplinks';

constructor(private deeplinks: Deeplinks) { }

//绑定从其他app唤醒该app的事件
this.deeplinks.route({
        '/:account': 'LoginPage' //path
      }).subscribe((match) =&gt; {
        // match.$route - the route we matched, which is the matched entry from the arguments to route()
        // match.$args - the args passed in the link
        // match.$link - the full link data
    	console.log('accout' + match.$args.account)
      }, (nomatch) =&gt; {
		console.error('Got a deeplink that didn\'t match', JSON.stringify(nomatch));
        this.nav.setRoot('LoginPage');
      });
</code></pre>

<p>​</p>

<h2 id="在ionic-app中打开其他app并传递参数-android">在ionic app中打开其他app并传递参数（ANDROID）</h2>

<ul>
<li>安装插件</li>
</ul>

<pre><code class="language-bash">$ ionic cordova plugin add cordova-plugin-inappbrowser
$ npm install --save @ionic-native/in-app-browser
</code></pre>

<ul>
<li>修改app.module.ts，将插件引入ionic工程</li>
</ul>

<pre><code>import { InAppBrowser } from '@ionic-native/in-app-browser';


...

@NgModule({
  ...

  providers: [
    ...
    InAppBrowser
    ...
  ]
  ...
})
</code></pre>

<ul>
<li>在需要调用外部app的地方引入下面的代码</li>
</ul>

<pre><code class="language-typescript">import { InAppBrowser } from '@ionic-native/in-app-browser';
constructor(private iab: InAppBrowser) { }

openotherapp(){
    let address = 'myapp://app/';
    let account = 'test'
    this.iab.create(address + account, '_system');
}
</code></pre>
