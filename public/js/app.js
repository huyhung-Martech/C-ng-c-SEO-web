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

  // GSC File Upload & Actions
  const gscUploadBtn = document.getElementById("gscUploadBtn");
  const gscFileInput = document.getElementById("gscFileInput");
  const gscDropzone = document.getElementById("gscDropzone");
  const gscDemoBtn = document.getElementById("gscDemoBtn");
  const gscClearBtn = document.getElementById("gscClearBtn");

  if (gscUploadBtn && gscFileInput) {
    gscUploadBtn.addEventListener("click", () => gscFileInput.click());
    gscFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleGscCsvUpload(file);
    });
  }

  if (gscDropzone && gscFileInput) {
    gscDropzone.addEventListener("click", () => gscFileInput.click());
    gscDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      gscDropzone.classList.add("drag-over");
    });
    gscDropzone.addEventListener("dragleave", () => gscDropzone.classList.remove("drag-over"));
    gscDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      gscDropzone.classList.remove("drag-over");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleGscCsvUpload(e.dataTransfer.files[0]);
      }
    });
  }

  if (gscDemoBtn) {
    gscDemoBtn.addEventListener("click", () => loadGscDemoData());
  }

  if (gscClearBtn) {
    gscClearBtn.addEventListener("click", () => clearGscData());
  }

  // Export buttons
  const mdBtn = document.getElementById("exportMdBtn");
  if (mdBtn) mdBtn.addEventListener("click", exportMarkdownReport);
  const jsonBtn = document.getElementById("exportJsonBtn");
  if (jsonBtn) jsonBtn.addEventListener("click", exportJsonData);
  const prtBtn = document.getElementById("printBtn");
  if (prtBtn) prtBtn.addEventListener("click", () => window.print());
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

  // Potential Score Display
  const potentialScoreWrap = document.getElementById("potentialScoreWrap");
  const potentialScoreVal = document.getElementById("potentialScoreVal");
  const potScore = scores.potential_score || qg.potential_score;
  if (potentialScoreWrap && potentialScoreVal && potScore) {
    potentialScoreVal.textContent = potScore;
    potentialScoreWrap.style.display = "inline-flex";
  } else if (potentialScoreWrap) {
    potentialScoreWrap.style.display = "none";
  }

  // Render Google SERP Pixel Width Engine
  renderSerpPixelMeter(data.meta || {}, data.target_url);

  // Render Live Google Suggest 5W1H Intent Clusters
  if (data.aeo_geo?.google_intent_clusters) {
    renderIntentClusters(data.aeo_geo.google_intent_clusters);
  }

  // Render GSC Performance if connected
  if (data.gsc_connected && data.gsc_performance) {
    renderGscData(data.gsc_performance);
  }

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

  // 6.1 Enterprise SaaS Visual Health Metrics
  renderSaasVisualMetrics(data.saas_visual_metrics || {}, data.subpages || []);

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

// ==============================================================================
// ENTERPRISE SAAS VISUAL HEALTH METRICS (Ahrefs / Screaming Frog Style)
// ==============================================================================
function renderSaasVisualMetrics(metrics, subpages = []) {
  const status = metrics.status_distribution || {};
  const words = metrics.word_count_distribution || {};
  const idx = metrics.indexability_metrics || {};

  // Card 1: HTTP Status Codes
  const s200 = status.s200 || 0;
  const s301 = status.s301 || 0;
  const s404 = status.s404 || 0;
  const sOther = status.s_other || 0;
  const totalStatus = Math.max(1, s200 + s301 + s404 + sOther);

  const pct200 = Math.round((s200 / totalStatus) * 100);
  const pct301 = Math.round((s301 / totalStatus) * 100);
  const pct404 = Math.round((s404 / totalStatus) * 100);
  const pctOther = Math.max(0, 100 - pct200 - pct301 - pct404);

  const seg200 = document.getElementById("seg200"); if (seg200) seg200.style.width = `${pct200}%`;
  const seg301 = document.getElementById("seg301"); if (seg301) seg301.style.width = `${pct301}%`;
  const seg404 = document.getElementById("seg404"); if (seg404) seg404.style.width = `${pct404}%`;
  const segOther = document.getElementById("segOther"); if (segOther) segOther.style.width = `${pctOther}%`;

  const val200 = document.getElementById("valHttp200"); if (val200) val200.textContent = s200;
  const val301 = document.getElementById("valHttp301"); if (val301) val301.textContent = s301;
  const val404 = document.getElementById("valHttp404"); if (val404) val404.textContent = s404;

  const badgeStatus = document.getElementById("saasStatusBadge");
  const subStatus = document.getElementById("saasStatusSummary");
  if (badgeStatus) {
    if (s404 === 0 && pct200 >= 95) {
      badgeStatus.className = "badge badge-emerald";
      badgeStatus.textContent = `${pct200}% OK`;
      if (subStatus) subStatus.textContent = "Không phát hiện lỗi phản hồi";
    } else if (s404 > 0) {
      badgeStatus.className = "badge badge-rose";
      badgeStatus.textContent = `${s404} link gãy`;
      if (subStatus) subStatus.textContent = `Phát hiện ${s404} URL trả về lỗi 404`;
    } else {
      badgeStatus.className = "badge badge-amber";
      badgeStatus.textContent = `${pct200}% OK`;
      if (subStatus) subStatus.textContent = "Cần theo dõi các mã chuyển hướng 3xx";
    }
  }

  // Card 2: Content Word Counts
  const wThin = words.thin || 0;
  const wStd = words.standard || 0;
  const wDeep = words.indepth || 0;
  const wPillar = words.pillar || 0;
  const totalWords = Math.max(1, wThin + wStd + wDeep + wPillar);

  const elThin = document.getElementById("valWordThin"); if (elThin) elThin.textContent = `${wThin} bài`;
  const elStd = document.getElementById("valWordStd"); if (elStd) elStd.textContent = `${wStd} bài`;
  const elDeep = document.getElementById("valWordDeep"); if (elDeep) elDeep.textContent = `${wDeep} bài`;
  const elPillar = document.getElementById("valWordPillar"); if (elPillar) elPillar.textContent = `${wPillar} bài`;

  const bThin = document.getElementById("tierThinBar"); if (bThin) bThin.style.width = `${Math.round((wThin / totalWords) * 100)}%`;
  const bStd = document.getElementById("tierStdBar"); if (bStd) bStd.style.width = `${Math.round((wStd / totalWords) * 100)}%`;
  const bDeep = document.getElementById("tierDeepBar"); if (bDeep) bDeep.style.width = `${Math.round((wDeep / totalWords) * 100)}%`;
  const bPillar = document.getElementById("tierPillarBar"); if (bPillar) bPillar.style.width = `${Math.round((wPillar / totalWords) * 100)}%`;

  const badgeWords = document.getElementById("saasWordsBadge");
  if (badgeWords) {
    if (wThin > 0) {
      badgeWords.className = "badge badge-amber";
      badgeWords.textContent = `${wThin} bài mỏng`;
    } else {
      badgeWords.className = "badge badge-emerald";
      badgeWords.textContent = "Đạt độ sâu tốt";
    }
  }

  // Card 3: Indexability & Architecture
  const vIdx = document.getElementById("valIndexable"); if (vIdx) vIdx.textContent = idx.indexable || 0;
  const vNoIdx = document.getElementById("valNoindex"); if (vNoIdx) vNoIdx.textContent = idx.noindex || 0;
  const vCanon = document.getElementById("valCanonicalValid"); if (vCanon) vCanon.textContent = idx.canonical_valid || 0;
  const vOrphan = document.getElementById("valOrphanPages"); if (vOrphan) vOrphan.textContent = idx.orphan_pages || 0;

  const badgeIdx = document.getElementById("saasIndexBadge");
  if (badgeIdx) {
    if ((idx.orphan_pages || 0) === 0 && (idx.noindex || 0) === 0) {
      badgeIdx.className = "badge badge-emerald";
      badgeIdx.textContent = "Kiến trúc hoàn hảo";
    } else if ((idx.orphan_pages || 0) > 0) {
      badgeIdx.className = "badge badge-amber";
      badgeIdx.textContent = `${idx.orphan_pages} bài mồ côi`;
    } else {
      badgeIdx.className = "badge badge-cyan";
      badgeIdx.textContent = `${idx.indexable || 0} Indexable`;
    }
  }
}

let currentSubpagesData = [];
let articlesFilterInitialized = false;
let activeFacetedFilter = "all";

function renderSubpagesMatrix(data) {
  currentSubpagesData = data.subpages || [];
  const cross = data.cross_page_audit || {};
  const silos = data.content_silos || [];

  document.getElementById("subpagesCountBadge").textContent = `${currentSubpagesData.length} bài`;
  document.getElementById("crossTotalPages").textContent = currentSubpagesData.length;
  document.getElementById("crossCannibalizationCount").textContent = cross.cannibalization ? cross.cannibalization.length : 0;
  document.getElementById("crossThinCount").textContent = cross.thin_content_pages ? cross.thin_content_pages.length : 0;
  document.getElementById("crossDupTitlesCount").textContent = cross.duplicate_titles ? cross.duplicate_titles.length : 0;

  // Faceted Quick Filter Chips Count Badges
  const countAll = currentSubpagesData.length;
  const countError = currentSubpagesData.filter(p => (p.issues && p.issues.length > 0) || (p.status_code && p.status_code >= 400)).length;
  const countThin = currentSubpagesData.filter(p => (p.word_count || 0) < 300).length;
  const countPrune = currentSubpagesData.filter(p => p.pruning_action && p.pruning_action !== 'keep').length;
  const countNoH1 = currentSubpagesData.filter(p => !p.h1 || p.h1.trim() === '' || p.h1.includes('Không có H1')).length;
  const countHigh = currentSubpagesData.filter(p => (p.page_score || 0) >= 80).length;

  const elChipAll = document.getElementById("chipAllCount"); if (elChipAll) elChipAll.textContent = countAll;
  const elChipErr = document.getElementById("chipErrorCount"); if (elChipErr) elChipErr.textContent = countError;
  const elChipThin = document.getElementById("chipThinCount"); if (elChipThin) elChipThin.textContent = countThin;
  const elChipPrune = document.getElementById("chipPruneCount"); if (elChipPrune) elChipPrune.textContent = countPrune;
  const elChipNoH1 = document.getElementById("chipNoH1Count"); if (elChipNoH1) elChipNoH1.textContent = countNoH1;
  const elChipHigh = document.getElementById("chipHighCount"); if (elChipHigh) elChipHigh.textContent = countHigh;

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

    // Faceted Chips click handler
    document.querySelectorAll("#facetedFilterChips .filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll("#facetedFilterChips .filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeFacetedFilter = chip.getAttribute("data-filter") || "all";
        filterAndDrawArticles();
      });
    });
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

  // Faceted Quick Filter Chip selection
  if (activeFacetedFilter === "error") {
    filtered = filtered.filter(p => (p.issues && p.issues.length > 0) || (p.status_code && p.status_code >= 400));
  } else if (activeFacetedFilter === "thin") {
    filtered = filtered.filter(p => (p.word_count || 0) < 300);
  } else if (activeFacetedFilter === "prune") {
    filtered = filtered.filter(p => p.pruning_action && p.pruning_action !== 'keep');
  } else if (activeFacetedFilter === "noh1") {
    filtered = filtered.filter(p => !p.h1 || p.h1.trim() === '' || p.h1.includes('Không có H1'));
  } else if (activeFacetedFilter === "high") {
    filtered = filtered.filter(p => (p.page_score || 0) >= 80);
  }

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
        ${p.issues && p.issues.length > 0 ? `<div style="margin-bottom:4px;"><span class="badge badge-rose" style="font-size:0.72rem;">${escapeHtml(p.issues[0])}</span></div>` : '<div style="margin-bottom:4px;"><span class="badge badge-emerald" style="font-size:0.72rem;">✓ Tốt</span></div>'}
        ${p.pruning_label ? `<div><span class="badge ${p.pruning_badge || 'badge-cyan'}" style="font-size:0.7rem;" title="${escapeHtml(p.pruning_reason || '')}">${escapeHtml(p.pruning_label)}</span></div>` : ''}
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
          <strong>✓ Hoàn hảo!</strong> Hệ thống đã kích hoạt xác thực hai tầng (Two-Phase GET Verification) kiểm tra toàn bộ liên kết nội bộ và không phát hiện bất kỳ liên kết gãy (HTTP 404/410) nào.
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

    const authRestricted = net.auth_restricted_links || [];
    if (authRestricted.length > 0) {
      const authBox = document.createElement("div");
      authBox.className = "auth-links-notice";
      authBox.style.cssText = "margin-top: 14px; padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.08);";
      authBox.innerHTML = `
        <div style="font-size:0.88rem; color:#f59e0b; font-weight:600; margin-bottom:6px;">
          ℹ️ Ghi nhận ${authRestricted.length} liên kết yêu cầu xác thực / phân quyền (HTTP 401/403) — Đã được phân loại an toàn, không tính vào lỗi gãy 404:
        </div>
        <div style="font-size:0.82rem; color:var(--text-muted); display:flex; flex-direction:column; gap:6px;">
          ${authRestricted.map(a => `
            <div>
              <span class="badge badge-amber font-mono" style="font-size:0.75rem;">HTTP ${a.status}</span>
              <span class="font-mono text-cyan">${escapeHtml(a.target_url)}</span>
              <span style="opacity:0.75;"> (tại: ${escapeHtml(a.source_url)})</span>
            </div>
          `).join("")}
        </div>
      `;
      brokenContainer.appendChild(authBox);
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

  // Trigger Interactive Force-Directed Link Graph Visualizer (Obsidian / Screaming Frog Canvas)
  initForceGraphEngine(subpages, net.edges || [], broken, orphan);
}

// ==============================================================================
// FORCE-DIRECTED LINK GRAPH SIMULATION ENGINE (Obsidian / Screaming Frog Style)
// ==============================================================================
let forceSimulation = {
  running: true,
  showLabels: true,
  nodes: [],
  edges: [],
  pan: { x: 0, y: 0 },
  zoom: 1.0,
  isDraggingNode: null,
  isPanning: false,
  startMouse: { x: 0, y: 0 },
  hoveredNode: null,
  animId: null
};

function initForceGraphEngine(subpages, edges, brokenLinks = [], orphanPages = []) {
  const canvas = document.getElementById("forceGraphCanvas");
  const wrap = document.getElementById("forceCanvasWrap");
  const placeholder = document.getElementById("graphPlaceholder");
  const tooltip = document.getElementById("graphTooltipHud");
  if (!canvas || !wrap) return;

  if (forceSimulation.animId) {
    cancelAnimationFrame(forceSimulation.animId);
    forceSimulation.animId = null;
  }

  if (!subpages || subpages.length === 0) {
    if (placeholder) placeholder.style.display = "flex";
    return;
  }
  if (placeholder) placeholder.style.display = "none";

  const rect = wrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = rect.width || 940;
  const height = rect.height || 520;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const nodeMap = new Map();
  const orphanSet = new Set((orphanPages || []).map(o => o.url));
  const brokenSet = new Set((brokenLinks || []).map(b => b.broken_target_url));

  const nodes = subpages.map((p, idx) => {
    const isHome = idx === 0;
    const isOrphan = orphanSet.has(p.url) || (p.inlinks_count === 0 && !isHome);
    const isBroken = brokenSet.has(p.url) || p.status === 404;
    const isThin = (p.word_count || 0) < 300;
    const isPillar = (p.inlinks_count || 0) >= 4 || (p.pruning_action === "HEALTHY" && p.word_count > 1200);

    let nodeType = "healthy";
    let color = "#10b981";
    let radius = 7;

    if (isHome) {
      nodeType = "home";
      color = "#06b6d4";
      radius = 16;
    } else if (isBroken) {
      nodeType = "broken";
      color = "#f43f5e";
      radius = 9;
    } else if (isOrphan) {
      nodeType = "orphan";
      color = "#f43f5e";
      radius = 7;
    } else if (isPillar) {
      nodeType = "pillar";
      color = "#a855f7";
      radius = 11;
    } else if (isThin) {
      nodeType = "thin";
      color = "#f59e0b";
      radius = 6;
    }

    const angle = (idx / Math.max(1, subpages.length)) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
    const dist = isHome ? 0 : 80 + Math.random() * (Math.min(width, height) * 0.35);

    const node = {
      id: p.url,
      url: p.url,
      title: p.title || p.url,
      x: width / 2 + Math.cos(angle) * dist,
      y: height / 2 + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: radius,
      color: color,
      nodeType: nodeType,
      inlinks: p.inlinks_count || 0,
      outlinks: p.outlinks_count || 0,
      words: p.word_count || 0,
      score: p.page_score || 80,
      isHome: isHome
    };
    nodeMap.set(p.url, node);
    return node;
  });

  const resolvedEdges = [];
  (edges || []).forEach(e => {
    const srcNode = nodeMap.get(e.source);
    const tgtNode = nodeMap.get(e.target);
    if (srcNode && tgtNode && srcNode !== tgtNode) {
      resolvedEdges.push({ source: srcNode, target: tgtNode });
    }
  });

  if (resolvedEdges.length === 0 && nodes.length > 1) {
    const homeNode = nodes[0];
    for (let i = 1; i < nodes.length; i++) {
      if (!orphanSet.has(nodes[i].url)) {
        resolvedEdges.push({ source: homeNode, target: nodes[i] });
      }
    }
  }

  forceSimulation.nodes = nodes;
  forceSimulation.edges = resolvedEdges;
  forceSimulation.pan = { x: 0, y: 0 };
  forceSimulation.zoom = 1.0;
  forceSimulation.running = true;

  // Toolbar actions
  const btnReset = document.getElementById("btnGraphResetZoom");
  if (btnReset) {
    btnReset.onclick = () => {
      forceSimulation.pan = { x: 0, y: 0 };
      forceSimulation.zoom = 1.0;
    };
  }

  const btnPause = document.getElementById("btnGraphPause");
  if (btnPause) {
    btnPause.onclick = () => {
      forceSimulation.running = !forceSimulation.running;
      btnPause.textContent = forceSimulation.running ? "⏸️ Pause" : "▶️ Play";
      btnPause.classList.toggle("active", !forceSimulation.running);
    };
  }

  const btnLabels = document.getElementById("btnGraphLabels");
  if (btnLabels) {
    btnLabels.onclick = () => {
      forceSimulation.showLabels = !forceSimulation.showLabels;
      btnLabels.classList.toggle("active", forceSimulation.showLabels);
    };
  }

  setupGraphInteractions(wrap, canvas, tooltip, width, height);

  // Physics simulation loop
  function step() {
    if (forceSimulation.running) {
      const repulseStrength = 360;
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          let dx = n2.x - n1.x;
          let dy = n2.y - n1.y;
          let distSq = dx * dx + dy * dy + 0.1;
          let dist = Math.sqrt(distSq);
          if (dist < 320) {
            let force = (repulseStrength / distSq);
            let fx = (dx / dist) * force;
            let fy = (dy / dist) * force;
            if (n1 !== forceSimulation.isDraggingNode) { n1.vx -= fx; n1.vy -= fy; }
            if (n2 !== forceSimulation.isDraggingNode) { n2.vx += fx; n2.vy += fy; }
          }
        }
      }

      const springLength = 80;
      const springK = 0.045;
      for (let i = 0; i < resolvedEdges.length; i++) {
        const e = resolvedEdges[i];
        let dx = e.target.x - e.source.x;
        let dy = e.target.y - e.source.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let force = (dist - springLength) * springK;
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        if (e.source !== forceSimulation.isDraggingNode) { e.source.vx += fx; e.source.vy += fy; }
        if (e.target !== forceSimulation.isDraggingNode) { e.target.vx -= fx; e.target.vy -= fy; }
      }

      const cx = width / 2;
      const cy = height / 2;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n === forceSimulation.isDraggingNode) continue;
        n.vx += (cx - n.x) * 0.008;
        n.vy += (cy - n.y) * 0.008;

        n.vx *= 0.88;
        n.vy *= 0.88;

        n.x += n.vx;
        n.y += n.vy;
      }
    }

    drawGraph(ctx, width, height);
    forceSimulation.animId = requestAnimationFrame(step);
  }

  step();
}

function setupGraphInteractions(wrap, canvas, tooltip, width, height) {
  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * (width / rect.width);
    const screenY = (e.clientY - rect.top) * (height / rect.height);
    const worldX = (screenX - (width / 2 + forceSimulation.pan.x)) / forceSimulation.zoom + width / 2;
    const worldY = (screenY - (height / 2 + forceSimulation.pan.y)) / forceSimulation.zoom + height / 2;
    return { worldX, worldY, screenX, screenY, clientX: e.clientX, clientY: e.clientY };
  }

  function findNode(worldX, worldY) {
    for (let i = forceSimulation.nodes.length - 1; i >= 0; i--) {
      const n = forceSimulation.nodes[i];
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      if (dx * dx + dy * dy <= (n.radius + 8) * (n.radius + 8)) {
        return n;
      }
    }
    return null;
  }

  canvas.onmousedown = (e) => {
    const c = getCoords(e);
    const hit = findNode(c.worldX, c.worldY);
    if (hit) {
      forceSimulation.isDraggingNode = hit;
      hit.vx = 0;
      hit.vy = 0;
    } else {
      forceSimulation.isPanning = true;
      forceSimulation.startMouse = { x: e.clientX, y: e.clientY };
    }
  };

  window.onmousemove = (e) => {
    if (forceSimulation.isDraggingNode) {
      const c = getCoords(e);
      forceSimulation.isDraggingNode.x = c.worldX;
      forceSimulation.isDraggingNode.y = c.worldY;
      forceSimulation.isDraggingNode.vx = 0;
      forceSimulation.isDraggingNode.vy = 0;
    } else if (forceSimulation.isPanning) {
      const dx = e.clientX - forceSimulation.startMouse.x;
      const dy = e.clientY - forceSimulation.startMouse.y;
      forceSimulation.pan.x += dx;
      forceSimulation.pan.y += dy;
      forceSimulation.startMouse = { x: e.clientX, y: e.clientY };
    } else {
      const c = getCoords(e);
      const hit = findNode(c.worldX, c.worldY);
      forceSimulation.hoveredNode = hit;
      if (hit && tooltip) {
        tooltip.style.display = "block";
        const wrapRect = wrap.getBoundingClientRect();
        let left = e.clientX - wrapRect.left + 15;
        let top = e.clientY - wrapRect.top + 15;
        if (left + 280 > wrapRect.width) left = wrapRect.width - 290;
        if (top + 110 > wrapRect.height) top = wrapRect.height - 120;
        tooltip.style.left = `${Math.max(10, left)}px`;
        tooltip.style.top = `${Math.max(10, top)}px`;
        tooltip.innerHTML = `
          <div class="graph-tooltip-title">${escapeHtml(hit.title)}</div>
          <div class="graph-tooltip-url font-mono">${escapeHtml(hit.url)}</div>
          <div class="graph-tooltip-stats font-mono">
            <span>📥 Inlinks: <strong>${hit.inlinks}</strong></span>
            <span>📤 Outlinks: <strong>${hit.outlinks}</strong></span>
            <span>📝 ${hit.words.toLocaleString()} từ</span>
            <span class="badge ${hit.nodeType === 'broken' || hit.nodeType === 'orphan' ? 'badge-rose' : 'badge-cyan'}">${hit.nodeType.toUpperCase()}</span>
          </div>
        `;
      } else if (tooltip) {
        tooltip.style.display = "none";
      }
    }
  };

  window.onmouseup = () => {
    forceSimulation.isDraggingNode = null;
    forceSimulation.isPanning = false;
  };

  canvas.onwheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 1.12 : 0.89;
    forceSimulation.zoom = Math.max(0.4, Math.min(3.5, forceSimulation.zoom * zoomDelta));
  };
}

function drawGraph(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2 + forceSimulation.pan.x, height / 2 + forceSimulation.pan.y);
  ctx.scale(forceSimulation.zoom, forceSimulation.zoom);
  ctx.translate(-width / 2, -height / 2);

  const hovered = forceSimulation.hoveredNode;

  // Draw Edges
  for (let i = 0; i < forceSimulation.edges.length; i++) {
    const e = forceSimulation.edges[i];
    const isConn = hovered && (e.source === hovered || e.target === hovered);

    ctx.beginPath();
    ctx.moveTo(e.source.x, e.source.y);
    ctx.lineTo(e.target.x, e.target.y);

    if (isConn) {
      ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
      ctx.lineWidth = 2.2;
    } else if (hovered) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 0.8;
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.0;
    }
    ctx.stroke();
  }

  // Draw Nodes
  for (let i = 0; i < forceSimulation.nodes.length; i++) {
    const n = forceSimulation.nodes[i];
    const isHovered = hovered === n;
    const isNeighbor = hovered && forceSimulation.edges.some(e => 
      (e.source === hovered && e.target === n) || (e.target === hovered && e.source === n)
    );

    // Outer halo / glow for Home, Pillars or Hovered
    if (n.isHome || n.nodeType === "pillar" || isHovered) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius + (isHovered ? 6 : 4), 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? "rgba(6, 182, 212, 0.35)" : n.color.replace(")", ", 0.25)").replace("rgb", "rgba").replace("#06b6d4", "rgba(6,182,212,0.25)").replace("#a855f7", "rgba(168,85,247,0.25)");
      ctx.fill();
    }

    // Node body
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fillStyle = (hovered && !isHovered && !isNeighbor) ? "rgba(100, 100, 110, 0.4)" : n.color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = isHovered ? 2.5 : 1.2;
    ctx.stroke();

    // Node labels
    const showLabel = forceSimulation.showLabels || isHovered || isNeighbor || n.isHome || n.nodeType === "pillar";
    if (showLabel) {
      const labelText = n.title.length > 24 ? n.title.slice(0, 22) + "..." : n.title;
      ctx.font = `${n.isHome ? 'bold 11px' : '10px'} Inter, sans-serif`;
      const textWidth = ctx.measureText(labelText).width;

      // Label background pill
      const px = n.x + n.radius + 4;
      const py = n.y - 6;
      ctx.fillStyle = "rgba(12, 12, 15, 0.88)";
      ctx.fillRect(px - 2, py - 8, textWidth + 6, 14);

      ctx.fillStyle = isHovered ? "#ffffff" : "rgba(220, 225, 235, 0.9)";
      ctx.fillText(labelText, px + 1, py + 3);
    }
  }

  ctx.restore();
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

  // Trigger Topic Silo Architecture & Conversion Pipeline Flowchart (Mermaid / SVG Style)
  renderSiloPipelineFlowchart(silos, currentAuditData?.hostname || "Domain");

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

// ==============================================================================
// TOPIC SILO & CONVERSION PIPELINE FLOWCHART (Mermaid / SVG Style)
// ==============================================================================
function renderSiloPipelineFlowchart(silos, hostname) {
  const container = document.getElementById("siloPipelineContainer");
  const badge = document.getElementById("siloFlowHealthBadge");
  if (!container) return;

  if (!silos || silos.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted);">Chưa có dữ liệu cụm chủ đề để tạo sơ đồ luồng.</div>`;
    return;
  }

  // Filter top 3 meaningful silos
  const topSilos = silos.filter(s => s.name !== "Trang Chủ & Hub Điều Hướng").slice(0, 3);
  if (topSilos.length === 0) {
    topSilos.push(...silos.slice(0, 3));
  }

  const svgWidth = 840;
  const svgHeight = Math.max(260, topSilos.length * 85 + 40);

  // Column X coordinates
  const col1X = 20;   // Home Hub
  const col2X = 260;  // Pillar Pages
  const col3X = 520;  // Satellite Sub-articles
  const col4X = 700;  // Conversion Goal (CTA)

  const nodeW = 180;
  const nodeH = 50;

  const homeY = svgHeight / 2 - nodeH / 2;
  const ctaY = svgHeight / 2 - nodeH / 2;

  let linksSvg = "";
  let nodesSvg = "";

  // 1. Home Hub Node
  nodesSvg += `
    <g class="flow-node-box" transform="translate(${col1X}, ${homeY})">
      <rect width="${nodeW}" height="${nodeH}" rx="8" fill="#141418" stroke="#06b6d4" stroke-width="1.8" filter="drop-shadow(0 4px 12px rgba(6,182,212,0.25))"/>
      <text x="12" y="22" fill="#06b6d4" font-size="10" font-family="Inter, sans-serif" font-weight="700">TẦNG 1: TRANG CHỦ &amp; HUB</text>
      <text x="12" y="38" fill="#ffffff" font-size="12" font-family="Inter, sans-serif" font-weight="600">${escapeHtml(hostname || 'Domain Root')}</text>
    </g>
  `;

  // 2. Pillars & Satellites
  topSilos.forEach((s, idx) => {
    const spacing = (svgHeight - 40) / Math.max(1, topSilos.length);
    const pillarY = 20 + idx * spacing + (spacing - nodeH) / 2;
    const subArticle = (s.articles && s.articles.length > 0) ? s.articles[0].title : `${s.articles_count} bài viết vệ tinh`;
    const subClean = subArticle.length > 20 ? subArticle.slice(0, 18) + '...' : subArticle;

    // Link: Home -> Pillar
    const p1x = col1X + nodeW;
    const p1y = homeY + nodeH / 2;
    const p2x = col2X;
    const p2y = pillarY + nodeH / 2;
    const mid1X = (p1x + p2x) / 2;

    linksSvg += `
      <path d="M ${p1x} ${p1y} C ${mid1X} ${p1y}, ${mid1X} ${p2y}, ${p2x} ${p2y}" class="flow-link-path" />
      <polygon points="${p2x},${p2y} ${p2x - 6},${p2y - 4} ${p2x - 6},${p2y + 4}" fill="#a855f7" />
    `;

    // Pillar Node
    const pillarName = s.name.length > 18 ? s.name.slice(0, 16) + '...' : s.name;
    nodesSvg += `
      <g class="flow-node-box" transform="translate(${col2X}, ${pillarY})">
        <rect width="${nodeW - 10}" height="${nodeH}" rx="8" fill="#141418" stroke="#a855f7" stroke-width="1.8" filter="drop-shadow(0 4px 12px rgba(168,85,247,0.25))"/>
        <text x="10" y="20" fill="#a855f7" font-size="9" font-family="Inter, sans-serif" font-weight="700">TẦNG 2: BÀI TRỤ CỘT (PILLAR)</text>
        <text x="10" y="37" fill="#ffffff" font-size="11" font-family="Inter, sans-serif" font-weight="600">${escapeHtml(pillarName)}</text>
      </g>
    `;

    // Link: Pillar -> Satellite
    const s1x = col2X + nodeW - 10;
    const s1y = pillarY + nodeH / 2;
    const s2x = col3X;
    const s2y = pillarY + nodeH / 2;
    const mid2X = (s1x + s2x) / 2;

    linksSvg += `
      <path d="M ${s1x} ${s1y} C ${mid2X} ${s1y}, ${mid2X} ${s2y}, ${s2x} ${s2y}" class="flow-link-path" />
      <polygon points="${s2x},${s2y} ${s2x - 6},${s2y - 4} ${s2x - 6},${s2y + 4}" fill="#10b981" />
    `;

    // Satellite Node
    nodesSvg += `
      <g class="flow-node-box" transform="translate(${col3X}, ${pillarY})">
        <rect width="140" height="${nodeH}" rx="8" fill="#141418" stroke="#10b981" stroke-width="1.5"/>
        <text x="10" y="20" fill="#10b981" font-size="9" font-family="Inter, sans-serif" font-weight="700">TẦNG 3: VỆ TINH (${s.articles_count})</text>
        <text x="10" y="37" fill="#e2e8f0" font-size="11" font-family="Inter, sans-serif">${escapeHtml(subClean)}</text>
      </g>
    `;

    // Link: Satellite -> CTA Goal
    const c1x = col3X + 140;
    const c1y = pillarY + nodeH / 2;
    const c2x = col4X;
    const c2y = ctaY + nodeH / 2;
    const mid3X = (c1x + c2x) / 2;

    linksSvg += `
      <path d="M ${c1x} ${c1y} C ${mid3X} ${c1y}, ${mid3X} ${c2y}, ${c2x} ${c2y}" class="flow-link-path" />
      <polygon points="${c2x},${c2y} ${c2x - 6},${c2y - 4} ${c2x - 6},${c2y + 4}" fill="#f59e0b" />
    `;
  });

  // 3. CTA Goal Node
  nodesSvg += `
    <g class="flow-node-box" transform="translate(${col4X}, ${ctaY})">
      <rect width="120" height="${nodeH}" rx="8" fill="#141418" stroke="#f59e0b" stroke-width="1.8" filter="drop-shadow(0 4px 12px rgba(245,158,11,0.25))"/>
      <text x="10" y="20" fill="#f59e0b" font-size="9" font-family="Inter, sans-serif" font-weight="700">TẦNG 4: CHUYỂN ĐỔI</text>
      <text x="10" y="37" fill="#ffffff" font-size="11" font-family="Inter, sans-serif" font-weight="700">🎯 Form CTA / Lead</text>
    </g>
  `;

  container.innerHTML = `
    <svg class="silo-flow-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
      ${linksSvg}
      ${nodesSvg}
    </svg>
  `;

  if (badge) {
    badge.className = "badge badge-emerald";
    badge.textContent = `${topSilos.length} Cụm Silo Khép Kín`;
  }
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
          <div style="display:flex; gap:4px; margin-top:5px; flex-wrap:wrap;">
            <span class="badge ${p.readiness?.chatgpt ? 'badge-emerald' : 'badge-rose'} badge-xs">ChatGPT: ${p.readiness?.chatgpt ? '✓' : '✗'}</span>
            <span class="badge ${p.readiness?.perplexity ? 'badge-emerald' : 'badge-rose'} badge-xs">Perplexity: ${p.readiness?.perplexity ? '✓' : '✗'}</span>
            <span class="badge ${p.readiness?.claude ? 'badge-emerald' : 'badge-rose'} badge-xs">Claude: ${p.readiness?.claude ? '✓' : '✗'}</span>
            <span class="badge ${p.readiness?.ai_overviews ? 'badge-emerald' : 'badge-rose'} badge-xs">Google AEO: ${p.readiness?.ai_overviews ? '✓' : '✗'}</span>
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
          <div style="display:flex; gap:4px; margin-top:5px; flex-wrap:wrap;">
            <span class="badge ${p.readiness?.chatgpt ? 'badge-emerald' : 'badge-rose'} badge-xs">ChatGPT: ${p.readiness?.chatgpt ? '✓' : '✗'}</span>
            <span class="badge ${p.readiness?.perplexity ? 'badge-emerald' : 'badge-rose'} badge-xs">Perplexity: ${p.readiness?.perplexity ? '✓' : '✗'}</span>
            <span class="badge ${p.readiness?.claude ? 'badge-emerald' : 'badge-rose'} badge-xs">Claude: ${p.readiness?.claude ? '✓' : '✗'}</span>
            <span class="badge ${p.readiness?.ai_overviews ? 'badge-emerald' : 'badge-rose'} badge-xs">Google AEO: ${p.readiness?.ai_overviews ? '✓' : '✗'}</span>
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

// ==============================================================================
// GOOGLE SERP PIXEL WIDTH RENDERER (Arial 580px Title / 920px Description)
// ==============================================================================
function renderSerpPixelMeter(meta, targetUrl) {
  const urlEl = document.getElementById("serpSnippetUrl");
  const titleEl = document.getElementById("serpSnippetTitle");
  const descEl = document.getElementById("serpSnippetDesc");

  const fullUrl = targetUrl || meta.url || "https://example.com";
  const title = meta.title || "Chưa có tiêu đề trang";
  const desc = meta.description || "Chưa có thẻ meta description.";

  if (urlEl) urlEl.textContent = fullUrl;
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;

  // Title calculation
  const titlePx = meta.title_px || 0;
  const titleChars = meta.title_len || title.length;
  const titlePxVal = document.getElementById("serpTitlePxVal");
  const titleCharVal = document.getElementById("serpTitleCharVal");
  const titleBadge = document.getElementById("serpTitleBadge");
  const titleBar = document.getElementById("serpTitleBar");

  if (titlePxVal) titlePxVal.textContent = titlePx;
  if (titleCharVal) titleCharVal.textContent = titleChars;

  const titlePercent = Math.min(100, Math.round((titlePx / 580) * 100));
  if (titleBar) {
    titleBar.style.width = `${titlePercent}%`;
    if (titlePx <= 580) {
      titleBar.className = "pixel-meter-fill pixel-fill-green";
      if (titleBadge) {
        titleBadge.className = "badge badge-emerald";
        titleBadge.textContent = `${titlePx}px (Đạt chuẩn hiển thị)`;
      }
    } else {
      titleBar.className = "pixel-meter-fill pixel-fill-rose";
      if (titleBadge) {
        titleBadge.className = "badge badge-rose";
        titleBadge.textContent = `${titlePx}px (Vượt quá 580px - Bị cắt đuôi ...)`;
      }
    }
  }

  // Description calculation
  const descPx = meta.desc_px || 0;
  const descChars = meta.desc_len || desc.length;
  const descPxVal = document.getElementById("serpDescPxVal");
  const descCharVal = document.getElementById("serpDescCharVal");
  const descBadge = document.getElementById("serpDescBadge");
  const descBar = document.getElementById("serpDescBar");

  if (descPxVal) descPxVal.textContent = descPx;
  if (descCharVal) descCharVal.textContent = descChars;

  const descPercent = Math.min(100, Math.round((descPx / 920) * 100));
  if (descBar) {
    descBar.style.width = `${descPercent}%`;
    if (descPx <= 920) {
      descBar.className = "pixel-meter-fill pixel-fill-green";
      if (descBadge) {
        descBadge.className = "badge badge-emerald";
        descBadge.textContent = `${descPx}px (Đạt chuẩn)`;
      }
    } else {
      descBar.className = "pixel-meter-fill pixel-fill-amber";
      if (descBadge) {
        descBadge.className = "badge badge-amber";
        descBadge.textContent = `${descPx}px (Vượt quá 920px)`;
      }
    }
  }

  const overallSerpBadge = document.getElementById("serpPixelStatusBadge");
  if (overallSerpBadge) {
    if (titlePx <= 580 && descPx <= 920) {
      overallSerpBadge.className = "badge badge-emerald";
      overallSerpBadge.textContent = "✓ Chuẩn SERP Google";
    } else {
      overallSerpBadge.className = "badge badge-amber";
      overallSerpBadge.textContent = "⚠ Cần Tối Ưu SERP Pixel";
    }
  }
}

// ==============================================================================
// 5W1H INTENT CLUSTERS RENDERER
// ==============================================================================
function renderIntentClusters(clusters) {
  if (!clusters) return;

  const qList = document.getElementById("clusterQuestionsList");
  const qCount = document.getElementById("clusterQuestionsCount");
  const cList = document.getElementById("clusterCommercialList");
  const cCount = document.getElementById("clusterCommercialCount");
  const tList = document.getElementById("clusterTrustList");
  const tCount = document.getElementById("clusterTrustCount");
  const totalBadge = document.getElementById("intentTotalBadge");

  const questions = clusters.questions || [];
  const commercial = clusters.commercial || [];
  const trust = clusters.trust_comparison || [];
  const total = questions.length + commercial.length + trust.length;

  if (totalBadge) totalBadge.textContent = `${total} từ khóa ý định (Google Live)`;

  function populateCol(listEl, countEl, items) {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (countEl) countEl.textContent = items.length;
    if (items.length === 0) {
      listEl.innerHTML = `<span class="text-muted" style="font-size:0.78rem;">Không có dữ liệu suggest.</span>`;
      return;
    }
    items.forEach(q => {
      const chip = document.createElement("div");
      chip.className = "intent-query-chip";
      chip.innerHTML = `<span>${escapeHtml(q)}</span> <span style="color:var(--text-dim);font-size:0.7rem;">🔍</span>`;
      chip.addEventListener("click", () => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
      });
      listEl.appendChild(chip);
    });
  }

  populateCol(qList, qCount, questions);
  populateCol(cList, cCount, commercial);
  populateCol(tList, tCount, trust);
}

// ==============================================================================
// GOOGLE SEARCH CONSOLE (GSC) CSV HANDLER & RENDERER
// ==============================================================================
async function handleGscCsvUpload(file) {
  const reader = new FileReader();
  const statusBadge = document.getElementById("gscStatusBadge");
  if (statusBadge) {
    statusBadge.className = "badge badge-cyan";
    statusBadge.textContent = "Đang xử lý CSV...";
  }

  reader.onload = async (e) => {
    const csvContent = e.target.result;
    try {
      const res = await fetch("/api/gsc/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvContent })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Lỗi xử lý file CSV của Google Search Console.");
      }
      renderGscData(data);
      alert(`✓ Nạp thành công dữ liệu GSC!\nĐã bóc tách ${data.total_queries} từ khóa, ${data.striking_distance.length} cơ hội Striking Distance và ${data.ctr_anomalies.length} lỗi CTR Anomaly.`);
    } catch (err) {
      if (statusBadge) {
        statusBadge.className = "badge badge-rose";
        statusBadge.textContent = "Lỗi nạp file";
      }
      alert(`❌ Lỗi: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

function loadGscDemoData() {
  const demoCsv = `Top queries,Clicks,Impressions,CTR,Position
wellspring tuyển sinh,145,2800,5.18%,2.4
học phí trường wellspring,120,4100,2.93%,3.1
học bổng wellspring 2026,38,1950,1.95%,4.2
trường quốc tế song ngữ hà nội,45,8200,0.55%,9.4
chương trình cambridge tiểu học,32,6400,0.50%,11.2
trường song ngữ chất lượng cao quận long biên,28,4500,0.62%,12.5
chi phí du học tại chỗ cấp 3,18,3100,0.58%,13.8
điều kiện xét tuyển lớp 10 wellspring,22,2900,0.76%,8.5
bảng giá xe buýt đưa đón học sinh wellspring,12,1850,0.65%,10.1
review trường song ngữ wellspring có tốt không,64,3100,2.06%,3.8
`;
  handleGscCsvUpload(new Blob([demoCsv], { type: "text/csv" }));
}

async function clearGscData() {
  try {
    await fetch("/api/gsc/clear", { method: "POST" });
    const wrap = document.getElementById("gscMetricsWrap");
    if (wrap) wrap.style.display = "none";
    const clearBtn = document.getElementById("gscClearBtn");
    if (clearBtn) clearBtn.style.display = "none";
    const statusBadge = document.getElementById("gscStatusBadge");
    if (statusBadge) {
      statusBadge.className = "badge badge-amber";
      statusBadge.textContent = "Chưa kết nối GSC";
    }
    const dropzone = document.getElementById("gscDropzone");
    if (dropzone) dropzone.style.display = "block";
  } catch (_) {}
}

function renderGscData(gsc) {
  if (!gsc || !gsc.is_connected) return;

  const statusBadge = document.getElementById("gscStatusBadge");
  if (statusBadge) {
    statusBadge.className = "badge badge-emerald";
    statusBadge.textContent = "🟢 Đã kết nối GSC (Dữ liệu thực tế)";
  }

  const dropzone = document.getElementById("gscDropzone");
  if (dropzone) dropzone.style.display = "none";

  const clearBtn = document.getElementById("gscClearBtn");
  if (clearBtn) clearBtn.style.display = "inline-flex";

  const wrap = document.getElementById("gscMetricsWrap");
  if (wrap) wrap.style.display = "block";

  const qEl = document.getElementById("gscTotalQueries");
  if (qEl) qEl.textContent = gsc.total_queries.toLocaleString();
  const cEl = document.getElementById("gscTotalClicks");
  if (cEl) cEl.textContent = gsc.total_clicks.toLocaleString();
  const iEl = document.getElementById("gscTotalImpressions");
  if (iEl) iEl.textContent = gsc.total_impressions.toLocaleString();

  const avgCtr = gsc.total_impressions > 0 ? (gsc.total_clicks / gsc.total_impressions * 100).toFixed(2) : "0.00";
  const ctrEl = document.getElementById("gscAvgCtr");
  if (ctrEl) ctrEl.textContent = `${avgCtr}%`;

  // Real Striking Distance table
  const strikingTbody = document.getElementById("gscStrikingTableBody");
  const strikingBadge = document.getElementById("gscStrikingBadge");
  if (strikingBadge) strikingBadge.textContent = `${gsc.striking_distance?.length || 0} từ khóa`;
  if (strikingTbody) {
    strikingTbody.innerHTML = "";
    (gsc.striking_distance || []).slice(0, 10).forEach(item => {
      const tr = document.createElement("tr");
      const mov = item.movement || "— 0";
      const isUp = mov.includes("▲");
      const isDown = mov.includes("▼");
      const movBadge = isUp ? 'badge-emerald' : (isDown ? 'badge-rose' : 'badge-cyan');
      tr.innerHTML = `
        <td style="font-weight:600;color:var(--text-white);">${escapeHtml(item.query)}</td>
        <td><span class="badge badge-amber">Top ${item.position}</span></td>
        <td><span class="badge ${movBadge}" style="font-size:0.75rem;">${escapeHtml(mov)}</span></td>
        <td>${item.impressions.toLocaleString()}</td>
        <td>${item.clicks.toLocaleString()}</td>
        <td>${item.ctr}%</td>
      `;
      strikingTbody.appendChild(tr);
    });
  }

  // Real CTR Anomalies table
  const anomalyTbody = document.getElementById("gscAnomalyTableBody");
  const anomalyBadge = document.getElementById("gscAnomalyBadge");
  if (anomalyBadge) anomalyBadge.textContent = `${gsc.ctr_anomalies?.length || 0} từ khóa`;
  if (anomalyTbody) {
    anomalyTbody.innerHTML = "";
    (gsc.ctr_anomalies || []).slice(0, 10).forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-weight:600;color:var(--text-white);">${escapeHtml(item.query)}</td>
        <td><span class="badge badge-emerald">Top ${item.position}</span></td>
        <td>${item.impressions.toLocaleString()}</td>
        <td><span class="badge badge-rose">${item.ctr}% (Quá thấp)</span></td>
        <td style="color:var(--accent-cyan);font-size:0.76rem;">Sửa Title &amp; Snippet để tăng CTR</td>
      `;
      anomalyTbody.appendChild(tr);
    });
  }
}
