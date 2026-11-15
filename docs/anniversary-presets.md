# Couple-day presets

Couple relationship days are built-in season anniversaries. Other playful days are optional and can be shown together or added individually. The preset registry lives in `public.anniversary_preset` and `apps/mobile/src/lib/anniversaryRegistry.ts`; historical IDs remain in the database for compatibility.

None of these days is a public holiday.

## Classification

The split uses the sources below and asks whether the day celebrates the relationship itself or primarily a product or activity. The latter remain optional even where couples often celebrate them together.

| Date | Day | Group | Reason |
|---|---|---|---|
| 1/14 | 다이어리데이 | playful | Exchanging diaries centers a product [1] [3]. |
| 2/14 | 발렌타인데이 | built-in | A widely recognized day for romantic partners [1] [9]. |
| 3/3 | 삼겹살데이 | playful | A food promotion rather than a relationship observance [2] [10]. |
| 3/14 | 화이트데이 | built-in | A reciprocal romantic gift day [1] [7]. |
| 5/14 | 로즈데이 | built-in | Roses express affection between partners [1] [3]. |
| 6/14 | 키스데이 | built-in | Celebrates affection between partners [3] [4]. |
| 7/14 | 실버데이 | playful | Silver jewelry and gifts are the focus [1] [4]. |
| 10/14 | 와인데이 | playful | Drinking wine is the activity [1] [4]. |
| 11/14 | 무비데이 | playful | Watching a film is the activity [4] [5]. |
| 12/14 | 허그데이 | built-in | Celebrates affection between partners [4] [5]. |
| 12/24 | 크리스마스 이브 | playful | A general holiday evening, also used for dates [4] [11]. |

Every row repeats yearly on a fixed solar date. 빼빼로데이 (11/11) and 크리스마스 (12/25) stay the built-in season rows.

Left out: 블랙데이 4/14 (a singles' day [6]), 그린데이 8/14 and 포토데이 9/14 (vague custom, disputed name), 칠석 (lunar 7/7 in Korea; rows store solar dates), 恋人の日 6/12 (industry promotion, little awareness), Sweetest Day (floating date), 커플데이/투투데이 2/22 (no reliable source), and food days that are not couple days (가래떡데이, 오이데이, 구구데이). The Japanese title for 6/14 is キスデー because Japan's own キスの日 is 5/23.

Married-couple days (부부의 날 5/21, いい夫婦の日 11/22) are left out because Aroom is for couples before marriage. Both were offered until 2026-11; their rows stay in `anniversary_preset` with `offered = false`, so anniversaries couples already added keep their `preset_id`, title and date and show the stored title, while new adds with those ids are rejected.

## Behaviour

- **Built-in days** (the relationship days above, Pepero Day and Christmas) are calculated on the client as season anniversaries, localized and treated like other season days for notifications and widgets. They do not require custom rows.
- **Existing rows.** The cleanup migration removes untouched previously seeded Valentine and White Day rows, including tombstones. Edited or user-created rows are preserved; a retained preset row takes precedence over its corresponding built-in day in the client. Previously optional relationship-day rows were user-created, so all of them are retained. Preset IDs remain unique per space, including soft-deleted rows.
- **Playful days** are hidden by default. The list switch displays them locally for the current person and space on this device; it does not create rows or schedule reminders, and does not change the partner’s view. They also appear as chips above the title on the add screen. A chip fills the localized title, the next date and yearly repeat; saving sends `presetId`. A day the couple already has is shown as 추가됨 and disabled. Adding the same preset again returns the existing row; adding one that was deleted revives it.
- **Notifications and widgets.** Built-ins use the existing season preference and notification limit; switching season notifications off suppresses all of them. The playful list switch affects only the list, not notifications or widgets. Individually added playful rows follow custom notification and widget rules.
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
11. Tokyo Tourism, Tokyo Christmas guide: https://www.tokyotourism.org/tokyo-christmas-guide/
