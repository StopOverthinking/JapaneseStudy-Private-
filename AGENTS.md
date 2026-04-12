# Project Notes

언제나 미니멀리즘 디자인, 아이콘 중심 디자인을 우선시하고 텍스트 설명은 최소화한다. 사용자가 설명 없이도 스스로 기능의 의미를 알 수 있다고 가정한다.

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
