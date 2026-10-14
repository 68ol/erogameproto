# 레퍼런스 분석: Degrees of Lewdity v0.5.12.13 구조

> 목적: 장르/게임 구조(틀)만 참고. DoL의 코드·텍스트·이미지는 이 저장소에 넣지 않는다.
> 소스: 사용자가 업로드한 APK(Cordova 래퍼) → `assets/www/index.html`에서 추출.

## 1. 기술 스택

| 항목 | 내용 |
|---|---|
| 엔진 | Twine 2 / **SugarCube 2.36.1**, Tweego 2.1.1로 빌드 |
| 배포 | 단일 `index.html` + `img/` 폴더. Android는 Cordova로 감쌈 |
| 규모 | 패시지 16,087개, 위젯 5,100개, 사용자 JS 4.4MB, CSS 130KB |
| 이미지 | 레이어 합성식 페이퍼돌 (`body`, `hair`, `face`, `clothes`, `bodywriting`, `transformations`, `sex`) |

결론적으로 "텍스트 + 하이퍼링크 선택지 + 사이드바 스탯 + 페이퍼돌"이 전부이고, 게임성은 거의 전부 **상태 변수와 시간 틱**에서 나온다.

## 2. 코어 루프

```
장소 패시지 (선택지 목록)
  └─ 행동 선택 → <<pass N>> 으로 시간 경과
        ├─ minutePassed / hourPassed / dayPassed / weekPassed  (JS)
        │     스탯 자연 회복·감소, NPC 스케줄, 날씨, 임신/체액 등 타이머
        └─ 확률 체크 → 랜덤 이벤트 발생
              └─ NPC 생성(<<generate1..N>>) → 대화 or 전투(조우) → <<endevent>>
  └─ 결과: 스탯 변화 → 다음 장소
```

- 시간: `Time` 객체 + `DateTime` 클래스. 모든 행동이 시간을 소모하고, 시간대·요일에 따라 장소 내용과 NPC 위치가 바뀐다.
- 성장 축은 레벨이 아니라 **누적되는 상태값**이다. 플레이어가 무엇을 반복했는지에 따라 캐릭터가 변한다.

## 3. 플레이어 상태 (사이드바)

| 분류 | 변수 | 역할 |
|---|---|---|
| 단기 게이지 | `pain`, `arousal`, `tiredness`, `stress` | 이벤트 안에서 오르내림. 상한 도달 시 기절(`Passout*`, 129 패시지) 같은 강제 전개 |
| 장기 게이지 | `trauma`, `control`, `awareness`, `purity` | 장기 누적. 특성 해금과 엔딩 분기 조건 |
| 성향 | `promiscuity`, `exhibitionism`, `deviancy`, `submissive` | "어디까지 받아들일지" 게이트. 높을수록 선택지가 열림 |
| 사회 | `fame`(종류별), `crime`, `delinquency`, `allure`, `money` | 소문·범죄·매력이 조우 확률과 반응을 바꿈 |
| 스킬 | 학업(`english`, `maths`, `science`, `history`) / 신체(`athletics`, `swimming`, `dancing`) / 생활(`skulduggery`, `housekeeping`, `tending`) / 전투용 신체 스킬 | 판정 성공률 |

설계 포인트: 단기 게이지가 장기 게이지를 밀어 올리고, 장기 게이지가 선택지 풀을 바꾸는 **2단 구조**다.

## 4. NPC 시스템

- **네임드 NPC** (`C.npc.<이름>`): 핵심 필드는 `love`, `lust`, `dom`, `rage`, `trauma`, `state`, `init`. 캐릭터마다 루트가 수백 패시지 규모다.
- **생성 NPC** (`<<generate1>>` ~ `<<generate6>>`): 성별, 체형, 성격을 랜덤으로 뽑는 일회성 NPC. 거리 조우를 채운다.
- 대명사 헬퍼(`getHe`, `getHim` 등)로 텍스트가 NPC 성별에 맞춰 바뀐다.

## 5. 조우/전투 시스템

- `maninit` → `combatinit` → 턴 반복 → `endcombat`.
- 턴마다 플레이어가 신체 부위별(손, 입, 다리 등)로 행동을 고르고, NPC AI는 `dom`/`rage` 같은 상태로 다음 행동을 고른다.
- 결과는 "저항해서 탈출 / 굴복 / 기절" 세 갈래이고, 그대로 스탯과 평판에 반영된다.
- 위젯의 거의 절반이 이 전투 분기다. 구현 비용이 가장 큰 덩어리다.

## 6. 콘텐츠 구성 (패시지 접두어 기준, 상위)

장소: Mansion, Farm, Street, Prison, Temple, Forest, School, Beach, Asylum, Office, Docks, Museum, Sewers, Pub, Spa, Park, Arcade 등 50곳 이상.
캐릭터 루트: 네임드 NPC마다 400~500 패시지.
부가 시스템: 낚시, 농사(`tending`), 사진, 댄스, 일자리(Brothel/Pub/Office), 감옥/수용소 같은 패배 루트, 엔딩 27개.

## 7. 우리 프로젝트에 가져갈 "틀"

1. 장소 그래프 + 시간 틱 + 확률 이벤트 루프
2. 단기 게이지 → 장기 게이지 → 선택지 게이팅의 2단 스탯 구조
3. 네임드 NPC 호감 축(`love`/`lust`/`dom`) + 랜덤 생성 NPC
4. 신체 부위별 턴제 조우 (단, 범위를 크게 줄인 버전)
5. 일자리/돈 루프와 패배 시 강제 루트

## 8. 리스크 / 바꿔야 할 것

- **연령**: 원작의 기본 무대는 학교이고, 코드에 `generatey*`, `getPeopleYoung`, `teensPresentCheck` 같은 미성년 관련 분기가 있다. 성적 콘텐츠에 관련된 모든 인물은 명확히 성인이어야 한다. 학교 무대는 대학, 직장, 다른 성인 무대로 바꾸고, 해당 분기 개념은 아예 가져오지 않는다.
- **범위**: 원작은 패시지 16k, 위젯 5k 규모다. 틀을 그대로 가져가면 1인/소규모로는 끝낼 수 없다. MVP는 장소 5곳, 네임드 NPC 2명, 조우 행동 10개 이하로 잡는다.
- **저작권**: 시스템과 장르 아이디어는 보호 대상이 아니지만 코드, 텍스트, 이미지는 다르다. 위젯이나 JS를 복붙하지 말고 처음부터 작성한다.
- **엔진 선택**: SugarCube로 가면 원작과 같은 구조라 편하지만, 5k 위젯처럼 유지보수가 지옥이 되는 원인도 그대로 따라온다. 상태와 로직은 JS/TS 모듈로 분리하고, 패시지는 텍스트만 담게 하는 걸 권장한다.
