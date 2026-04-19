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
  var booksBackLink = document.getElementById("books-back-link");
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

  function getQueryBookId() {
    var params = new URLSearchParams(window.location.search);
    var book = params.get("book");
    return book ? book.trim() : "";
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

  function getAnyCache() {
    try {
      var raw = localStorage.getItem(cacheKey);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.data)) {
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

  function parseBookBlock(blockContent) {
    var fields = {};
    var notes = "";
    var lines = (blockContent || "").split(/\r?\n/);
    var collectingNotes = false;
    var notesLines = [];

    lines.forEach(function (line) {
      var pair = line.match(/^\s*[-*]?\s*([a-zA-Z][a-zA-Z0-9_\- ]{1,40})\s*:\s*(.+?)\s*$/);

      if (!collectingNotes && pair) {
        var key = pair[1].toLowerCase().replace(/[\s\-]+/g, "_");
        fields[key] = pair[2].trim();
        return;
      }

      if (line.trim() !== "" || collectingNotes) {
        collectingNotes = true;
        notesLines.push(line);
      }
    });

    notes = notesLines.join("\n").trim();

    return {
      fields: fields,
      notes: notes
    };
  }

  function hasBookFields(fields) {
    return (
      !!fields.title ||
      !!fields.book_title ||
      !!fields.amazon ||
      !!fields.amazon_url ||
      !!fields.category ||
      !!fields.author ||
      !!fields.status
    );
  }

  function extractBookConfigs(markdown) {
    var source = markdown || "";
    var blocks = [];
    var match;
    var bookFenceRegex = /```book\s*([\s\S]*?)```/gi;
    var plainFenceRegex = /```\s*([\s\S]*?)```/gi;

    while ((match = bookFenceRegex.exec(source)) !== null) {
      var rawBookBlock = match[1] || "";
      var titleMatchesInBook = rawBookBlock.match(/^\s*[-*]?\s*title\s*:/gim);

      if (titleMatchesInBook && titleMatchesInBook.length > 1) {
        rawBookBlock
          .split(/(?=^\s*[-*]?\s*title\s*:)/gim)
          .map(function (part) {
            return part.trim();
          })
          .filter(Boolean)
          .forEach(function (part) {
            var parsedPart = parseBookBlock(part);
            if (hasBookFields(parsedPart.fields || {})) {
              blocks.push(parsedPart);
            }
          });
      } else {
        var parsedBookBlock = parseBookBlock(rawBookBlock);
        if (hasBookFields(parsedBookBlock.fields || {})) {
          blocks.push(parsedBookBlock);
        }
      }
    }

    while ((match = plainFenceRegex.exec(source)) !== null) {
      var rawPlainBlock = match[1] || "";
      var titleMatches = rawPlainBlock.match(/^\s*[-*]?\s*title\s*:/gim);

      if (titleMatches && titleMatches.length > 1) {
        rawPlainBlock
          .split(/(?=^\s*[-*]?\s*title\s*:)/gim)
          .map(function (part) {
            return part.trim();
          })
          .filter(Boolean)
          .forEach(function (part) {
            var parsedPart = parseBookBlock(part);
            if (hasBookFields(parsedPart.fields || {})) {
              blocks.push(parsedPart);
            }
          });
      } else {
        var parsedPlainBlock = parseBookBlock(rawPlainBlock);
        if (hasBookFields(parsedPlainBlock.fields || {})) {
          blocks.push(parsedPlainBlock);
        }
      }
    }

    return {
      blocks: blocks,
      bodyWithoutConfig: source
        .replace(/```book\s*[\s\S]*?```/gi, "")
        .replace(/```\s*([\s\S]*?)```/gi, function (fullMatch, plainContent) {
          var parsedPlain = parseBookBlock(plainContent || "");
          return hasBookFields(parsedPlain.fields || {}) ? "" : fullMatch;
        })
        .trim()
    };
  }

  function normalizeBookCategory(rawCategory, issueLabels) {
    var value = (rawCategory || "").toLowerCase();
    var hasAcademicLabel = (issueLabels || []).some(function (name) {
      return (name || "").toLowerCase() === "books-academic";
    });

    if (
      hasAcademicLabel ||
      value.indexOf("academic") !== -1 ||
      value.indexOf("acad") !== -1 ||
      value.indexOf("textbook") !== -1 ||
      value.indexOf("course") !== -1 ||
      value.indexOf("research") !== -1
    ) {
      return "academic";
    }

    return "reading";
  }

  function normalizeBookStatus(rawStatus) {
    var value = (rawStatus || "").toLowerCase().trim();
    if (!value) {
      return "reading";
    }

    if (value === "currently reading") {
      return "reading";
    }

    return value;
  }

  function getStatusPriority(status) {
    var normalized = normalizeBookStatus(status);
    if (normalized === "reading") {
      return 0;
    }
    if (normalized === "up next" || normalized === "to read") {
      return 1;
    }
    if (normalized === "completed" || normalized === "finished") {
      return 2;
    }
    return 3;
  }

  function compareBooks(a, b) {
    var statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }

    var aTime = new Date(a.createdAt).getTime();
    var bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  }

  function issueToBookEntries(issue) {
    var body = issue.body || "";
    var parsed = extractBookConfigs(body);
    var labels = (issue.labels || []).map(function (item) {
      return item.name;
    });
    var hasStructuredData = parsed.blocks.some(function (block) {
      return hasBookFields(block.fields || {});
    });

    if (hasStructuredData) {
      return parsed.blocks
        .map(function (block, index) {
          var fields = block.fields || {};
          var amazonUrl = normalizeUrl(fields.amazon || fields.amazon_url || "") || extractAmazonLink(block.notes || "");
          var title = fields.title || fields.book_title || "";

          if (!title && !amazonUrl) {
            return null;
          }

          return {
            title: title || issue.title,
            author: fields.author || "",
            category: normalizeBookCategory(fields.category || "", labels),
            status: normalizeBookStatus(fields.status || "reading"),
            url: amazonUrl,
            bookId: "b" + String(index + 1),
            notesBody: block.notes || "",
            issueNumber: issue.number,
            createdAt: issue.created_at,
            excerpt: toExcerpt(block.notes || parsed.bodyWithoutConfig || "", 180),
            tags: getTags(issue.labels || [])
          };
        })
        .filter(Boolean);
    }

    return extractBooksFromMarkdown(body).map(function (book, index) {
      return {
        title: book.title,
        author: "",
        category: normalizeBookCategory("", labels),
        status: normalizeBookStatus("reading"),
        url: book.url,
        bookId: "b" + String(index + 1),
        notesBody: body,
        issueNumber: issue.number,
        createdAt: issue.created_at,
        excerpt: toExcerpt(body, 180),
        tags: getTags(issue.labels || [])
      };
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

  function renderBookCard(book) {
    var author = book.author ? '<p class="blog-meta">by ' + escapeHtml(book.author) + '</p>' : "";
    var status = "";
    var titleHtml = "";

    if (book.url) {
      titleHtml =
        '<h2><a href="' +
        escapeHtml(book.url) +
        '" target="_blank" rel="noopener">' +
        escapeHtml(book.title) +
        "</a></h2>";
    } else {
      titleHtml = '<h2>' + escapeHtml(book.title) + "</h2>";
    }

    if (book.status) {
      var normalizedStatus = normalizeBookStatus(book.status);
      var label = normalizedStatus === "reading" ? "Currently Reading" : normalizedStatus;
      status =
        '<p class="book-status-row"><span class="book-status-badge">' +
        escapeHtml(label) +
        "</span></p>";
    }

    return (
      '<article class="box blog-card book-card">' +
      '<div class="book-card-body">' +
      titleHtml +
      author +
      status +
      '<p class="blog-meta">' +
      formatDate(book.createdAt) +
      '</p>' +
      '<p><a href="?post=' +
      book.issueNumber +
      (book.bookId ? "&book=" + encodeURIComponent(book.bookId) : "") +
      '">View notes</a></p>' +
      renderTags(book.tags || []) +
      '</div>' +
      '</article>'
    );
  }

  function renderBookSection(title, books) {
    if (!books.length) {
      return "";
    }

    return (
      '<section class="books-section">' +
      '<h2 class="major">' +
      escapeHtml(title) +
      '</h2>' +
      '<div class="blog-list">' +
      books.map(renderBookCard).join("") +
      '</div>' +
      '</section>'
    );
  }

  function renderList(issues) {
    var books = [];
    issues.forEach(function (issue) {
      books = books.concat(issueToBookEntries(issue));
    });

    if (books.length > 0) {
      var academicBooks = books.filter(function (book) {
        return book.category === "academic";
      });
      var readingBooks = books.filter(function (book) {
        return book.category !== "academic";
      });

      academicBooks.sort(compareBooks);
      readingBooks.sort(compareBooks);

      listContainer.innerHTML =
        renderBookSection("Academic Books", academicBooks) +
        renderBookSection("Other Books I Am Reading", readingBooks);
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

  function stripBookConfigBlock(markdown) {
    var parsed = extractBookConfigs(markdown || "");
    var notesFromBlocks = parsed.blocks
      .map(function (block) {
        return block.notes || "";
      })
      .filter(Boolean)
      .join("\n\n");

    return [notesFromBlocks, parsed.bodyWithoutConfig || ""].filter(Boolean).join("\n\n").trim();
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
    var selectedBookId = getQueryBookId();
    var issueBooks = issueToBookEntries(issue);
    var selectedBook = selectedBookId
      ? issueBooks.find(function (book) {
          return book.bookId === selectedBookId;
        })
      : issueBooks[0];
    var markdownBody = selectedBook && selectedBook.notesBody
      ? selectedBook.notesBody
      : stripBookConfigBlock(issue.body || "");
    var postTitle = selectedBook && selectedBook.title ? selectedBook.title : issue.title;
    var headerHtml =
      '<article class="box blog-card blog-post">' +
      "<h2>" +
      escapeHtml(postTitle) +
      "</h2>" +
      '<p class="blog-meta">' +
      formatDate(issue.created_at) +
      "</p>";
    var footerHtml =
      renderAmazonButton(amazonUrl) +
      renderTags(tags) +
      "</article>";

    renderMarkdown(markdownBody)
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
          escapeHtml(markdownBody)
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

  function updateBackLink(queryPost) {
    if (!booksBackLink) {
      return;
    }

    if (queryPost) {
      booksBackLink.textContent = "Back to Books";
      booksBackLink.setAttribute("href", "/books/");
    } else {
      booksBackLink.textContent = "Back to Portfolio";
      booksBackLink.setAttribute("href", "/");
    }
  }

  function fetchIssues() {
    return fetch(issuesApi, {
      headers: {
        Accept: "application/vnd.github.full+json"
      }
    }).then(function (response) {
      if (!response.ok) {
        var error = new Error("Failed to fetch issues");
        error.status = response.status;
        throw error;
      }
      return response.json();
    });
  }

  function start() {
    setLoading(true);
    bindSearch();

    var queryPost = getQueryPostNumber();
    updateBackLink(queryPost);
    var cached = getCache();
    var anyCached = getAnyCache();
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
        if (!cached && anyCached) {
          var fallbackIssues = normalizeIssues(anyCached);
          allIssues = fallbackIssues;

          if (queryPost) {
            var fallbackPost = fallbackIssues.find(function (item) {
              return item.number === queryPost;
            });
            if (fallbackPost) {
              renderPost(fallbackPost);
              return;
            }
          } else {
            renderList(fallbackIssues);
            applySearch();
            return;
          }
        }

        if (!cached && !anyCached) {
          renderError();
        }
      })
      .finally(function () {
        setLoading(false);
      });
  }

  start();
})();
