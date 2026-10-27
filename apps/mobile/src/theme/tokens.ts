// Generated from design/tokens.json by tools/tokens/build-tokens.mjs.
export const tokens = {
  "$comment": "Direction A (warm hand-drawn). Generated from the design source; values mirror the canvas. Hex colors are sRGB.",
  "version": "2.0.0",
  "direction": "A",
  "color": {
    "room": {
      "day": {
        "wall": "#FBF1E3",
        "floor": "#F3E0C4",
        "line": "#4A3426",
        "frame": "#C99A6B",
        "sky": "#E6F0F7",
        "sun": "#F7D98B",
        "star": "#F7D98B",
        "glass": "#FFF8EC"
      },
      "night": {
        "wall": "#2B2320",
        "floor": "#352A25",
        "line": "#E8D3BC",
        "frame": "#7A5C48",
        "sky": "#2F3050",
        "sun": "#F7D98B",
        "star": "#FFF4DF",
        "glass": "#3A2F2A"
      }
    },
    "app": {
      "light": {
        "normal": {
          "bg": "#FBF1E3",
          "surface": "#FFF8EC",
          "surface2": "#F3E0C4",
          "text": "#3F2D22",
          "text2": "#6B5444",
          "primary": "#B24A24",
          "onPrimary": "#FFFFFF",
          "line": "#4A3426",
          "border": "#8A6B55",
          "divider": "#E3CDB0",
          "danger": "#A3341C",
          "dangerBg": "#FBE3DC",
          "onDanger": "#FFFFFF",
          "success": "#3C6B45",
          "successBg": "#E4F0DE",
          "warn": "#7A4F00",
          "warnBg": "#FFEFC4",
          "info": "#2D5E86",
          "infoBg": "#E1EDF5",
          "focus": "#2D5E86",
          "bw": 2
        },
        "highContrast": {
          "bg": "#FFFAF2",
          "surface": "#FFFFFF",
          "surface2": "#F5E7D2",
          "text": "#1F140D",
          "text2": "#4A3426",
          "primary": "#8A2F10",
          "onPrimary": "#FFFFFF",
          "line": "#1F140D",
          "border": "#1F140D",
          "divider": "#8A6B55",
          "danger": "#8A1F10",
          "dangerBg": "#FBE3DC",
          "onDanger": "#FFFFFF",
          "success": "#27502F",
          "successBg": "#E4F0DE",
          "warn": "#5E3C00",
          "warnBg": "#FFEFC4",
          "info": "#1D4A6E",
          "infoBg": "#E1EDF5",
          "focus": "#1D4A6E",
          "bw": 3
        }
      },
      "dark": {
        "normal": {
          "bg": "#2B2320",
          "surface": "#352B26",
          "surface2": "#40342E",
          "text": "#F7EBDD",
          "text2": "#CDB8A5",
          "primary": "#F0A67F",
          "onPrimary": "#2B1A12",
          "line": "#E8D3BC",
          "border": "#A58E7B",
          "divider": "#4A3D36",
          "danger": "#FF9A82",
          "dangerBg": "#4A2219",
          "onDanger": "#2A0A06",
          "success": "#9CD0A3",
          "successBg": "#26372A",
          "warn": "#F7D98B",
          "warnBg": "#40361A",
          "info": "#9CC6E4",
          "infoBg": "#25364A",
          "focus": "#9CC6E4",
          "bw": 2
        },
        "highContrast": {
          "bg": "#1A1411",
          "surface": "#241C18",
          "surface2": "#33281F",
          "text": "#FFF6EA",
          "text2": "#EBD9C5",
          "primary": "#FFC09C",
          "onPrimary": "#1A0F08",
          "line": "#FFF0DC",
          "border": "#F0DCC4",
          "divider": "#A58E7B",
          "danger": "#FFB4A2",
          "dangerBg": "#4A2219",
          "onDanger": "#1A0A06",
          "success": "#B5E4BB",
          "successBg": "#26372A",
          "warn": "#FFE39A",
          "warnBg": "#40361A",
          "info": "#B9DBF2",
          "infoBg": "#25364A",
          "focus": "#B9DBF2",
          "bw": 3
        }
      }
    },
    "illustration": {
      "outline": "#4A3426",
      "rim": "#FFF4DF",
      "fillOffsetRatio": {
        "x": 0.0203,
        "y": 0.0156
      },
      "palette": {
        "peach": "#F4B79B",
        "butter": "#F7D98B",
        "sage": "#A8C6A0",
        "sage2": "#8FB68A",
        "sky": "#AACBE2",
        "sky2": "#8DB6D2",
        "pink": "#F2A7B4",
        "rose": "#E88A9B",
        "cream": "#FFF4DF",
        "terra": "#D98B63",
        "wood": "#C99A6B",
        "ice": "#E6F0F7",
        "lav": "#C9B8E8",
        "aqua": "#9ED8CB",
        "dark": "#7A5C48"
      }
    },
    "homeCover": {
      "purpose": "top of the home screen: a background photo uploaded by the couple (shared, either partner can change or remove it); no asset illustration",
      "scrim": {
        "color": "#201610",
        "alpha": 0.64,
        "solidHeight": "205pt (150pt while the partner invite is pending), then fades out over 110pt"
      },
      "veil": {
        "color": "#FFF8EC",
        "alpha": 0.55,
        "height": "status bar + 64pt, fades out"
      },
      "text": {
        "color": "#FFFFFF",
        "shadow": "0 1px 3px rgba(0,0,0,.35)"
      },
      "coverMinHeight": "330pt + top inset",
      "radius": "0 0 30 24",
      "aspect": "tall crop: width x 0.86",
      "noPhoto": "plain paper (app bg), dark text",
      "controls": "app-name pill and change button sit on surface pills",
      "upload": {
        "picker": "system photo picker (no photo-library permission)",
        "formats": [
          "JPG",
          "PNG",
          "HEIC"
        ],
        "maxMB": 20,
        "crop": "drag + pinch, rule-of-thirds grid"
      }
    },
    "widgetPresets": [
      {
        "id": "butter",
        "name": {
          "ko": "버터",
          "en": "Butter",
          "ja": "バター"
        },
        "fill": "#FFE6A8",
        "text": "#3F2D22",
        "contrast": 10.64
      },
      {
        "id": "peach",
        "name": {
          "ko": "복숭아",
          "en": "Peach",
          "ja": "ピーチ"
        },
        "fill": "#F4B79B",
        "text": "#3F2D22",
        "contrast": 7.51
      },
      {
        "id": "sage",
        "name": {
          "ko": "세이지",
          "en": "Sage",
          "ja": "セージ"
        },
        "fill": "#A8C6A0",
        "text": "#3F2D22",
        "contrast": 6.99
      },
      {
        "id": "sky",
        "name": {
          "ko": "하늘",
          "en": "Sky",
          "ja": "スカイ"
        },
        "fill": "#AACBE2",
        "text": "#3F2D22",
        "contrast": 7.67
      },
      {
        "id": "pink",
        "name": {
          "ko": "분홍",
          "en": "Pink",
          "ja": "ピンク"
        },
        "fill": "#F2A7B4",
        "text": "#3F2D22",
        "contrast": 6.81
      },
      {
        "id": "cream",
        "name": {
          "ko": "크림",
          "en": "Cream",
          "ja": "クリーム"
        },
        "fill": "#FFF8EC",
        "text": "#3F2D22",
        "contrast": 12.36
      }
    ],
    "widgetOutline": {
      "ink": "#4A3426",
      "rim": "#FFF4DF",
      "widthByMode": {
        "normal": 2,
        "highContrast": 3
      }
    },
    "mascot": {
      "status": "master created by the owner with a generative-AI chat tool (tool, date, prompts: owner to supply, optional); used as-is, no illustrator redo; weak copyright protection accepted by the owner; similarity check and legal review recommended before release, not blockers",
      "source": "design/mascot/source/mascot-source.png",
      "nameToken": "모피",
      "poses": [
        {
          "id": "mascot_wave_main",
          "room": true,
          "use": "기본 포즈 · 온보딩·D-day·방 기본"
        },
        {
          "id": "mascot_cheer",
          "room": true,
          "use": "성공·참여 완료"
        },
        {
          "id": "mascot_lookup",
          "room": true,
          "use": "기다리는 중·빈 상태"
        },
        {
          "id": "mascot_walk",
          "room": true,
          "use": "로딩·생성 중"
        },
        {
          "id": "mascot_lie",
          "room": true,
          "use": "느긋한 방 · 오프라인 대기"
        },
        {
          "id": "mascot_sleep",
          "room": true,
          "use": "밤 방 · 종료된 공간"
        },
        {
          "id": "mascot_back",
          "room": false,
          "use": "일러스트: 떠남·이별"
        },
        {
          "id": "mascot_star_sit",
          "room": false,
          "use": "일러스트: 기념·첫 일러스트"
        },
        {
          "id": "mascot_box",
          "room": false,
          "use": "일러스트: 빈 상태"
        },
        {
          "id": "mascot_heart",
          "room": false,
          "use": "일러스트: 초대 수락·감사"
        },
        {
          "id": "mascot_phone",
          "room": false,
          "use": "일러스트: 로그인·인증 처리 중"
        }
      ],
      "fixedElements": [
        "egg/potato clay silhouette, no neck",
        "dot eyes + small mouth + pink cheeks",
        "blue sash (permanent, covers the neck)",
        "yellow star pin (back view: sash knot)"
      ],
      "sampledPalette": [
        {
          "region": "몸통",
          "sampledFromSource": "#F9DBB5 · #DFB892 · #C59876",
          "harmonizedTones": [
            "#F8DFBB",
            "#ECC9A2",
            "#D9AD86",
            "#C39772"
          ]
        },
        {
          "region": "볼",
          "sampledFromSource": "#F3B89A",
          "harmonizedTones": [
            "#F2A99B"
          ]
        },
        {
          "region": "어깨띠",
          "sampledFromSource": "#323D7E · #4553AA · #6776D7",
          "harmonizedTones": [
            "#7081DC",
            "#5263BD",
            "#3F4E9E",
            "#2E3C82"
          ]
        },
        {
          "region": "별 핀·별",
          "sampledFromSource": "#F8C071",
          "harmonizedTones": [
            "#FFE4A6",
            "#FCCF7B",
            "#F0A650"
          ]
        },
        {
          "region": "하트",
          "sampledFromSource": "—",
          "harmonizedTones": [
            "#EE8A7B",
            "#DB6D5C",
            "#BB5242"
          ]
        },
        {
          "region": "상자",
          "sampledFromSource": "—",
          "harmonizedTones": [
            "#D0A173",
            "#BC8A5E",
            "#9D6C4F",
            "#7C5340"
          ]
        },
        {
          "region": "휴대폰",
          "sampledFromSource": "—",
          "harmonizedTones": [
            "#4A5568",
            "#2E3646",
            "#1F2532"
          ]
        },
        {
          "region": "얼굴 선",
          "sampledFromSource": "#391E17",
          "harmonizedTones": [
            "#3A261C"
          ]
        },
        {
          "region": "윤곽선 · 림",
          "sampledFromSource": "—",
          "harmonizedTones": [
            "#4A3426",
            "#FFF4DF"
          ]
        }
      ],
      "harmonize": {
        "tool": "design/tools/harmonize-mascot.py",
        "outline": "#4A3426",
        "rim": "#FFF4DF",
        "outlineRatio": 0.0375,
        "innerLineRatio": 0.65,
        "rimRatio": 0.027,
        "fillOffsetRatio": {
          "x": 0.01,
          "y": 0.008
        },
        "wobble": 0.1,
        "minLinePx": 1.6
      },
      "placement": {
        "character": [
          "default object of the room scene (S07 room states, S24 and every miniature of the room)",
          "one onboarding hero (S01-3)"
        ],
        "elsewhere": "no character: small spot illustrations built from the object sketches (books, letter, plant, balloon+ribbon, moon, cloud, gift) or plain layout",
        "reference": "canvas boards C01-C05 (character section)"
      },
      "sizes": {
        "minHeightPx": 48,
        "defaultHeightPx": [
          96,
          200
        ],
        "sceneBoxPt": 170,
        "clearSpaceRatio": 0.1
      }
    },
    "roomOverlayControlOutline": {
      "rule": "outline follows the ROOM (day=brown, night=cream) regardless of app mode; high contrast uses the stronger pair",
      "day": {
        "normal": "#4A3426",
        "highContrast": "#1F140D"
      },
      "night": {
        "normal": "#E8D3BC",
        "highContrast": "#FFF0DC"
      }
    },
    "sceneText": {
      "plateFill": "#FFF8EC",
      "plateInk": "#3F2D22",
      "outline": "#4A3426",
      "rim": "#FFF4DF"
    },
    "systemTabBar": {
      "owner": "system",
      "appControls": [
        "selected tint = app.primary",
        "unselected tint = app.text2",
        "label text",
        "icon image",
        "badge (unused)"
      ],
      "iosFallbackGray": {
        "light": "#8E8E93",
        "dark": "#98989D",
        "note": "fails 4.5:1 label contrast; always set the unselected tint"
      }
    }
  },
  "typography": {
    "families": {
      "ko": {
        "display": [
          "Gaegu 700",
          "Gowun Dodum 400",
          "Noto Sans KR 400"
        ],
        "body": [
          "Gowun Dodum 400",
          "Noto Sans KR 400"
        ],
        "emphasis": [
          "Noto Sans KR 500/700",
          "Gowun Dodum 400"
        ]
      },
      "en": {
        "display": [
          "Gaegu 700",
          "Gowun Dodum 400"
        ],
        "body": [
          "Gowun Dodum 400",
          "Noto Sans KR 400"
        ],
        "emphasis": [
          "Noto Sans KR 500/700"
        ]
      },
      "ja": {
        "display": [
          "Yomogi 400",
          "Zen Maru Gothic 400",
          "Noto Sans JP 400"
        ],
        "body": [
          "Zen Maru Gothic 400",
          "Noto Sans JP 400"
        ],
        "emphasis": [
          "Zen Maru Gothic 500/700",
          "Noto Sans JP 500/700"
        ]
      }
    },
    "faceRule": "display only when the token size at 100% is >= 20px AND the weight is semibold/bold (titles, big D-day number, mascot speech, room text). Everything smaller uses body or emphasis. The rule is evaluated on the token, never on the scaled size.",
    "scale": {
      "display": {
        "size": 56,
        "weight": 700,
        "face": "display"
      },
      "title": {
        "size": 28,
        "weight": 700,
        "face": "display"
      },
      "heading": {
        "size": 20,
        "weight": 700,
        "face": "display"
      },
      "body": {
        "size": 16,
        "weight": 400,
        "face": "body"
      },
      "label": {
        "size": 16,
        "weight": 600,
        "face": "emphasis"
      },
      "bodySm": {
        "size": 14,
        "weight": 400,
        "face": "body"
      },
      "caption": {
        "size": 12,
        "weight": 400,
        "face": "body"
      }
    },
    "lineHeight": {
      "ko": 1.5,
      "en": 1.4,
      "ja": 1.6,
      "display": 1.1
    },
    "wordBreak": {
      "ko": "keep-all",
      "en": "normal",
      "ja": "normal (line-break: strict)"
    },
    "fontScale": {
      "designedUpTo": 2,
      "toolbarLabelCap": 1.6,
      "note": "iOS Dynamic Type beyond 200% falls back to the 200% layout with scrolling; system tab bar sizing is owned by the OS"
    },
    "fonts": [
      {
        "name": "Gaegu",
        "role": "display (ko, en)",
        "license": "SIL OFL 1.1",
        "licenseUrl": "https://github.com/google/fonts/blob/main/ofl/gaegu/OFL.txt",
        "copyright": "Copyright 2018 The Gaegu Project Authors",
        "reservedFontName": "지정 없음",
        "hangulSyllables": "2,350 (KS X 1001만)",
        "files": "Gaegu-Bold.ttf (Regular 선택)",
        "rawSize": "3.0MB",
        "subset": "한글 2,350 + 라틴 ≈1.6MB"
      },
      {
        "name": "Gowun Dodum",
        "role": "body (ko, en)",
        "license": "SIL OFL 1.1",
        "licenseUrl": "https://github.com/google/fonts/blob/main/ofl/gowundodum/OFL.txt",
        "copyright": "Copyright 2021 The Gowun Dodum Project Authors (https://github.com/yangheeryu/Gowun-Dodum)",
        "reservedFontName": "지정 없음",
        "hangulSyllables": "11,172 전체",
        "files": "GowunDodum-Regular.ttf",
        "rawSize": "7.2MB",
        "subset": "KS X 1001 + 라틴 ≈1.2MB · 한글 전체 ≈6.9MB"
      },
      {
        "name": "Noto Sans KR",
        "role": "emphasis · fallback (ko, en)",
        "license": "SIL OFL 1.1",
        "licenseUrl": "https://github.com/google/fonts/blob/main/ofl/notosanskr/OFL.txt",
        "copyright": "Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'",
        "reservedFontName": "'Source' (google/fonts OFL.txt 기준)",
        "hangulSyllables": "11,172 전체",
        "files": "NotoSansKR[wght].ttf → 500·700 정적 인스턴스",
        "rawSize": "10.4MB(가변)",
        "subset": "500 · KS X 1001 ≈0.5MB · 700 · 한글 전체 ≈2.5MB"
      },
      {
        "name": "Yomogi",
        "role": "display (ja)",
        "license": "SIL OFL 1.1",
        "licenseUrl": "https://github.com/google/fonts/blob/main/ofl/yomogi/OFL.txt",
        "copyright": "Copyright 2020 The Yomogi Project Authors (https://github.com/satsuyako/YomogiFont), all rights reserved.",
        "reservedFontName": "지정 없음",
        "hangulSyllables": "없음",
        "files": "Yomogi-Regular.ttf",
        "rawSize": "4.0MB",
        "subset": "JIS 1수준 ≈1.5MB · 1+2수준 ≈3.6MB"
      },
      {
        "name": "Zen Maru Gothic",
        "role": "body · emphasis (ja)",
        "license": "SIL OFL 1.1",
        "licenseUrl": "https://github.com/google/fonts/blob/main/ofl/zenmarugothic/OFL.txt",
        "copyright": "Copyright 2021 The Zen Maru Gothic Project Authors (https://github.com/googlefonts/zen-marugothic)",
        "reservedFontName": "지정 없음",
        "hangulSyllables": "없음",
        "files": "ZenMaruGothic-Regular/Medium/Bold.ttf",
        "rawSize": "3.8MB × 3",
        "subset": "JIS 1수준 ≈1.5MB × 3"
      },
      {
        "name": "Noto Sans JP",
        "role": "fallback (ja)",
        "license": "SIL OFL 1.1",
        "licenseUrl": "https://github.com/google/fonts/blob/main/ofl/notosansjp/OFL.txt",
        "copyright": "Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'",
        "reservedFontName": "'Source' (google/fonts OFL.txt 기준)",
        "hangulSyllables": "없음",
        "files": "NotoSansJP[wght].ttf → 400 정적 인스턴스",
        "rawSize": "9.6MB(가변)",
        "subset": "500 · JIS 1수준 ≈1.3MB · 700 · 1+2수준 ≈2.6MB"
      },
      {
        "name": "Klee One",
        "role": "검토 후 제외",
        "license": "SIL OFL 1.1",
        "licenseUrl": "https://github.com/google/fonts/blob/main/ofl/kleeone/OFL.txt",
        "copyright": "Copyright 2020 The Klee Project Authors (https://github.com/fontworks-fonts/Klee)",
        "reservedFontName": "지정 없음",
        "hangulSyllables": "없음",
        "files": "KleeOne-Regular/SemiBold.ttf",
        "rawSize": "8.7MB",
        "subset": "—"
      },
      {
        "name": "Kosugi Maru",
        "role": "검토 후 제외",
        "license": "Apache License 2.0",
        "licenseUrl": "https://github.com/google/fonts/blob/main/apache/kosugimaru/LICENSE.txt",
        "copyright": "(Apache-2.0)",
        "reservedFontName": "—",
        "hangulSyllables": "없음",
        "files": "KosugiMaru-Regular.ttf",
        "rawSize": "3.6MB",
        "subset": "—"
      }
    ]
  },
  "spacing": [
    4,
    8,
    12,
    16,
    20,
    24,
    32,
    40,
    48
  ],
  "radius": {
    "input": 16,
    "card": 20,
    "sheet": 28,
    "pill": 999,
    "cornerJitter": "each corner radius varies by about +-12% (hand-drawn), not applied to system components"
  },
  "border": {
    "outline": {
      "normal": 2,
      "highContrast": 3
    },
    "unit": "px",
    "colorToken": "app.*.line"
  },
  "touch": {
    "minimum": 48,
    "platformMinimum": {
      "ios": 44,
      "android": 48
    },
    "toolbarHeight": 52
  },
  "safeArea": {
    "ios": {
      "top": 47,
      "bottom": 34
    },
    "android": {
      "top": 32,
      "bottomGesture": 24,
      "bottomThreeButton": 48
    },
    "note": "real values are measured on device; the protected zones are computed from them"
  },
  "elevation": "none (flat; no shadows anywhere, including controls and dialogs)",
  "motion": {
    "transitionMs": 150,
    "reducedMotion": "no transition"
  },
  "focus": {
    "ringWidth": 3,
    "offset": 3,
    "minContrast": 3
  },
  "layout": {
    "floorLineRatio": 0.68,
    "roomObjectsMax": 16,
    "roomTextsMax": 3,
    "sceneTextMinSizePt": 20,
    "protectedZones": [
      "system safe area (top/bottom)",
      "room toolbar (top)",
      "D-day widget",
      "system tab bar (bottom)"
    ],
    "toolbarLabelCap": 1.6
  },
  "contrast": {
    "pairsChecked": 464,
    "failures": 0,
    "matrix": "room(day|night) x app(light|dark) x (normal|high contrast)",
    "minText": 4.5,
    "minNonText": 3
  }
} as const;
