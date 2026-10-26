# design/icon — 모피루 앱 아이콘

모피(Mopi)의 얼굴이 들어간 앱 아이콘 후보 3개와, 추천안의 제작용 파일 세트예요. **새 그림을 만들지 않았어요.** 모든 그림은 이미 있는 마스코트 파일(`../mascot/harmonized/mascot_wave_main@3x.png`)을 자르고, 크기를 바꾸고, 평평한 바탕색 위에 올린 거예요. 아이콘 안에는 글자가 없어요.

## 출처와 권리

- 이 아이콘은 **소유자가 생성형 AI 대화 도구로 만든 마스코트 마스터**(`../mascot/source/`)에서 파생됐어요. 권리 상태는 마스코트와 같아요: 마스터를 그대로 쓰기로 했고, 약한 저작권 보호 위험은 소유자가 받아들였고, 닮음 검사·법률 검토는 출시 전 권장이에요(출시를 막지 않아요). 자세한 내용은 `../handoff.md` §10.4, `../assets-spec.md` §8.1.
- 앱 아이콘은 스토어에서 가장 눈에 띄는 얼굴이라서 위 권장 항목(닮음 검사·법률 검토)이 아이콘에도 그대로 적용돼요. 아이콘용으로 따로 만든 그림은 없어요.
- 앱 이름 "모피루"의 상표·스토어 이름 사용 가능 여부는 아직 확인 전이에요(`../handoff.md` §16).

## 후보 3개 (1024×1024, 불투명 PNG, 알파 없음, 모서리는 둥글게 자르지 않음)

| 후보 | 파일 | 구성 | 바탕색(`tokens.json`) |
|---|---|---|---|
| A | `candidates/icon-candidate-A-1024.png` | 머리와 어깨띠, 넉넉한 여백 | 종이색 `#FBF1E3` (앱 밝은 배경) |
| **B (추천)** | `candidates/icon-candidate-B-1024.png` | 얼굴을 크게, 머리 윤곽이 바탕색 안에 떠 있음 | 브랜드 강조색 `#B24A24` (앱 밝은 primary) |
| C | `candidates/icon-candidate-C-1024.png` | 전신(포즈 전체), 크림 테두리가 도드라짐 | 밤색 `#2B2320` (앱 어두운 배경) |

**추천: B.** 이유 — ① 얼굴이 가장 크게 들어가서 작은 크기에서도 눈 두 개·볼터치·머리 모양이 남아요(아래 점검). ② 브랜드 강조색 바탕이라 밝은 배경화면과 어두운 배경화면 모두에서 아이콘 경계가 분명해요(A는 밝은 배경에서 바탕이 묻혀요). ③ 크림 테두리(림)가 머리 윤곽을 바탕에서 띄워 줘서 방향 A의 스티커 느낌이 그대로예요. C는 전신이라 29px에서 얼굴을 알아보기 어려워서(점검 결과 "실패") 후보로만 남겼어요.

## 추천안(B)의 제작용 파일

Expo 설정 파일 이름과 맞춘 파일은 `expo/`에 있어요.

| 용도 | 파일 | 크기 | 비고 |
|---|---|---|---|
| iOS 기본(light) · Expo `icon` | `expo/icon.png` | 1024 | 불투명 RGB, 알파 없음 |
| iOS 어두운 변형(dark) | `expo/icon-dark.png` | 1024 | 같은 그림 + 밤색 바탕 |
| iOS 색조 변형(tinted) | `expo/icon-tinted.png` | 1024 | 회색조 + 검은 바탕(시스템이 색을 입혀요) |
| iOS 크기별 | `ios-sizes/icon-{1024,180,167,152,120,87,80,76,60,58,40,29,20}.png` | 위 크기 | light. dark·tinted는 1024·180·120·60·40·29만 |
| Android adaptive 전경 | `expo/adaptive-icon-foreground.png` | 1024(108dp) | 투명 배경. 머리·얼굴이 안전 영역 안, 몸은 아래로 잘림 |
| Android adaptive 배경 | `expo/adaptive-icon-background.png` | 1024 | 단색 `#B24A24` (`backgroundColor`와 같은 값) |
| Android monochrome(테마 아이콘) | `expo/adaptive-icon-monochrome.png` | 1024 | 그림의 어두운 선(윤곽·눈·입)만 한 색으로, 투명 배경 |
| 스플래시 | `expo/splash-icon.png` | 1024 | 포즈 전체(투명). 배경색은 `app.json` |
| 파비콘 | `expo/favicon.png` | 48 | 웹 |
| 스토어 등록용 | `store/play-store-512.png` | 512 | Google Play 등록 아이콘(불투명). App Store용은 `expo/icon.png` 1024 |
| 웹 192 | `store/web-192.png` | 192 | |
| 점검용 그림 | `preview/legibility-sheet.png`, `preview/candidates-sizes.png`, `preview/android-layers.png` | | 아래 점검 |
| 점검 수치 | `legibility-report.json` | | 도구가 잰 값 |

## Expo 설정에 연결하기 (예시)

```jsonc
{
  "expo": {
    "icon": "./assets/icon/icon.png",
    "ios": {
      // iOS 18의 어두운·색조 아이콘. 지원 형식은 Expo 버전에 따라 달라서 현재 문서로 확인
      "icon": {
        "light": "./assets/icon/icon.png",
        "dark": "./assets/icon/icon-dark.png",
        "tinted": "./assets/icon/icon-tinted.png"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon/adaptive-icon-foreground.png",
        "backgroundColor": "#B24A24",
        "monochromeImage": "./assets/icon/adaptive-icon-monochrome.png"
      }
    },
    "web": { "favicon": "./assets/icon/favicon.png" },
    "plugins": [
      ["expo-splash-screen", {
        "image": "./assets/icon/splash-icon.png",
        "imageWidth": 200,
        "backgroundColor": "#FBF1E3",
        "dark": { "backgroundColor": "#2B2320" }
      }]
    ]
  }
}
```

`design/icon/expo/`의 파일을 앱의 `assets/icon/`으로 복사해 쓰면 돼요(경로는 예시이고 구현 때 정해요). `adaptiveIcon`에 배경 이미지(`adaptive-icon-background.png`)를 쓰는 방식도 있지만 단색이라 `backgroundColor`로 충분해요. 위 설정 키와 형식은 Expo의 현재 문서로 다시 확인하세요(verify against current Expo docs).

## 적용한 규칙 (모두 verify against current store rules)

- **Apple**: 1024×1024 PNG, 불투명(알파 없음), 모서리는 시스템이 둥글게 자르니 직접 자르지 않음, 글자·사진 피함, sRGB. iOS 18의 어두운·색조 변형은 같은 그림으로 만들었어요(색조는 회색조 + 검은 바탕).
- **Google Play / Android**: adaptive 아이콘 레이어는 108dp(여기서는 1024px). 마스크가 가운데 72dp만 보여 주고, 안전 영역은 지름 66dp(= 레이어의 약 61% = 626px). 요청한 "66%"(676px)도 함께 만족하도록 머리·얼굴을 626px 원 안에 뒀어요. 테마 아이콘용 monochrome 레이어는 알파만 쓰이니 한 색으로 만들었어요. Play 등록 아이콘은 512×512 불투명 PNG.
- 글자 없음, 그림자·광택·그라데이션 덧입히기 없음(마스코트 규칙 `../assets-spec.md` §4.2와 같아요).

## 얼마나 알아볼 수 있나 (점검 결과)

`preview/legibility-sheet.png`: 밝은·어두운 배경화면 타일 위에 1024→180·120·60·40·29px(실제 크기와 4배 확대), iOS 마스크, Android 원형·스쿼클·둥근 사각 마스크로 그렸어요. `legibility-report.json`은 눈·입이 주변 피부색과 얼마나 구분되는지를 수치로 잰 값이에요.

| 후보 | 60px | 40px | 29px |
|---|---|---|---|
| A | 통과 | 통과 | 경계(입이 흐려짐) |
| **B** | 통과 | 통과 | 통과(눈·볼·머리 모양은 분명, **입은 가는 선이라 흐려요**) |
| C | 통과 | 경계 | **실패**(얼굴이 안 보여요) |

솔직한 결론: B는 29px에서도 "눈 두 개 + 볼터치 + 둥근 머리 + 파란 어깨띠"로 모피라는 것을 알아볼 수 있지만, 웃는 입 선은 흐려져요(눈의 대비는 약 8.6:1, 입은 약 2.8:1). 20px(iOS 알림 아이콘 크기)는 단정하지 않아요. 얼굴 세부(입)가 너무 작아지는 문제가 있어서 이미 확대 비율을 키운(후보 B의 0.66배) 구성이고, 더 키우면 머리 윤곽이 잘려요.

## 한계

- 수치와 미리 보기는 도구와 헤드리스 렌더로 확인한 것이고, **실제 기기(홈 화면, 알림, 설정, 스토어 목록)에서는 확인하지 못했어요.**
- 어두운·색조 변형과 monochrome(테마 아이콘)은 같은 그림에서 앱 쪽이 만든 대용품이고, 시스템이 실제로 어떻게 칠하는지는 못 봤어요.
- adaptive 전경은 몸이 아래로 잘려 나가는 구성이라 launcher 마스크에 따라 잘리는 모양이 달라져요(원형·스쿼클·둥근 사각 미리 보기 참고).
- 스플래시는 포즈 전체를 그대로 쓴 안이에요(필요하면 다른 구성으로 바꿀 수 있어요).
- 상표·스토어 이름·도메인·bundle ID 확인, 마스코트 닮음 검사·법률 검토는 아직이에요.

## 다시 만들기

```
python3 design/tools/make-icon.py --rec B      # Pillow, NumPy 필요
```

후보 구성(크기 비율, 바탕색)은 도구 안 `CANDIDATES`에 있어요. 추천안을 바꾸려면 `--rec A|B|C`.
