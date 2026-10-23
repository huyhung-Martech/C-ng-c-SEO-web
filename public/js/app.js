// ==========================================================================
// SEO · AEO · GEO MASTER SUITE - CLIENT APPLICATION ENGINE
// Autonomous Multi-Agent Pipeline & Deep Multi-Page Matrix
// ==========================================================================

let currentAuditData = null;
let currentScanMode = "deep"; // "deep" or "single"
let activeEventSource = null;

document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
});

function initEventListeners() {
  const scanBtn = document.getElementById("scanBtn");
  const targetUrlInput = document.getElementById("targetUrlInput");
  const modeDeepBtn = document.getElementById("modeDeepBtn");
  const modeSingleBtn = document.getElementById("modeSingleBtn");
  const subpagesParamGroup = document.getElementById("subpagesParamGroup");

  // Mode switching
  modeDeepBtn.addEventListener("click", () => {
    currentScanMode = "deep";
    modeDeepBtn.classList.add("active");
    modeSingleBtn.classList.remove("active");
    if (subpagesParamGroup) subpagesParamGroup.style.display = "block";
  });

  modeSingleBtn.addEventListener("click", () => {
    currentScanMode = "single";
    modeSingleBtn.classList.add("active");
    modeDeepBtn.classList.remove("active");
    if (subpagesParamGroup) subpagesParamGroup.style.display = "none";
  });

  scanBtn.addEventListener("click", () => {
    const url = targetUrlInput.value.trim();
    if (url) runAudit(url);
  });

  targetUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const url = targetUrlInput.value.trim();
      if (url) runAudit(url);
    }
  });

  // Quick sample tags
  document.querySelectorAll(".sample-tag").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      targetUrlInput.value = url;
      runAudit(url);
    });
  });

  // Tab switching: support .tab-btn, .subtab-btn, .sidebar-nav-item, and .accordion-row
  document.querySelectorAll(".tab-btn, .subtab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTabId = btn.getAttribute("data-tab");
      if (targetTabId) switchTab(targetTabId);
    });
  });

  document.querySelectorAll(".sidebar-nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const targetTabId = item.getAttribute("data-tab");
      if (targetTabId) switchTab(targetTabId);
    });
  });

  document.querySelectorAll(".accordion-row[data-target-tab]").forEach((row) => {
    row.addEventListener("click", () => {
      const targetTabId = row.getAttribute("data-target-tab");
      if (targetTabId) switchTab(targetTabId);
    });
  });

  // URL input change to update domain and preview in real-time
  function updateDomainPreview(rawUrl) {
    try {
      let u = (rawUrl || "").trim();
      if (!u) return;
      if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
      const parsed = new URL(u);
      const domain = parsed.hostname.replace(/^www\./, "");
      const domTitle = document.getElementById("openseoDomainTitle");
      if (domTitle) domTitle.textContent = domain || "wellspring.edu.vn";
      const sidePreview = document.getElementById("sidebarUrlPreview");
      if (sidePreview) sidePreview.textContent = u;
    } catch (_) {}
  }

  if (targetUrlInput) {
    targetUrlInput.addEventListener("input", (e) => {
      updateDomainPreview(e.target.value);
    });
  }

  const sidebarProjBox = document.getElementById("sidebarProjectBox");
  if (sidebarProjBox && targetUrlInput) {
    sidebarProjBox.addEventListener("click", () => {
      targetUrlInput.focus();
      targetUrlInput.select();
    });
  }

  // Issue filter pills
  document.querySelectorAll(".pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const filter = pill.getAttribute("data-filter");
      filterIssues(filter);
    });
  });

  // Copy patch buttons
  document.querySelectorAll(".copy-patch-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const patchKey = btn.getAttribute("data-patch");
      if (!currentAuditData?.patches?.[patchKey]) return;
      navigator.clipboard.writeText(currentAuditData.patches[patchKey]).then(() => {
        const originalText = btn.textContent;
        btn.textContent = "✓ Đã sao chép!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove("copied");
        }, 2000);
      });
    });
  });

  // Copy llms.txt
  const copyLlmBtn = document.getElementById("copyLlmBtn");
  if (copyLlmBtn) {
    copyLlmBtn.addEventListener("click", () => {
      if (!currentAuditData?.aeo_geo?.generated_llmstxt) return;
      navigator.clipboard.writeText(currentAuditData.aeo_geo.generated_llmstxt).then(() => {
        const originalHtml = copyLlmBtn.innerHTML;
        copyLlmBtn.innerHTML = `<span>✓ Đã sao chép!</span>`;
        setTimeout(() => { copyLlmBtn.innerHTML = originalHtml; }, 2000);
      });
    });
  }

  // Export buttons
  document.getElementById("exportMdBtn").addEventListener("click", exportMarkdownReport);
  document.getElementById("exportJsonBtn").addEventListener("click", exportJsonData);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
}

function switchTab(targetTabId) {
  if (!targetTabId) return;

  // Sync sidebar items
  document.querySelectorAll(".sidebar-nav-item").forEach((item) => {
    if (item.getAttribute("data-tab") === targetTabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Sync horizontal subtabs
  document.querySelectorAll(".subtab-btn").forEach((btn) => {
    if (btn.getAttribute("data-tab") === targetTabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Sync phase tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    if (btn.getAttribute("data-tab") === targetTabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Switch active pane
  document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
  const targetPane = document.getElementById(targetTabId);
  if (targetPane) {
    targetPane.classList.add("active");
  }
}

function addStreamLine(type, text) {
  const feed = document.getElementById("liveStreamFeed");
  if (!feed) return;
  const line = document.createElement("div");
  line.className = `stream-line stream-${type}`;
  const now = new Date().toTimeString().split(" ")[0];
  line.innerHTML = `<span class="stream-time font-mono">[${now}]</span> ${escapeHtml(text)}`;
  feed.appendChild(line);
  feed.scrollTop = feed.scrollHeight;
}

async function runAudit(url) {
  const scanBtn = document.getElementById("scanBtn");
  const btnText = scanBtn.querySelector(".btn-text");
  const btnLoader = scanBtn.querySelector(".btn-loader");
  const progressBanner = document.getElementById("scanProgress");
  const progressText = document.getElementById("progressStepText");
  const progressPercent = document.getElementById("progressPercent");
  const progressBar = document.getElementById("progressBar");
  const streamBadge = document.getElementById("streamBadgeStatus");
  const feed = document.getElementById("liveStreamFeed");
  const resultsContainer = document.getElementById("resultsContainer");
  const errorAlert = document.getElementById("errorAlert");

  const maxPages = parseInt(document.getElementById("maxPagesSelect").value || "12");
  const qualityThreshold = parseInt(document.getElementById("qualityThresholdSelect").value || "80");

  // UI loading state
  scanBtn.disabled = true;
  btnText.style.display = "none";
  btnLoader.style.display = "inline-flex";
  errorAlert.style.display = "none";
  progressBanner.style.display = "block";
  resultsContainer.style.display = "none";

  progressBar.style.width = "5%";
  progressPercent.textContent = "5%";
  progressText.textContent = "Đang khởi tạo Radar & Kết nối luồng dữ liệu Live SSE...";
  if (streamBadge) streamBadge.textContent = "Đang nhận dữ liệu trực tiếp...";
  if (feed) feed.innerHTML = "";

  addStreamLine("info", `🚀 KHỞI ĐỘNG CRAWLER: Mục tiêu = ${url}`);
  addStreamLine("info", `⚙️ CẤU HÌNH: Mode = ${currentScanMode.toUpperCase()} | Giới hạn = ${maxPages} bài viết | Ngưỡng duyệt = ${qualityThreshold}/100`);

  let auditCompleted = false;

  if (activeEventSource) {
    try { activeEventSource.close(); } catch (_) {}
    activeEventSource = null;
  }

  try {
    const sseUrl = `/api/audit/stream?url=${encodeURIComponent(url)}&mode=${currentScanMode}&max_pages=${maxPages}&quality_threshold=${qualityThreshold}`;
    activeEventSource = new EventSource(sseUrl);

    activeEventSource.addEventListener("agent_log", (e) => {
      try {
        const log = JSON.parse(e.data);
        addStreamLine("agent", `${log.avatar} [${log.agent} · ${log.role}]: ${log.message}`);
        progressText.textContent = `${log.avatar} ${log.agent}: ${log.message}`;
      } catch (err) {
        console.error("agent_log parse error:", err);
      }
    });

    activeEventSource.addEventListener("crawl_progress", (e) => {
      try {
        const p = JSON.parse(e.data);
        const cur = p.crawled || p.page_index || 1;
        const tot = p.total || maxPages;
        const w = p.words || p.word_count || 0;
        const pct = Math.min(85, Math.max(15, Math.round((cur / tot) * 75) + 5));
        progressBar.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;
        addStreamLine("info", `🕸️ CRAWL (${cur}/${tot}): ${p.current_url} [${w.toLocaleString()} từ] - "${p.title || 'Không có title'}"`);
      } catch (err) {
        console.error("crawl_progress parse error:", err);
      }
    });

    activeEventSource.addEventListener("stage", (e) => {
      try {
        const s = JSON.parse(e.data);
        addStreamLine("info", `🔍 ${s.msg}`);
      } catch (_) {}
    });

    activeEventSource.addEventListener("link_check", (e) => {
      try {
        const lk = JSON.parse(e.data);
        if (lk.status === 404) {
          addStreamLine("error", `🚨 [TESTER-AI PING 404] Phát hiện liên kết gãy: ${lk.url} (${lk.inlink_count} trang nội bộ trỏ tới)`);
        } else {
          addStreamLine("success", `🔗 [TESTER-AI PING] ${lk.url} ➔ HTTP ${lk.status}`);
        }
      } catch (err) {
        console.error("link_check parse error:", err);
      }
    });

    activeEventSource.addEventListener("complete", (e) => {
      try {
        auditCompleted = true;
        const raw = JSON.parse(e.data);
        const data = raw.result ? raw.result : raw;
        if (activeEventSource) {
          activeEventSource.close();
          activeEventSource = null;
        }

        addStreamLine("success", `⚡ HOÀN TẤT: Đã giải phẫu xong ${data.subpages?.length || 0} bài viết và mạng lưới liên kết!`);
        progressBar.style.width = "100%";
        progressPercent.textContent = "100%";
        progressText.textContent = "✓ Toàn bộ 4 Agents đã hoàn tất quy trình!";
        if (streamBadge) streamBadge.textContent = "✓ Hoàn tất thu thập dữ liệu";

        currentAuditData = data;
        setTimeout(() => {
          showResults(data);
        }, 400);

      } catch (err) {
        console.error("complete parse error:", err);
      } finally {
        scanBtn.disabled = false;
        btnText.style.display = "inline";
        btnLoader.style.display = "none";
      }
    });

    activeEventSource.onerror = async (err) => {
      if (auditCompleted) return;
      console.warn("SSE stream closed or error, falling back to POST /api/audit...", err);
      if (activeEventSource) {
        activeEventSource.close();
        activeEventSource = null;
      }
      addStreamLine("warn", "⚠️ Luồng SSE chuyển hướng sang chế độ Direct POST API...");

      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: url,
            mode: currentScanMode,
            max_pages: maxPages,
            quality_threshold: qualityThreshold
          })
        });

        const raw = await res.json();
        const data = raw.result ? raw.result : raw;
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Không thể phân tích website.");
        }

        auditCompleted = true;
        currentAuditData = data;
        progressBar.style.width = "100%";
        progressPercent.textContent = "100%";
        progressText.textContent = "✓ Toàn bộ 4 Agents đã hoàn tất!";
        if (streamBadge) streamBadge.textContent = "✓ Hoàn tất";

        setTimeout(() => {
          showResults(data);
        }, 300);

      } catch (postErr) {
        progressBanner.style.display = "none";
        errorAlert.textContent = `❌ Lỗi: ${postErr.message}`;
        errorAlert.style.display = "block";
      } finally {
        scanBtn.disabled = false;
        btnText.style.display = "inline";
        btnLoader.style.display = "none";
      }
    };

  } catch (err) {
    if (activeEventSource) {
      try { activeEventSource.close(); } catch (_) {}
      activeEventSource = null;
    }
    progressBanner.style.display = "none";
    errorAlert.textContent = `❌ Lỗi kết nối: ${err.message}`;
    errorAlert.style.display = "block";
    scanBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }
}

function showResults(data) {
  const progressBanner = document.getElementById("scanProgress");
  const resultsContainer = document.getElementById("resultsContainer");
  if (progressBanner) progressBanner.style.display = "none";
  if (resultsContainer) {
    resultsContainer.style.display = "block";
    resultsContainer.scrollIntoView({ behavior: "smooth" });
  }
  try {
    renderResults(data);
  } catch (err) {
    console.error("Critical error inside renderResults:", err);
  }
}

function renderResults(data) {
  if (!data) return;

  // 0. Update OpenSEO Header & Sidebar URL Preview
  try {
    const rawHost = data.hostname || (data.target_url ? new URL(data.target_url).hostname : "");
    const cleanHost = rawHost.replace(/^www\./, "");
    const openseoTitle = document.getElementById("openseoDomainTitle");
    if (openseoTitle && cleanHost) {
      openseoTitle.textContent = cleanHost;
    }
    const sidePreview = document.getElementById("sidebarUrlPreview");
    if (sidePreview) {
      sidePreview.textContent = data.target_url || (cleanHost ? `https://${cleanHost}` : "https://www.wellspring.edu.vn");
    }
    // Default to Overview tab
    switchTab("tabOverview");
  } catch (_) {}

  // 1. Mission Control & Loop Status
  const qg = data.quality_gate || { status: 'PASSED', initial_score: 80, final_score: 80, threshold: 80 };
  const loopStatusBadge = document.getElementById("loopStatusBadge");
  const qualityDecisionBadge = document.getElementById("qualityDecisionBadge");

  if (loopStatusBadge && qualityDecisionBadge) {
    if (qg.status === "PASSED") {
      loopStatusBadge.className = "badge badge-emerald";
      loopStatusBadge.textContent = `Vòng lặp #${data.iterations_run || 1}: ĐẠT CHUẨN (${qg.final_score}/${qg.threshold})`;
      qualityDecisionBadge.className = "badge badge-cyan";
      qualityDecisionBadge.textContent = "Quality Gate: PASSED";
    } else {
      loopStatusBadge.className = "badge badge-rose";
      loopStatusBadge.textContent = `Vòng lặp #${data.iterations_run || 1}: CHƯA ĐẠT (${qg.final_score}/${qg.threshold})`;
      qualityDecisionBadge.className = "badge badge-amber";
      qualityDecisionBadge.textContent = "Quality Gate: REJECTED";
    }
  }

  const initialTag = document.getElementById("initialScoreTag");
  if (initialTag) initialTag.textContent = `${qg.initial_score}/100`;
  const finalTag = document.getElementById("finalScoreTag");
  if (finalTag) finalTag.textContent = `${qg.final_score}/100`;

  // 2. Render 4-Agent Status Cards
  const specEl = document.getElementById("agentSpecialistStatus");
  if (specEl) specEl.textContent = `Đã sinh ${Object.keys(data.patches || {}).length} bản vá code`;
  const scorEl = document.getElementById("agentScorerStatus");
  if (scorEl) scorEl.textContent = `Điểm cuối: ${qg.final_score}/100 (Ngưỡng ${qg.threshold})`;
  const revEl = document.getElementById("agentReviewerStatus");
  if (revEl) revEl.textContent = qg.status === "PASSED" ? "Đã duyệt nghiệm thu" : "Từ chối nghiệm thu";
  const testEl = document.getElementById("agentTesterStatus");
  if (testEl) testEl.textContent = data.test_results?.all_passed ? "100% Tests Passed" : "Cần tinh chỉnh";

  // 3. Render Agent Terminal Trace Stream
  if (data.agents_trace) {
    renderAgentTraceFeed(data.agents_trace);
    const traceBadge = document.getElementById("traceCountBadge");
    if (traceBadge) traceBadge.textContent = `${data.agents_trace.length} logs`;
  }
  const iterBadge = document.getElementById("iterationBadge");
  if (iterBadge) iterBadge.textContent = `${data.iterations_run || 1} Vòng Lặp Hoàn Tất`;

  // 4. Render Automated Test Cases
  renderTestCases(data.test_results?.tests || []);

  // 5. Overall Gauges and Subscores
  const scores = data.scores || { overall: 80, technical: 80, onpage: 80, aeo: 70, geo: 80, subpages_avg: 75 };
  const finalScore = scores.overall;
  const scoreValEl = document.getElementById("overallScoreVal");
  if (scoreValEl) scoreValEl.textContent = finalScore;
  const circle = document.getElementById("overallCircle");
  if (circle) {
    const circumference = 2 * Math.PI * 50; // r=50 -> ~314.16
    const offset = circumference - (finalScore / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    if (finalScore >= 80) circle.style.stroke = "#10b981";
    else if (finalScore >= 60) circle.style.stroke = "#06b6d4";
    else if (finalScore >= 40) circle.style.stroke = "#f59e0b";
    else circle.style.stroke = "#f43f5e";
  }

  let verdict = "Xuất sắc · Sẵn sàng thống trị AI Search";
  if (finalScore < 50) verdict = "Cần sửa khẩn cấp · Nhiều rủi ro phạt";
  else if (finalScore < 70) verdict = "Trung bình · Cần tối ưu sâu";
  else if (finalScore < 85) verdict = "Khá tốt · Đã vượt ngưỡng chuẩn";
  const verdictEl = document.getElementById("overallScoreVerdict");
  if (verdictEl) verdictEl.textContent = verdict;

  renderSubBar("techScoreVal", "techBar", scores.technical || 70);
  renderSubBar("onpageScoreVal", "onpageBar", scores.onpage || 70);
  renderSubBar("aeoScoreVal", "aeoBar", scores.aeo || 65);
  renderSubBar("geoScoreVal", "geoBar", scores.geo || 70);
  renderSubBar("subpagesAvgScoreVal", "subpagesAvgBar", scores.subpages_avg || 75);

  // 6. Meta Strip
  const meta = data.meta || {};
  const elHost = document.getElementById("metaHostname");
  if (elHost) elHost.textContent = data.hostname || "";
  const elServer = document.getElementById("metaServer");
  if (elServer) elServer.textContent = meta.server || "Web Server";
  const elLatency = document.getElementById("metaLatency");
  if (elLatency) elLatency.textContent = `${meta.latency_ms || 0} ms`;
  const elSize = document.getElementById("metaSize");
  if (elSize) elSize.textContent = `${meta.page_size_kb || 0} KB`;
  const elSubCount = document.getElementById("metaSubpagesCount");
  if (elSubCount) elSubCount.textContent = `${data.subpages?.length || 1} bài viết`;
  const elDur = document.getElementById("metaDuration");
  if (elDur) elDur.textContent = `${data.duration_seconds || 0}s`;

  // 7. Multi-Page & Content Matrix Tab
  renderSubpagesMatrix(data);

  // 8. Internal Link Graph & Broken 404 Links Tab
  renderNetworkGraph(data);

  // 8.1 Topic Clusters & Content Silos Tab
  renderContentSilos(data.content_silos || []);

  // 8.2 Competitor Strategic Playbook Tab
  renderCompetitorPlaybook(data.competitor_playbook || {});

  // 9. Auto Patches in Roadmap Tab
  if (data.patches) {
    const pNginx = document.getElementById("patchNginxBlock");
    if (pNginx) pNginx.textContent = data.patches.nginx_301 || "# Không có bản vá Nginx";
    const pSchema = document.getElementById("patchSchemaBlock");
    if (pSchema) pSchema.textContent = data.patches.schema_jsonld || "{}";
    const pRobots = document.getElementById("patchRobotsBlock");
    if (pRobots) pRobots.textContent = data.patches.robots_txt || "";
  }

  // 9.1 Striking Distance Quick Wins (Ryze Open-SEO Model)
  renderStrikingDistance(data.striking_distance || []);

  // 10. Issues List & Counts
  renderIssuesList(data.issues || []);

  // 10. Phase 1 (Entity & AEO)
  const aeo = data.aeo_geo || {};
  const p1Brand = document.getElementById("p1BrandName");
  if (p1Brand) p1Brand.textContent = aeo.brand_guess || data.hostname || "";
  const p1Title = document.getElementById("p1FullTitle");
  if (p1Title) p1Title.textContent = meta.title || "(Chưa có thẻ title)";
  const p1Desc = document.getElementById("p1MetaDesc");
  if (p1Desc) p1Desc.textContent = meta.description || "(Chưa có thẻ description)";

  const kwContainer = document.getElementById("suggestedKeywordsList");
  if (kwContainer) {
    kwContainer.innerHTML = "";
    if (aeo.suggested_keywords && aeo.suggested_keywords.length > 0) {
      aeo.suggested_keywords.forEach((kw) => {
        const tag = document.createElement("span");
        tag.className = "keyword-tag";
        tag.textContent = kw;
        kwContainer.appendChild(tag);
      });
    } else {
      kwContainer.innerHTML = `<span class="text-muted">Không tìm thấy từ khóa mở rộng.</span>`;
    }
  }

  // 11. Phase 2 (Technical & Bot Parity)
  const tech = data.technical_audit || {};
  setTagStatus("stateDomainSplit", !tech.has_domain_split_bug, tech.has_domain_split_bug ? "Dính lỗi Domain Splitting (200 OK cả hai)" : "Chuẩn (Đã redirect 301)");
  setTagStatus("stateRobots", tech.robots_status === 200, tech.robots_status === 200 ? "200 OK" : `HTTP ${tech.robots_status}`);
  setTagStatus("stateSitemap", tech.sitemap_status === 200, tech.sitemap_status === 200 ? `200 OK (${tech.sitemap_url_count} URLs)` : "Thiếu Sitemap");
  setTagStatus("stateLlms", tech.has_llms_txt, tech.has_llms_txt ? "Đã sẵn sàng" : "Thiếu file /llms.txt");

  const botParity = tech.bot_parity || {};
  if (botParity.googlebot) {
    const el = document.getElementById("botGoogleStatus");
    if (el) el.textContent = `HTTP ${botParity.googlebot.status}`;
    const elLat = document.getElementById("botGoogleLatency");
    if (elLat) elLat.textContent = botParity.googlebot.latency_ms;
  }
  if (botParity.gptbot) {
    const el = document.getElementById("botGptStatus");
    if (el) el.textContent = `HTTP ${botParity.gptbot.status}`;
    const elLat = document.getElementById("botGptLatency");
    if (elLat) elLat.textContent = botParity.gptbot.latency_ms;
  }
  if (botParity.perplexitybot) {
    const el = document.getElementById("botPerplexityStatus");
    if (el) el.textContent = `HTTP ${botParity.perplexitybot.status}`;
    const elLat = document.getElementById("botPerplexityLatency");
    if (elLat) elLat.textContent = botParity.perplexitybot.latency_ms;
  }

  // 12. Phase 3 (On-Page, SERP & Heading Tree)
  const serpU = document.getElementById("serpUrl");
  if (serpU) serpU.textContent = data.target_url;
  const serpT = document.getElementById("serpTitle");
  if (serpT) serpT.textContent = meta.title || "Tiêu đề trang";
  const serpD = document.getElementById("serpDesc");
  if (serpD) serpD.textContent = meta.description || "Mô tả trang web hiển thị trên Google.";

  const headingsList = document.getElementById("headingsTreeList");
  if (headingsList) {
    headingsList.innerHTML = "";
    const onpage = data.onpage_audit || {};
    if (onpage.headings_sample && onpage.headings_sample.length > 0) {
      onpage.headings_sample.forEach((h) => {
        const item = document.createElement("div");
        item.className = `heading-tree-item lvl-${h.level.toLowerCase()}`;
        item.innerHTML = `<span class="h-badge">${h.level}</span> <span class="h-text">${escapeHtml(h.text)}</span>`;
        headingsList.appendChild(item);
      });
    } else {
      headingsList.innerHTML = `<span class="text-rose">⚠️ Không tìm thấy thẻ Heading nào trên trang!</span>`;
    }
  }

  const schemaBox = document.getElementById("schemaStatusBox");
  if (schemaBox) {
    schemaBox.innerHTML = "";
    const onpage = data.onpage_audit || {};
    if (onpage.schema_types && onpage.schema_types.length > 0) {
      onpage.schema_types.forEach((st) => {
        const chip = document.createElement("span");
        chip.className = "schema-chip";
        chip.textContent = `✓ Schema: ${st}`;
        schemaBox.appendChild(chip);
      });
    } else {
      schemaBox.innerHTML = `<div class="empty-schema-alert">⚠️ Chưa khai báo Schema JSON-LD trên trang chủ! Đã được tự sinh ở tab Bản Vá.</div>`;
    }
  }

  // 13. Phase 5 (GEO)
  const fRatio = document.getElementById("factualRatio");
  if (fRatio) fRatio.textContent = `${aeo.factual_ratio || 0}%`;
  const llmsText = document.getElementById("llmsStatusText");
  if (llmsText) llmsText.textContent = tech.has_llms_txt ? "Đã có sẵn" : "Đã tự động tạo mới";
  const llmsCode = document.getElementById("llmsCodeBlock");
  if (llmsCode) llmsCode.textContent = aeo.generated_llmstxt || "";

  // 13.1 AI Citation Recipe (Ryze Open-SEO GEO Engine)
  renderAiCitationAudit(data.ai_citation_audit || {});
}

function renderAgentTraceFeed(trace) {
  const feed = document.getElementById("agentTraceFeed");
  feed.innerHTML = "";

  trace.forEach((msg, idx) => {
    const item = document.createElement("div");
    item.className = `trace-item iteration-${msg.iteration}`;
    item.style.animationDelay = `${idx * 0.05}s`;

    item.innerHTML = `
      <div class="trace-meta">
        <span class="trace-time font-mono">${msg.timestamp}</span>
        <span class="trace-avatar">${msg.avatar}</span>
        <strong class="trace-agent">${msg.agent}</strong>
        <span class="trace-role text-muted">(${msg.role})</span>
        <span class="badge ${msg.badge} trace-iter-badge">Loop #${msg.iteration}</span>
      </div>
      <div class="trace-content">${escapeHtml(msg.message)}</div>
    `;
    feed.appendChild(item);
  });
}

function renderTestCases(tests) {
  const container = document.getElementById("testCasesContainer");
  container.innerHTML = "";

  tests.forEach((t) => {
    const card = document.createElement("div");
    card.className = `test-card ${t.passed ? 'test-pass' : 'test-fail'}`;
    card.innerHTML = `
      <div class="test-header">
        <span class="test-icon">${t.passed ? '✅' : '❌'}</span>
        <span class="test-name">${t.name}</span>
        <span class="test-status-tag ${t.passed ? 'status-pass' : 'status-fail'}">${t.passed ? 'PASSED' : 'FAILED'}</span>
      </div>
      <p class="test-detail">${t.detail}</p>
    `;
    container.appendChild(card);
  });
}

let currentSubpagesData = [];
let articlesFilterInitialized = false;

function renderSubpagesMatrix(data) {
  currentSubpagesData = data.subpages || [];
  const cross = data.cross_page_audit || {};
  const silos = data.content_silos || [];

  document.getElementById("subpagesCountBadge").textContent = `${currentSubpagesData.length} bài`;
  document.getElementById("crossTotalPages").textContent = currentSubpagesData.length;
  document.getElementById("crossCannibalizationCount").textContent = cross.cannibalization ? cross.cannibalization.length : 0;
  document.getElementById("crossThinCount").textContent = cross.thin_content_pages ? cross.thin_content_pages.length : 0;
  document.getElementById("crossDupTitlesCount").textContent = cross.duplicate_titles ? cross.duplicate_titles.length : 0;

  // Cannibalization Block
  const canBlock = document.getElementById("cannibalizationBlock");
  const canList = document.getElementById("cannibalList");
  if (cross.cannibalization && cross.cannibalization.length > 0) {
    canBlock.style.display = "block";
    canList.innerHTML = "";
    cross.cannibalization.forEach((c) => {
      const item = document.createElement("div");
      item.className = "cannibal-item";
      item.innerHTML = `
        <div class="cannibal-header">
          <span class="cannibal-overlap text-rose font-mono">Trùng lặp: ${c.overlap_percent}%</span>
          <span class="badge badge-rose">Ăn thịt từ khóa</span>
        </div>
        <div class="cannibal-pages">
          <div class="c-page"><strong>Bài A:</strong> <a href="${c.url_a}" target="_blank" rel="noopener">${escapeHtml(c.title_a || c.url_a)}</a></div>
          <div class="c-page"><strong>Bài B:</strong> <a href="${c.url_b}" target="_blank" rel="noopener">${escapeHtml(c.title_b || c.url_b)}</a></div>
        </div>
        <div class="cannibal-kws text-muted" style="margin-top:6px; font-size:0.82rem;"><strong>Từ khóa bị cạnh tranh:</strong> ${c.shared_keywords.join(", ")}</div>
      `;
      canList.appendChild(item);
    });
  } else {
    canBlock.style.display = "none";
  }

  // Populate Cluster Dropdown in filter bar
  const clusterSelect = document.getElementById("articleClusterSelect");
  if (clusterSelect) {
    clusterSelect.innerHTML = `<option value="ALL">Tất cả chuyên mục / Cụm chủ đề (${currentSubpagesData.length})</option>`;
    silos.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.name;
      opt.textContent = `${s.name} (${s.articles_count} bài)`;
      clusterSelect.appendChild(opt);
    });
  }

  // Bind filter events once
  if (!articlesFilterInitialized) {
    articlesFilterInitialized = true;
    const searchInp = document.getElementById("articleSearchInput");
    const sortSel = document.getElementById("articleSortSelect");
    if (searchInp) searchInp.addEventListener("input", filterAndDrawArticles);
    if (clusterSelect) clusterSelect.addEventListener("change", filterAndDrawArticles);
    if (sortSel) sortSel.addEventListener("change", filterAndDrawArticles);
  }

  filterAndDrawArticles();
}

function filterAndDrawArticles() {
  const searchInp = document.getElementById("articleSearchInput");
  const clusterSel = document.getElementById("articleClusterSelect");
  const sortSel = document.getElementById("articleSortSelect");
  const countBadge = document.getElementById("articlesFoundCount");
  const tbody = document.getElementById("subpagesTableBody");
  if (!tbody) return;

  const query = (searchInp?.value || "").toLowerCase().trim();
  const selectedCluster = clusterSel?.value || "ALL";
  const sortBy = sortSel?.value || "inlinks-desc";

  let filtered = [...currentSubpagesData];

  // Search filter
  if (query) {
    filtered = filtered.filter(p => 
      (p.title || "").toLowerCase().includes(query) ||
      (p.url || "").toLowerCase().includes(query) ||
      (p.h1 || "").toLowerCase().includes(query)
    );
  }

  // Cluster filter
  if (selectedCluster !== "ALL" && currentAuditData?.content_silos) {
    const matchedSilo = currentAuditData.content_silos.find(s => s.name === selectedCluster);
    if (matchedSilo) {
      const urlsInSilo = new Set(matchedSilo.articles.map(a => a.url));
      filtered = filtered.filter(p => urlsInSilo.has(p.url));
    }
  }

  // Sorting
  if (sortBy === "inlinks-desc") {
    filtered.sort((a, b) => (b.inlinks_count || 0) - (a.inlinks_count || 0));
  } else if (sortBy === "words-desc") {
    filtered.sort((a, b) => (b.word_count || 0) - (a.word_count || 0));
  } else if (sortBy === "words-asc") {
    filtered.sort((a, b) => (a.word_count || 0) - (b.word_count || 0));
  } else if (sortBy === "score-desc") {
    filtered.sort((a, b) => (b.page_score || 0) - (a.page_score || 0));
  } else if (sortBy === "score-asc") {
    filtered.sort((a, b) => (a.page_score || 0) - (b.page_score || 0));
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} / ${currentSubpagesData.length} bài viết`;
  }

  tbody.innerHTML = "";
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Không tìm thấy bài viết nào phù hợp với bộ lọc tìm kiếm.</td></tr>`;
    return;
  }

  filtered.forEach((p) => {
    const tr = document.createElement("tr");
    const isThin = p.word_count < 300;

    let kwsHtml = "";
    if (p.top_keywords && p.top_keywords.length > 0) {
      kwsHtml = p.top_keywords.slice(0, 4).map(k => {
        const isStuffing = k.density_pct > 3.5;
        return `<span class="kw-density-pill ${isStuffing ? 'kw-stuffing' : ''}" title="${k.count} lần (${k.density_pct}%)">
          ${escapeHtml(k.keyword)} <strong class="density-val font-mono">${k.density_pct}%</strong>
        </span>`;
      }).join(" ");
    } else {
      kwsHtml = `<span class="text-muted" style="font-size:0.8rem;">Chưa đủ dữ liệu text</span>`;
    }

    const hc = p.heading_counts || {};
    const headingsHtml = `
      <div class="heading-chips">
        <span class="h-chip ${hc.H1 === 1 ? 'h-pass' : 'h-warn'}" title="Thẻ H1">H1: ${hc.H1 || 0}</span>
        <span class="h-chip" title="Thẻ H2">H2: ${hc.H2 || 0}</span>
        <span class="h-chip" title="Thẻ H3">H3: ${hc.H3 || 0}</span>
      </div>
    `;

    tr.innerHTML = `
      <td class="url-col">
        <div class="p-title font-medium"><a href="${p.url}" target="_blank" rel="noopener">${escapeHtml(p.title || "(Chưa có title)")}</a></div>
        <div class="p-url font-mono text-muted" style="font-size:0.78rem;">${escapeHtml(p.url)}</div>
        <div class="p-h1 text-muted" style="font-size:0.8rem; margin-top:2px;">H1: ${escapeHtml(p.h1 || "❌ Không có H1")}</div>
      </td>
      <td class="font-mono" style="white-space:nowrap;">
        <div class="word-count-badge"><strong>${p.word_count.toLocaleString()}</strong> từ</div>
        <div class="reading-time text-muted" style="font-size:0.75rem;">~${p.reading_time_min || Math.ceil(p.word_count/200)} phút đọc</div>
        ${isThin ? '<span class="badge badge-rose badge-xs" style="margin-top:4px;">⚠️ Thin Content</span>' : ''}
      </td>
      <td>
        <div class="kws-container">${kwsHtml}</div>
      </td>
      <td>${headingsHtml}</td>
      <td>
        <span class="page-score-pill ${p.page_score >= 80 ? 'score-high' : p.page_score >= 60 ? 'score-mid' : 'score-low'}">
          ${p.page_score}
        </span>
      </td>
      <td>
        ${p.issues && p.issues.length > 0 ? `<span class="badge badge-rose" style="font-size:0.72rem;">${escapeHtml(p.issues[0])}</span>` : '<span class="badge badge-emerald" style="font-size:0.72rem;">✓ Tốt</span>'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderNetworkGraph(data) {
  const net = data.network_graph || {};
  const broken = net.broken_links || [];
  const orphan = net.orphan_pages || [];
  const deadEnds = net.dead_end_pages || [];
  const subpages = data.subpages || [];

  document.getElementById("netTotalLinks").textContent = net.total_internal_links || 0;
  document.getElementById("netBrokenLinksCount").textContent = broken.length;
  document.getElementById("netOrphanCount").textContent = orphan.length;
  document.getElementById("netDeadEndsCount").textContent = deadEnds.length;

  const brokenBadge = document.getElementById("brokenLinksBadge");
  if (brokenBadge) {
    brokenBadge.textContent = `${broken.length} link 404`;
    brokenBadge.className = `tab-badge ${broken.length > 0 ? 'badge-rose' : 'badge-emerald'}`;
  }

  // Broken Links List
  const brokenContainer = document.getElementById("brokenLinksList");
  if (brokenContainer) {
    brokenContainer.innerHTML = "";
    if (broken.length === 0) {
      brokenContainer.innerHTML = `
        <div class="clean-links-notice">
          <strong>✓ Hoàn hảo!</strong> Hệ thống đã gửi HEAD requests kiểm tra toàn bộ liên kết nội bộ và không tìm thấy lỗi 404 nào.
        </div>
      `;
    } else {
      broken.forEach((b) => {
        const item = document.createElement("div");
        item.className = "broken-link-item";
        item.innerHTML = `
          <div class="broken-link-header">
            <span class="badge badge-rose font-mono">HTTP ${b.status}</span>
            <span class="broken-link-url font-mono">${escapeHtml(b.broken_target_url)}</span>
          </div>
          <div class="broken-link-meta text-muted" style="margin-top:6px; font-size:0.83rem;">
            <strong>Tìm thấy tại trang nguồn:</strong> <a href="${b.source_url}" target="_blank" rel="noopener" class="font-mono text-cyan">${escapeHtml(b.source_url)}</a>
          </div>
          <div class="broken-link-fix">
            💡 <strong>Hành động đề xuất:</strong> Sửa lại thẻ <code>&lt;a href="..."&gt;</code> trong mã nguồn hoặc cấu hình bản ghi Nginx redirect 301 tự động được tạo ở tab <em>"Lộ Trình &amp; Bản Vá Code"</em>.
          </div>
        `;
        brokenContainer.appendChild(item);
      });
    }
  }

  // Inlinks Distribution Table
  const inlinksTbody = document.getElementById("inlinksTableBody");
  if (inlinksTbody) {
    inlinksTbody.innerHTML = "";
    const sortedSubpages = [...subpages].sort((a, b) => (b.inlinks_count || 0) - (a.inlinks_count || 0));
    sortedSubpages.forEach((p) => {
      const tr = document.createElement("tr");
      const anchors = (p.anchors_used || []).slice(0, 4).map(a => `<span class="anchor-badge font-mono">"${escapeHtml(a)}"</span>`).join(" ");
      tr.innerHTML = `
        <td class="url-col font-mono">
          <a href="${p.url}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a>
          <div class="p-title text-muted" style="font-size:0.82rem; margin-top:2px;">${escapeHtml(p.title || '')}</div>
        </td>
        <td>
          <span class="badge badge-cyan font-mono" style="font-size:0.85rem; font-weight:700;">
            ${p.inlinks_count || 0} inlinks
          </span>
          ${(p.inlinks_count === 0 && p.url !== data.target_url) ? '<span class="badge badge-amber badge-xs" style="margin-left:4px;">Orphan Page</span>' : ''}
        </td>
        <td class="font-mono">${p.outlinks_count || 0} links</td>
        <td>${anchors || '<span class="text-muted" style="font-size:0.8rem;">Chưa có anchor text</span>'}</td>
      `;
      inlinksTbody.appendChild(tr);
    });
  }

  // Render Outbound Authority & Anchors
  renderBacklinkAuthority(data.backlink_authority || {});
}

function renderBacklinkAuthority(backlinks) {
  const extList = backlinks.external_domains || [];
  const extBadge = document.getElementById("externalDomainsCountBadge");
  const extTbody = document.getElementById("externalAuthorityTableBody");
  if (extBadge) extBadge.textContent = `${extList.length} tên miền`;

  if (extTbody) {
    extTbody.innerHTML = "";
    if (extList.length === 0) {
      extTbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:16px; color:var(--text-muted);">Không tìm thấy external outbound links nào.</td></tr>`;
    } else {
      extList.forEach((ed) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong class="font-mono text-cyan">${escapeHtml(ed.domain)}</strong></td>
          <td><span class="badge ${ed.badge || 'badge-cyan'}">${escapeHtml(ed.category)}</span></td>
          <td class="font-mono">${ed.referring_pages_count} trang trích dẫn</td>
        `;
        extTbody.appendChild(tr);
      });
    }
  }

  // Anchor Cloud
  const anchors = backlinks.anchor_diversity || [];
  const anchorsBadge = document.getElementById("anchorsTotalCountBadge");
  const cloudContainer = document.getElementById("anchorCloudContainer");
  if (anchorsBadge) anchorsBadge.textContent = `${anchors.length} Anchors`;

  if (cloudContainer) {
    cloudContainer.innerHTML = "";
    if (anchors.length === 0) {
      cloudContainer.innerHTML = `<span class="text-muted" style="font-size:0.85rem;">Chưa ghi nhận anchor text nội bộ.</span>`;
    } else {
      anchors.forEach((a) => {
        const span = document.createElement("span");
        span.className = "anchor-tag";
        span.innerHTML = `
          <span>"${escapeHtml(a.anchor)}"</span>
          <span class="anchor-count">${a.count}</span>
          <span class="badge ${a.badge} badge-xs" style="margin-left:2px;">${escapeHtml(a.type)}</span>
        `;
        cloudContainer.appendChild(span);
      });
    }
  }
}

function renderContentSilos(silos) {
  const container = document.getElementById("silosGridContainer");
  const silosBadge = document.getElementById("silosCountBadge");
  if (silosBadge) silosBadge.textContent = `${silos.length} cụm`;

  const totalWords = silos.reduce((acc, s) => acc + (s.total_words || 0), 0);
  const pillarCount = silos.filter(s => s.pillar_title).length;
  const thinCount = silos.filter(s => s.health && s.health.includes("Thin")).length;

  const sCountEl = document.getElementById("logicSilosCount");
  if (sCountEl) sCountEl.textContent = silos.length;
  const sWordsEl = document.getElementById("logicTotalClusterWords");
  if (sWordsEl) sWordsEl.textContent = `${totalWords.toLocaleString()} từ`;
  const sPillarEl = document.getElementById("logicPillarCount");
  if (sPillarEl) sPillarEl.textContent = `${pillarCount} trụ cột`;
  const sThinEl = document.getElementById("logicThinClustersCount");
  if (sThinEl) sThinEl.textContent = `${thinCount} cụm`;

  if (!container) return;
  container.innerHTML = "";

  if (silos.length === 0) {
    container.innerHTML = `<div class="glass-card" style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:30px;">Chưa phân tích cụm chủ đề. Hãy kích hoạt quét mạng lưới.</div>`;
    return;
  }

  silos.forEach((s) => {
    const card = document.createElement("div");
    card.className = "silo-card";

    const articlesListHtml = (s.articles || []).slice(0, 8).map(a => `
      <div class="silo-article-row">
        <a href="${a.url}" target="_blank" rel="noopener" class="silo-article-name" title="${escapeHtml(a.title)}">
          ${escapeHtml(a.title)}
        </a>
        <span class="silo-article-stat">${a.words.toLocaleString()} từ · ${a.inlinks} inlinks</span>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="silo-header">
        <div>
          <h4 class="silo-title">${escapeHtml(s.name)}</h4>
          <span class="silo-meta">${s.articles_count} bài viết · Tổng ~${s.total_words.toLocaleString()} từ (~${s.avg_words} từ/bài)</span>
        </div>
        <span class="badge ${s.health_badge || 'badge-cyan'}">${escapeHtml(s.health)}</span>
      </div>

      <div class="pillar-callout">
        <span class="pillar-label">Trang Trụ Cột (Pillar Page) · ${s.pillar_inlinks} Inlinks</span>
        <a href="${s.pillar_url}" target="_blank" rel="noopener" class="pillar-title" title="${escapeHtml(s.pillar_title)}">
          ${escapeHtml(s.pillar_title)}
        </a>
      </div>

      <div class="silo-articles-list">
        ${articlesListHtml}
      </div>

      <div class="silo-footer-actions" style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
        <span class="text-muted" style="font-size: 0.78rem;">Khung bài viết chuẩn AEO:</span>
        <button class="btn btn-xs btn-outline brief-trigger-btn" data-silo="${escapeHtml(s.name)}" data-pillar="${escapeHtml(s.pillar_title)}">
          📄 Lập Content Brief
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach Content Brief click handlers
  container.querySelectorAll(".brief-trigger-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const siloName = btn.getAttribute("data-silo");
      const pillarTitle = btn.getAttribute("data-pillar");
      openContentBriefModal(siloName, pillarTitle);
    });
  });
}

function renderCompetitorPlaybook(playbook) {
  const strengths = playbook.strengths || [];
  const weaknesses = playbook.weaknesses || [];

  const sList = document.getElementById("playbookStrengthsList");
  const wList = document.getElementById("playbookWeaknessesList");

  if (sList) {
    sList.innerHTML = "";
    if (strengths.length === 0) {
      sList.innerHTML = `<div class="text-muted" style="padding:16px;">Chưa ghi nhận dữ liệu năng lực triển khai.</div>`;
    } else {
      strengths.forEach((st) => {
        const item = document.createElement("div");
        item.className = "playbook-card";
        item.innerHTML = `
          <div class="playbook-card-header">
            <span class="playbook-item-title">${escapeHtml(st.title)}</span>
            <span class="badge ${st.badge || 'badge-emerald'}">${escapeHtml(st.area)}</span>
          </div>
          <p class="playbook-item-desc">${escapeHtml(st.desc)}</p>
          <div class="playbook-fix-box">
            ✓ <strong>Hiệu quả đạt được:</strong> Đạt tiêu chuẩn kỹ thuật giúp tăng tốc độ tải và giữ chân người dùng.
          </div>
        `;
        sList.appendChild(item);
      });
    }
  }

  if (wList) {
    wList.innerHTML = "";
    if (weaknesses.length === 0) {
      wList.innerHTML = `<div class="text-emerald" style="padding:16px;">✓ Không phát hiện điểm mù chiến lược nghiêm trọng nào!</div>`;
    } else {
      weaknesses.forEach((wk) => {
        const item = document.createElement("div");
        item.className = "playbook-card";
        const isCritical = wk.severity === "CRITICAL";
        item.innerHTML = `
          <div class="playbook-card-header">
            <span class="playbook-item-title ${isCritical ? 'text-rose' : 'text-amber'}">${escapeHtml(wk.title)}</span>
            <span class="badge ${isCritical ? 'badge-rose' : 'badge-amber'}">${escapeHtml(wk.severity)}</span>
          </div>
          <p class="playbook-item-desc">${escapeHtml(wk.desc)}</p>
          <div class="playbook-impact-box">
            ⚠️ <strong>Hậu quả chiến lược:</strong> ${escapeHtml(wk.impact)}
          </div>
          <div class="playbook-fix-box" style="margin-top:4px;">
            💡 <strong>Giải pháp kỹ thuật:</strong> ${escapeHtml(wk.fix)}
          </div>
        `;
        wList.appendChild(item);
      });
    }
  }
}

function renderSubBar(valId, barId, score) {
  document.getElementById(valId).textContent = score;
  const bar = document.getElementById(barId);
  bar.style.width = score + "%";
  if (score >= 80) bar.style.background = "#10b981";
  else if (score >= 60) bar.style.background = "#06b6d4";
  else if (score >= 40) bar.style.background = "#f59e0b";
  else bar.style.background = "#f43f5e";
}

function setTagStatus(elId, isPass, text) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.className = `status-tag ${isPass ? 'tag-pass' : 'tag-fail'}`;
}

function renderIssuesList(issues) {
  const list = document.getElementById("issuesList");
  list.innerHTML = "";

  document.getElementById("issuesCountBadge").textContent = issues.length;
  document.getElementById("countAll").textContent = issues.length;
  document.getElementById("countCritical").textContent = issues.filter(i => i.severity === "CRITICAL").length;
  document.getElementById("countHigh").textContent = issues.filter(i => i.severity === "HIGH").length;
  document.getElementById("countMedium").textContent = issues.filter(i => i.severity === "MEDIUM").length;

  if (issues.length === 0) {
    list.innerHTML = `<div class="glass-card" style="text-align:center; color:#34d399;">✓ Tuyệt vời! Không phát hiện lỗi nghiêm trọng nào.</div>`;
    return;
  }

  issues.forEach((issue) => {
    const item = document.createElement("div");
    item.className = "issue-item";
    item.setAttribute("data-severity", issue.severity);

    const sevClass = `severity-${issue.severity.toLowerCase()}`;

    item.innerHTML = `
      <div class="issue-header" onclick="this.parentElement.classList.toggle('open')">
        <div class="issue-title-group">
          <span class="severity-tag ${sevClass}">${issue.severity}</span>
          <span class="issue-title">${issue.title}</span>
        </div>
        <svg class="issue-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div class="issue-body">
        <p class="issue-desc"><strong>Nguyên nhân:</strong> ${issue.description}</p>
        <div class="code-box">${escapeHtml(issue.fix)}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

function filterIssues(severity) {
  const items = document.querySelectorAll(".issue-item");
  items.forEach((item) => {
    if (severity === "ALL" || item.getAttribute("data-severity") === severity) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

function renderStrikingDistance(quickWins) {
  const container = document.getElementById("strikingGridContainer");
  const badge = document.getElementById("strikingCountBadge");
  if (badge) badge.textContent = `${quickWins.length} cơ hội`;
  if (!container) return;
  container.innerHTML = "";

  if (quickWins.length === 0) {
    container.innerHTML = `<div class="text-muted" style="padding:16px;">Toàn bộ bài viết đã có tiêu đề và mô tả đầy đủ. Không phát hiện CTR Anomaly đáng kể.</div>`;
    return;
  }

  quickWins.forEach((item) => {
    const card = document.createElement("div");
    card.className = "striking-card";
    const reasonsHtml = item.reasons.map(r => `<span class="badge badge-rose badge-xs" style="margin-right:4px;">${escapeHtml(r)}</span>`).join("");

    card.innerHTML = `
      <div class="striking-header">
        <div class="striking-url-wrap font-mono">
          <a href="${item.url}" target="_blank" rel="noopener" class="text-cyan">${escapeHtml(item.url)}</a>
        </div>
        <div class="striking-badges">
          <span class="badge badge-purple">${item.inlinks} Inlinks</span>
          <span class="badge ${item.priority === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${item.priority}</span>
        </div>
      </div>

      <div class="striking-reasons" style="margin: 8px 0;">
        ${reasonsHtml}
      </div>

      <div class="striking-diff-box">
        <div class="diff-row">
          <span class="diff-label text-rose">Tiêu đề hiện tại:</span>
          <span class="diff-val">${escapeHtml(item.current_title)}</span>
        </div>
        <div class="diff-row diff-recommended">
          <span class="diff-label text-emerald">💡 Bản vá Title tối ưu CTR:</span>
          <span class="diff-val font-medium text-emerald">${escapeHtml(item.recommended_title)}</span>
        </div>
        <div class="diff-row" style="margin-top:6px;">
          <span class="diff-label text-muted">Mô tả hiện tại:</span>
          <span class="diff-val text-muted">${escapeHtml(item.current_desc)}</span>
        </div>
        <div class="diff-row diff-recommended">
          <span class="diff-label text-cyan">💡 Bản vá Meta Description:</span>
          <span class="diff-val text-cyan">${escapeHtml(item.recommended_desc)}</span>
        </div>
      </div>

      <div class="striking-actions" style="margin-top:10px; display:flex; justify-content:flex-end;">
        <button class="btn btn-xs btn-secondary copy-snippet-btn" data-title="${escapeHtml(item.recommended_title)}" data-desc="${escapeHtml(item.recommended_desc)}">
          📋 Sao chép Title &amp; Description
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach copy listeners
  container.querySelectorAll(".copy-snippet-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.getAttribute("data-title");
      const d = btn.getAttribute("data-desc");
      const snippet = `<title>${t}</title>\n<meta name="description" content="${d}">`;
      navigator.clipboard.writeText(snippet).then(() => {
        const orig = btn.textContent;
        btn.textContent = "✓ Đã sao chép Snippet!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = orig;
          btn.classList.remove("copied");
        }, 2000);
      });
    });
  });
}

function renderAiCitationAudit(aiData) {
  const citableList = document.getElementById("geoCitableList");
  const needsList = document.getElementById("geoNeedsList");
  const cBadge = document.getElementById("geoCitableBadge");
  const nBadge = document.getElementById("geoNeedsBadge");

  const citable = aiData.citable_pages || [];
  const needs = aiData.optimization_candidates || [];

  if (cBadge) cBadge.textContent = `${aiData.total_citable || citable.length} Đạt Chuẩn AI`;
  if (nBadge) nBadge.textContent = `${aiData.total_needs_recipe || needs.length} Cần Thêm Công Thức`;

  if (citableList) {
    citableList.innerHTML = "";
    if (citable.length === 0) {
      citableList.innerHTML = `<div class="text-muted" style="padding:10px;">Chưa có bài viết nào đạt trên 75 điểm chuẩn trích dẫn AI.</div>`;
    } else {
      citable.forEach((p) => {
        const div = document.createElement("div");
        div.className = "citation-card citable-card";
        div.innerHTML = `
          <div class="citation-header">
            <a href="${p.url}" target="_blank" rel="noopener" class="citation-title font-medium">${escapeHtml(p.title || p.url)}</a>
            <span class="badge badge-emerald font-mono">${p.ai_readiness_score}/100</span>
          </div>
          <div class="citation-criteria" style="margin-top:6px;">
            ${p.criteria.map(c => `<span class="badge badge-cyan badge-xs" style="margin-right:4px;">${escapeHtml(c)}</span>`).join("")}
          </div>
          <div class="citation-action text-emerald" style="margin-top:6px; font-size:0.8rem;">
            ✓ ${escapeHtml(p.action)}
          </div>
        `;
        citableList.appendChild(div);
      });
    }
  }

  if (needsList) {
    needsList.innerHTML = "";
    if (needs.length === 0) {
      needsList.innerHTML = `<div class="text-emerald" style="padding:10px;">Toàn bộ bài viết đã đạt chuẩn!</div>`;
    } else {
      needs.forEach((p) => {
        const div = document.createElement("div");
        div.className = "citation-card needs-card";
        div.innerHTML = `
          <div class="citation-header">
            <a href="${p.url}" target="_blank" rel="noopener" class="citation-title font-medium">${escapeHtml(p.title || p.url)}</a>
            <span class="badge badge-amber font-mono">${p.ai_readiness_score}/100</span>
          </div>
          <div class="citation-criteria" style="margin-top:6px;">
            ${p.criteria.map(c => `<span class="badge badge-rose badge-xs" style="margin-right:4px;">${escapeHtml(c)}</span>`).join("")}
          </div>
          <div class="citation-action text-amber" style="margin-top:6px; font-size:0.8rem;">
            💡 ${escapeHtml(p.action)}
          </div>
        `;
        needsList.appendChild(div);
      });
    }
  }
}

let currentBriefMarkdown = "";

function openContentBriefModal(topic, pillarTitle) {
  const modal = document.getElementById("contentBriefModal");
  const mTitle = document.getElementById("briefModalTitle");
  const mSub = document.getElementById("briefModalSubtitle");
  const mBody = document.getElementById("briefModalBody");
  if (!modal) return;

  mTitle.textContent = `📄 Bản Đề Cương Nội Dung: ${topic}`;
  mSub.textContent = `Tối ưu chuẩn thực thể SEO & AEO kết nối với Trang trụ cột: "${pillarTitle || 'Trang chủ'}"`;
  mBody.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-cyan);">Đang sinh cấu trúc Brief chuẩn SERP &amp; Entity...</div>`;
  modal.style.display = "flex";

  fetch("/api/content-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: topic, pillar_title: pillarTitle })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.brief) {
      const b = data.brief;
      currentBriefMarkdown = `# CONTENT BRIEF: ${b.recommended_title}\n- **Chủ đề chính:** ${b.target_keyword}\n- **Search Intent:** ${b.search_intent}\n- **Độ dài mục tiêu:** ~${b.word_count_target} từ\n- **Dữ liệu có cấu trúc:** ${b.suggested_schema}\n- **Từ khóa bắt buộc:** ${b.primary_keywords.join(", ")}\n\n## Dàn Ý Chi Tiết (Headings Outline)\n${b.headings_outline.map(h => `- ${h}`).join("\n")}\n\n## Mạng Lưới Liên Kết Nội Bộ Cần Nhúng\n${b.target_internal_links.map(l => `- [ ] ${l}`).join("\n")}\n`;

      mBody.innerHTML = `
        <div class="brief-box">
          <div class="brief-meta-row" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <div><span class="text-muted">Tiêu đề đề xuất:</span> <strong class="text-cyan">${escapeHtml(b.recommended_title)}</strong></div>
            <div style="margin-top:6px;"><span class="text-muted">Độ dài mục tiêu:</span> <span class="badge badge-emerald">~${b.word_count_target} từ</span> · <span class="badge badge-purple">${escapeHtml(b.suggested_schema)}</span></div>
            <div style="margin-top:6px;"><span class="text-muted">Ý định tìm kiếm (Intent):</span> <span class="text-amber" style="font-size:0.85rem;">${escapeHtml(b.search_intent)}</span></div>
          </div>

          <div style="margin-top:12px;">
            <h4 style="font-size:0.92rem; margin-bottom:8px; color:var(--emerald-400);">Dàn Ý Đề Mục Headings Chuẩn AEO (5W1H):</h4>
            <ul class="brief-outline-list" style="padding-left: 20px; line-height: 1.6;">
              ${b.headings_outline.map(h => `<li>${escapeHtml(h)}</li>`).join("")}
            </ul>
          </div>

          <div style="margin-top:14px;">
            <h4 style="font-size:0.92rem; margin-bottom:8px; color:var(--cyan-400);">Liên Kết Nội Bộ (Internal Inlinks) Bắt Buộc Nhúng:</h4>
            <div class="brief-links-chips">
              ${b.target_internal_links.map(l => `<span class="badge badge-cyan badge-xs" style="margin-right:6px; margin-bottom:4px; display:inline-block;">🔗 ${escapeHtml(l)}</span>`).join("")}
            </div>
          </div>
        </div>
      `;
    }
  })
  .catch(err => {
    mBody.innerHTML = `<div class="text-rose">Lỗi sinh Content Brief: ${err.message}</div>`;
  });
}

// Modal bindings initialization
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("contentBriefModal");
  const closeBtn1 = document.getElementById("closeBriefModalBtn");
  const closeBtn2 = document.getElementById("closeBriefBtn2");
  const copyBriefBtn = document.getElementById("copyBriefBtn");

  const closeModal = () => { if (modal) modal.style.display = "none"; };
  if (closeBtn1) closeBtn1.addEventListener("click", closeModal);
  if (closeBtn2) closeBtn2.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (copyBriefBtn) {
    copyBriefBtn.addEventListener("click", () => {
      if (!currentBriefMarkdown) return;
      navigator.clipboard.writeText(currentBriefMarkdown).then(() => {
        const orig = copyBriefBtn.textContent;
        copyBriefBtn.textContent = "✓ Đã sao chép Brief Markdown!";
        copyBriefBtn.classList.add("copied");
        setTimeout(() => {
          copyBriefBtn.textContent = orig;
          copyBriefBtn.classList.remove("copied");
        }, 2000);
      });
    });
  }
});

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function exportMarkdownReport() {
  if (!currentAuditData) return;
  const d = currentAuditData;
  const md = `# BÁO CÁO AUDIT SEO · AEO · GEO TOÀN DIỆN
**Tên miền:** ${d.hostname}  
**URL kiểm định:** ${d.target_url}  
**Thời gian:** ${new Date().toLocaleString("vi-VN")}  
**Trạng thái Quality Gate:** ${d.quality_gate.status} (Điểm cuối: ${d.quality_gate.final_score}/${d.quality_gate.threshold})  
**Số vòng lặp AI Agent thực hiện:** ${d.iterations_run}

---

## 1. Điểm Số Đa Chiều
- **Điểm tổng hợp:** ${d.scores.overall}/100
- **Technical SEO:** ${d.scores.technical}/100
- **On-Page & Schema:** ${d.scores.onpage}/100
- **Core Web Vitals:** ${d.scores.cwv}/100
- **AEO (Answer Intent):** ${d.scores.aeo}/100
- **GEO (AI Search Ready):** ${d.scores.geo}/100
- **Sức khỏe trung bình đa trang:** ${d.scores.subpages_avg}/100

---

## 2. Kết Quả Kiểm Thử Tự Động (Tester-AI)
${(d.test_results?.tests || []).map(t => `- [${t.passed ? 'x' : ' '}] **${t.name}**: ${t.detail}`).join("\n")}

---

## 3. Ma Trận Đào Sâu ${d.subpages?.length || 0} Bài Viết & Trang Con
${(d.subpages || []).map((p, idx) => `${idx + 1}. **${p.title || p.url}** (${p.url})  
   - Số từ: ${p.word_count} | H1: ${p.h1 || 'Không có'} | Điểm: ${p.page_score}/100`).join("\n\n")}

---

## 4. Các Lỗi Cần Khắc Phục (Tổng cộng: ${d.issues.length} lỗi)
${d.issues.map(iss => `### [${iss.severity}] ${iss.title}\n- **Mô tả:** ${iss.description}\n- **Cách khắc phục:**\n\`\`\`\n${iss.fix}\n\`\`\``).join("\n\n")}

---
*Báo cáo được tạo tự động bởi SEO Master Suite Autonomous Engine.*
`;

  downloadFile(`${d.hostname}-seo-audit.md`, md, "text/markdown");
}

function exportJsonData() {
  if (!currentAuditData) return;
  const jsonStr = JSON.stringify(currentAuditData, null, 2);
  downloadFile(`${currentAuditData.hostname}-audit.json`, jsonStr, "application/json");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
