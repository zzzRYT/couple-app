# Aroom public site

Static HTML, CSS and a small shared contact script; no build step. The privacy and deletion copy is a draft based on the current specifications, not a finalized policy. Legal review, the public support email (G10), and the external deletion request verification and response process (G18) must be resolved before relying on these pages for launch. Account deletion and other described app features are planned and must be implemented and verified before release.

## Cloudflare Pages setup

- Project: `aroom-site`; production branch: `main`.
- Build command: none. Use the repository root as the root directory and `site` as the build output directory. Alternatively, if the Pages root directory is set to `site`, use `/` as the output directory.
- Add custom domain `aroom.jinjinstar.com` in Pages. At Gabia, point CNAME `aroom` to `aroom-site.pages.dev`. Domain activation and DNS are managed separately from this repository.

## Contact and copy

Set `supportEmail` in `contact.js` to the approved public address. It fills every contact line; the HTML retains a visible placeholder when JavaScript is unavailable. Update those fallback placeholders too when the address is approved so the contact is accessible without JavaScript. Review the external request instructions in all three languages when the process is approved. Update all localized pages together after policy review.

Pages: `/`, `/support/`, `/privacy/`, `/delete-account/`; English under `/en/` and Japanese under `/ja/` with the same paths. Preview with `python3 -m http.server --directory site 8000`.
