/**
 * E2ELab v1.0 — Entry Point
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { App.init(); });
} else {
  App.init();
}
