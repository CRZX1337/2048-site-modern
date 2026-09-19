const effects = `<div class="theme-effects" aria-hidden="true"><div class="apple-orb apple-orb-one"></div><div class="apple-orb apple-orb-two"></div><div class="glass-aurora"></div><div class="glass-grain"></div><div class="material-rail"></div><div class="crt-scanlines"></div><div class="crt-vignette"></div><div class="modern-grid"></div></div>`;

export function composeThemeShell(shellClass: string, contentClass: string, content: string): string {
  return `<main class="app-shell ${shellClass}">${effects}<div class="theme-content ${contentClass}">${content}</div></main>`;
}
