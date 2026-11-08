# Account deletion web page (T157, FR-074)

The page Google Play asks for next to the in-app path, and the one to enter in the Data safety form. It lives in this repository at `site/delete-account/` (Korean), `site/en/delete-account/` and `site/ja/delete-account/`, and is served at `https://aroom.jinjinstar.com/delete-account` once the owner connects the domain (see `site/README.md`). The legal wording (G1, G18) is still open; the draft banner was removed before App Store submission.

Policy behind the text: `specs/001-couple-prompt-todo/spec.md` Decided 41-51 (owner accepted the recommendations on 2026-10-29). Account deletion hard-deletes the person's spaces at once (no 30-day wait on this path only), keeps no profile shell, offers no export, and keeps only content-free report fingerprints. Ending a space or disconnecting still keeps data internally for 30 days.

## Page content

The HTML in the three languages is the source. Each page has the same four parts: deleting in the app (Settings → Account → Delete account, "I understand", sign in again with Apple), what is deleted right away (auth account, profile, pending invite codes, and the space with its start date and custom anniversaries, with no retention period), what remains (a one-time nameless notice for the partner, and operational records without personal information), and what to do without the app (write to the public support email; the operator confirms by replying to the sign-up address). Room, photo, decoration, prompt and AI consent wording returns only with V1.

## Out-of-app request procedure

The operator steps are in `docs/operator-review-runbook.md` ("Account deletion requests from outside the app").
