# design/figcraft — FigCraft 보기용 사본

Claude Design 캔버스를 **인터넷·Claude 없이 로컬에서 편하게 보려고** FigCraft 문서(`.figcraft`) 하나로 모아 두는 방법이에요.

- **보기용이에요, 편집용이 아니에요.** 보드를 이미지로 그려서 프레임에 넣어요. 글자·도형은 편집할 수 없어요.
- **한 방향 동기화예요: 캔버스 → FigCraft.** 기준(source of truth)은 계속 Claude 캔버스(`design/canvas/`)이고, FigCraft에서 고친 내용은 캔버스로 돌아가지 않아요. 다시 돌리면 문서를 처음부터 새로 만들어서 같은 파일을 덮어써요(붙여 쓰지 않아요). 같은 입력이면 같은 내용이에요. 다만 Chrome이 그린 이미지가 보드 2~3개에서 아주 조금(픽셀 값 18~34/255, 점 몇 개) 다르게 나올 때가 있어서 파일이 바이트까지 같다고는 보장하지 않아요(세 번 돌려 두 번은 해시가 같았어요).
- **구성**: 페이지 4개(`00 개요` · `S 화면 · 참고 보드` · `C 캐릭터 (C01–C07)` · `L 기록 포함 (V1 이후)`), 프레임 38개(보드 하나 = 프레임 하나, 이름은 보드 id: `S06-main-dday`, `C07-vector-version` …). 밝게/어둡게·한/영/일 변형은 보드 안에 이미 격자로 놓여 있어서 그대로 보여요. 프레임은 캔버스처럼 한 줄에 4개씩 놓여요.
- **빠지는 것**: 1단계 인터랙티브 시안 `A`, `B`는 캔버스 실행 환경(`support.js`)이 있어야 해서 넣지 않았어요(캔버스에서 보세요). 보드의 움직임은 정지 프레임이에요.
- 매우 긴 보드(S06·S28 등 15,000px 이상)는 이미지 2~3장으로 나눠 같은 프레임에 이어 붙였어요(보이는 모습은 한 장이에요).

## 어디에 있나

- 만든 파일(로컬): `~/Documents/Aroom-design/aroom-design.figcraft`
- **저장소에는 `.figcraft` 파일을 넣지 않았어요**(크기가 15MB를 넘어요). 저장소는 공개이고 그림은 소유자가 생성형 AI 도구로 만든 마스코트 마스터에서 파생된 것이라(권리 상태는 `../mascot/README.md`), 큰 이미지 묶음을 올리지 않고 아래 스크립트로 언제든 다시 만들어요.

## 열기

FigCraft 앱(https://github.com/storytold/figcraft/releases, macOS는 `figcraft-<버전>-macos-universal.dmg`)에서 파일을 열면 돼요. 앱 없이 확인하려면 `figcraft-cli info <파일>`, `figcraft-cli export <파일> -o out.png --page "S 화면 · 참고 보드" --node S06-main-dday --scale 0.5`.

## 다시 동기화하기 (캔버스가 바뀐 뒤)

```
cd design/tools/figcraft-sync && npm ci
node sync-figcraft.mjs --cli /path/to/figcraft-cli          # → ~/Documents/Aroom-design/aroom-design.figcraft
```

필요한 것: Node 20+, Google Chrome(기본 경로 `/Applications/Google Chrome.app/…`, 다르면 `--chrome`), **공식 릴리스의 `figcraft-cli`**(아래), 인터넷(보드가 Google Fonts를 불러와요). 옵션: `--out`(출력 파일), `--scale`(기본 2, 선명도), `--quality`(기본 85), `--only S06,S28`(일부만, 시험용), `--work`(작업 폴더 유지). 스크립트는 `design/canvas/project/*.dc.html` + `canvas.json` 순서를 읽고, 보드의 마스코트 그림 주소(`/_blob/…`)는 `design/canvas/blob-map.json`으로 `design/mascot/` 파일에 이어요. 끝에 문서를 다시 열어 페이지·프레임 수를 세고 프레임 3개를 PNG로 내보내 보는 점검 결과를 JSON으로 출력해요.

## 도구와 한계

- **FigCraft**: storytold의 오픈소스(Rust) 디자인 앱, 라이선스 **MIT 또는 Apache-2.0**, **알파 단계**예요. 이 작업은 `figcraft-cli 0.11.2`(macOS universal, 공식 릴리스 `SHA256SUMS.txt`와 일치, Apple 서명)로 했어요. **바이너리는 저장소에 넣지 않아요**(공식 릴리스에서 받아 저장소 밖에 두세요). CLI는 HTML을 가져오지 못해서 이미지 경로를 택했어요.
- **이미지 해상도**: 기본 2배(WebP 품질 85). 아주 크게 확대하면 흐려져요(원본 벡터가 아니에요).
- **글꼴**: 이미지에 이미 그려져 있어서 FigCraft에 글꼴이 없어도 모양은 그대로예요(그릴 때 Chrome이 Google Fonts를 받아 와요. 오프라인에서 다시 돌리면 대체 글꼴로 그려져요).
- FigCraft 앱에서 실제로 열어 보는 것은 하지 못했어요. CLI로 다시 열기·내보내기만 확인했어요.
- 이 폴더의 동기화 도구는 보기용 사본을 위한 것이고, 캔버스의 Claude 전용 기능(편집, 재생, 댓글)은 옮기지 않아요.
