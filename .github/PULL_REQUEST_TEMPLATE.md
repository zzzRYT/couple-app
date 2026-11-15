## 변경 요약

## 디자인 변경 선언

UI 영향이 없어도 아래 블록을 채워야 `Design review` 검사가 통과해요. 한 줄에 `키: 값` 하나씩 쓰고, `#` 줄은 무시돼요.
`apps/mobile/src/`, `apps/mobile/assets/`, `design/`(증거와 `__tests__` 제외)을 바꿨는데 `ui: none`이면 실패해요.

```design-change
# changed | none | unknown (unknown은 소유자가 분류할 때까지 실패)
ui:
# app-local, product-theme, shared-proposed, exception 중 하나 이상, 쉼표로 구분 (changed·unknown이면 필수)
classification:
# 이 분류와 UI 영향 판단의 근거 (항상 필수)
reason:
# 아래부터 ui: changed일 때 필수. 해당 없으면 none
# 영향 화면·플랫폼
screens:
# 영향 상태 (기본, 눌림, 비활성, 오류 등)
states:
# 사용하거나 바꾼 토큰
tokens:
# 사용하거나 바꾼 컴포넌트
components:
# 디자인 정본 링크
design:
# 정본 버전 또는 해시
design-version:
# 소유자 승인 기록 (누가, 언제, 어디서)
design-approval:
# 캡처를 찍은 커밋의 40자리 SHA. 이후 UI 파일이 바뀌면 다시 캡처
evidence-commit:
# design/evidence/ 아래 PNG 경로, 쉼표로 구분
evidence:
# 캡처 조건 (시뮬레이터, 화면 크기, OS, 글꼴, 테마, 데이터, 시간)
conditions:
# 확인하지 못한 항목 (선택)
unverified:
```
