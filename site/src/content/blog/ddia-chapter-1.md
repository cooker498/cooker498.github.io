---
title: "DDIA 第一章：可靠、可扩展与可维护的应用"
description: "用电商商品系统理解可靠性、可扩展性与可维护性，并整理 QPS、尾延迟和架构评审方法。"
date: 2026-09-10
category: "架构设计"
tags: ["DDIA", "架构设计", "分布式系统"]
draft: false
---
<div class="note-summary"><strong>一句话总结：</strong>可靠性看故障，可扩展性看增长，可维护性看长期变化。</div>

<h2 id="data-intensive">一、数据密集型应用</h2>

<p>现代数据系统通常由数据库、缓存、搜索索引和消息队列等通用组件组合而成。业务服务通过统一 API 隐藏内部实现，并向用户承诺数据正确性、性能与可用性。此时，应用开发者也成为了数据系统设计者。</p>

<p class="flow">用户请求 → 商品服务 → 商品数据库、Redis 缓存、搜索索引与变更消息队列</p>

<ul>
                <li><strong>可靠性 Reliability：</strong>发生故障时，系统仍能正确工作。</li>
                <li><strong>可扩展性 Scalability：</strong>数据量、流量或复杂度增长时，有合理的应对方式。</li>
                <li><strong>可维护性 Maintainability：</strong>系统长期演进、多人维护时，仍能高效运维、理解和修改。</li>
              </ul>

<h2 id="reliability">二、可靠性</h2>

<h3 id="fault-failure">Fault 与 Failure</h3>

<ul>
                <li><strong>Fault（故障）：</strong>某个组件偏离预期行为。</li>
                <li><strong>Failure（失效）：</strong>系统整体无法向用户提供承诺的服务。</li>
                <li><strong>Fault tolerance（容错）：</strong>阻止局部 fault 演变成整体 failure。</li>
              </ul>

<blockquote><p>Fault 是内部发生了问题；failure 是问题突破系统边界，影响了服务承诺。</p></blockquote>

<p>例如 Redis 不可用后，商品服务自动回源数据库。响应从 30ms 增加到 120ms，但数据正确且仍低于 200ms SLA。这是 fault，但不是 failure。如果 SLA 是 100ms，同一事件也构成 failure。</p>

<h3 id="fault-types">三类故障</h3>

<ol>
                <li><strong>硬件故障：</strong>磁盘、网卡、机器或机房故障，通常通过冗余、复制和故障转移处理。</li>
                <li><strong>软件错误：</strong>连接池泄漏、异常输入导致所有实例崩溃、缓存故障引发数据库雪崩。软件错误可能跨节点相关，更容易造成级联故障。</li>
                <li><strong>人为错误：</strong>错误配置、误删数据、发布错误。应通过权限隔离、灰度发布、审计、自动化和回滚机制降低风险。</li>
              </ol>

<p class="flow">Redis 故障 → 大量请求回源 → 数据库过载 → 连接池耗尽 → 商品服务整体失效</p>

<p>保护措施包括主备切换、本地缓存或旧值兜底、热点 Key 请求合并、数据库限流与熔断、非核心功能降级、缓存预热和故障演练。仅准备备用路径还不够，必须验证备用路径在真实故障下仍然可用。</p>

<h2 id="scalability">三、可扩展性</h2>

<h3 id="load">负载参数</h3>

<p>“支持高并发”不是可验证的描述。应该使用读写 QPS、读写比例、热点集中度、数据增长速度、价格更新速率、MQ 生产和消费速率等参数描述负载。</p>

<table>
                <thead><tr><th>类型</th><th>例子</th></tr></thead>
                <tbody>
                  <tr><td>负载参数</td><td>输入 QPS、写入速率、索引数据量</td></tr>
                  <tr><td>容量配置</td><td>缓存大小、机器数量</td></tr>
                  <tr><td>压力信号</td><td>MQ 积压量、P99、错误率</td></tr>
                </tbody>
              </table>

<p>MQ 积压量应结合生产速率、消费速率和最老消息等待时间分析。消费速度大于生产速度时积压正在恢复，反之则继续恶化。</p>

<h3 id="performance">吞吐量、QPS 与响应时间</h3>

<ul>
                <li><strong>吞吐量：</strong>单位时间内成功完成的工作量，可以用请求/秒、事务/秒、消息/秒或 MB/秒表示。</li>
                <li><strong>QPS：</strong>每秒查询或请求数，是吞吐量的一种具体计量方式。当工作单位就是请求时，成功 QPS 就是吞吐量。</li>
                <li><strong>输入 QPS：</strong>每秒到达的请求数，不一定等于系统成功完成的吞吐量。</li>
                <li><strong>响应时间：</strong>从请求发出到收到结果的总时间，包含执行、排队和网络等待。</li>
              </ul>

<p>P50 描述典型请求，P95、P99 和 P99.9 用于观察长尾。平均响应时间会掩盖偏斜分布和少量极慢请求。商品页并行依赖多个下游服务时，只要其中一个服务变慢，页面就会变慢，形成尾延迟放大。</p>

<h3 id="scaling">扩容方式</h3>

<ul>
                <li><strong>纵向扩展：</strong>提高单机 CPU、内存、磁盘和网络能力，架构变化小，但存在硬件上限和单机风险。</li>
                <li><strong>横向扩展：</strong>增加服务实例、缓存分片、搜索节点、数据库分片或 MQ 消费者。有状态组件还要处理分片、复制、一致性和恢复。</li>
                <li><strong>手动扩容：</strong>稳定可预测，但响应较慢。</li>
                <li><strong>弹性扩容：</strong>能随负载变化，但存在启动延迟和扩缩容震荡风险。</li>
              </ul>

<h3 id="promotion">大促计算案例</h3>

<p>当前流量为 5,000 QPS、缓存命中率为 95%，数据库承担：</p>

<p class="formula">5,000 × (1 − 95%) = 250 QPS</p>

<p>大促流量增长到 20,000 QPS，命中率不变时，数据库承担：</p>

<p class="formula">20,000 × (1 − 95%) = 1,000 QPS</p>

<p>若数据库最大稳定容量为 600 QPS，仅增加商品服务实例无法解决瓶颈。缓存命中率至少需要达到：</p>

<p class="formula">1 − 600 ÷ 20,000 = 97%</p>

<p>实际系统还应预留安全余量，并结合只读副本、热点本地缓存、请求合并、缓存预热、限流和分片处理。</p>

<h2 id="maintainability">四、可维护性</h2>

<h3 id="operability">可运维性 Operability</h3>

<p>让开发和运维人员容易观察、管理和恢复系统。典型能力包括统一日志、指标、链路追踪、自动化部署、容量规划、变更记录和运行手册。只能逐台登录服务器查日志，属于可运维性差。</p>

<h3 id="simplicity">简单性 Simplicity</h3>

<p>控制不必要的偶然复杂度，使系统更容易理解。多个服务共享数据库、循环依赖，以及同一业务概念存在多套定义，都会增加复杂度。</p>

<h3 id="evolvability">可演化性 Evolvability</h3>

<p>系统能够安全适应新需求。新增价格类型或商品类型时，如果必须修改大量服务并协同发布，说明系统可演化性差。</p>

<h2 id="case-study">五、综合案例</h2>

<p>商家修改商品价格后，数据库和缓存已经更新，但 MQ 严重积压，Elasticsearch 两小时未更新：</p>

<ul>
                <li><strong>可靠性：</strong>搜索页与详情页价格不一致。是否构成 failure，取决于系统承诺的索引同步时效。</li>
                <li><strong>可扩展性：</strong>负载增长后，MQ 生产速度超过消费速度，且 P99 明显升高，说明系统无法合理承载增长后的负载。</li>
                <li><strong>可维护性：</strong>缺少统一链路追踪，只能跨服务手动查询日志，属于可运维性不足。</li>
              </ul>

<h2 id="review-template">六、架构评审模板</h2>

<ol>
                <li><strong>定义正确工作：</strong>系统承诺什么？哪些数据必须准确？允许多长时间的数据延迟？SLA 是什么？</li>
                <li><strong>描述负载：</strong>读写 QPS 和比例、热点程度、数据增长速度、MQ 生产和消费速率是多少？</li>
                <li><strong>描述性能：</strong>吞吐量及 P50、P95、P99 是多少？负载增长后哪个组件最先达到上限？</li>
                <li><strong>分析可靠性：</strong>需要容忍哪些故障？哪些 fault 可能演变成 failure？如何检测、隔离、降级和恢复？</li>
                <li><strong>分析可维护性：</strong>系统是否容易观察和恢复？是否存在偶然复杂度？新需求能否局部修改并安全回滚？</li>
              </ol>

<h2 id="interview">七、面试表达</h2>

<blockquote><p>我主要从可靠性、可扩展性和可维护性三个维度评价数据系统。可靠性关注局部故障是否会演变为用户可见的服务失效；可扩展性需要先用 QPS、读写比例、热点程度和数据量描述负载，再通过吞吐量和 P99 等指标观察负载增长后的表现；可维护性则包括系统是否容易运维、是否控制了不必要的复杂度，以及是否能够适应未来需求变化。</p></blockquote>
