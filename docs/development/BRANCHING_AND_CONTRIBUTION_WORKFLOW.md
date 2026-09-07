# Duesora Branching and Contribution Workflow

## Permanent branches

### `main`
Stable/release branch.

- No direct contributor pushes.
- No force pushes.
- No deletion.
- Changes require pull requests.
- Only the project owner or explicitly authorized release maintainers may update `main`.
- Normal releases come from `develop`.

### `develop`
Integration/testing branch.

- No direct contributor pushes.
- Normal features, fixes, docs, refactors, tests, and security improvements target `develop`.
- CI must pass once required checks are enabled.
- Review conversations must be resolved before merge.

## Branch naming

- `feature/<short-name>` for new features
- `fix/<short-name>` for normal bugs
- `hotfix/<short-name>` for urgent production fixes
- `security/<short-name>` for security changes
- `docs/<short-name>` for docs
- `refactor/<short-name>` for restructuring
- `test/<short-name>` for tests
- `chore/<short-name>` for tooling/config/dependencies

Examples:

```text
feature/tls-monitor
fix/duplicate-reminders
security/block-private-ip
docs/docker-install
refactor/resource-service
test/workspace-isolation
chore/update-dependencies
```

## Normal workflow

```text
Fork
 -> branch from latest develop
 -> make focused change
 -> test
 -> PR to develop
 -> CI + review
 -> merge to develop
 -> integration testing
 -> release PR develop -> main
 -> project owner merges
```

Do not open normal feature PRs directly against `main`.

## Commits

Use clear Conventional Commit-style messages:

```text
feat: add TLS expiry monitoring
fix: prevent duplicate reminders
docs: document Docker setup
test: add workspace isolation tests
security: block private network monitor targets
refactor: extract resource service
chore: update dependencies
```

Avoid messages such as `update`, `changes`, `final`, or `fix stuff`.

## Pull request requirements

A PR should explain:

- problem being solved;
- what changed;
- related issue;
- security impact;
- authorization/workspace impact;
- database migration impact;
- tests added or updated;
- documentation changes;
- screenshots for UI changes.

## Security

Contributors must follow:

- `SECURITY.md`
- `docs/SECURITY_ARCHITECTURE.md`
- `docs/AI_AGENT_INSTRUCTIONS.md`
- `docs/ENGINEERING_STANDARDS.md`

Never commit secrets, bypass workspace authorization, store third-party passwords, or make unrestricted network requests to user-supplied URLs.

Security vulnerabilities must be reported privately according to `SECURITY.md`.

## Database changes

Database changes require explicit migrations, tests, documentation where relevant, and a data-preservation/rollback plan for risky changes.

Never change production schema manually.

## Merge policy

### Into `develop`
Preferred method: **Squash and merge**.

### Into `main`
Normal path:

```text
develop -> main
```

Only the project owner or explicitly authorized release maintainer may merge.

### Hotfix

```text
main
 -> hotfix/<name>
 -> PR to main
 -> owner merge
 -> sync the fix back to develop
```

## CODEOWNERS

Recommended initial `.github/CODEOWNERS`:

```text
* @Adarshkumar76

/.github/ @Adarshkumar76
/SECURITY.md @Adarshkumar76
/LICENSE @Adarshkumar76
/docs/SECURITY_ARCHITECTURE.md @Adarshkumar76
/docs/AI_AGENT_INSTRUCTIONS.md @Adarshkumar76
```

## CI policy

Once required checks are configured, merges should require passing:

```text
lint
typecheck
unit tests
integration tests
build
security-sensitive tests
selected E2E tests
```

## Contributor checklist

- [ ] Correct branch name
- [ ] PR targets `develop` unless explicitly approved otherwise
- [ ] Focused change
- [ ] No secrets committed
- [ ] Authorization/workspace isolation reviewed
- [ ] SSRF/network implications reviewed where applicable
- [ ] Tests added or updated
- [ ] Migration added if needed
- [ ] Documentation updated
- [ ] Lint/type-check/tests/build pass
- [ ] Self-review completed

## Summary

```text
branch -> PR -> develop -> test -> release PR -> main
```

For `main`:

```text
no direct contributor push
no force push
no contributor merge
owner-controlled release merge
```
