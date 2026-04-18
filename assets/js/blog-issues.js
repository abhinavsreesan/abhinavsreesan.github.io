(function () {
  var body = document.body;
  if (!body) {
    return;
  }

  var owner = body.getAttribute("data-owner") || "abhinavsreesan";
  var repo = body.getAttribute("data-repo") || "abhinavsreesan.github.io";
  var baseLabel = body.getAttribute("data-label") || "blog";
  var singular = body.getAttribute("data-singular") || "post";
  var plural = body.getAttribute("data-plural") || "posts";

  var perPage = 100;
  var cacheKey = "issues_cache_v2_" + baseLabel;
  var cacheTtlMs = 10 * 60 * 1000;
  var markdownApi = "https://api.github.com/markdown";
  var issuesApi =
    "https://api.github.com/repos/" +
    owner +
    "/" +
    repo +
    "/issues?state=all&labels=" +
    encodeURIComponent(baseLabel) +
    "&per_page=" +
    perPage +
    "&sort=created&direction=desc";

  var listContainer = document.getElementById("issues-list");
  var postContainer = document.getElementById("issues-post");
  var emptyState = document.getElementById("issues-empty");
  var errorState = document.getElementById("issues-error");
  var loadingState = document.getElementById("issues-loading");
  var searchInput = document.getElementById("issues-search");
  var tagsContainer = document.getElementById("issues-tags");
  var summary = document.getElementById("issues-summary");

  if (!listContainer || !postContainer || !loadingState || !emptyState || !errorState) {
    return;
  }

  var state = {
    allIssues: [],
    selectedTag: "",
    query: ""
  };

  function escapeHtml(text) {
    return String(text)
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

  function toSlug(value) {
    return String(value)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
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
    return String(text || "")
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
    return (labelsArray || [])
      .map(function (item) {
        return item.name;
      })
      .filter(function (name) {
        return name.toLowerCase() !== baseLabel.toLowerCase();
      })
      .sort(function (a, b) {
        return a.localeCompare(b);
      });
  }

  function renderTagBadges(tags) {
    if (!tags.length) {
      return "";
    }
    var tagHtml = tags
      .map(function (tag) {
        return '<span class="issue-tag">' + escapeHtml(tag) + "</span>";
      })
      .join("");
    return '<div class="issue-tags">' + tagHtml + "</div>";
  }

  function getAllTags(issues) {
    var tagMap = {};
    issues.forEach(function (issue) {
      getTags(issue.labels || []).forEach(function (tag) {
        tagMap[tag] = true;
      });
    });
    return Object.keys(tagMap).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function matchesSearch(issue, query) {
    if (!query) {
      return true;
    }
    var haystack = [issue.title || "", issue.body || "", getTags(issue.labels || []).join(" ")]
      .join(" ")
      .toLowerCase();
    return haystack.indexOf(query.toLowerCase()) !== -1;
  }

  function matchesTag(issue, tag) {
    if (!tag) {
      return true;
    }
    return getTags(issue.labels || []).some(function (item) {
      return item.toLowerCase() === tag.toLowerCase();
    });
  }

  function getFilteredIssues() {
    return state.allIssues.filter(function (issue) {
      return matchesTag(issue, state.selectedTag) && matchesSearch(issue, state.query);
    });
  }

  function updateSummary(total, filtered) {
    if (!summary) {
      return;
    }
    var scope = filtered === total ? "all" : String(filtered);
    var activeTag = state.selectedTag ? ' with tag "' + state.selectedTag + '"' : "";
    var activeQuery = state.query ? ' matching "' + state.query + '"' : "";
    summary.textContent = "Showing " + scope + " of " + total + " " + plural + activeTag + activeQuery + ".";
  }

  function renderTagFilters(tags) {
    if (!tagsContainer) {
      return;
    }
    if (!tags.length) {
      tagsContainer.innerHTML = "";
      return;
    }
    var buttons =
      '<button class="tag-filter' +
      (state.selectedTag === "" ? " active" : "") +
      '" data-tag="">All</button>' +
      tags
        .map(function (tag) {
          var active = state.selectedTag.toLowerCase() === tag.toLowerCase() ? " active" : "";
          return '<button class="tag-filter' + active + '" data-tag="' + escapeHtml(tag) + '">#' + escapeHtml(tag) + "</button>";
        })
        .join("");
    tagsContainer.innerHTML = buttons;
  }

  function bindFilterHandlers() {
    if (searchInput) {
      searchInput.addEventListener("input", function (event) {
        state.query = event.target.value.trim();
        renderListView();
      });
    }

    if (tagsContainer) {
      tagsContainer.addEventListener("click", function (event) {
        var target = event.target;
        if (!target || !target.classList.contains("tag-filter")) {
          return;
        }
        state.selectedTag = target.getAttribute("data-tag") || "";
        renderListView();
      });
    }
  }

  function renderListView() {
    var filtered = getFilteredIssues();
    var tags = getAllTags(state.allIssues);
    renderTagFilters(tags);
    updateSummary(state.allIssues.length, filtered.length);

    if (!filtered.length) {
      setVisibility(listContainer, false);
      setVisibility(postContainer, false);
      setVisibility(emptyState, true);
      setVisibility(errorState, false);
      return;
    }

    var cards = filtered
      .map(function (issue) {
        var excerpt = toExcerpt(issue.body || "", 190);
        var tagsHtml = renderTagBadges(getTags(issue.labels || []));
        var issueSlug = toSlug(issue.title || String(issue.number));
        return (
          '<article class="issue-card" id="' +
          issueSlug +
          '">' +
          '<h2><a href="?post=' +
          issue.number +
          '">' +
          escapeHtml(issue.title) +
          "</a></h2>" +
          '<p class="issue-meta">' +
          formatDate(issue.created_at) +
          "</p>" +
          "<p>" +
          escapeHtml(excerpt) +
          "</p>" +
          tagsHtml +
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
    var blocks = container.querySelectorAll("pre code");
    blocks.forEach(function (block) {
      window.hljs.highlightElement(block);
    });
  }

  function renderPost(issue) {
    var tags = getTags(issue.labels || []);
    var title = escapeHtml(issue.title);
    var headerHtml =
      '<article class="issues-panel blog-post">' +
      '<h2>' +
      title +
      "</h2>" +
      '<p class="issue-meta">' +
      formatDate(issue.created_at) +
      "</p>";
    var footerHtml =
      '<p><a href="' +
      issue.html_url +
      '" target="_blank" rel="noopener">View source issue on GitHub</a></p>' +
      renderTagBadges(tags) +
      "</article>";

    renderMarkdown(issue.body || "")
      .then(function (contentHtml) {
        postContainer.innerHTML =
          headerHtml + '<div class="issue-markdown rendered-markdown">' + contentHtml + "</div>" + footerHtml;
        enhanceCodeBlocks(postContainer);
      })
      .catch(function () {
        postContainer.innerHTML =
          headerHtml +
          '<div class="issue-markdown rendered-markdown"><p>' +
          escapeHtml(issue.body || "")
            .replace(/\n\n/g, "</p><p>")
            .replace(/\n/g, "<br />") +
          "</p></div>" +
          footerHtml;
        enhanceCodeBlocks(postContainer);
      });

    if (summary) {
      summary.textContent = "Viewing 1 " + singular + ". Use the navigation to return to the list.";
    }

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
    var queryPost = getQueryPostNumber();
    bindFilterHandlers();
    setVisibility(loadingState, true);

    var cached = getCache();
    if (cached) {
      state.allIssues = normalizeIssues(cached);
      if (state.allIssues.length) {
        if (queryPost) {
          var cachedPost = state.allIssues.find(function (item) {
            return item.number === queryPost;
          });
          if (cachedPost) {
            renderPost(cachedPost);
          }
        } else {
          renderListView();
        }
      }
    }

    fetchIssues()
      .then(function (items) {
        state.allIssues = normalizeIssues(items);
        setCache(state.allIssues);

        if (!state.allIssues.length) {
          renderEmpty();
          return;
        }

        if (queryPost) {
          var post = state.allIssues.find(function (item) {
            return item.number === queryPost;
          });
          if (!post) {
            renderEmpty();
            return;
          }
          renderPost(post);
          return;
        }

        renderListView();
      })
      .catch(function () {
        if (!cached) {
          renderError();
        }
      })
      .finally(function () {
        setVisibility(loadingState, false);
      });
  }

  start();
})();
