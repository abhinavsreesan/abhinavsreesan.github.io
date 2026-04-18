(function () {
  var body = document.body;
  if (!body) {
    return;
  }

  var links = [
    { id: "home", href: "/", label: "Home" },
    { id: "experience", href: "/experience/", label: "Experience" },
    { id: "skills", href: "/skills/", label: "Skills" },
    { id: "blog", href: "/blog/", label: "Blog" },
    { id: "bookshelf", href: "/bookshelf/", label: "Books" },
    { id: "contact", href: "/contact/", label: "Contact" }
  ];

  var currentPage = body.getAttribute("data-page") || "home";
  var navs = document.querySelectorAll("[data-site-nav]");
  if (!navs.length) {
    return;
  }

  function renderLinks() {
    return links
      .map(function (item) {
        var active = item.id === currentPage ? ' class="active"' : "";
        return '<a href="' + item.href + '"' + active + ">" + item.label + "</a>";
      })
      .join("");
  }

  var navHtml = renderLinks();

  navs.forEach(function (nav) {
    nav.innerHTML = navHtml;
  });
})();
