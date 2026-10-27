# aroomi-shape — 생성 오브젝트 검증기와 기준 렌더러

멤버가 프롬프트를 쓰면 Claude가 **방 배경 조각**, **말풍선 틀**, **작은 방 소품** 같은 작은 2D 장식을 만들어 줘요. 이 폴더는 그 결과를 안전하게 받는 쪽의 도구예요.

- 모델이 돌려주는 것은 **코드나 SVG 글이 아니라 데이터**(`aroomi-shape-v1` JSON 도형 목록)예요.
- 서버가 이 데이터를 **검증하고 정리(normalize)** 하고, 앱은 **검증이 끝난 데이터만** 그려요.
- 헌법 규칙: *모델이 만든 데이터는 절대 실행되는 코드가 아니다.* 그래서 형식 자체에 글자·이미지·참조·변형·그라디언트·투명도·애니메이션이 없어요.

앱 코드는 아니에요. 형식이 실제로 만들 수 있고 안전한지 보여 주는 **증거용 구현**이고, 앱의 Skia 렌더러가 맞춰야 할 **기준 렌더러**예요. 의존성은 없어요(Node 22, `node:` 내장 모듈만).

## 파일

| 파일 | 내용 |
|---|---|
| `validate.mjs` | `validateGeneratedObject(doc, options)`, `validateJsonText(text, options)`, 정리 함수 `normalizeGeneratedObject`, 상수(`LIMITS`, `PALETTE_ALLOWLIST`, `STYLE`, `ERROR_CODES`) |
| `render-svg.mjs` | `toSvg(doc, { background, surface, scale, pad })` 같은 입력은 항상 같은 바이트의 SVG |
| `cli.mjs` | `validate`, `render`, `check-samples`, `previews`, `contact-sheet`, `style-check` |
| `style-check.mjs` | 스타일 어림 점검(색 수·둥근 정도·윤곽선 비율·뾰족함)과 0~1 점수. 저작권 닮음은 **재지 않아요** |
| `test/` | `node:test` 테스트 164개 |
| 스키마 | `specs/001-couple-prompt-todo/contracts/generated-object.schema.json` (구조 부분만) |
| 샘플 | `specs/001-couple-prompt-todo/contracts/samples/generated-object/` (`valid/` 8개, `invalid/` 77개 + `_expectations.json`) |
| 기준 라이브러리 | `design/reference-library/` ([README](../../reference-library/README.md)) |

## 빠른 시작

```sh
# 검증 (잘못이면 코드와 위치를 보여 주고 종료 코드 1)
node design/tools/aroomi-shape/cli.mjs validate design/reference-library/objects/*.json

# 그리기 (낮 벽 위, 가장자리 12칸 여유, 2배)
node design/tools/aroomi-shape/cli.mjs render design/reference-library/objects/bg-round-rug.json /tmp/rug.svg --bg day --surface floor --pad 12 --scale 2

# 샘플 전체와 기준 라이브러리 확인
node design/tools/aroomi-shape/cli.mjs check-samples

# 미리 보기 SVG와 모아보기 PNG 다시 만들기 (PNG는 헤드리스 Chrome이 필요해요)
node design/tools/aroomi-shape/cli.mjs previews
node design/tools/aroomi-shape/cli.mjs contact-sheet

# 스타일 점검
node design/tools/aroomi-shape/cli.mjs style-check

# 테스트
node --test design/tools/aroomi-shape/test/
```

테스트 안내:

- Node 22는 디렉터리 인자를 모듈 경로로 보기 때문에 `test/index.js`가 `*.test.mjs`를 모두 불러와요. `node --test design/tools/aroomi-shape/test/*.test.mjs`(glob)도 같은 결과예요. **둘을 한 번에 섞어 쓰지는 마세요**(두 번 돌아요).
- JSON Schema와 검증기가 구조에서 같은 판단을 하는지 `ajv`로 교차 확인하는 테스트가 있어요. 이 저장소는 아무것도 설치하지 않으니, 이미 있는 `ajv/dist/2020.js` 경로를 `AJV_PATH`로 알려 주면 돌고 없으면 건너뛰어요.
  `AJV_PATH=/path/to/node_modules/ajv/dist/2020.js node --test design/tools/aroomi-shape/test/`

## 문서 형식 `aroomi-shape-v1`

모든 객체는 `additionalProperties:false`예요(모르는 키는 거절).

| 필드 | 규칙 |
|---|---|
| `schemaVersion` | 정수 `1` |
| `format` | 문자열 `"aroomi-shape-v1"` |
| `kind` | `"background_piece"`, `"bubble_frame"`, `"prop"` |
| `layerHint` | `background_piece`에 **필수**: `wall` `floor` `backdrop` `window_view`. `prop`에 **필수**: `floor` `wall` `shelf`(놓는 자리 힌트). `bubble_frame`에는 **금지**. 종류에 안 맞는 값은 `KIND_FIELDS`, 아예 모르는 값은 `SCHEMA_TYPE` |
| `label` | 1~24자. 한글·영문·가나·숫자·공백·`. , ' -` 만. URL 같은 글(`://` `www.` `.com`…), `@` `<` `>`, 연속 숫자 5개 이상(또는 숫자 합계 7개 이상), 제어 문자는 거절 |
| `viewBox` | `{w,h}` 정수, 각 32~512, 긴 변 128~512(**`prop`은 긴 변 64~256**). 원점은 항상 0,0 |
| `anchor` | `{x,y}` 0~1(앱이 놓을 때의 기준점) |
| `palette` | 채움색 1~4개, `#RRGGBB` **대문자**, 모두 앱 팔레트 허용 목록 안(아래). 윤곽선 색은 문서에 없어요 |
| `shapes` | 1~40개(**`prop`은 1~30개**). 아래 도형 |
| `textArea` `textFill` `tail` | `bubble_frame` 전용(`tail`만 선택). `background_piece`·`prop`에 있으면 거절 |

도형은 모두 `{t, fill, stroke, …}`예요. `fill`은 팔레트 번호(정수) 또는 `null`, `stroke`는 불리언(`true`면 윤곽선을 그려요). 둘 다 없는(`null` + `false`) 도형은 아무것도 안 그리니 거절해요.

| `t` | 필드 |
|---|---|
| `rect` | `x y w h` + 선택 `rx`(모서리 반지름, 최대 min(w,h)/2) |
| `ellipse` | `cx cy rx ry` |
| `poly` | `pts: [[x,y], …]` 3~24점, 항상 닫혀요 |
| `path` | `d` 문자열. **절대 좌표 대문자 `M L H V C Q Z`만**, 명령 뒤에 인자 개수를 정확히(암묵 반복 금지), 숫자는 소수 둘째 자리까지의 평범한 소수(지수·`NaN`·`Infinity`·앞의 `+`·`.5` 금지), `M`으로 시작, 600자·48명령 이하, 구분은 공백이나 쉼표 |

- 좌표는 `-8 ~ 크기+8`(8칸 번짐 허용), 소수 둘째 자리까지. 크기(`w h rx ry`)는 0보다 커야 해요. 도형의 경계 상자 전체가 이 범위 안이어야 해요(곡선은 제어점까지).
- **path 채움·윤곽선 규칙**: 채움(`fill`)은 열린 하위 경로도 끝점을 이어 닫아서 칠해요(SVG와 같아요). 윤곽선(`stroke`)은 `Z`가 있을 때만 닫혀요. 선만 그리려면 `fill:null, stroke:true`.
- 그리는 순서는 배열 순서예요(뒤가 위).
- 복잡도 `complexityScore = shapes + 경로명령수/4 + 다각형점수/6`이 60(`prop`은 45)을 넘으면 거절. 문서 전체는 12 KB(12288바이트) 이하.
- **`prop` 전용 규칙**: 배경보다 작은 한도(위 표), 글자 없음, 같은 팔레트·같은 납작한 채움. 바닥·선반 소품의 기준점은 스타일 사양에서 아래 가운데 (0.5, 1)로 정해요(검증기는 `anchor`의 값을 강제하지 않아요). 마스코트·캐릭터를 닮은 소품은 `PROP_FACE_LIKE`로 어림 점검해요:
  - *작고 어두운 타원 둘*(rx·ry가 각각 긴 변의 6% 이하, 채움 밝기 0.2 이하이거나 몸통 채움보다 0.25 이상 어둡거나, 채움 없이 윤곽선만 있는 것)이 *더 큰 몸통 도형의 경계 상자 안에서 나란히*(세로 위치 차이 6% 이하) 있고, 그 *아래에 짧은 곡선 path*(너비 몸통의 40% 이하, 높이 20% 이하, 눈 아래 가운데)가 있으면 눈 + 입으로 보고 거절해요.
  - **솔직한 한계: 이것은 거친 어림 점검이지 보증이 아니에요.** 눈을 하나만 그리거나, 눈 사이를 멀리 떼거나, 입을 곡선 아닌 모양으로 그리거나, 몸통을 쪼개면 지나가요. 반대로 단추 두 개 + 솔기 곡선처럼 얼굴이 아닌 물건이 걸릴 수 있어요. 마스코트 닮음은 프롬프트와 사람 검사(승인 체크리스트)가 책임져요. 이 점검은 `prop`에서만, 다른 검사가 모두 통과한 뒤에만 돌아요.
- `bubble_frame` 전용 규칙:
  - `textArea {x,y,w,h}`는 viewBox 안에 완전히 들어가고 너비 40% 이상, 높이 25% 이상.
  - `textFill`(팔레트 번호)은 글자 뒤에 깔리는 채움이고, 글자색 `#3A261C`와의 대비가 **4.5 이상**이어야 해요(WCAG 식).
  - `rect`/`ellipse`/`poly` 중 `fill == textFill`인 도형이 `textArea`를 **완전히 덮어야** 해요. path는 덮개가 될 수 없어요. 덮는지 잴 때는 `textArea`를 윤곽선 굵기의 절반만큼 부풀리고, 채움 어긋남만큼 민 자리도 함께 확인해요(윤곽선이 글자를 가로지르거나 채움이 모자라지 않게).
  - 덮개 **뒤에 그려지는** 도형은 `textArea`와 겹치면 안 돼요(같은 채움·윤곽선 없음은 예외, 눈에 안 띄어요). 겹침은 경계 상자로 보수적으로 재요.
  - `tail {x,y}`는 번짐 범위 안.

### 허용 팔레트

`design/tokens.json`의 `color.illustration.palette.*` 15색과 낮 방 벽·바닥 2색, 모두 17색이에요(이름과 값은 [style-spec.md](../../reference-library/style-spec.md)). `test/reference-library.test.mjs`가 이 상수와 토큰이 어긋나면 실패해요.

## 렌더링 규칙(기준)

기존 카탈로그 스케치 `design/assets-sketch/*.svg` 19개(모두 64×64)와 `assets-spec.md` §4를 재서 만든 규칙이에요. 긴 변을 `M = max(w,h)`라 할 때:

| 항목 | 비율 | 64칸 | 128 | 192 | 256 |
|---|---|---|---|---|---|
| 윤곽선 굵기 (`#4A3426`) | 3.75% × M | 2.4 | 4.8 | 7.2 | 9.6 |
| 크림 림 선 굵기 (`#FFF4DF`, 윤곽선 + 양쪽 1.7칸) | 9.0625% × M | 5.8 | 11.6 | 17.4 | 23.2 |
| 채움 어긋남 오른쪽·아래 | 2.03% × M, 1.56% × M | 1.3, 1.0 | 2.6, 2.0 | 3.9, 3.0 | 5.2, 4.0 |

그리는 순서(스케치와 같아요): **① 림**(윤곽선을 그리는 모든 도형을 크림색 채움+크림 선으로) → **② 도형마다** 채움(어긋남 적용) 다음에 윤곽선(끝·이음 둥글게). 윤곽선 없는(`stroke:false`) 도형에는 림이 없어요.

스케치 19개에서 잰 값: 윤곽선 67개 중 64개가 2.4, 안쪽 가는 선 3개가 1.8~2.0. 림 67개 중 63개가 5.8. 채움 어긋남은 48개 전부 `translate(1.3 1)`. 이 형식은 윤곽선을 한 가지 굵기로만 지원해요(가는 안쪽 선은 아직 없어요).

SVG 출력은 검증이 끝난 숫자·정리된 경로 문자열·허용 색만으로 만들어요. 요소는 `svg title rect ellipse polygon path`뿐이고 `script`·`href`·`style`·이벤트 속성은 없어요(테스트가 확인). 입력이 거절되는 문서면 `toSvg`는 던져요.

## 에러 코드

`result.errors[0]`이 **기본 코드**예요. 검사 순서는 고정이라 한 가지 잘못에는 한 가지 코드가 나와요: 가드(금지 키·구조 크기) → 바이트 크기 → 최상위 키 → `kind`/종류별 필드 → `label` → `viewBox` → `anchor` → `palette` → `shapes` → 복잡도 → (소품) 얼굴 어림 점검 → 말풍선 규칙. 텍스트 입구(`validateJsonText`)는 이보다 먼저 크기·BOM·문법·중복 키를 봐요.

| 코드 | 언제 | 샘플 예 |
|---|---|---|
| `JSON_SYNTAX` | JSON이 아니거나 BOM·후행 쉼표·깊이 8 초과·짝 없는 서로게이트·`1e999` | `json-bom`, `json-trailing-comma` |
| `JSON_DUPLICATE_KEY` | 같은 객체에 같은 키가 두 번(마지막이 이기는 해석 차이 방지) | `key-duplicate` |
| `SCHEMA_TYPE` | 타입이 틀림, 열거값 밖(`kind`, `layerHint`), `format`/`schemaVersion` 불일치, 비JSON 값·순환·접근자·깊이/크기 가드, `fill`에 문자열(`data:` URI·`url(#g)`) | `fill-data-uri`, `kind-unknown` |
| `SCHEMA_UNKNOWN_KEY` | 모르는 키(`opacity` `gradient` `transform` `href` 도형 키 포함) | `shape-key-opacity`, `top-level-unknown-key` |
| `SCHEMA_MISSING_KEY` | 필수 키 없음 | `missing-palette` |
| `FORBIDDEN_KEY` | `__proto__` `constructor` `prototype` 키(어느 깊이든). 있으면 다른 검사는 하지 않아요 | `key-proto`, `key-constructor` |
| `KIND_FIELDS` | 종류와 안 맞는 필드(배경·소품에 `layerHint` 없음/`textArea` 있음, 말풍선에 `layerHint` 있음/`textArea`·`textFill` 없음, 종류에 안 맞는 `layerHint` 값: 소품에 `backdrop`, 배경에 `shelf`) | `layerhint-on-bubble`, `prop-layerhint-backdrop`, `prop-missing-layerhint`, `prop-textarea` |
| `LABEL_INVALID` | 길이·글자 집합·URL·전화번호 꼴·`@<>`·제어 문자 | `label-script-markup`, `label-url-www` |
| `LIMIT_BYTES` | 12 KB 초과(텍스트는 받은 바이트 그대로, 파싱 전에 거절) | `json-oversize` |
| `LIMIT_SHAPES` | 도형 0개 또는 41개 이상(소품은 31개 이상) | `shapes-41`, `shapes-empty`, `prop-shapes-31` |
| `LIMIT_PATH` | 경로 600자 또는 48명령 초과 | `path-too-long`, `path-too-many-commands` |
| `LIMIT_POINTS` | 다각형 점 3개 미만 또는 24개 초과 | `poly-too-many-points` |
| `COMPLEXITY` | `complexityScore` > 60(소품 45) | `complexity-too-high`, `prop-complexity-too-high` |
| `SHAPE_TYPE` | 모르는 도형 종류(`text` `image` `use` …) | `shape-type-text`, `shape-type-use` |
| `SHAPE_INVISIBLE` | `fill:null`이고 `stroke:false` | `shape-invisible` |
| `PATH_COMMAND` | 허용 밖 명령(호 `A`, 소문자 상대, `S` `T`) | `path-arc`, `path-smooth-s` |
| `PATH_NUMBER` | 지수, `NaN`/`Infinity`, 소수 셋째 자리 이상, `.5`/`+5` | `path-exponent`, `path-nan` |
| `PATH_SYNTAX` | `M`으로 시작 안 함, 인자 부족·남음, 이상한 글자, 숫자 붙여 쓰기 | `path-no-m-start` |
| `RANGE_COORD` | 좌표·`anchor`·`tail`이 범위 밖이거나 소수 셋째 자리 이상, 경계 상자가 번짐 밖 | `coord-1e9`, `bubble-tail-out-of-range` |
| `RANGE_SIZE` | `viewBox`가 범위 밖(소품은 긴 변 64~256), `rx`가 한계 밖 | `viewbox-too-large`, `prop-viewbox-300` |
| `ZERO_AREA` | 크기 0 이하, 넓이 0인 다각형·경로 | `shape-zero-area-rect` |
| `PALETTE_NOT_ALLOWED` | 허용 목록 밖 색, `#RRGGBB` 대문자 꼴이 아님 | `palette-near-black`, `palette-neon` |
| `PALETTE_COUNT` | 팔레트 0개 또는 5개 이상, 중복 색 | `palette-five-colors` |
| `PALETTE_INDEX` | `fill`/`textFill` 번호가 팔레트 밖이거나 정수가 아님 | `fill-index-out-of-range` |
| `BUBBLE_TEXTAREA` | `textArea`가 viewBox 밖이거나 40%×25%보다 작음 | `bubble-textarea-outside` |
| `BUBBLE_COVER` | `fill == textFill`인 rect/ellipse/poly 덮개가 없거나 모자람, 덮개 뒤 도형이 글자 자리를 가림 | `bubble-cover-path-only`, `bubble-cover-overdrawn` |
| `BUBBLE_CONTRAST` | 글자색 `#3A261C` 대비 4.5 미만 | `bubble-contrast-dark-fill` |
| `PROP_FACE_LIKE` | `prop`이 눈 둘 + 입 모양을 가짐(위의 어림 점검) | `prop-face-like` |

`FORBIDDEN_KEY`·`JSON_*`·`LIMIT_BYTES`처럼 가드에서 걸리는 코드는 그 자리에서 끝내요. `errors`는 최대 50개까지 모아요(`options.maxErrors`).

## 한도 표

| 항목 | 한도 | 상수 |
|---|---|---|
| 문서 크기 | 12288바이트 | `LIMITS.maxBytes` |
| 도형 수 | 1~40(소품 1~30) | `maxShapes`, `propMaxShapes` |
| 경로 | 600자, 48명령 | `maxPathChars`, `maxPathCommands` |
| 다각형 점 | 3~24 | `polyMinPoints`, `polyMaxPoints` |
| 복잡도 | 60(소품 45) | `maxComplexity`, `propMaxComplexity` |
| 팔레트 | 1~4색 | `paletteMax` |
| `label` | 1~24자 | `labelMaxChars` |
| `viewBox` | 각 32~512, 긴 변 128~512(소품 64~256) | `viewMin` `viewMax` `longSideMin` `propLongSideMin` `propLongSideMax` |
| 좌표 번짐 | 8칸, 소수 2자리 | `bleed`, `decimals` |
| 글자 영역 | 너비 40%, 높이 25% 이상, 대비 4.5 이상 | `textAreaMinW` `textAreaMinH` `minContrast` |
| JSON 깊이·노드 수 | 8단계, 객체 2000개 | `maxDepth`, `maxNodes` |

## 서버에서 쓰는 법

```js
import { validateJsonText } from './validate.mjs';

// modelOutput: the raw text the model returned. Pull out the single JSON value first
// (strip a ```json fence if the model added one): that step is the server's job, the validator stays strict.
const res = validateJsonText(modelOutput, { normalize: true });
if (!res.ok) {
  // log res.errors[0].code and path; show the member a generic "try another description" message.
  // Never echo model text, error messages built from model text, or raw JSON back to the client.
  return { status: 'rejected', reason: res.errors[0].code };
}
// Store and send ONLY res.normalized (canonical key order, rounded numbers, canonical path strings).
save(res.normalized);
```

권장 흐름:

1. 모델 출력에서 JSON 한 덩어리를 꺼낸다(서버).
2. `validateJsonText`(크기·BOM·중복 키·금지 키 → 구조 → 규칙). 실패면 거절하고 한 번만 자동 재시도할지 정책으로 정한다.
3. 통과하면 `normalized`만 저장·전송한다. 원문 텍스트는 저장하지 않아요.
4. 클라이언트(Skia)는 이 데이터를 **같은 규칙 표**로 그려요. 클라이언트도 최소한 형식 가드(알려진 도형 종류·숫자 범위)를 다시 걸어요. `toSvg`와 바이트 단위로 같을 필요는 없고 도형·색·굵기·순서가 같으면 돼요.
5. 사용자에게 보이는 글(`label`)은 일반 텍스트로만 그려요(HTML·마크다운으로 해석하지 않아요).

## 알려진 한계

- **스타일과 저작권은 검증하지 않아요.** 검증기는 안전(코드·참조 없음)과 형식·색·대비만 봐요. 기존 작품을 닮은 모양이 나올 수 있어요. 그것은 출시 전 승인 절차(`design/reference-library/approval-checklist.md`)의 일이에요.
- 말풍선 덮개 검사는 경계 상자로 보수적이에요. 덮개 뒤에 그린 곡선 장식의 경계 상자가 글자 자리와 겹치면 실제로는 안 겹쳐도 `BUBBLE_COVER`가 나와요(덮개를 마지막에 그리거나 장식을 먼저 그려요).
- 윤곽선 굵기는 한 가지예요. 스케치의 가는 안쪽 선(1.8~2.0칸)은 표현할 수 없고, 필요하면 v2에서 도형별 `thin` 같은 값을 더해야 해요.
- 큰 배경 조각은 긴 변에 비례해 윤곽선도 두꺼워져요(192칸이면 7.2칸). 앱이 배경 조각을 화면 폭 전체로 키워 놓으면 굵게 보일 수 있어서 놓는 크기를 정해야 해요.
- 객체 입구(`validateGeneratedObject`)는 `JSON.parse`가 만든 평범한 객체를 가정해요. 접근자·Proxy·순환 구조는 막지만(Proxy는 감지하지 못하고 평범한 객체로 읽어요) 가장 안전한 입구는 텍스트 입구예요.
- JSON Schema는 구조만 담아요. 팔레트 허용 목록·좌표 범위·경로 문법·복잡도·말풍선 규칙은 검증기에만 있어요(스키마 `description`에 목록이 있어요).
- 성능: 허용되는 가장 큰 문서의 검증은 약 0.15 ms, 12 KB 텍스트 약 0.14 ms(이 기계 기준, 테스트가 50 ms 미만을 확인).
