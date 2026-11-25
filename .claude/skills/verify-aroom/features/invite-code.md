# Invite code

Until a partner joins, home shows a card with the 8-character invite code, its expiry, copy and share buttons, and a link for the other direction ("상대에게 코드를 받았어요").

## Sub-features

- `invite-card` shows "상대가 코드를 넣으면 연결돼요" with the code read letter by letter.
- `invite-copy` copies the code and confirms "복사했어요".

## How to get to it (user POV)

- Open home in a space that has no partner yet.
- Design page: `design/pages/space/invite-create/page.md`.

## Driving it with aroom.mjs

Preconditions:

- The app is on home after the Home D+Day recipe, in a space with one member.

- **Card and copy.** Run `node .claude/skills/verify-aroom/aroom.mjs drive invite-code`. Every step ends `COMPLETED`: the card and the code label "초대 코드 …, 글자 하나씩 읽어요" are visible, and tapping "코드 복사" shows "복사했어요".
- **Proof.** Run `node .claude/skills/verify-aroom/aroom.mjs shot invite-code/01-copied` right after the flow, while the confirmation shows.

## Gotchas

- The code boxes are separate letters; match the card's accessibility label, not the letters.
- 2026-11-01's two-simulator test saw the waiting screen instead of the code after "새 코드 만들기". The first code now shows on the invite screen and on home; reissuing is not in this recipe yet.
- Joining with the code needs a second signed-in user on a second simulator, which this CLI does not drive yet.
