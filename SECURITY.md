# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| `main` (pre-1.0) | ✅ |
| Tagged releases (`v*`) | ✅ latest tag only |

## Reporting a vulnerability

**Do not open a public issue for security problems.**

Email the maintainer privately, or use GitHub’s private vulnerability reporting:

1. Open https://github.com/arun-prasad-t/npp-x/security/advisories/new  
2. Describe the issue, impact, and steps to reproduce  
3. Include affected OS / build if relevant  

We aim to acknowledge reports within **72 hours** and share a remediation plan or fix timeline after triage.

## Scope notes

- Themes and plugins installed from file/URL run with the privileges the app grants. Treat third-party packages as untrusted.
- Browser / static-hosted builds are demos: they are not a hardened multi-tenant web product.
- Native Tauri builds have filesystem access via OS dialogs — report sandbox escapes or unintended FS access.

## Safe harbor

Good-faith research that follows this policy and avoids privacy harm / service disruption is welcome.
