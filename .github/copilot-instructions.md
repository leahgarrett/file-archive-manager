# Copilot Rules

## Response Protocol

- Begin each response with "Hello"
- Specify which rule is being applied in each response
- log each prompt at the end of the README file without making any other edits
- do not respond until you are at least 95% confident you have the right answer

## Accessibility

- All websites and UI must be WCAG 2.1 A compliant.

## Best practices

The following are recommended team-wide practices to keep the project maintainable, secure, and pleasant to work on.

- Commits
  - Use small, focused commits. One logical change per commit.
  - Use clear, conventional commit messages (e.g. feat:, fix:, docs:, chore:).

- Branching
  - Use feature branches named with a short prefix and ticket (e.g. feat/add-import-ux, fix/cleanup-123).
  - Keep `main` protected; merge via pull requests after review.

- Pull Requests & Reviews
  - Open PRs with a short description, list of changed areas, and test instructions.
  - Request at least one reviewer and address feedback before merging.
  - Link PRs to issues when appropriate and squash or rebase as the team prefers.

- Testing & Quality
  - Add automated tests for new functionality (unit + integration when applicable).
  - Maintain a minimal CI pipeline that runs linting and tests on every PR.
  - Keep test data small and deterministic.

- Linting & Formatting
  - Enforce a consistent code style with linters and formatters (pre-commit hooks recommended).
  - Fix linter warnings before merging; treat errors as blockers.

- Dependencies
  - Pin direct dependencies and review transitive updates regularly.
  - Use Dependabot (or similar) for automated update PRs and review them promptly.

- Security & Secrets
  - Never commit secrets or credentials. Use environment variables or a secret manager.
  - Run dependency vulnerability checks in CI and fix or mitigate critical findings quickly.

- Documentation
  - Keep `README.md` up to date with setup and run instructions.
  - Document public APIs and non-obvious implementation decisions in the repository.

- Accessibility & Internationalization
  - Follow accessibility requirements (WCAG 2.1 A) for UI work.
  - Keep UI text ready for localization; avoid hard-coded strings when practical.

- Releases & Changelog
  - Tag and document releases. Keep a changelog or rely on automated changelog generation from commit messages.

- Automation & Tooling
  - Use pre-commit hooks to run quick checks locally (format, lint, unit tests where fast).
  - Prefer automated checks in CI over manual gating when possible.

- Onboarding & Contributions
  - Add a short CONTRIBUTING.md if the project will accept external contributors.
  - Add issue and PR templates to clarify expectations.

These guidelines are intentionally pragmatic; adapt them as the project grows. Small, consistent practices reduce friction and technical debt.

## Language-specific programming best practices (TypeScript)

This project will use TypeScript. Keep the guidance below focused, practical, and enforced via CI and pre-commit hooks where possible.

- Environment & package manager
  - Document and use a Node.js LTS version (in `engines` or an `.nvmrc` / `.node-version`).
  - Keep a lockfile (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`) checked in.

- TypeScript configuration
  - Use `tsconfig.json` with `strict: true` enabled (opt-in gradually for legacy code if needed).
  - Target a reasonable ES version (e.g., `ES2020`) and enable `incremental` builds for faster CI.
  - Emit type declarations only for packages/libraries that need them (`declaration: true` when publishing).

- Linting & formatting
  - Use ESLint with the TypeScript parser (`@typescript-eslint/parser`) and a shared config; enforce in CI.
  - Use Prettier for formatting and integrate with ESLint (or run via `lint-staged`).
  - Run `eslint --ext .ts,.tsx` and `npm run type-check` as part of PR checks.

- Types & dependencies
  - Prefer precise types over `any`. Use `unknown` for external inputs and validate before casting.
  - Install `@types/*` for JS dependencies when needed, or add local minimal typings for untyped packages.
  - Pin direct dependencies and review transitive updates.

- Testing
  - Use a fast TypeScript-friendly test runner (Vitest or Jest with `ts-jest`).
  - Keep tests small and deterministic; mock external services and I/O where appropriate.
  - Include a type-check test step to catch regressions (e.g., `tsc --noEmit`).

- Tooling & workflows
  - Use `husky` + `lint-staged` (or built-in git hooks) to run formatter/linter on staged files.
  - Run lint, type-check, and tests in CI on every PR.
  - Consider `turbo`, `nx`, or workspaces for monorepos; prefer `pnpm` for deterministic installs in large projects.

- Project layout & source conventions
  - Keep source under `src/` and compiled output under `dist/` or `lib/` (gitignored).
  - Use clear public/internal API boundaries and export types in an `index.ts` entrypoint.

- Security & best practices
  - Avoid eval-like patterns; validate inputs and sanitize filesystem/network operations.
  - Run dependency vulnerability scans in CI and block critical findings.

If you want, I can also add a `tsconfig.json`, ESLint/Prettier config, `package.json` scripts, pre-commit hooks, and a small GitHub Actions workflow that runs type-check, lint, and tests on PRs — tell me which you'd like next.
