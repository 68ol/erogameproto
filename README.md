# erogameproto

SugarCube 2 (Twine) 기반 성인 텍스트 시뮬레이션. 무대는 대학교, 모든 등장인물은 20세 이상.

## 빌드

```bash
./build.sh          # → dist/index.html (브라우저로 열면 실행)
./build.sh -w       # 파일 변경 감시 모드
```

Tweego는 처음 빌드할 때 `tools/`에 자동으로 받는다. SugarCube 2.37.3은 `storyformats/`에 고정돼 있다.

## 구조

```
src/
  js/                 로직 (파일명 숫자 순서대로 로드)
    00-config.js      엔진 설정, 최소 나이(MIN_NPC_AGE = 20)
    10-stats.js       스탯 정의와 2단 구조(short → long), 판정, 기절/붕괴 예약
    20-time.js        게임 시간, 시/일 틱
    30-npc.js         네임드 NPC 정의(이름·성격은 여기서 수정), 랜덤 NPC 생성
    40-events.js      장소별 랜덤 이벤트 테이블
    50-encounter.js   턴제 조우
    60-game.js        이동 처리(Game.advance), <<act>> / <<encAction>> 매크로
  passages/           텍스트 (로직은 최소한으로)
  css/style.css
docs/                 설계 문서
```

## 글 쓰는 규칙

- 이동이나 행동은 `<<act "라벨" 분 "목적지">>효과<</act>>`로 쓴다. 시간이 흐르고, 스탯이 누적되고, 이벤트 판정이 자동으로 일어난다.
- 장소 패시지에는 `[location]` 태그를 붙인다. 붙이면 들어올 때마다 `setup.EVENTS`의 이벤트를 굴린다.
- 이벤트를 끝낼 때는 `<<link "...">><<run Game.resume()>><</link>>`로 원래 가던 곳으로 돌아간다.
- 스탯 변경은 `Stats.change("stress", 5)`, NPC 관계 변경은 `NPC.change("senior", "love", 3)`.
- 계산 로직은 패시지에 쓰지 말고 `src/js/`에 함수로 만든다.
- NPC의 `age`가 20 미만이면 게임이 시작되지 않는다. 의도된 동작이다.
