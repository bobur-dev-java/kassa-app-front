<template>
  <RouterView />
</template>

<style>
:root {
  color: #172026;
  background: var(--tg-theme-bg-color, #f4f7f6);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background:
    linear-gradient(180deg, rgba(18, 124, 100, 0.12), transparent 280px),
    var(--tg-theme-bg-color, #f4f7f6);
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled,
input:disabled,
select:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

#app {
  min-height: 100vh;
}

.auth-screen,
.admin-screen {
  width: min(100%, 560px);
  min-height: 100vh;
  margin: 0 auto;
  padding: max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
}

.auth-screen {
  display: grid;
  align-items: center;
}

.auth-panel,
.panel,
.stat-card {
  border: 1px solid rgba(23, 32, 38, 0.08);
  border-radius: 8px;
  background: var(--tg-theme-secondary-bg-color, #ffffff);
  box-shadow: 0 16px 42px rgba(23, 32, 38, 0.08);
}

.auth-panel {
  padding: 22px;
}

.brand,
.topbar,
.section-title,
.stats-grid {
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
  color: var(--tg-theme-hint-color, #6a7672);
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
}

h1 {
  color: var(--tg-theme-text-color, #172026);
  font-size: 26px;
  line-height: 1.15;
}

h2 {
  font-size: 18px;
}

.form {
  display: grid;
  gap: 14px;
}

.form.compact {
  gap: 12px;
}

.field {
  display: grid;
  gap: 7px;
}

.field span {
  color: var(--tg-theme-hint-color, #54625e);
  font-size: 13px;
  font-weight: 700;
}

.field input,
.field select {
  width: 100%;
  min-height: 48px;
  border: 1px solid rgba(23, 32, 38, 0.13);
  border-radius: 8px;
  background: #f8faf9;
  color: var(--tg-theme-text-color, #172026);
  outline: none;
  padding: 0 13px;
}

.field input:focus,
.field select:focus {
  border-color: #127c64;
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
}

.primary-button,
.primary-small-button {
  background: var(--tg-theme-button-color, #127c64);
  color: var(--tg-theme-button-text-color, #ffffff);
}

.primary-small-button {
  min-height: 40px;
  padding: 0 14px;
}

.ghost-button {
  min-height: 40px;
  border: 1px solid rgba(23, 32, 38, 0.12);
  background: rgba(255, 255, 255, 0.72);
  color: var(--tg-theme-text-color, #172026);
  padding: 0 14px;
}

.danger-button {
  min-height: 40px;
  background: #dc2626;
  color: #ffffff;
  padding: 0 14px;
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
  gap: 14px;
}

.topbar {
  justify-content: space-between;
  gap: 12px;
  padding: 8px 2px 4px;
}

.topbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.yatt-switcher {
  display: grid;
  gap: 5px;
  min-width: 180px;
}

.yatt-switcher select {
  min-height: 40px;
  max-width: 240px;
  border: 1px solid rgba(23, 32, 38, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--tg-theme-text-color, #172026);
  padding: 0 11px;
  font-weight: 800;
  outline: none;
}

.yatt-switcher select:focus {
  border-color: #127c64;
  box-shadow: 0 0 0 3px rgba(18, 124, 100, 0.12);
}

.yatt-switcher-error {
  color: #b42318;
  font-size: 12px;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: grid;
  gap: 8px;
  padding: 16px;
}

.stat-card strong {
  font-size: 30px;
  line-height: 1;
}

.panel {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.section-title {
  justify-content: space-between;
  gap: 12px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 0 6px;
}

.tab-button {
  min-height: 40px;
  border: 1px solid rgba(23, 32, 38, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--tg-theme-text-color, #172026);
  padding: 0 13px;
  font-weight: 800;
  white-space: nowrap;
}

.tab-button.active {
  border-color: #127c64;
  background: #127c64;
  color: #ffffff;
}

.mini-grid,
.product-row {
  display: grid;
  gap: 10px;
}

.mini-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.product-row {
  grid-template-columns: 1fr 92px 76px 44px;
  align-items: end;
}

.product-row .ghost-button {
  min-width: 44px;
  padding: 0;
}

.list-card {
  display: grid;
  gap: 5px;
  width: 100%;
  border: 1px solid rgba(23, 32, 38, 0.08);
  border-radius: 8px;
  background: #f8faf9;
  color: inherit;
  padding: 12px;
  text-align: left;
}

button.list-card:focus-visible {
  border-color: #127c64;
  outline: 3px solid rgba(18, 124, 100, 0.12);
}

.list-card strong {
  color: var(--tg-theme-text-color, #172026);
  font-size: 15px;
}

.list-card span {
  color: var(--tg-theme-hint-color, #6a7672);
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 460px) {
  .topbar {
    align-items: flex-start;
  }

  .topbar-actions {
    width: 100%;
    justify-content: stretch;
  }

  .topbar-actions .ghost-button,
  .yatt-switcher,
  .yatt-switcher select {
    width: 100%;
    max-width: none;
  }

  .mini-grid,
  .product-row {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 720px) {
  .auth-screen,
  .admin-screen {
    padding-top: 32px;
    padding-bottom: 32px;
  }
}
</style>
