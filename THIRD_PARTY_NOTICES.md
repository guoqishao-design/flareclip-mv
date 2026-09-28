# Third-party notices

This project uses the following third-party software and fonts. Each component
remains subject to its original license.

| Component | Version | License |
|---|---:|---|
| p5.js | 2.3.4 | LGPL-2.1 |
| p5.brush | 2.2.3 | MIT |
| Puppeteer Core | 25.x | Apache-2.0 |
| Fredoka font | 5.x package | SIL Open Font License 1.1 |
| Permanent Marker font | 5.x package | Apache-2.0 |

The npm dependency tree and resolved versions are recorded in
`package-lock.json`.

`vendor/p5.brush.js` is a locally patched copy of p5.brush 2.2.3. Its canvas
bounds check was adjusted because the upstream check does not account for the
camera and canvas transforms used by this renderer. The MIT license text is
included at `vendor/p5.brush.LICENSE.md`.

No changes are made to the p5.js package itself; it is installed from npm.
