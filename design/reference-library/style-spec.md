# style-spec.md — 생성 오브젝트 스타일 사양 (방향 A · 손그림)

> **상태: 자리표시 스케치 기준이에요.** 이 문서의 모양 규칙은 기존 카탈로그 스케치(`design/assets-sketch/*.svg`)와 `design/assets-spec.md` §4를 재서 정리했고, 기준 오브젝트 10개는 이 프로젝트를 위해 그린 자리표시 그림이에요. 최종 그림은 소유자·일러스트레이터 승인이 필요해요([approval-checklist.md](approval-checklist.md)).

모델이 만드는 오브젝트는 세 가지뿐이에요: **방 배경 조각**(`background_piece`), **말풍선 틀**(`bubble_frame`), **작은 방 소품**(`prop`). 형식과 검증 규칙은 [`design/tools/mopi-shape/README.md`](../tools/mopi-shape/README.md)에 있고, 여기는 **어떻게 보여야 하는지**(스타일)를 정해요. 형식은 안전을, 스타일은 일관된 분위기를 지켜요. 둘 다 통과해야 좋은 결과예요.

## 1. 허용 팔레트 (채움색)

채움색만 문서에 적어요. 윤곽선과 림은 렌더러가 고정색으로 그려요. 모두 `design/tokens.json`과 같고(테스트가 확인), 이 17색 밖은 검증기가 거절해요(`PALETTE_NOT_ALLOWED`). 에셋 하나에 **4색 이하**, 되도록 **3색 이하**예요.

| 이름 | `id` | HEX | 글자색(#3A261C)과 대비 | 말풍선 글자 받침으로 |
|---|---|---|---|---|
| 복숭아 | peach | `#F4B79B` | 8.20 | 가능 |
| 버터 | butter | `#F7D98B` | 10.35 | 가능 |
| 세이지 | sage | `#A8C6A0` | 7.63 | 가능 |
| 진한 세이지 | sage2 | `#8FB68A` | 6.26 | 가능 |
| 하늘 | sky | `#AACBE2` | 8.38 | 가능 |
| 진한 하늘 | sky2 | `#8DB6D2` | 6.62 | 가능 |
| 분홍 | pink | `#F2A7B4` | 7.44 | 가능 |
| 장미 | rose | `#E88A9B` | 5.79 | 가능 |
| 크림 | cream | `#FFF4DF` | 13.07 | 가능(가장 안전) |
| 테라코타 | terra | `#D98B63` | 5.31 | 가능 |
| 나무 | wood | `#C99A6B` | 5.64 | 가능 |
| 얼음 | ice | `#E6F0F7` | 12.33 | 가능 |
| 연보라 | lav | `#C9B8E8` | 7.81 | 가능 |
| 아쿠아 | aqua | `#9ED8CB` | 8.91 | 가능 |
| 짙은 갈색 | dark | `#7A5C48` | **2.34** | **안 돼요**(검증기가 `BUBBLE_CONTRAST`로 거절) |
| 낮 방 벽 | roomDayWall | `#FBF1E3` | 12.75 | 가능 |
| 낮 방 바닥 | roomDayFloor | `#F3E0C4` | 11.04 | 가능 |

- 되도록 쓰지 않아요: `dark`(어두운 면, 글자 받침 불가). 방 벽·바닥색과 같은 색은 방에 묻혀서 배경 조각의 몸통 색으로는 심심해요(포인트 정도로).
- 색 계열(따뜻함 · 초록 · 파랑 · 보라)은 **세 가지 이하**로 맞춰요(`style-check`가 세요. 크림·얼음처럼 채도 낮은 색은 세지 않아요).

## 2. 윤곽선 · 림 · 채움 어긋남 (재서 정한 값)

기존 스케치 19개(64×64)에서 재고, 문서 크기에 비례하도록 한 규칙이에요. 긴 변을 `M = max(w,h)`라 해요.

| 항목 | 규칙 | 스케치에서 잰 값 | 64 | 128 | 160 | 192 | 256 | 512 |
|---|---|---|---|---|---|---|---|---|
| 윤곽선 `#4A3426` | 굵기 = **3.75% × M**, 끝·이음 둥글게 | 67개 중 64개가 2.4칸(안쪽 가는 선 3개 1.8~2.0) | 2.4 | 4.8 | 6.0 | 7.2 | 9.6 | 19.2 |
| 크림 림 `#FFF4DF` | 선 굵기 = **9.0625% × M** (= 윤곽선 + 양쪽 1.7칸, 즉 바깥으로 2.66% × M) | 67개 중 63개가 5.8칸 | 5.8 | 11.6 | 14.5 | 17.4 | 23.2 | 46.4 |
| 채움 어긋남 | 오른쪽 **2.03% × M**, 아래 **1.56% × M** | 48개 전부 (1.3, 1.0)칸 | 1.3 / 1.0 | 2.6 / 2.0 | 3.25 / 2.5 | 3.9 / 3.0 | 5.2 / 4.0 | 10.4 / 8.0 |

- 이 비율은 `tokens.json`의 `color.illustration.fillOffsetRatio`(0.0203, 0.0156)와 `outline`/`rim` 색과 같아요.
- 그리는 순서: ① **림**(윤곽선을 그리는 모든 도형) → ② 도형마다 **채움**(어긋남 적용) 다음에 **윤곽선**. 윤곽선 없는 도형(`stroke:false`)에는 림이 없어요.
- 림 대비(재서 확인): 윤곽선 `#4A3426`은 낮 벽 `#FBF1E3`에서 10.38:1이지만 밤 벽 `#2B2320`에서는 1.33:1이라 안 보여요. 그래서 크림 림이 밤 벽에서 14.12:1(밤 바닥 `#352A25`에서 12.76:1)로 모양을 읽히게 해요. 기준 오브젝트의 밤 미리 보기에서 확인할 수 있어요(`previews/*.night.svg`, `contact-sheet.png`).
- 윤곽선은 이 형식에서 **한 가지 굵기**예요. 큰 조각은 긴 변에 비례해 두꺼워져요. 그래서 작은 무늬는 윤곽선 굵기의 3배(M의 11% 안팎) 아래로 그리지 않아요.

## 3. 채움 규칙 (납작하게)

- 도형 하나는 **한 가지 색**으로 납작하게 칠해요. 그라디언트·그림자·광택·질감·투명도는 형식에 없어요(`assets-spec.md` §4.4).
- 하이라이트는 크림색 작은 면 하나까지.
- 큰 바탕 면은 윤곽선을 그려요(윤곽선으로 둘러싼 스티커 느낌). 안쪽의 점·줄무늬·작은 장식은 `stroke:false`로 두면 인쇄된 무늬처럼 보여요. 기준 오브젝트에서는 가장 큰 도형이 항상 윤곽선이 있고, 면적 기준 윤곽선 비율이 0.65 이상이에요.

## 4. 모양 언어

- 둥글고 부드럽고 **유기적인** 모양. 곡선(`C`, `Q`), 타원, `rx`가 있는 사각형을 먼저 써요.
- 손으로 그린 듯 **살짝 어긋난 비율**: 완벽한 원·정사각형·완전 대칭 대신 반지름과 간격에 ±1~3% 흔들림. 같은 오브젝트 안에서는 같은 정도로 흔들어요.
- **뾰족한 가시 금지.** 꼭짓점 각이 60도 아래가 되는 모양, 별 모양 폭발, 톱니, 날카로운 삼각형은 쓰지 않아요. 말풍선 꼬리도 곡선으로 부드럽게 말아요.
- 큰 도형 몇 개로 단순하게. 도형은 16개 이하가 편안하고(상한 40), 모든 세부는 긴 변의 11% 이상이에요.
- 가장자리 8칸은 비워 둬요(검증기가 허용하는 번짐이 8칸이라 윤곽선·림이 잘리지 않게).

## 5. 크기 · 기준점 표

문서 크기는 긴 변 128~512예요. 아래는 **권장 크기**고 기준 오브젝트의 값이에요.

| 종류 | `layerHint` | 권장 `viewBox` | 기준점 `anchor` | 기준 오브젝트 |
|---|---|---|---|---|
| 배경 조각 | `wall` (벽에 붙는 무늬·띠·장식) | 128×128 패치, 192×80 띠 | 가운데 (0.5, 0.5). 위에서 늘어지는 장식(가랜드)은 위 가운데 (0.5, 0) | `bg-stripe-band`, `bg-polka-patch`, `bg-dot-garland` |
| 배경 조각 | `floor` (바닥에 놓는 러그·매트) | 192×112 안팎(원근을 준 납작한 타원) | 가운데 (0.5, 0.5) = 바닥에 닿는 자리의 중심 | `bg-round-rug` |
| 배경 조각 | `backdrop` (가장 뒤: 하늘·구름 띠) | 192×96 | (0.5, 0.4) | `bg-cloud-band` |
| 배경 조각 | `window_view` (창문과 창밖 풍경) | 160×128 | 가운데 (0.5, 0.5) | `bg-window-hills` |
| 소품 | `floor` (바닥에 놓는 쿠션·작은 탁자) | 96~160 안팎(긴 변 64~256) | **아래 가운데 (0.5, 1)** = 바닥에 닿는 자리 | `prop-cushion-stack`, `prop-round-side-table` |
| 소품 | `shelf` (선반 위에 올리는 책 더미·화분류) | 96~160 안팎 | 아래 가운데 (0.5, 1) = 선반 면에 닿는 자리 | `prop-book-stack` |
| 소품 | `wall` (벽에 거는 모빌·액자류) | 96~160 안팎 | 위 가운데 (0.5, 0) = 거는 점 | `prop-star-mobile` |
| 말풍선 | (없음) | **128×96** | **꼬리 끝** 위치를 0~1로 (꼬리가 위로 가면 위쪽 값) | `bubble-*` 4개 |

- **소품**은 배경보다 작아요: 긴 변 64~256(권장 96~160), 도형 30개 이하(권장 8개 이하), 복잡도 45 이하(기준 소품은 모두 18 미만), 텍스트·`textArea`·`tail` 없음, 팔레트는 같은 17색. 한 장면에는 객체를 16개까지만 둘 수 있고 **소품도 그 16개에 들어가요**(마스코트 1개 포함).
- 소품은 앱이 배치할 때 `layerHint`로 자리를 정해요: `floor`는 바닥, `shelf`는 선반 위, `wall`은 벽. 바닥·선반 소품은 아래 가운데가 기준점이라 그림의 발이 `anchor`에 닿게 그려요(바닥 소품의 아랫면은 납작한 타원이나 둥근 직사각형).
- 배경 조각은 256 안팎까지 키워도 돼요. 윤곽선이 굵어지니(256칸 9.6칸) 세부를 그만큼 크게 그려요.
- 말풍선의 `tail`은 꼬리 끝 좌표예요. 앱이 말풍선을 말하는 대상 쪽에 놓을 때 쓰는 기준과 일치시켜요(`anchor`가 같은 자리).

## 6. 구성 규칙

- 채움 4색 이하(권장 3색), 도형 40개 이하(권장 16개 이하), 경로 600자·48명령 이하, 복잡도 60 이하(기준 오브젝트는 모두 25 미만).
- 그리는 순서: 뒤에서 앞으로. 몸통 → 안쪽 면 → 무늬 → 포인트. 겹치는 도형의 윤곽선은 뒤에 그려진 도형의 채움이 덮어요.
- 가장 큰 도형은 `stroke:true`. 모든 도형이 윤곽선일 필요는 없어요.
- 가장자리에서 8칸 안으로 모으고 바깥 번짐에는 림이 닿을 정도만 써요.
- 색은 대비로 구분해요: 이웃한 면은 서로 다른 팔레트 색 + 윤곽선.

## 7. 말풍선 규칙

| 항목 | 규칙 |
|---|---|
| 크기 | `viewBox` 128×96 권장 |
| 글자 영역 `textArea` | 너비 40% 이상, 높이 25% 이상, viewBox 안. 기준: 기준 오브젝트는 너비 42~59%, 높이 27~38% |
| 글자 받침 `textFill` | 글자색 `#3A261C`와 대비 4.5 이상(`dark`만 안 돼요). 기준 오브젝트의 대비: 크림 13.07, 얼음 12.33, 버터 10.35 |
| 덮개 | `fill == textFill`인 `rect`/`ellipse`/`poly`가 `textArea`를 완전히 덮고, 그 위에 그려지는 도형은 글자 자리와 겹치지 않아요. 덮을 때는 윤곽선 굵기의 절반 + 채움 어긋남만큼 여유를 줘요(128칸 말풍선에서 사방 약 5칸) |
| 구름·물결 가장자리 | 몸통은 `path`로 그리고, 같은 색의 `ellipse`/`rect`를 `stroke:false`로 **그 위에** 얹어 덮개로 써요(`path`는 덮개가 될 수 없어요). 덮개는 몸통 윤곽선 안쪽에 두어 윤곽선을 가리지 않게 해요 |
| 꼬리 | 곡선으로 말아 둥글게. 꼬리를 **먼저**, 몸통을 그다음에 그려요(몸통이 꼬리 뿌리를 덮어 이음새가 깔끔해요) |
| 모서리 | 둥글게(`rx`는 짧은 변의 약 1/4 이상) |
| 장식 | 리본·하트·점 같은 작은 장식은 **마지막에**, 글자 영역 밖에서만 |
| 글자 | 도형으로 글자를 그리지 않아요(글자는 앱이 `textArea`에 써요) |

## 7a. 소품 규칙

| 항목 | 규칙 |
|---|---|
| 종류 | 쿠션 더미, 작은 탁자, 모빌, 책 더미, 화분 받침, 작은 선반 장식처럼 **흔하고 일반적인 방 물건**만 |
| 모양 | §4와 같아요(둥글고 유기적, 가시 없음). 한눈에 읽히는 단순한 실루엣 |
| 크기 | 긴 변 96~160 권장(64~256 허용). 윤곽선이 3.75%라 세부는 긴 변의 11% 이상 |
| 색 | 3색 이하 권장, 같은 17색 팔레트 |
| 기준점 | 바닥·선반 소품은 아래 가운데(0.5, 1), 벽 소품은 위 가운데(0.5, 0) |
| 얼굴·캐릭터 | **금지.** 눈·입·볼 같은 얼굴 요소, 눈코입이 있는 물건(웃는 쿠션·표정 있는 해), 사람·동물 모양, 앱 마스코트(달걀·감자 모양 몸통, 점 눈, 분홍 볼, 파란 어깨띠, 노란 별 핀)나 앱 안의 어떤 캐릭터와도 닮은 모양 |
| 글자·브랜드 | 글자·숫자·로고·브랜드·상표 모양 금지(책등에도 글자를 쓰지 않아요) |
| 수량 | 장면의 객체 16개 한도에 포함 |

**`PROP_FACE_LIKE` 검증(어림 점검, 보증 아님):** 검증기는 `prop`에서 *작고 어두운 타원 두 개가 나란히 있고 그 아래에 짧은 곡선이 있는 도형 묶음*(눈 두 개 + 입)이 하나의 더 큰 몸통 안에 있으면 거절해요. 눈 조건은 긴 변의 6% 이하 타원이고, 채움이 어둡거나(밝기 0.2 이하) 몸통 채움보다 뚜렷하게 어둡거나 윤곽선만 있는 경우예요. 눈을 점 하나로 그리거나, 눈과 입을 다른 모양으로 나타내거나, 눈 두 개를 서로 멀리 떼어 놓거나, 몸통을 도형 여러 개로 나누면 **빠져나갈 수 있어요.** 또 단추 두 개 + 아래 솔기 곡선처럼 얼굴이 아닌 물건이 걸릴 수도 있어요. 이 점검은 가장 흔한 실수만 막는 얇은 방어선이고, 마스코트·캐릭터를 닮지 않았는지는 프롬프트 지시와 승인 체크리스트의 사람 검사가 책임져요.

## 8. DO / DON'T

**DO**

- 둥근 몸통 + 꼬리: 타원 몸통(`C`로 이은 살짝 일그러진 원) + 곡선 꼬리, 하트 하나를 모서리에 얹기 → `bubble-round-tail.json`
- 큰 면 하나 + 작은 무늬: 윤곽선 있는 하늘색 패치에 윤곽선 없는 크림 점 8개 → `bg-polka-patch.json`
- 같은 계열 2~3색: 테라코타·크림·복숭아로 만든 러그 → `bg-round-rug.json`
- 줄무늬는 물결치듯 살짝 휘게(`C`로 그린 얇은 막대), 가장자리는 살짝 일그러지게 → `bg-stripe-band.json`
- 구름 몸통은 `Q`로 부풀린 `path` + 같은 색 타원 덮개 → `bubble-cloud.json`
- 가랜드의 줄은 `fill:null, stroke:true`인 열린 `Q` 곡선, 구슬은 살짝 다른 크기의 타원 → `bg-dot-garland.json`
- 소품은 납작한 바닥면이 있는 단순한 실루엣, 같은 계열 색 2~3개: 겹쳐 쌓은 쿠션 → `prop-cushion-stack.json`, 작은 둥근 탁자 → `prop-round-side-table.json`
- 벽 소품은 거는 점(위 가운데)에서 줄로 이어 내려오게, 별은 모서리를 둥글게 → `prop-star-mobile.json`
- 선반 소품은 아래를 납작하게, 책은 글자 없이 색 띠만 → `prop-book-stack.json`

**DON'T** (각각 `examples-dont/`에 형식은 맞지만 스타일이 어긋난 예가 있어요 — 아래 §10)

- 무지개처럼 4가지 색 계열을 섞기 → `dont-01-rainbow-confetti.json`
- 톱니·별 모양 폭발 말풍선, 정수 좌표로 찍은 완전 대칭 가시 → `dont-02-spiky-burst.json`
- 윤곽선이 없는 납작한 덩어리(림도 없어서 밤 벽에서 사라져요) → `dont-03-no-outline.json`
- 작은 네모를 격자로 촘촘히 깔기(도형 37개, 모서리 직각, 완전 규칙적) → `dont-04-clutter-grid.json`
- 소품에 점 눈 두 개와 작은 입을 그리기, 몸통을 달걀·감자 모양으로 만들고 볼을 칠하기(마스코트를 닮아요 — `PROP_FACE_LIKE`가 일부만 막아요)
- 그 밖에 하지 않는 것: 그림자·광택·그라디언트 흉내(작은 도형을 겹쳐 명암 만들기), 반투명처럼 보이려고 연한 색 덧칠하기, 윤곽선 대신 어두운 면으로 모양 잡기, 팔레트에 없는 색을 근사한 색으로 쓰기, 도형 수를 늘려 사진처럼 그리기

## 9. 범위 밖 (그리지 않아요)

- 캐릭터와 **마스코트(모피)를 닮은 것**: 달걀·감자 모양 몸통에 점 눈과 분홍 볼, 파란 어깨띠, 노란 별 핀 같은 조합. 앱 안의 다른 캐릭터도 마찬가지예요. 마스코트는 소유자가 제공한 고정 에셋이고 모델이 만들지 않아요(소품이 마스코트 곁에 놓이므로 특히 소품에서 조심해요).
- 얼굴(눈·코·입이 있는 모든 것, 동물·해 달 얼굴 포함), 사람·동물 실루엣.
- **로고·브랜드·상표 모양**, 글자·숫자·기호, QR·바코드 같은 무늬, 상표권이 있는 물건의 윤곽(특정 회사 캐릭터·신발·가방·과일 모양 로고 등).
- 사진, 실제 장소·작품을 따라 그린 것, 외부 이미지를 조각낸 것.
- 선정적이거나 폭력적이거나 정치·종교 상징.

이 목록은 프롬프트와 승인 검사에 같이 들어가요. 검증기는 이것을 **판단하지 못해요**(모양의 뜻은 코드로 알 수 없어요). 승인 체크리스트의 사람 검사와 프롬프트 지시가 방어선이에요.

## 10. 스타일 어긋남 예시 (`examples-dont/`)

네 개 모두 **형식은 올바른**(검증기 통과) 문서예요. 라벨이 `DONT …`로 시작해요. 부정 예시(프롬프트에 "이렇게 하지 마"로 보여 주기)나 적대적 스타일 테스트로 써요.

| 파일 | 어긴 규칙 | `style-check` 지표 | 결과 |
|---|---|---|---|
| `dont-01-rainbow-confetti.json` | §1 색 계열 3가지 이하: 분홍·세이지·하늘·연보라 4계열(채움 4색) | 계열 4, 점수 0.84 | 실패 `HUE_FAMILIES` |
| `dont-02-spiky-burst.json` | §4 뾰족한 가시 금지, 완전 대칭·정수 좌표: 24점 별 폭발 `poly` | 둥근 비율 0, 뾰족한 꼭짓점 2, 점수 0.69 | 실패 `NOT_ROUNDED` |
| `dont-03-no-outline.json` | §2·§3 가장 큰 도형은 윤곽선 필수(림도 없어서 밤 벽에서 사라짐) | 윤곽선 비율 0, 점수 0.75 | 실패 `NO_OUTLINE` |
| `dont-04-clutter-grid.json` | §4 도형 16개 이하 · 직각 대신 둥글게 · 규칙적 격자 금지: 사각형 37개 | 도형 37, 둥근 비율 0, 점수 0.60 | 실패 `TOO_MANY_SHAPES` `NOT_ROUNDED` |

모아보기: `contact-sheet-dont.png`.

### 스타일 점검 도구 `style-check.mjs`

`node design/tools/mopi-shape/cli.mjs style-check`로 기준 오브젝트와 `examples-dont`를 한 번에 재요.

| 지표 | 뜻 | 통과 기준 |
|---|---|---|
| `fillsUsed` | 실제로 쓰인 채움색 수 | 3 이하 만점, 4는 감점 |
| `hueFamilies` | 따뜻함·초록·파랑·보라 중 몇 계열인가(채도 낮은 색 제외) | 3 이하(넘으면 하드 실패) |
| `shapes` | 도형 수 | 16 이하 만점, 30 초과 하드 실패 |
| `roundedRatio` | 곡선 도형의 비율(타원 1, `rx`가 있는 사각형 1, `poly` 0, path는 곡선 명령 비율) | 0.7 이상 만점, 0.4 미만 하드 실패 |
| `outlineCoverage` | 윤곽선이 있는 도형의 경계 상자 넓이 비율 | 0.6 이상 만점, 0.3 미만 하드 실패. 가장 큰 도형이 윤곽선이 있어야 해요 |
| `spikes` | 곧은 선이 만드는 60도 미만 꼭짓점 수 | 0 만점, 3 이상 하드 실패 |

점수는 가중 평균(둥근 정도·윤곽선 2배, 나머지 1배)이고 **0.9 이상 + 하드 실패 없음**이면 통과예요. 측정값(이 저장소 기준): 기준 오브젝트 10개는 모두 통과(최저 0.94 `bg-window-hills`, 나머지 1.00), 스타일 어긋남 4개는 모두 실패(0.60~0.84). 점수만으로도 갈려요(최저 기준 0.94 > 최고 어긋남 0.84).

**한계**: 이것은 *스타일이 집 그림에 가까운가*만 어림으로 재요. 기존 작품·상표와 *닮은지*는 재지 않아요. 통과해도 닮은 그림일 수 있고, 실패해도 법적으로 문제없는 그림일 수 있어요. 지표는 이 10개 + 4개에 맞춰 정한 어림값이라(작은 표본) 새 종류의 오브젝트에는 임계값을 다시 봐야 해요.

## 11. 모델 프롬프트용 요약 (영문 원문)

생성 프롬프트에 그대로 넣는 요약이에요(번역하지 않고 영문으로 두는 이유: 모델에게 주는 지시문이라서예요). 크기는 [README.md](README.md)의 표에 있어요.

<!-- PROMPT-SUMMARY-BEGIN -->
You draw ONE small flat 2D decoration as JSON in format "mopi-shape-v1". Output a single JSON object only: no prose, no markdown fence.
kind is "background_piece" (also needs layerHint: wall|floor|backdrop|window_view), "bubble_frame" (also needs textArea{x,y,w,h}, textFill, optional tail{x,y}) or "prop" (a small room object; also needs layerHint: floor|wall|shelf; viewBox longer side 64..256, typically 96-160; at most 30 shapes; anchor (0.5,1) for floor and shelf props, (0.5,0) for hanging wall props).
Fields: schemaVersion 1, format "mopi-shape-v1", kind, [layerHint], label (1-24 chars; letters, digits, space and . , ' - only; never URLs, @ or phone numbers), viewBox{w,h} integers 32..512 (longer side 128..512; background pieces 128-256, bubbles 128x96), anchor{x,y} 0..1, palette [1-4 uppercase hex fill colors], shapes [1-40 shapes drawn in order].
Every shape has "fill" (palette index or null) and "stroke" (true draws the outline). Shape types: rect{x,y,w,h,rx?} ellipse{cx,cy,rx,ry} poly{pts:[[x,y],...] 3-24 points} path{d}. In d use ONLY absolute M L H V C Q Z, plain decimals with at most 2 decimals, start with M, at most 48 commands and 600 chars. Nothing else exists: no text, image, use, gradient, opacity, transform, filter, clip, animation, script or link.
Coordinates stay inside -8..size+8 with at most 2 decimals. The app adds a dark-brown outline and a cream rim to stroke:true shapes, so never draw outlines yourself.
Palette (only these): peach #F4B79B, butter #F7D98B, sage #A8C6A0, sage2 #8FB68A, sky #AACBE2, sky2 #8DB6D2, pink #F2A7B4, rose #E88A9B, cream #FFF4DF, terra #D98B63, wood #C99A6B, ice #E6F0F7, lav #C9B8E8, aqua #9ED8CB, dark #7A5C48, wall #FBF1E3, floor #F3E0C4.
Style: warm hand-drawn sticker look. Flat pastel fill, one color per shape, 3 colors preferred (4 max), colors from at most 3 families. The biggest shape always has stroke:true; small inner dots or stripes may use stroke:false. Soft rounded organic outlines (C/Q curves, ellipses, rects with rx), slightly irregular proportions, no sharp spikes, no perfect geometry or grids. Few big shapes (16 or fewer); no detail smaller than about 11% of the longer side; keep 8 units of margin.
Bubbles: textArea at least 40% of the width and 25% of the height, inside the viewBox. textFill must be a fill with contrast of at least 4.5 against #3A261C (never dark). A rect, ellipse or poly with fill == textFill must contain the textArea plus about 4% of the longer side of margin (a path cannot be the cover); for cloud or scalloped edges draw the path body, then a same-color ellipse or rect with stroke:false inside it as the cover. Draw the tail first, the body next, small decorations last and away from the textArea. Round tails with curves.
Never draw: characters, faces (no eyes, mouths or cheeks on props), mascot lookalikes (egg-shaped body with dot eyes, blue sash, yellow star pin), logos, brands, letters, numbers, QR-like patterns, trademarked object silhouettes, photos.
<!-- PROMPT-SUMMARY-END -->

## 12. 구현 상수 (`validate.mjs`의 `STYLE`)

```
outline #4A3426, rim #FFF4DF
outlineRatio 2.4/64, rimStrokeRatio 5.8/64, offsetXRatio 1.3/64, offsetYRatio 1/64
room day wall #FBF1E3 floor #F3E0C4, night wall #2B2320 floor #352A25
```

값이 바뀌면 `test/reference-library.test.mjs`가 `tokens.json`·스케치와 어긋난 곳에서 실패해요.
