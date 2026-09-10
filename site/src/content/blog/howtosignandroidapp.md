---
title: "如何给apk签名(翻译自ionic官方文档)"
description: "根据 Ionic 官方文档整理 Android APK 的签名与发布流程。"
date: 2018-04-11
category: "APP开发"
tags: ["android"]
draft: false
---
<p>如果你想将你的app发布到google play 商店，你需要为你的apk文件签名。在此之前，你需要新增一个新的证书/密钥库。</p>

<p>让我们使用jdk提供的<code>keytool</code>命令来生成你的私钥(一般在<code>jdk/bin</code>目录下)：</p>

<pre><code class="language-bash">keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias
</code></pre>

<p>命令首先会提示为你的密钥库设置密码。然后，回答这个出色工具剩余的问题，当这些全部完成，你的当前目录应该有了一个名字为<code>my-release-key.jks</code>的文件。</p>

<p>注意：确保将这个文件保存到安全的地方，如果丢失你将无法为你的app提交更新！</p>

<p>为了给未签名的apk签名，运行同样由jdk提供的<code>jarsigner</code>工具：</p>

<pre><code class="language-bash">jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.jks android-release-unsigned.apk my-alias
</code></pre>

<p>这将完成APK的签名。最后，我们需要运行zip对齐工具来优化APK。<code>zipalign</code>工具位于<code>/path/to/Android/sdk/build-tools/VERSION/zipalign</code>。例如，在安装了Android Studio 的 OS X系统中，zipalign 位于<code>~/Library/Android/sdk/build-tools/VERSION/zipalign</code></p>

<pre><code class="language-bash">zipalign -v 4 android-release-unsigned.apk HelloWorld.apk
</code></pre>

<p>为了确保你的apk已经被签名，运行<code>apksigner</code>。<code>apksigner</code> 位于<code>zipalign</code> 同一目录下</p>

<pre><code class="language-bash">apksigner verify HelloWorld.apk
</code></pre>

<p>现在我们拥有了我们的最终发行版二进制文件HelloWorld.apk，下面我们可以在谷歌应用商店发布它，让全世界使用！</p>
