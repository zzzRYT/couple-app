# design/mascot — 마스코트 파일

소유자가 **생성형 AI 대화 도구로 만든** 캐릭터 시트(점토 질감의 달걀 모양 캐릭터, 파란 어깨띠와 노란 별 핀; 도구 이름·날짜·프롬프트는 owner to supply)에서 포즈를 오리고, 방향 A로 가볍게 다듬은 파일이에요.
**최종 그림은 확정 전이고, AI 생성 원본이라 저작권 보호가 불확실해서 법률 검토가 필요해요**(`../handoff.md` §10.4, `../assets-spec.md` §8.1). 이름은 **모피(Mopi)** 예요(일본어 モピ는 제안, `../handoff.md` §16). 한국어 '모피'는 털가죽이라는 뜻도 있어 확인이 필요한 주의점이 있어요.

| 폴더/파일 | 내용 |
|---|---|
| `source/mascot-source.png` | 제공된 캐릭터 시트 원본(1536×1024). 출처 증빙으로 그대로 보존 |
| `cutouts/` | 포즈 11개의 투명 컷아웃(원본 해상도, 가공 없음) + `cutout-report.json`(체크섬) |
| `cutouts-fx/` | 시트에 있던 떠 있는 표식(별·하트·움직임 선·zzz) 컷아웃 6개. 아직 화면에서 쓰지 않아요 |
| `harmonized/` | 방향 A로 가볍게 다듬은 파일: `mascot_{pose}.png`(@1x) `@2x` `@3x` + `harmonize-report.json`(매개변수·파일별 선 굵기·체크섬·도구 버전) |
| `contact-sheet.png` | 11포즈 원본 vs 가공본(낮·밤 배경) |
| `before-after.png` | 주 포즈 + 작은 포즈 3개를 높이 200·96·48px로, 낮 벽·밤 벽·어두운 앱 면 위에서 비교 |

캔버스의 **캐릭터 섹션**(C01 개요 · C02 제스처 시트 · C03 팔레트·해부·규칙 · C04 배경·크기 · C05 하모나이즈 vs 원본)이 이 폴더의 파일을 보여 줘요. 화면에서는 방 장면의 기본 오브젝트와 온보딩 히어로 1개에만 써요(`../handoff.md` §10.5).

포즈 id: `wave_main`(서서 손 흔들기) `cheer` `lookup` `walk` `lie` `sleep` — 방 안 사용 제안 6종 / `star_sit` `box` `heart` `phone` `back` — 방 밖 일러스트 5종.

## 다시 만들기

```
python3 design/tools/cutout-mascot.py --sheet design/mascot/source/mascot-source.png --out design/mascot
python3 design/tools/harmonize-mascot.py --in design/mascot/cutouts --out design/mascot/harmonized
python3 design/tools/mascot-sheets.py --mascot design/mascot
```

필요한 것: Python 3.9+, numpy, scipy, Pillow, opencv-python(-headless). 라이브러리가 기본 위치에 없으면 `MASCOT_LIBS=/path/to/site-packages`.
시트가 바뀌면 `cutout-mascot.py`의 포즈 상자(`FIG`, `FX`)를 `--list-components`로 다시 확인해요. 컷아웃을 최종 일러스트(같은 포즈 id, 투명 PNG)로 바꾸고 두 번째 명령만 다시 돌리면 같은 룩이 적용돼요.

## 가공 방법(요약)

실루엣·비율·얼굴·색 계열·어깨띠·별 핀은 그대로, 바닥 그림자 제거, 음영을 색 영역마다 3~4톤의 납작한 면으로 정리(볼터치 유지), 갈색 윤곽선(그림 긴 변의 3.75%, 크기에 비례) + 어긋난 채움(1.0% / 0.8%) + 크림 림(2.7%) + 약한 선 굵기 흔들림. 자세한 값은 `harmonized/harmonize-report.json`, 가공 전후와 한계는 캔버스 S17 보드와 `../handoff.md` §10.2.
