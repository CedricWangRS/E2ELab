# Contributing to E2ELab

Thank you for your interest in improving E2ELab! This document outlines how to contribute.

## Ways to Contribute

### Add a Preset Configuration
If you have a real-world E2E-protected PDU configuration that would make a good example:
1. Open `assets/js/presets.js`
2. Add a new entry to the `configurations` array following the existing format
3. Include: id, name, description, profile, dataId, counter, dataHex, useCase

### Improve Documentation
- Fix typos or clarify unclear sections in README.md
- Add real-world use case descriptions to ARCHITECTURE.md
- Translate documentation to other languages

### Report Issues
When reporting issues, please include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console error messages (if any)

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Verify: open `index.html` in a browser and test your changes
5. Run syntax check: `node --check assets/js/your-file.js`
6. Commit with a clear message
7. Submit a pull request

## Code Style

### JavaScript
- Use `var` (not `let`/`const`) — this project supports older browsers
- Use traditional `function` syntax (not arrow functions)
- Use single quotes for strings
- No ES modules — all files use `<script>` tags and global variables
- Use `>>> 0` for all 32-bit unsigned operations (see TOOLS.md)
- Variable names: camelCase, descriptive, consistent (avoid `hasReturn` when you mean `hasReverse`!)

### CSS
- Use CSS custom properties (variables) from `variables.css`
- Follow BEM-inspired naming: `.block__element--modifier`
- Dark theme is default; light theme via `[data-theme="light"]`

### HTML
- Semantic HTML5 elements
- No inline styles (use CSS classes)
- No external resources (fonts, images, scripts) — everything must work offline

## Project Principles

- **Zero dependencies** — no CDNs, no npm packages, no frameworks
- **Offline-first** — must work with `file://` protocol (double-click to open)
- **Privacy-first** — no analytics, no tracking, no cookies
- **Education-first** — every feature should teach something about E2E protection

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
