# Contributing safely

Contributions are welcome through pull requests. The repository follows a
zero-trust review model: code from a fork, dependency update, generated file,
or vendored file is untrusted until the repository owner has reviewed it.

## Rules

1. Never commit credentials, tokens, personal data, private media, `.env`
   files, browser profiles, or machine-specific absolute paths.
2. Never ask maintainers to run an opaque binary or a script downloaded from
   a pull request, comment, issue, or external URL.
3. Do not add telemetry, network access, post-install scripts, shell command
   construction, or dynamic code execution without an explicit explanation
   and focused review.
4. Keep `package-lock.json` in sync with `package.json`. Dependencies must
   resolve from the official npm registry.
5. Vendored changes must state the upstream URL, exact version, license, and
   local patch. Minified-file-only changes will not be accepted without a
   reproducible source or patch.
6. Do not place final renders or frame caches in Git. Use GitHub Releases for
   approved release artifacts.
7. Run `npm audit --omit=dev`, the three-second benchmark, and
   `git diff --check` before requesting review.

Pull requests require review by `@guoqishao-design`. Automated workflows are
not used to execute pull-request code.

Report suspected vulnerabilities privately according to `SECURITY.md`.
