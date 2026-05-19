(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }

  var api = factory();
  root.ForgePunchlist = {
    init: api.initForgePunchlistWidget,
    initForgePunchlistWidget: api.initForgePunchlistWidget,
  };
})(typeof window !== "undefined" ? window : globalThis, function () {
  var STYLE_ID = "forge-punchlist-widget-style";
  var ROOT_ID = "forge-punchlist-widget-root";
  var MAX_LOGS = 80;

  function defaultOptions() {
    return {
      apiUrl: "",
      bearerToken: "",
      productId: "",
      includeUrlByDefault: true,
      includeLogsByDefault: true,
      useQueryToken: false,
      accessTokenQueryParamName: "access_token",
      sendProductIdHeader: true,
      title: "Send Feedback",
      subtitle: "Report UX, UI, and dev issues",
      appName: "",
      metadata: {},
      transformPayload: null,
      buttonLabel: "Help",
      zIndex: 2147482000,
      maxLogEntries: MAX_LOGS,
    };
  }

  function safeString(value) {
    try {
      if (typeof value === "string") {
        return value;
      }
      return JSON.stringify(value);
    } catch (_error) {
      return String(value);
    }
  }

  function timeIso() {
    return new Date().toISOString();
  }

  function injectStyles(zIndex) {
    if (typeof document === "undefined") {
      return;
    }
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      ".forge-plw{position:fixed;right:16px;bottom:16px;z-index:" +
      String(zIndex) +
      ";font-family:'Avenir Next','Segoe UI',Tahoma,sans-serif;color:#0f172a}" +
      ".forge-plw *{box-sizing:border-box}" +
      ".forge-plw-toggle{border:0;border-radius:999px;min-width:58px;height:58px;padding:0 18px;background:linear-gradient(135deg,#0891b2,#1d4ed8);color:#fff;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 12px 26px rgba(15,23,42,.28);letter-spacing:.2px}" +
      ".forge-plw-toggle:hover{transform:translateY(-1px)}" +
      ".forge-plw-panel{position:absolute;right:0;bottom:72px;width:min(372px,calc(100vw - 24px));max-height:min(80vh,700px);overflow:auto;background:#ffffff;border-radius:18px;border:1px solid #dbe7ff;box-shadow:0 26px 50px rgba(15,23,42,.24);padding:14px 14px 12px}" +
      ".forge-plw-hidden{display:none}" +
      ".forge-plw-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}" +
      ".forge-plw-title-wrap{display:flex;flex-direction:column;gap:2px}" +
      ".forge-plw-title{font-size:16px;font-weight:800;color:#0b2245}" +
      ".forge-plw-subtitle{font-size:12px;color:#425a7d}" +
      ".forge-plw-close{border:0;background:transparent;color:#274367;font-size:21px;line-height:1;cursor:pointer;padding:2px 6px}" +
      ".forge-plw-field{display:flex;flex-direction:column;gap:6px;margin:8px 0}" +
      ".forge-plw-label{font-size:12px;font-weight:700;color:#17365d}" +
      ".forge-plw-input,.forge-plw-select,.forge-plw-textarea{width:100%;border:1px solid #c6d6f7;border-radius:10px;padding:10px 11px;font-size:14px;background:#f8fbff;color:#0f172a}" +
      ".forge-plw-input:focus,.forge-plw-select:focus,.forge-plw-textarea:focus{outline:2px solid #93c5fd;border-color:#60a5fa;background:#fff}" +
      ".forge-plw-textarea{resize:vertical;min-height:86px}" +
      ".forge-plw-mini{font-size:11px;color:#516a8e;line-height:1.4}" +
      ".forge-plw-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px}" +
      ".forge-plw-check{display:flex;align-items:center;gap:6px;font-size:12px;color:#274367}" +
      ".forge-plw-details{margin-top:8px;border:1px solid #dbe7ff;border-radius:10px;background:#f8fbff;padding:8px}" +
      ".forge-plw-details summary{cursor:pointer;font-size:12px;font-weight:700;color:#163968}" +
      ".forge-plw-logs{margin-top:8px;max-height:120px;overflow:auto;background:#0f172a;color:#dbeafe;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;padding:8px;border-radius:8px;white-space:pre-wrap;word-break:break-word}" +
      ".forge-plw-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}" +
      ".forge-plw-status{font-size:12px;color:#3d5b83;min-height:18px}" +
      ".forge-plw-submit{border:0;border-radius:10px;padding:9px 14px;background:#0f4cc9;color:#fff;font-weight:700;cursor:pointer}" +
      ".forge-plw-submit[disabled]{opacity:.6;cursor:not-allowed}" +
      "@media (max-width:540px){.forge-plw{right:10px;bottom:10px}.forge-plw-panel{bottom:66px}}";

    document.head.appendChild(style);
  }

  function createLogCollector(maxEntries) {
    var logs = [];
    var resolvedMax = Number.isFinite(maxEntries) && maxEntries > 0 ? maxEntries : MAX_LOGS;

    function push(level, args) {
      logs.push({
        level: level,
        timestamp: timeIso(),
        message: args.map(safeString).join(" "),
      });
      if (logs.length > resolvedMax) {
        logs.splice(0, logs.length - resolvedMax);
      }
    }

    var patchedKey = "__forgePunchlistConsolePatched";
    if (typeof window !== "undefined" && !window[patchedKey]) {
      var methods = ["log", "info", "warn", "error"];
      methods.forEach(function (method) {
        var original = console[method];
        console[method] = function () {
          var args = Array.prototype.slice.call(arguments);
          push(method, args);
          original.apply(console, args);
        };
      });

      window.addEventListener("error", function (event) {
        push("error", ["window.error", event.message, event.filename + ":" + event.lineno]);
      });
      window.addEventListener("unhandledrejection", function (event) {
        push("error", ["unhandledrejection", safeString(event.reason)]);
      });
      window[patchedKey] = true;
    }

    return {
      addLog: push,
      getLogs: function () {
        return logs.slice();
      },
    };
  }

  function buildPayload(values, context, options) {
    var payload = {
      title: values.summary,
      description: values.details,
      category: values.issueType,
      source: "forge-punchlist-widget",
      app_name: options.appName || "",
      product_id: options.productId || undefined,
      metadata: {
        product_id: options.productId || undefined,
        url: context.url,
        logs: context.logs,
        user_agent: context.userAgent,
        viewport: context.viewport,
        timestamp: context.timestamp,
        extra: options.metadata || {},
      },
      context: {
        url: context.url,
        logs: context.logs,
        userAgent: context.userAgent,
        viewport: context.viewport,
        timestamp: context.timestamp,
      },
    };

    if (typeof options.transformPayload === "function") {
      return options.transformPayload(payload, values, context);
    }
    return payload;
  }

  function withTokenQuery(url, token, queryName) {
    var separator = url.indexOf("?") >= 0 ? "&" : "?";
    return url + separator + encodeURIComponent(queryName) + "=" + encodeURIComponent(token);
  }

  function initForgePunchlistWidget(userOptions) {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return { destroy: function () {} };
    }

    var options = Object.assign(defaultOptions(), userOptions || {});
    var collector = createLogCollector(options.maxLogEntries);
    injectStyles(options.zIndex);

    var existingRoot = document.getElementById(ROOT_ID);
    if (existingRoot) {
      existingRoot.remove();
    }

    var shell = document.createElement("div");
    shell.id = ROOT_ID;
    shell.className = "forge-plw";

    var panel = document.createElement("div");
    panel.className = "forge-plw-panel forge-plw-hidden";

    var header = document.createElement("div");
    header.className = "forge-plw-head";
    header.innerHTML =
      '<div class="forge-plw-title-wrap">' +
      '<div class="forge-plw-title"></div>' +
      '<div class="forge-plw-subtitle"></div>' +
      "</div>" +
      '<button type="button" class="forge-plw-close" aria-label="Close">×</button>';

    var issueType =
      '<div class="forge-plw-field">' +
      '<label class="forge-plw-label" for="forge-plw-issue-type">Issue type</label>' +
      '<select class="forge-plw-select" id="forge-plw-issue-type">' +
      '<option value="ui_bug">UI bug</option>' +
      '<option value="design_ux">Design/UX</option>' +
      '<option value="development">Development process</option>' +
      '<option value="performance">Performance</option>' +
      '<option value="other">Other</option>' +
      "</select>" +
      "</div>";

    var bodyHtml =
      issueType +
      '<div class="forge-plw-field">' +
      '<label class="forge-plw-label" for="forge-plw-summary">Summary</label>' +
      '<input class="forge-plw-input" id="forge-plw-summary" placeholder="What happened?" maxlength="160" />' +
      "</div>" +
      '<div class="forge-plw-field">' +
      '<label class="forge-plw-label" for="forge-plw-details">Details</label>' +
      '<textarea class="forge-plw-textarea" id="forge-plw-details" placeholder="Steps to reproduce, expected behavior, and impact."></textarea>' +
      '<div class="forge-plw-mini">URL and console context can be included automatically.</div>' +
      "</div>" +
      '<div class="forge-plw-row">' +
      '<label class="forge-plw-check"><input type="checkbox" id="forge-plw-include-url" /> Include URL</label>' +
      '<label class="forge-plw-check"><input type="checkbox" id="forge-plw-include-logs" /> Include console logs</label>' +
      "</div>" +
      '<div class="forge-plw-details">' +
      '<summary>Captured context preview</summary>' +
      '<div class="forge-plw-mini" id="forge-plw-url-preview"></div>' +
      '<div class="forge-plw-logs" id="forge-plw-logs-preview"></div>' +
      "</div>" +
      '<div class="forge-plw-footer">' +
      '<div class="forge-plw-status" id="forge-plw-status"></div>' +
      '<button type="button" class="forge-plw-submit" id="forge-plw-submit">Submit</button>' +
      "</div>";

    var bodyContainer = document.createElement("div");
    bodyContainer.innerHTML = bodyHtml;

    panel.appendChild(header);
    panel.appendChild(bodyContainer);

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "forge-plw-toggle";
    toggle.textContent = options.buttonLabel;
    toggle.setAttribute("aria-expanded", "false");

    shell.appendChild(panel);
    shell.appendChild(toggle);
    document.body.appendChild(shell);

    var titleEl = panel.querySelector(".forge-plw-title");
    var subtitleEl = panel.querySelector(".forge-plw-subtitle");
    var closeButton = panel.querySelector(".forge-plw-close");
    var issueTypeEl = panel.querySelector("#forge-plw-issue-type");
    var summaryEl = panel.querySelector("#forge-plw-summary");
    var detailsEl = panel.querySelector("#forge-plw-details");
    var includeUrlEl = panel.querySelector("#forge-plw-include-url");
    var includeLogsEl = panel.querySelector("#forge-plw-include-logs");
    var urlPreviewEl = panel.querySelector("#forge-plw-url-preview");
    var logsPreviewEl = panel.querySelector("#forge-plw-logs-preview");
    var submitEl = panel.querySelector("#forge-plw-submit");
    var statusEl = panel.querySelector("#forge-plw-status");

    titleEl.textContent = options.title;
    subtitleEl.textContent = options.subtitle;
    includeUrlEl.checked = !!options.includeUrlByDefault;
    includeLogsEl.checked = !!options.includeLogsByDefault;

    function setStatus(message, color) {
      statusEl.textContent = message;
      statusEl.style.color = color || "#3d5b83";
    }

    function capturedContext() {
      var logs = includeLogsEl.checked ? collector.getLogs() : [];
      var recent = logs.slice(-20);
      return {
        timestamp: timeIso(),
        url: includeUrlEl.checked ? window.location.href : "",
        logs: recent,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };
    }

    function refreshPreview() {
      var context = capturedContext();
      urlPreviewEl.textContent = context.url ? "URL: " + context.url : "URL not included";

      if (!context.logs.length) {
        logsPreviewEl.textContent = "No logs included";
        return;
      }

      logsPreviewEl.textContent = context.logs
        .map(function (entry) {
          return "[" + entry.timestamp + "] [" + entry.level.toUpperCase() + "] " + entry.message;
        })
        .join("\n");
    }

    function openPanel() {
      panel.classList.remove("forge-plw-hidden");
      toggle.setAttribute("aria-expanded", "true");
      refreshPreview();
      setStatus("");
    }

    function closePanel() {
      panel.classList.add("forge-plw-hidden");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      if (panel.classList.contains("forge-plw-hidden")) {
        openPanel();
        return;
      }
      closePanel();
    });
    closeButton.addEventListener("click", closePanel);
    includeUrlEl.addEventListener("change", refreshPreview);
    includeLogsEl.addEventListener("change", refreshPreview);

    submitEl.addEventListener("click", async function () {
      var summary = summaryEl.value.trim();
      var details = detailsEl.value.trim();
      if (!summary) {
        setStatus("Please add a summary.", "#b91c1c");
        return;
      }
      if (!options.apiUrl) {
        setStatus("Missing API URL configuration.", "#b91c1c");
        return;
      }

      var token = options.bearerToken || "";
      if (!token && !options.useQueryToken) {
        setStatus("Missing bearer token configuration.", "#b91c1c");
        return;
      }

      submitEl.disabled = true;
      setStatus("Submitting...", "#1d4ed8");

      try {
        var context = capturedContext();
        var payload = buildPayload(
          {
            issueType: issueTypeEl.value,
            summary: summary,
            details: details,
          },
          context,
          options
        );

        var requestUrl = options.useQueryToken
          ? withTokenQuery(options.apiUrl, token, options.accessTokenQueryParamName)
          : options.apiUrl;
        var headers = {
          "Content-Type": "application/json",
        };

        if (!options.useQueryToken) {
          headers.Authorization = "Bearer " + token;
        }
        if (options.productId && options.sendProductIdHeader) {
          headers["X-Product-Id"] = String(options.productId);
        }

        var response = await fetch(requestUrl, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          var bodyText = await response.text();
          throw new Error("API error " + response.status + ": " + bodyText);
        }

        setStatus("Thanks. Your issue was submitted.", "#047857");
        summaryEl.value = "";
        detailsEl.value = "";
        refreshPreview();
      } catch (error) {
        collector.addLog("error", ["forge.widget.submit", safeString(error && error.message ? error.message : error)]);
        setStatus("Submit failed. Check API URL/token and try again.", "#b91c1c");
      } finally {
        submitEl.disabled = false;
      }
    });

    function destroy() {
      shell.remove();
      var style = document.getElementById(STYLE_ID);
      if (style) {
        style.remove();
      }
    }

    return { destroy: destroy };
  }

  return {
    initForgePunchlistWidget: initForgePunchlistWidget,
  };
});