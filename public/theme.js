(() => {
  const root = document.documentElement
  const preferredTheme = () => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const applyTheme = (theme) => {
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const isDark = theme === 'dark'
      button.innerHTML = isDark ? '☀️' : '🌙'
      button.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro')
      button.title = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
    })
  }

  const initialize = () => {
    applyTheme(preferredTheme())

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextTheme = root.classList.contains('dark') ? 'light' : 'dark'
        applyTheme(nextTheme)
      })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
  } else {
    initialize()
  }
})()
