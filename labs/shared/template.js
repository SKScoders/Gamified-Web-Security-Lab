function pageTemplate(title, subtitle, navLinks, bodyHtml) {
  const navHtml = navLinks
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .join('')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Solstice Dynamics</title>
  <link rel="stylesheet" href="/shared/style.css">
</head>
<body>
  <header class="header">
    <div class="header-brand">
      <div class="header-logo">SD</div>
      <div>
        <div class="header-title">Solstice Dynamics</div>
        <div class="header-subtitle">${subtitle}</div>
      </div>
    </div>
    <nav class="header-nav">
      ${navHtml}
    </nav>
  </header>
  <main class="container">
    ${bodyHtml}
  </main>
  <footer class="footer">
    &copy; 2025 Solstice Dynamics, Inc. &mdash; Internal Use Only
  </footer>
</body>
</html>`
}

module.exports = { pageTemplate }
