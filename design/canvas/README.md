# design/canvas — 캔버스 원본

Claude Design 캔버스의 프로젝트 파일을 그대로 내보낸 것이에요(`project/` 아래).

| 파일 | 내용 |
|---|---|
| `project/canvas.json` | 보드 배치·제목 인덱스 |
| `project/Main.dc.html` | 개요. 상단에 **최종 방향 A**와 이유를 적었고 아래는 1단계 기록 |
| `project/A.dc.html` | **A 손그림 따뜻함**(1단계 시안, 최종 방향) — 수정하지 않았어요 |
| `project/B.dc.html` | B 평면 도형 — **대체된 참고 시안**(삭제하지 않음) |
| `project/S00-overview.dc.html` ~ `S27-navigation.dc.html` | 단계 2 보드(화면 S01~S16, 마스코트 S17, 에셋 S18, 글꼴·토큰 S19, 접근성 S20, 긴 문구 S21, 컴포넌트 S22, 탭 S23~S26, 탭 구조 S27) |

- 각 `.dc.html`은 보드 하나의 전체 소스예요. 화면은 정적 마크업(인라인 스타일 + SVG)이라 브라우저에서 열어도 대부분 보여요. 다만 캔버스 런타임 스크립트(`support.js`)는 이 폴더에 없어서 편집·재생 기능은 Claude Design 안에서만 동작해요. 글꼴은 미리 보기용으로 Google Fonts를 불러와요(실제 앱은 번들).
- 화면은 이 저장소의 `design/` 문서와 같은 데이터에서 만들어져서 숫자(색·대비·키)가 일치해요.
- 보드 높이·위치는 렌더 측정값이에요.
