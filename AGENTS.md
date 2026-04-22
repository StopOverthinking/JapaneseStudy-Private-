# Project Notes

언제나 미니멀리즘 디자인, 아이콘 중심 디자인을 우선시하고 텍스트 설명은 최소화한다. 사용자가 설명 없이도 스스로 기능의 의미를 알 수 있다고 가정한다.

## 단어장 관리 앱 메모

- 단어장 관리용 에디터 앱은 모바일 사용을 고려하지 않는다.
- 에디터는 데스크톱 기준의 넓은 고정형 레이아웃을 우선한다.
- 선택 상태와 주요 조작은 표 자체에서 바로 드러나야 하며 별도 우측 상세 패널에 의존하지 않는다.

## 스마트 복습 IndexedDB 저장/공유 설계

작성일: 2026-04-12

### 목표

- 스마트 복습의 영속 저장 범위를 `어떤 단어를 언제 다시 학습해야 하는지`로 제한한다.
- 스마트 복습 데이터는 `localStorage`에서 `IndexedDB`로 이동한다.
- 즐겨찾기, 설정, 기타 기존 기록은 현행대로 `localStorage`에 남긴다.
- 스마트 복습의 진행 중 세션, 직전 결과, 프롬프트/오답 상세 로그는 더 이상 영속 저장하지 않는다.

### 저장 범위

영속 저장 대상은 단어별 다음 복습 일정만이다.

기본 규칙:

- `wordId`가 없으면 저장하지 않는다.
- 해당 단어를 아직 복습한 적이 없으면 레코드 자체를 만들지 않는다.
- 다음 복습 일정이 있으면 그 일정만 저장한다.
- 더 이상 예약된 복습이 없으면 레코드는 남기되 `dueAt = null`로 저장한다.

레코드 스키마:

```ts
type SmartReviewScheduleRecord = {
  wordId: string
  dueAt: string | null
  intervalDays: number | null
  updatedAt: string
}
```

필드 의미:

- `wordId`: 어휘 ID, 기본 키
- `dueAt`: 다음 복습 시각 ISO 문자열, 없으면 `null`
- `intervalDays`: 현재 예약에 사용된 간격 일수
- `updatedAt`: 병합/가져오기 충돌 해소용 최종 수정 시각

저장하지 않는 것:

- `status`
- `lastReviewedAt`
- `totalCorrectSessions`
- `totalWrongSessions`
- `consecutiveCorrectSessions`
- `lapseCount`
- `masteredAt`
- 세션 큐, 재시도 큐, 현재 인덱스
- 결과 화면용 오답 목록

### IndexedDB 구조

데이터베이스:

- 이름: `japanese-study`
- 버전: `1`

오브젝트 스토어:

- `smartReviewSchedule`

키와 인덱스:

- keyPath: `wordId`
- index: `dueAt`
- index: `updatedAt`

의도:

- 단건 조회는 `wordId`
- 오늘 복습 대상 조회는 `dueAt`
- 가져오기 병합은 `updatedAt`

### 앱 동작 규칙

스마트 복습 초기 상태:

- IndexedDB 레코드가 없으면 `새 단어`로 취급한다.
- IndexedDB 레코드가 있고 `dueAt <= now`이면 `복습 대상`으로 취급한다.
- IndexedDB 레코드가 있고 `dueAt > now`이면 아직 차례가 오지 않은 단어로 취급한다.
- IndexedDB 레코드가 있고 `dueAt = null`이면 현재 예약된 복습이 없는 단어로 취급한다.

세션 처리:

- 진행 중 세션은 메모리에만 둔다.
- 새로고침이나 탭 종료 시 진행 중 세션은 복구하지 않는다.
- 세션 종료 시 단어별 다음 일정만 IndexedDB에 반영한다.

저장 시점:

- 정답/오답 판정 직후가 아니라 세션 완료 시 한 번에 반영한다.
- 저장은 `bulkPut` 성격의 단일 트랜잭션으로 처리한다.

### 마이그레이션

기존 소스:

- `jsp-react:smart-review-profiles`
- `jsp-react:smart-review-session`
- `jsp-react:smart-review-result`

1회 마이그레이션 규칙:

1. 앱 시작 시 마이그레이션 마커를 확인한다.
2. 기존 `smart-review-profiles`가 있으면 파싱 후 최소 스케줄 레코드로 축소한다.
3. 축소 결과를 IndexedDB `smartReviewSchedule`에 일괄 저장한다.
4. 성공하면 마커를 남긴다.
5. 이후 기존 스마트 복습 `localStorage` 키는 읽지 않는다.
6. 안전 확인 후 기존 스마트 복습 키를 제거한다.

마이그레이션 마커:

- `jsp-react:smart-review-storage = indexeddb-v1`

축소 규칙:

- 기존 프로필의 `dueAt`만 유지한다.
- 간격 정보가 필요하면 현재 stage를 고정 규칙에 따라 `intervalDays`로 변환한다.
- 나머지 통계 필드는 버린다.

### 공유 설계

공유는 두 갈래로 분리한다.

1. 기존 `localStorage` 백업
2. 스마트 복습 스케줄 백업

#### 1. 기존 localStorage 백업

대상:

- 즐겨찾기
- 설정
- 게임/시험 등 기존 `jsp-react:` 기반 데이터

유지 규칙:

- 현재 `share.ts`의 prefix 기반 백업 구조를 유지한다.
- 스마트 복습 스케줄은 더 이상 이 백업에 포함하지 않는다.

#### 2. 스마트 복습 스케줄 백업

대상:

- IndexedDB `smartReviewSchedule` 전체

포맷:

```ts
type SmartReviewScheduleBackup = {
  schemaVersion: 'jsp-smart-review-schedule-v1'
  exportedAt: string
  recordCount: number
  data: SmartReviewScheduleRecord[]
}
```

내보내기 규칙:

- IndexedDB 커서로 전체 레코드를 읽는다.
- JSON 파일로 저장한다.
- 작은 데이터만 QR 공유를 허용한다.

QR 규칙:

- 스케줄 레코드가 적을 때만 허용한다.
- 기준선 초과 시 QR 버튼은 숨기거나 비활성화한다.
- 기준선 초과 시 파일 공유만 제공한다.

권장 기준선:

- `recordCount <= 200`일 때만 QR 허용

가져오기 규칙:

- 스마트 복습 스케줄 가져오기는 별도 진입점으로 둔다.
- 기존 스케줄 전체 삭제 후 덮어쓰기와 병합 가져오기를 구분한다.
- 기본 정책은 병합으로 한다.

병합 정책:

- 동일 `wordId` 충돌 시 `updatedAt`이 더 최신인 레코드를 채택한다.
- 한쪽이 `dueAt = null`이고 다른 쪽이 일정이 있어도 `updatedAt`이 최신인 쪽을 채택한다.

덮어쓰기 정책:

- 사용자가 명시적으로 선택한 경우에만 전체 삭제 후 가져온 데이터로 대체한다.

### UI 원칙

- 공유 메뉴에서는 `기존 앱 백업`과 `스마트 복습 백업`을 분리해서 보여준다.
- 아이콘 중심으로 구분하고 설명 문구는 짧게 유지한다.
- 스마트 복습 QR 공유는 작은 데이터에서만 노출한다.
- 큰 데이터에서는 파일 내보내기/가져오기만 노출한다.

### 코드 구조 제안

신규 파일:

- `src/features/smart-review/smartReviewDb.ts`
- `src/features/smart-review/smartReviewScheduleShare.ts`

역할:

- `smartReviewDb.ts`: IndexedDB open, migration, CRUD, bulk put, due query
- `smartReviewScheduleShare.ts`: 스케줄 전용 export/import/merge

기존 파일 조정:

- `src/features/smart-review/smartReviewStorage.ts`
  - 삭제하거나 IndexedDB 래퍼로 축소
- `src/features/smart-review/smartReviewStore.ts`
  - hydrate를 비동기 초기화로 변경
  - 세션/결과 영속 저장 제거
- `src/features/share/share.ts`
  - 기존 localStorage 백업만 담당
- `src/features/share/SharePanel.tsx`
  - 스마트 복습 스케줄 export/import 액션 분리

### 구현 순서

1. IndexedDB 래퍼와 스케줄 타입 정의
2. 기존 profile -> schedule 마이그레이션
3. smart review store를 IndexedDB 기반으로 전환
4. 세션/결과 영속 저장 제거
5. 스케줄 전용 공유 JSON 추가
6. 작은 데이터만 QR 허용
7. 기존 localStorage 공유에서 smart review 제외

### 비목표

- 스마트 복습 상세 통계 복원
- 세션 이어하기 복원
- 오답 기록 장기 보관
- 다른 기능의 저장 방식 변경

### 결정 요약

- 스마트 복습은 `IndexedDB`
- 저장 범위는 `다음 복습 일정`만
- 즐겨찾기/설정은 그대로 `localStorage`
- 공유는 `기존 백업`과 `스마트 복습 스케줄 백업`을 분리
- 스마트 복습 대용량 공유는 JSON 파일 우선

## LLM Handoff Notes

작성일: 2026-04-12

### 이번 세션에서 끝낸 것

- `1순위` 목록은 모두 1차 반영 완료.
- 학습 세션의 `이전 카드`는 이제 1회용이 아니라 연속 undo 가능.
- 학습 카드 전환 시 다음 카드가 너무 일찍 나타나며 생기던 옆으로 움찔하는 느낌을 완화.
- 터치 환경에서 툴팁이 포커스에 남아 사라지지 않던 문제를 수정.
- 모바일 한정이 아니라 전체 앱 기준으로 GPU 대비 효용이 낮은 효과를 줄여 라우트 전환/홈 메뉴/테마 전환 체감 비용을 낮춤.
- 목록 모드에서 검색, 가리기, 글자 크기 조절 시 전체 카드 재마운트와 blur 비용을 줄여 반응성 개선.
- 목록 모드 일본어/한국어 가리기를 opacity 기반이 아니라 실제 마스킹 바 렌더링으로 바꿔 확실히 가려지게 수정.
- 일반 학습 완료 화면 액션을 홈 이동 버튼 1개만 남기도록 단순화.

### 변경 파일

- `src/features/session/learnSessionStore.ts`
- `src/features/session/learnSessionStore.test.ts`
- `src/features/learn/LearnSessionPage.tsx`
- `src/features/learn/LearnSessionPage.test.tsx`
- `src/components/Tooltip.tsx`
- `src/components/Tooltip.test.tsx`
- `src/app/App.tsx`
- `src/features/home/HomePage.tsx`
- `src/features/home/ResumeBannerActions.test.tsx`
- `src/lib/useShouldReduceEffects.ts`
- `src/features/learn/LearnResultPage.tsx`
- `src/features/list/ListPage.tsx`
- `src/features/list/ListPage.test.tsx`
- `src/features/list/list.module.css`
- `src/styles/global.css`

### 구현 메모

- 학습 undo는 `previousSnapshot` 단일 값이 아니라 `snapshotHistory` 스택으로 바뀌었다.
- 학습 카드 전환은 판정을 즉시 state에 반영하지 않고, leaving card 애니메이션이 끝난 뒤 commit 하도록 바뀌었다.
- 툴팁은 CSS `:focus-within` 의존이 아니라 React state 기반으로 표시된다.
- 터치 입력은 툴팁 포커스를 즉시 정리하고, 키보드 포커스는 유지한다.
- 앱 전역의 route transition 에서 `blur + scale` 제거. 현재는 가벼운 `opacity + y`만 사용.
- 배경 장식용 `noise-layer`, `orb`, `glass-panel backdrop-filter`, `body background/color transition` 제거.
- 홈 메뉴 서브패널은 `height` 애니메이션을 제거하고 opacity/y 중심으로 축소.
- 목록 카드는 `key={word.id}`로 유지해 hide toggle 시 재마운트를 피한다.
- 목록 검색은 `useDeferredValue`와 `startTransition` 사용.
- 목록 카드 숨김 표현은 실제 텍스트를 렌더링하지 않고 길이 기반 마스킹 바로 대체한다.
- 목록 카드에 `content-visibility: auto`와 `contain-intrinsic-size`를 넣어 긴 목록 렌더링 비용을 낮춤.
- 일반 학습 완료 화면은 추가 분기 없이 홈 이동 아이콘 버튼 1개만 제공한다.

### 다음 작업 우선순위

- 이제 `2순위`로 넘어가면 된다.
- 다음 후보 1: 목록 모드에서 `전체 단어장` 제거.
- 다음 후보 2: 시험 결과 기준 `마지막 시험 오답 단어장`이 실제로 덮어쓰기 방식으로 동작하는지 확인하고, 없으면 구현.
- 다음 후보 3: 스마트 복습에서 학습 개수 지정 UI와 store 연동.

### 주의할 점

- 사용자는 미니멀리즘, 아이콘 중심 UI를 선호하고 설명 문구를 줄이길 원한다.
- 이번 세션에서 전역 시각 효과를 이미 많이 줄였으므로, 이후 UI 수정 시 고비용 blur/filter/height animation/backdrop-filter를 다시 늘리지 않는 편이 좋다.
- `To-do.md` 기준으로 1순위는 완료 처리했으니, 이후 작업 기록은 2순위 기준으로 갱신하면 된다.
