// Applies the last-used theme before first paint so dark themes don't flash
// white while settings load from the local database. Written by
// src/lib/theme.ts; every value is re-validated here before use.
;(function () {
  try {
    var raw = window.localStorage.getItem('cinetrack.theme')
    if (!raw) return
    var hint = JSON.parse(raw)
    var root = document.documentElement
    if (typeof hint.theme === 'string' && /^[a-z]{1,20}$/.test(hint.theme)) root.setAttribute('data-theme', hint.theme)
    if (hint.vars && typeof hint.vars === 'object') {
      for (var name in hint.vars) {
        var value = hint.vars[name]
        if (/^--[a-z-]{1,40}$/.test(name) && typeof value === 'string' && /^(#[0-9a-f]{6}|rgba\([0-9., ]{1,40}\))$/i.test(value)) {
          root.style.setProperty(name, value)
        }
      }
    }
    if (hint.scheme === 'dark' || hint.scheme === 'light') root.style.colorScheme = hint.scheme
    if (typeof hint.color === 'string' && /^#[0-9a-f]{6}$/i.test(hint.color)) {
      var meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', hint.color)
    }
    if (hint.round === true) root.setAttribute('data-round-posters', 'true')
  } catch (e) {
    // Storage unavailable or hint unreadable: the app applies the theme itself.
  }
})()
