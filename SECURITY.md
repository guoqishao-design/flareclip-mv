# Security policy

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Report it
privately to support@flareclip.com with:

- the affected file or component;
- steps to reproduce;
- the potential impact; and
- any suggested mitigation.

Do not send credentials, API keys, private media, or other sensitive data.

## Scope

This project renders trusted local source files and media. It is not designed
to process untrusted web pages or execute untrusted JavaScript. Chrome's
sandbox is enabled by default; the optional `--no-sandbox` flag should be used
only in a trusted, isolated CI or container environment.

Do not run code, binaries, commands, or workflows supplied through an issue or
pull request until their full diff and provenance have been reviewed. External
contributors cannot push directly to the protected `main` branch.

Only the latest release and the current `main` branch receive security fixes.
