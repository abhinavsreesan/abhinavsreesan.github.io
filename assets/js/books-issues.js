(function () {
  var owner = "abhinavsreesan";
  var repo = "abhinavsreesan.github.io";
  var label = "books";
  var perPage = 100;
  var cacheKey = "books_issues_cache_v1";
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
  var searchInput = document.getElementById("issues-search");
  var searchEmptyState = document.getElementById("issues-search-empty");
  var allIssues = [];

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
    if (!element) {
      return;
    }
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

  function isAmazonUrl(url) {
    return /https?:\/\/(?:www\.)?(?:amazon\.|amzn\.to\/)/i.test(url || "");
  }

  function normalizeUrl(url) {
    if (!url) {
      return null;
    }
    var cleaned = url.replace(/[\],.;!?]+$/, "");
    try {
      return new URL(cleaned).href;
    } catch (error) {
      return null;
    }
  }

  function normalizeBookTitle(title) {
    if (!title) {
      return "View on Amazon";
    }
    var cleaned = title.replace(/^[\-*\d\.\)\s]+/, "").trim();
    return cleaned || "View on Amazon";
  }

  function extractBooksFromMarkdown(markdown) {
    if (!markdown) {
      return [];
    }

    var books = [];
    var seen = {};
    var lines = markdown.split(/\r?\n/);

    var markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    lines.forEach(function (line) {
      var match;
      while ((match = markdownLinkPattern.exec(line)) !== null) {
        var linkedUrl = normalizeUrl(match[2]);
        if (!linkedUrl || !isAmazonUrl(linkedUrl) || seen[linkedUrl]) {
          continue;
        }
        seen[linkedUrl] = true;
        books.push({
          title: normalizeBookTitle(match[1]),
          url: linkedUrl
        });
      }
      markdownLinkPattern.lastIndex = 0;
    });

    var rawUrlPattern = /https?:\/\/(?:www\.)?(?:amazon\.[^\s)\]]+|amzn\.to\/[^\s)\]]+)/gi;
    lines.forEach(function (line) {
      var match;
      while ((match = rawUrlPattern.exec(line)) !== null) {
        var rawUrl = normalizeUrl(match[0]);
        if (!rawUrl || seen[rawUrl]) {
          continue;
        }
        seen[rawUrl] = true;
        var titleFromLine = line.replace(match[0], "").replace(/\[[^\]]+\]\([^\)]+\)/g, "").trim();
        books.push({
          title: normalizeBookTitle(titleFromLine),
          url: rawUrl
        });
      }
      rawUrlPattern.lastIndex = 0;
    });

    return books;
  }

  function extractAmazonLink(markdown) {
    if (!markdown) {
      return null;
    }

    var match = markdown.match(/https?:\/\/(?:www\.)?(?:amazon\.[^\s)\]]+|amzn\.to\/[^\s)\]]+)/i);
    if (!match || !match[0]) {
      return null;
    }

    var candidate = match[0].replace(/[\],.;!?]+$/, "");
    try {
      var parsed = new URL(candidate);
      return parsed.href;
    } catch (error) {
      return null;
    }
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

    var withoutAmazon = markdown
      .replace(/https?:\/\/(?:www\.)?(?:amazon\.[^\s)\]]+|amzn\.to\/[^\s)\]]+)/gi, "")
      .trim();

    var plain = stripMarkdown(withoutAmazon).replace(/\n/g, " ").trim();
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

  function renderAmazonButton(url) {
    if (!url) {
      return "";
    }
    return '<p><a href="' +
      escapeHtml(url) +
      '" class="button" target="_blank" rel="noopener">View on Amazon</a></p>';
  }

  function renderList(issues) {
    var books = [];
    issues.forEach(function (issue) {
      var issueBooks = extractBooksFromMarkdown(issue.body || "");
      issueBooks.forEach(function (book) {
        books.push({
          title: book.title,
          url: book.url,
          issueNumber: issue.number,
          createdAt: issue.created_at
        });
      });
    });

    if (books.length > 0) {
      var bookCards = books
        .map(function (book) {
          return (
            '<article class="box blog-card">' +
            "<h2>" +
            escapeHtml(book.title) +
            "</h2>" +
            '<p class="blog-meta">' +
            formatDate(book.createdAt) +
            "</p>" +
            renderAmazonButton(book.url) +
            '<p><a href="?post=' +
            book.issueNumber +
            '">View notes</a></p>' +
            "</article>"
          );
        })
        .join("");

      listContainer.innerHTML = bookCards;
      setVisibility(listContainer, true);
      setVisibility(postContainer, false);
      setVisibility(emptyState, false);
      setVisibility(errorState, false);
      setVisibility(searchEmptyState, false);
      return;
    }

    var cards = issues
      .map(function (issue) {
        var excerpt = toExcerpt(issue.body || "", 180);
        var tags = getTags(issue.labels || []);
        var amazonUrl = extractAmazonLink(issue.body || "");
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
          renderAmazonButton(amazonUrl) +
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
    setVisibility(searchEmptyState, false);
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
    var amazonUrl = extractAmazonLink(issue.body || "");
    var headerHtml =
      '<article class="box blog-card blog-post">' +
      "<h2>" +
      escapeHtml(issue.title) +
      "</h2>" +
      '<p class="blog-meta">' +
      formatDate(issue.created_at) +
      "</p>";
    var footerHtml =
      renderAmazonButton(amazonUrl) +
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
    setVisibility(searchEmptyState, false);
  }

  function renderEmpty() {
    setVisibility(listContainer, false);
    setVisibility(postContainer, false);
    setVisibility(emptyState, true);
    setVisibility(errorState, false);
    setVisibility(searchEmptyState, false);
  }

  function renderError() {
    setVisibility(listContainer, false);
    setVisibility(postContainer, false);
    setVisibility(emptyState, false);
    setVisibility(errorState, true);
    setVisibility(searchEmptyState, false);
  }

  function getSearchText(issue) {
    var labels = (issue.labels || []).map(function (item) {
      return item.name;
    });
    return [issue.title || "", issue.body || "", labels.join(" ")].join(" ").toLowerCase();
  }

  function applySearch() {
    if (!searchInput) {
      return;
    }

    var query = searchInput.value.trim().toLowerCase();
    var queryPost = getQueryPostNumber();

    if (queryPost || !allIssues.length) {
      return;
    }

    if (!query) {
      renderList(allIssues);
      return;
    }

    var filtered = allIssues.filter(function (issue) {
      return getSearchText(issue).indexOf(query) !== -1;
    });

    if (!filtered.length) {
      setVisibility(listContainer, false);
      setVisibility(postContainer, false);
      setVisibility(emptyState, false);
      setVisibility(errorState, false);
      setVisibility(searchEmptyState, true);
      return;
    }

    renderList(filtered);
  }

  function bindSearch() {
    if (!searchInput) {
      return;
    }

    searchInput.addEventListener("input", applySearch);
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
    bindSearch();

    var queryPost = getQueryPostNumber();
    var cached = getCache();
    if (cached) {
      var cachedIssues = normalizeIssues(cached);
      if (cachedIssues.length > 0) {
        allIssues = cachedIssues;
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
          applySearch();
        }
      }
    }

    fetchIssues()
      .then(function (items) {
        var issues = normalizeIssues(items);
        setCache(issues);
        allIssues = issues;

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
        applySearch();
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
