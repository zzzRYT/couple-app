# Couple-day presets

Couples get well-known couple days in their anniversary list. Two are built-in season days; eleven more are offered on the add screen. The optional preset registry lives in `public.anniversary_preset` and is mirrored by `apps/mobile/src/lib/anniversaryPresets.ts`; the original registry also retains the two historical IDs for compatibility. Design: V0-04 and V0-05 boards of the artifact (version `1794387715-f47d`).

None of these days is a public holiday. 부부의 날 is the only legal commemorative day (법정기념일, not a day off); the rest are informal commercial or pop-culture observances. The app shows them as anniversaries, never as holidays.

## Classification

A day is **built-in** when it is for romantic couples by definition and mainstream: it has its own encyclopedia article, every source reviewed agrees on its name and date, and it is observed beyond internet lists (several countries or national commercial scale). Only Valentine's Day and White Day pass this couple-day rule. Every other day is **optional**.

| id | Date | Built-in | Region label | ko (stored title) | en | ja | Status | Sources |
|---|---|---|---|---|---|---|---|---|
| `valentine` | 2/14 | yes | none | 발렌타인데이 | Valentine's Day | バレンタインデー | Informal, worldwide | [1] [5] [9] |
| `white` | 3/14 | yes | none | 화이트데이 | White Day | ホワイトデー | Informal, KR · JP · TW · CN | [1] [7] [8] |
| `diary` | 1/14 | no | Korea | 다이어리데이 | Diary Day | ダイアリーデー | Informal (14th-day series) | [1] [3] [4] [5] |
| `samgyeopsal` | 3/3 | no | Korea | 삼겹살데이 | Samgyeopsal Day | サムギョプサルデー | Informal food day, promoted by MAFRA | [2] [10] |
| `rose` | 5/14 | no | Korea | 로즈데이 | Rose Day | ローズデー | Informal (14th-day series) | [1] [3] [4] [5] |
| `married` | 5/21 | no | Korea | 부부의 날 | Married Couples Day | 夫婦の日 | Legal commemorative day since 2007 | [11] [12] |
| `kiss` | 6/14 | no | Korea | 키스데이 | Kiss Day | キスデー | Informal (14th-day series) | [3] [4] [5] |
| `silver` | 7/14 | no | Korea | 실버데이 | Silver Day | シルバーデー | Informal (14th-day series) | [1] [4] [5] |
| `wine` | 10/14 | no | Korea | 와인데이 | Wine Day | ワインデー | Informal (14th-day series) | [1] [4] [5] |
| `movie` | 11/14 | no | Korea | 무비데이 | Movie Day | ムービーデー | Informal; Orange Day is a variant | [4] [5] |
| `goodCouple` | 11/22 | no | Japan | 좋은 부부의 날 | Good Spouses Day | いい夫婦の日 | Informal, Japan | [13] |
| `hug` | 12/14 | no | Korea | 허그데이 | Hug Day | ハグデー | Informal; Money/Sock Day are variants | [4] [5] |
| `xmasEve` | 12/24 | no | none | 크리스마스 이브 | Christmas Eve | クリスマスイブ | Informal; Japan's main couples' night | [4] [14] |

Every row repeats yearly on a fixed solar date. 빼빼로데이 (11/11) and 크리스마스 (12/25) stay the built-in season rows.

Left out: 블랙데이 4/14 (a singles' day [6]), 그린데이 8/14 and 포토데이 9/14 (vague custom, disputed name), 칠석 (lunar 7/7 in Korea; rows store solar dates), 恋人の日 6/12 (industry promotion, little awareness), Sweetest Day (floating date), 커플데이/투투데이 2/22 (no reliable source), and food days that are not couple days (가래떡데이, 오이데이, 구구데이). The Japanese title for 6/14 is キスデー because Japan's own キスの日 is 5/23.

## Behaviour

- **Built-in days** (Valentine, White Day, Pepero Day and Christmas) are calculated on the client as season anniversaries, localized and treated like other season days for notifications and widgets. They do not require custom rows.
- **Existing rows.** The cleanup migration removes untouched previously seeded Valentine and White Day rows, including tombstones. Edited or user-created rows are preserved; a retained preset row takes precedence over its corresponding built-in day in the client. Optional preset IDs remain unique per space, including soft-deleted rows.
- **Optional days** appear as chips above the title on the add screen. A chip fills the localized title, the next date and yearly repeat; saving sends `presetId`. A day the couple already has is shown as 추가됨 and disabled. Adding the same preset again returns the existing row; adding one that was deleted revives it.
- **Names follow the reader.** A preset row whose title is still the stored Korean title shows in the reader's language everywhere (list, home, detail, widgets, notifications). A renamed row shows as written.

## Rollout

Apply the cleanup migration first, then deploy the spaces function, then release the mobile OTA. The function RPC signatures and optional preset API remain compatible with the previously shipped app. Between migration and OTA, older builds no longer see removed seeded days until updated; retained edited rows remain available. The migration stops both new-space seeding and the legacy seed function via the registry flags.

## Sources

1. korea.net, "Why the 14th day of each month in Korea is special" (2021): https://www.korea.net/NewsFocus/HonoraryReporters/view?articleId=200941
2. 농림축산식품부 보도자료, 삼겹살데이 돼지고기 할인 지원 (2026-03-01): https://www.mafra.go.kr/bbs/home/792/595202/download.do
3. 서울신문, 오늘은 '키스데이' (2006): https://www.seoul.co.kr/news/plan/2006/06/14/20060614026003
4. Korea Herald via Asia News Network, "Love on repeat" (2025): https://asianews.network/love-on-repeat-why-the-14th-of-every-month-is-special-day-for-lovers-in-korea
5. 경향신문, 톡톡튀는 N세대 기념일문화 (2001): https://www.khan.co.kr/article/200103051638111
6. Wikipedia, Black Day (South Korea): https://en.wikipedia.org/wiki/Black_Day_(South_Korea)
7. Wikipedia, White Day: https://en.wikipedia.org/wiki/White_Day
8. 위키백과, 화이트데이: https://ko.wikipedia.org/wiki/화이트데이
9. Wikipedia, Valentine's Day: https://en.wikipedia.org/wiki/Valentine%27s_Day
10. 농사로 (농촌진흥청), 3월 3일은 무슨 날?: https://www.nongsaro.go.kr/portal/ps/psb/psby/vodPlay.ps?mvpNo=2829
11. 위키백과, 부부의 날: https://ko.wikipedia.org/wiki/부부의_날
12. 위키백과, 대한민국의 기념일: https://ko.wikipedia.org/wiki/대한민국의_기념일
13. Wikipedia, Good Spouses Day: https://en.wikipedia.org/wiki/Good_Spouses_Day
14. Tokyo Tourism, Tokyo Christmas guide: https://www.tokyotourism.org/tokyo-christmas-guide/
