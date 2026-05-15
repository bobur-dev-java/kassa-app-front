<template>
  <RouterView />
</template>

<style>
:root {
  --page-max-width: 1180px;
  --app-bg: #f4f7f6;
  --surface: #ffffff;
  --text: #172026;
  --hint: #5f6d68;
  --primary: #127c64;
  --primary-text: #ffffff;
  --line: rgba(23, 32, 38, 0.12);
  color: #172026;
  background: var(--app-bg);
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  min-height: 100%;
  background: var(--app-bg);
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: linear-gradient(180deg, rgba(18, 124, 100, 0.12), transparent 280px), var(--app-bg);
  overflow-x: hidden;
}

button,
input,
select {
  font: inherit;
}

input,
select {
  font-size: 16px;
}

button {
  cursor: pointer;
  touch-action: manipulation;
}

button:disabled,
input:disabled,
select:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

#app {
  min-height: 100vh;
  min-height: 100dvh;
}

.auth-screen,
.admin-screen {
  width: min(100%, var(--page-max-width));
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding: max(16px, env(safe-area-inset-top)) clamp(12px, 3vw, 32px)
    max(24px, env(safe-area-inset-bottom));
}

.auth-screen {
  display: grid;
  align-items: center;
  width: min(100%, 520px);
}

.auth-panel,
.panel,
.stat-card {
  border: 1px solid rgba(23, 32, 38, 0.08);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 16px 42px rgba(23, 32, 38, 0.08);
}

.auth-panel {
  width: 100%;
  padding: clamp(18px, 5vw, 28px);
}

.brand,
.section-title {
  display: flex;
  align-items: center;
}

.brand {
  gap: 14px;
  margin-bottom: 28px;
}

.brand-mark {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 8px;
  background: #127c64;
  color: white;
  font-size: 24px;
  font-weight: 800;
}

.brand p,
.topbar p,
.session-meta,
.section-title span,
.stat-card span {
  margin: 0;
  color: var(--hint);
  font-size: 13px;
  font-weight: 600;
}

.session-meta {
  display: block;
  margin-top: 4px;
}

h1,
h2 {
  margin: 0;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

h1 {
  color: var(--text);
  font-size: 26px;
  line-height: 1.15;
}

h2 {
  color: var(--text);
  font-size: clamp(18px, 2vw, 22px);
  line-height: 1.2;
}

.form {
  display: grid;
  gap: 14px;
  width: 100%;
}

.form.compact {
  gap: 12px;
}

.field {
  display: grid;
  gap: 7px;
}

.field span {
  color: var(--hint);
  font-size: 13px;
  font-weight: 700;
}

.field input,
.field select {
  width: 100%;
  min-height: 50px;
  border: 1px solid rgba(23, 32, 38, 0.13);
  border-radius: 8px;
  background: #f8faf9;
  color: var(--text);
  outline: none;
  padding: 0 13px;
}

.field input:focus,
.field select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(18, 124, 100, 0.12);
}

.primary-button,
.ghost-button,
.primary-small-button,
.danger-button {
  min-height: 48px;
  border: 0;
  border-radius: 8px;
  font-weight: 800;
  line-height: 1.15;
  text-align: center;
}

.primary-button,
.primary-small-button {
  background: var(--primary);
  color: var(--primary-text);
}

.primary-small-button {
  min-height: 42px;
  padding: 0 16px;
}

.ghost-button {
  min-height: 42px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.72);
  color: var(--text);
  padding: 0 16px;
}

.danger-button {
  min-height: 42px;
  background: #dc2626;
  color: #ffffff;
  padding: 0 16px;
}

.alert,
.success {
  margin: 0;
  border-radius: 8px;
  padding: 12px 13px;
  font-size: 14px;
  font-weight: 700;
}

.alert {
  background: #fff2f0;
  color: #b42318;
}

.success {
  background: #edfdf7;
  color: #047857;
}

.admin-screen {
  display: grid;
  align-content: start;
  gap: clamp(12px, 2vw, 18px);
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 14px;
  padding: 8px 2px 4px;
}

.topbar > div:first-child {
  min-width: 0;
}

.topbar h1 {
  font-size: clamp(24px, 3.2vw, 36px);
}

.topbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.topbar-actions > * {
  min-width: 0;
}

.yatt-switcher {
  display: grid;
  gap: 5px;
  min-width: 180px;
}

.yatt-switcher select {
  min-height: 42px;
  max-width: 240px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  padding: 0 11px;
  font-weight: 800;
  outline: none;
}

.yatt-switcher select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(18, 124, 100, 0.12);
}

.yatt-switcher-error {
  color: #b42318;
  font-size: 12px;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.stat-card {
  display: grid;
  gap: 8px;
  padding: clamp(16px, 2vw, 22px);
  min-width: 0;
}

.stat-card strong {
  color: var(--text);
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1;
}

.panel {
  display: grid;
  gap: clamp(14px, 2vw, 18px);
  min-width: 0;
  padding: clamp(16px, 2.4vw, 24px);
}

.section-title {
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
}

.section-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 0 8px;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.tab-button {
  flex: 0 0 auto;
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text);
  padding: 0 16px;
  font-weight: 800;
  white-space: nowrap;
}

.tab-button.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #ffffff;
}

.mini-grid,
.product-row {
  display: grid;
  gap: 10px;
}

.mini-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
}

.product-row {
  grid-template-columns: minmax(180px, 1fr) minmax(108px, 160px) minmax(88px, 120px) 48px;
  align-items: end;
}

.product-row .ghost-button {
  min-width: 48px;
  padding: 0;
}

.list-card {
  display: grid;
  gap: 5px;
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(23, 32, 38, 0.08);
  border-radius: 8px;
  background: #f8faf9;
  color: inherit;
  padding: clamp(12px, 2vw, 16px);
  text-align: left;
  overflow-wrap: anywhere;
}

button.list-card:focus-visible {
  border-color: var(--primary);
  outline: 3px solid rgba(18, 124, 100, 0.12);
}

.list-card strong {
  color: var(--text);
  font-size: 15px;
  line-height: 1.35;
}

.list-card span {
  color: var(--hint);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
}

@media (min-width: 760px) {
  .panel > .form.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: end;
  }

  .panel > .form.compact > .mini-grid,
  .panel > .form.compact > .product-row,
  .panel > .form.compact > .primary-button,
  .panel > .form.compact > .ghost-button {
    grid-column: 1 / -1;
  }

  .panel > .ghost-button,
  .panel > .primary-small-button,
  .panel > .danger-button {
    justify-self: start;
  }
}

@media (max-width: 760px) {
  .admin-screen {
    padding: max(12px, env(safe-area-inset-top)) 12px max(20px, env(safe-area-inset-bottom));
  }

  .topbar {
    grid-template-columns: 1fr;
    align-items: flex-start;
    gap: 12px;
  }

  .topbar h1 {
    font-size: 24px;
  }

  .topbar-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
    width: 100%;
    justify-content: initial;
  }

  .topbar-actions > *,
  .topbar-actions .ghost-button,
  .yatt-switcher,
  .yatt-switcher select {
    width: 100%;
    max-width: none;
  }

  .tabs {
    margin-inline: -12px;
    padding-inline: 12px;
  }

  .section-title {
    align-items: flex-start;
  }

  .section-title > span {
    max-width: 100%;
  }

  .section-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(136px, 1fr));
    width: 100%;
    justify-content: initial;
  }

  .section-actions > button {
    width: 100%;
  }

  .product-row {
    grid-template-columns: 1fr 1fr;
  }

  .product-row .field:first-child,
  .product-row .ghost-button {
    grid-column: 1 / -1;
  }

  .panel > .ghost-button,
  .panel > .primary-small-button,
  .panel > .danger-button {
    width: 100%;
    justify-self: stretch;
  }
}

@media (max-width: 460px) {
  .auth-screen {
    align-items: start;
  }

  .brand {
    margin-bottom: 22px;
  }

  .brand-mark {
    width: 44px;
    height: 44px;
  }

  .stats-grid,
  .mini-grid,
  .product-row,
  .topbar-actions,
  .section-actions {
    grid-template-columns: 1fr;
  }

  .field input,
  .field select,
  .primary-button,
  .ghost-button,
  .primary-small-button,
  .danger-button,
  .tab-button {
    min-height: 48px;
  }
}

@media (min-width: 720px) {
  .auth-screen,
  .admin-screen {
    padding-top: max(32px, env(safe-area-inset-top));
    padding-bottom: max(32px, env(safe-area-inset-bottom));
  }
}

@media (min-width: 1280px) {
  :root {
    --page-max-width: 1240px;
  }
}
</style>
