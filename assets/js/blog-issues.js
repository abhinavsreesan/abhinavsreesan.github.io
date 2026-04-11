(function () {
  var owner = "abhinavsreesan";
  var repo = "abhinavsreesan.github.io";
  var label = "blog";
  var perPage = 100;
  var cacheKey = "blog_issues_cache_v1";
  var cacheTtlMs = 10 * 60 * 1000;
  var markdownApi = "https://api.github.com/markdown";
  var issuesApi =
    "https://api.github.com/repos/" +
    owner +
    "/" +
    repo +
    "/issues?state=all&labels=" +
    encodeURIComponent(label) +
    "&per_page=" +
    perPage +
    "&sort=created&direction=desc";

  var listContainer = document.getElementById("issues-blog-list");
  var postContainer = document.getElementById("issues-blog-post");
  var emptyState = document.getElementById("issues-empty");
  var errorState = document.getElementById("issues-error");
  var loadingState = document.getElementById("issues-loading");

  if (!listContainer || !postContainer || !loadingState || !emptyState || !errorState) {
    return;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(isoDate) {
    var date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  }

  function getQueryPostNumber() {
    var params = new URLSearchParams(window.location.search);
    var post = params.get("post");
    if (!post) {
      return null;
    }
    var parsed = parseInt(post, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function setVisibility(element, visible) {
    element.style.display = visible ? "block" : "none";
  }

  function setLoading(visible) {
    setVisibility(loadingState, visible);
  }

  function getCache() {
    try {
      var raw = localStorage.getItem(cacheKey);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      if (!parsed.timestamp || !Array.isArray(parsed.data)) {
        return null;
      }
      if (Date.now() - parsed.timestamp > cacheTtlMs) {
        return null;
      }
      return parsed.data;
    } catch (error) {
      return null;
    }
  }

  function setCache(data) {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          timestamp: Date.now(),
          data: data
        })
      );
    } catch (error) {
      return;
    }
  }

  function normalizeIssues(items) {
    return items.filter(function (item) {
      return item && !item.pull_request;
    });
  }

  function stripMarkdown(text) {
    return text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^\)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
      .replace(/^#+\s+/gm, "")
      .replace(/[>*_~\-]{1,3}/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim();
  }

  function toExcerpt(markdown, limit) {
    if (!markdown) {
      return "No preview text available.";
    }
    var plain = stripMarkdown(markdown).replace(/\n/g, " ").trim();
    if (plain.length <= limit) {
      return plain;
    }
    return plain.slice(0, limit).replace(/\s+\S*$/, "") + "...";
  }

  function getTags(labelsArray) {
    return labelsArray
      .map(function (item) {
        return item.name;
      })
      .filter(function (name) {
        return name.toLowerCase() !== label;
      });
  }

  function renderTags(tags) {
    if (!tags.length) {
      return "";
    }
    var tagHtml = tags
      .map(function (tag) {
        return '<span class="skill-badge">' + escapeHtml(tag) + "</span>";
      })
      .join("");
    return '<div class="skill-badges">' + tagHtml + "</div>";
  }

  function renderList(issues) {
    var cards = issues
      .map(function (issue) {
        var excerpt = toExcerpt(issue.body || "", 180);
        var tags = getTags(issue.labels || []);
        return (
          '<article class="box blog-card">' +
          '<h2><a href="?post=' +
          issue.number +
          '">' +
          escapeHtml(issue.title) +
          "</a></h2>" +
          '<p class="blog-meta">' +
          formatDate(issue.created_at) +
          "</p>" +
          "<p>" +
          escapeHtml(excerpt) +
          "</p>" +
          renderTags(tags) +
          "</article>"
        );
      })
      .join("");

    listContainer.innerHTML = cards;
    setVisibility(listContainer, true);
    setVisibility(postContainer, false);
    setVisibility(emptyState, false);
    setVisibility(errorState, false);
  }

  function renderMarkdown(markdown) {
    return fetch(markdownApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        text: markdown,
        mode: "gfm",
        context: owner + "/" + repo
      })
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Could not render markdown");
      }
      return response.text();
    });
  }

  function enhanceCodeBlocks(container) {
    if (!container || typeof window.hljs === "undefined") {
      return;
    }

    var githubBlocks = container.querySelectorAll(".highlight pre");
    githubBlocks.forEach(function (pre) {
      if (pre.querySelector("code")) {
        return;
      }

      var language = "";
      var wrapper = pre.parentElement;
      if (wrapper) {
        var match = (wrapper.className || "").match(/highlight-source-([a-z0-9_+-]+)/i);
        if (match && match[1]) {
          language = match[1].toLowerCase();
        }
      }

      var raw = pre.textContent || "";
      pre.innerHTML =
        '<code' + (language ? ' class="language-' + language + '"' : "") + ">" + escapeHtml(raw) + "</code>";
    });

    var blocks = container.querySelectorAll("pre code");
    blocks.forEach(function (block) {
      var pre = block.parentElement;
      if (pre && pre.getAttribute("lang") && !block.className.match(/language-/)) {
        block.classList.add("language-" + pre.getAttribute("lang"));
      }
      window.hljs.highlightElement(block);
    });
  }

  function renderPost(issue) {
    var tags = getTags(issue.labels || []);
    var headerHtml =
      '<article class="box blog-card blog-post">' +
      "<h2>" +
      escapeHtml(issue.title) +
      "</h2>" +
      '<p class="blog-meta">' +
      formatDate(issue.created_at) +
      "</p>";
    var footerHtml =
      '<p><a href="' +
      issue.html_url +
      '" target="_blank" rel="noopener">View source issue on GitHub</a></p>' +
      renderTags(tags) +
      "</article>";

    renderMarkdown(issue.body || "")
      .then(function (contentHtml) {
        postContainer.innerHTML =
          headerHtml +
          '<div class="issue-markdown">' +
          contentHtml +
          "</div>" +
          footerHtml;
        enhanceCodeBlocks(postContainer);
      })
      .catch(function () {
        postContainer.innerHTML =
          headerHtml +
          '<div class="issue-markdown"><p>' +
          escapeHtml(issue.body || "")
            .replace(/\n\n/g, "</p><p>")
            .replace(/\n/g, "<br />") +
          "</p></div>" +
          footerHtml;
        enhanceCodeBlocks(postContainer);
      });

    setVisibility(listContainer, false);
    setVisibility(postContainer, true);
    setVisibility(emptyState, false);
    setVisibility(errorState, false);
  }

  function renderEmpty() {
    setVisibility(listContainer, false);
    setVisibility(postContainer, false);
    setVisibility(emptyState, true);
    setVisibility(errorState, false);
  }

  function renderError() {
    setVisibility(listContainer, false);
    setVisibility(postContainer, false);
    setVisibility(emptyState, false);
    setVisibility(errorState, true);
  }

  function fetchIssues() {
    return fetch(issuesApi, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }
      return response.json();
    });
  }

  function start() {
    setLoading(true);

    var queryPost = getQueryPostNumber();
    var cached = getCache();
    if (cached) {
      var cachedIssues = normalizeIssues(cached);
      if (cachedIssues.length > 0) {
        if (queryPost) {
          var cachedPost = cachedIssues.find(function (item) {
            return item.number === queryPost;
          });
          if (cachedPost) {
            renderPost(cachedPost);
          } else {
            renderEmpty();
          }
        } else {
          renderList(cachedIssues);
        }
      }
    }

    fetchIssues()
      .then(function (items) {
        var issues = normalizeIssues(items);
        setCache(issues);

        if (!issues.length) {
          renderEmpty();
          return;
        }

        if (queryPost) {
          var post = issues.find(function (item) {
            return item.number === queryPost;
          });
          if (!post) {
            renderEmpty();
            return;
          }
          renderPost(post);
          return;
        }

        renderList(issues);
      })
      .catch(function () {
        if (!cached) {
          renderError();
        }
      })
      .finally(function () {
        setLoading(false);
      });
  }

  start();
})();
