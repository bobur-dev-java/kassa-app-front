<template>
  <RouterView />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

:root {
  --page-max-width: 1180px;
  --primary-h: 165;
  --primary-s: 74%;
  --primary-l: 30%;
  --primary: hsl(var(--primary-h), var(--primary-s), var(--primary-l));
  --primary-hover: hsl(var(--primary-h), var(--primary-s), calc(var(--primary-l) - 5%));
  --primary-active: hsl(var(--primary-h), var(--primary-s), calc(var(--primary-l) - 10%));
  --primary-light: hsl(var(--primary-h), var(--primary-s), 95%);
  --primary-text: #ffffff;
  
  --app-bg: #f4f8f6;
  --surface: #ffffff;
  --surface-border: rgba(18, 124, 100, 0.08);
  --text: #0f1715;
  --hint: #566c62;
  --line: rgba(18, 124, 100, 0.12);
  
  --success: #10b981;
  --success-bg: #ecfdf5;
  --success-border: rgba(16, 185, 129, 0.15);
  
  --warning: #f59e0b;
  --warning-bg: #fffbeb;
  --warning-border: rgba(245, 158, 11, 0.15);
  
  --danger: #ef4444;
  --danger-bg: #fef2f2;
  --danger-border: rgba(239, 68, 68, 0.15);
  
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  --shadow-sm: 0 2px 4px rgba(18, 124, 100, 0.02);
  --shadow-md: 0 8px 20px rgba(18, 124, 100, 0.06);
  --shadow-lg: 0 16px 36px rgba(18, 124, 100, 0.1);
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  
  color: var(--text);
  background: var(--app-bg);
  font-family: 'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  color-scheme: light;
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

button,
.tab-button,
.badge,
.list-card,
.session-meta,
.brand-mark,
.topbar h1,
.topbar p,
.topbar-actions {
  user-select: none;
  -webkit-user-select: none;
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
  background: 
    radial-gradient(circle at 100% 0%, hsl(165, 74%, 93%), transparent 350px),
    radial-gradient(circle at 0% 100%, hsl(165, 74%, 95%), transparent 350px),
    var(--app-bg);
  overflow-x: hidden;
}

button,
input,
select {
  font: inherit;
}

input,
select {
  font-size: 15px;
}

button {
  cursor: pointer;
  touch-action: manipulation;
  transition: var(--transition);
}

button:disabled,
input:disabled,
select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

#app {
  min-height: 100vh;
  min-height: 100dvh;
}

/* Screen Containers */
.auth-screen,
.admin-screen {
  width: min(100%, var(--page-max-width));
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding: max(20px, env(safe-area-inset-top)) clamp(16px, 4vw, 36px)
    max(28px, env(safe-area-inset-bottom));
}

.auth-screen {
  display: grid;
  align-items: center;
  justify-content: center;
  width: min(100%, 480px);
}

/* Glass & Card Panels */
.auth-panel,
.panel,
.stat-card {
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-md);
  transition: var(--transition);
}

.auth-panel {
  width: 100%;
  padding: clamp(24px, 6vw, 36px);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow-lg);
}

.panel {
  padding: clamp(20px, 3.2vw, 32px);
  margin-bottom: 20px;
}

.stat-card {
  display: grid;
  gap: 8px;
  padding: clamp(18px, 2.5vw, 26px);
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--primary);
  border-radius: 4px 0 0 4px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Brand & Typography */
.brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.brand-mark {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary), hsl(var(--primary-h), var(--primary-s), calc(var(--primary-l) - 6%)));
  color: white;
  font-size: 26px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(18, 124, 100, 0.25);
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
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.session-meta {
  display: inline-block;
  margin-top: 6px;
  background: var(--primary-light);
  color: var(--primary);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
}

h1, h2, h3 {
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.5px;
  overflow-wrap: anywhere;
}

h1 {
  color: var(--text);
  font-size: 28px;
  line-height: 1.15;
}

h2 {
  color: var(--text);
  font-size: clamp(20px, 2.5vw, 24px);
  line-height: 1.2;
}

/* Forms & Fields */
.form {
  display: grid;
  gap: 18px;
  width: 100%;
}

.form.compact {
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.field input,
.field select {
  width: 100%;
  min-height: 50px;
  border: 1.5px solid rgba(18, 124, 100, 0.15);
  border-radius: var(--radius-md);
  background: #fafcfb;
  color: var(--text);
  outline: none;
  padding: 0 16px;
  transition: var(--transition);
}

.field input:focus,
.field select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(18, 124, 100, 0.12);
  background: #ffffff;
}

/* Buttons */
.primary-button,
.ghost-button,
.primary-small-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 50px;
  border: 0;
  border-radius: var(--radius-md);
  font-weight: 700;
  line-height: 1;
  text-align: center;
  text-decoration: none;
  transition: var(--transition);
}

.primary-button:active,
.ghost-button:active,
.primary-small-button:active,
.danger-button:active,
.tab-button:active,
.list-card:active {
  transform: scale(0.97);
}

.primary-button {
  background: var(--primary);
  color: var(--primary-text);
  box-shadow: 0 4px 12px rgba(18, 124, 100, 0.15);
}

.primary-button:hover:not(:disabled) {
  background: var(--primary-hover);
  box-shadow: 0 6px 16px rgba(18, 124, 100, 0.25);
}

.primary-small-button {
  min-height: 42px;
  padding: 0 18px;
  background: var(--primary);
  color: var(--primary-text);
  font-size: 14px;
}

.primary-small-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.ghost-button {
  min-height: 42px;
  border: 1.5px solid var(--line);
  background: rgba(255, 255, 255, 0.85);
  color: var(--text);
  padding: 0 18px;
  font-size: 14px;
}

.ghost-button:hover:not(:disabled) {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.danger-button {
  min-height: 42px;
  background: #dc2626;
  color: #ffffff;
  padding: 0 18px;
  font-size: 14px;
}

.danger-button:hover:not(:disabled) {
  background: #b91c1c;
}

/* Alerts & Notices */
.alert,
.success {
  margin: 0;
  border-radius: var(--radius-md);
  padding: 14px 18px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
}

.alert {
  background: var(--danger-bg);
  color: var(--danger);
  border-color: var(--danger-border);
}

.success {
  background: var(--success-bg);
  color: var(--success);
  border-color: var(--success-border);
}

/* Topbar Header & Navigation */
.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  padding: 12px 0 20px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
}

.topbar h1 {
  font-size: clamp(26px, 3.5vw, 36px);
}

.topbar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

/* Switcher scoped variables overriding default select styling */
.yatt-switcher {
  display: inline-grid;
  gap: 4px;
}

.yatt-switcher select {
  min-height: 42px;
  background: rgba(255, 255, 255, 0.9);
  border: 1.5px solid var(--line);
  font-weight: 700;
  color: var(--primary);
  border-radius: var(--radius-md);
  padding: 0 12px;
}

.yatt-switcher select:focus {
  border-color: var(--primary);
}

.yatt-switcher-error {
  color: var(--danger);
  font-size: 12px;
  font-weight: 600;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card strong {
  color: var(--text);
  font-size: clamp(32px, 5vw, 44px);
  line-height: 1;
  font-weight: 800;
}

/* Navigation Tabs */
.tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 6px;
  background: rgba(18, 124, 100, 0.05);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
  scrollbar-width: none; /* Hide scrollbars for layout */
  -webkit-overflow-scrolling: touch;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab-button {
  flex: 1 0 auto;
  min-height: 42px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--hint);
  padding: 0 20px;
  font-weight: 700;
  white-space: nowrap;
  font-size: 14px;
  transition: var(--transition);
}

.tab-button:hover {
  color: var(--text);
}

.tab-button.active {
  background: var(--surface);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

/* Content Layout Components */
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.section-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.mini-grid,
.product-row {
  display: grid;
  gap: 12px;
}

.mini-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  margin-bottom: 16px;
}

.product-row {
  grid-template-columns: minmax(180px, 1fr) minmax(100px, 150px) minmax(80px, 110px) 46px;
  align-items: end;
  background: rgba(18, 124, 100, 0.02);
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--line);
}

.product-row .ghost-button {
  min-height: 46px;
  min-width: 46px;
  padding: 0;
  color: var(--danger);
  border-color: var(--danger-border);
}

.product-row .ghost-button:hover {
  background: var(--danger-bg);
  border-color: var(--danger);
}

/* Item List Cards */
.list-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: inherit;
  padding: 18px;
  text-align: left;
  overflow-wrap: anywhere;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  margin-bottom: 10px;
}

button.list-card {
  border: 1px solid var(--surface-border);
}

button.list-card:hover,
a.list-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

button.list-card:focus-visible {
  border-color: var(--primary);
  outline: 3px solid rgba(18, 124, 100, 0.12);
}

.list-card strong {
  color: var(--text);
  font-size: 16px;
  line-height: 1.3;
  font-weight: 700;
}

.list-card span {
  color: var(--hint);
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Badges & Status Indicators */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-completed {
  background: var(--success-bg);
  color: var(--success);
}

.badge-open {
  background: var(--warning-bg);
  color: var(--warning);
}

.badge-pending {
  background: var(--warning-bg);
  color: var(--warning);
}

.badge-cancelled {
  background: var(--danger-bg);
  color: var(--danger);
}

.badge-cash {
  background: rgba(18, 124, 100, 0.1);
  color: var(--primary);
}

.badge-card {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.badge-terminal {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
}

/* Responsive Overrides */
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
    padding: 0 16px max(24px, env(safe-area-inset-bottom));
  }

  .topbar {
    grid-template-columns: 1fr;
    align-items: flex-start;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(244, 248, 246, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: max(12px, env(safe-area-inset-top)) 16px 12px 16px;
    margin: 0 -16px 20px -16px;
    border-bottom: 1px solid var(--line);
  }

  .topbar h1 {
    font-size: 26px;
  }

  .topbar-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    width: 100%;
    justify-content: initial;
    gap: 8px;
  }

  .topbar-actions > *,
  .topbar-actions .ghost-button,
  .yatt-switcher,
  .yatt-switcher select {
    width: 100%;
    max-width: none;
  }

  .tabs {
    margin-inline: -16px;
    padding-inline: 16px;
    border-radius: 0;
  }

  .section-title {
    align-items: flex-start;
  }

  .section-title > span {
    max-width: 100%;
  }

  .section-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    width: 100%;
    justify-content: initial;
    gap: 8px;
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

  input,
  select,
  textarea {
    font-size: 16px !important;
  }
}

@media (max-width: 480px) {
  .auth-screen {
    align-items: start;
    padding-top: max(40px, env(safe-area-inset-top));
  }

  .brand {
    margin-bottom: 24px;
  }

  .brand-mark {
    width: 46px;
    height: 46px;
    font-size: 22px;
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
    padding-top: max(40px, env(safe-area-inset-top));
    padding-bottom: max(40px, env(safe-area-inset-bottom));
  }
}

@media (min-width: 1280px) {
  :root {
    --page-max-width: 1240px;
  }
}
</style>
