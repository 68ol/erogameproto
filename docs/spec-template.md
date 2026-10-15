# 기획서 양식

GPT에 아래 **"GPT에 붙여넣을 지시문"**을 통째로 붙여넣고 기획을 요청한 뒤, 나온 YAML을 그대로 가져오면 된다.
한 번에 전부 만들 필요는 없다. NPC 1명, 장소 1곳씩 가져와도 된다.

## 구조 도식

```
세계관 (world)
 └─ 장소 (locations)  ─ 서로 연결된 그래프. 이동에 시간이 든다
      ├─ 행동 (actions)     : 시간을 쓰고 스탯을 바꾼다. 영업시간/조건이 있다
      ├─ 상주 NPC          : 언제 어디에 있는지 (schedule)
      └─ 랜덤 이벤트 (events): 들어올 때 확률로 발생
            └─ 선택지 → 스탯 변화 / 조우(encounter) / 다른 이벤트

NPC
 ├─ 기본 정보: 이름, 나이(20+), 역할, 성격, 말투
 ├─ 관계 수치: love(호감) / lust(욕구) / dom(지배성) 시작값
 ├─ 일정 (schedule): 요일·시간대별 위치
 └─ 관계 단계 (stages): 수치 조건에 따라 대사와 해금 행동이 달라진다

조우 (encounter): 시스템이 처리한다. 기획서에는 누가, 어떤 성향으로(dom), 승리·패배 뒤 무슨 일이 생기는지만 쓴다.
```

## 게임에 이미 있는 것 (기획서에서 이 이름을 그대로 써야 함)

| 스탯 키 | 이름 | 범위 | 종류 |
|---|---|---|---|
| `stress` | 스트레스 | 0~100 | 단기 |
| `fatigue` | 피로 | 0~100 | 단기 |
| `pain` | 고통 | 0~100 | 단기 |
| `arousal` | 흥분 | 0~100 | 단기 |
| `trauma` | 트라우마 | 0~1000 | 장기 |
| `control` | 자제력 | 0~1000 | 장기 |
| `awareness` | 자각 | 0~1000 | 장기 |
| `daring` | 대담함 | 0~100 | 성향 |
| `submission` | 순종 | 0~100 | 성향 |
| `study` | 학업 | 0~1000 | 스킬 |
| `athletics` | 운동 | 0~1000 | 스킬 |
| `social` | 화술 | 0~1000 | 스킬 |
| `money` | 돈(원) | — | — |

새 스탯이 필요하면 `new_stats`에 따로 적는다. 기존 스탯으로 되는 걸 새로 만들지 않는다.

현재 장소: `Dorm` 기숙사, `CampusPlaza` 캠퍼스 광장, `LectureHall` 강의동, `Library` 도서관, `Downtown` 번화가, `Cafe` 카페.

---

## GPT에 붙여넣을 지시문

````
너는 성인용 텍스트 시뮬레이션 게임의 기획을 돕는다. 무대는 한국의 대학교와 주변 도시다.
아래 규칙과 YAML 스키마를 정확히 지켜서 기획서를 작성해라.

[절대 규칙]
- 모든 등장인물은 20세 이상이다. age 필드에 숫자로 명시한다. "어려 보인다" 같은 미성년 연상 묘사를 쓰지 않는다.
- 스탯 이름은 다음만 쓴다: stress, fatigue, pain, arousal, trauma, control, awareness, daring, submission, study, athletics, social, money.
  새 스탯이 꼭 필요하면 new_stats에 이유와 함께 따로 제안한다.
- 시간은 분(minutes) 단위 정수, 시각은 0~23시 정수로 쓴다.
- 스탯 변화는 증감량으로 쓴다. (예: stress: +5, trauma: -3)
  단기 스탯(stress/fatigue/pain/arousal)은 한 번에 ±30 이내, 장기 스탯(trauma/control/awareness)은 한 번에 ±30 이내로 쓴다.
- 조건(condition)은 "스탯 비교" 또는 "NPC 관계 비교" 또는 "시간/요일"로만 쓴다.
  예: "daring >= 20", "npc.senior.love >= 40", "hour 22~6", "weekday", "weekend"
- 장면 본문은 쓰지 말고, 각 장면이 무슨 일인지 1~3문장 요약(summary)만 쓴다. 본문은 나중에 따로 쓴다.
- 결과는 YAML 하나로만 출력한다.

[스키마]

world:
  summary: 세계관 3~5문장
  tone: 분위기 키워드 3~5개

new_stats:            # 없으면 빈 목록
  - key: 영문소문자
    name: 한글 이름
    range: [0, 100]
    reason: 왜 기존 스탯으로 안 되는지

locations:
  - id: PascalCase 영문 (예: Gym)
    name: 한글 이름
    summary: 1~2문장
    open_hours: [시작시, 끝시]   # 항상 열려 있으면 생략
    danger: low | mid | high      # 밤 조우 위험도
    connects:                     # 연결된 장소와 이동 시간
      - { to: CampusPlaza, minutes: 10 }
    actions:
      - label: 선택지에 보일 문구
        minutes: 60
        condition: 없으면 생략
        effects: { study: +3, fatigue: +5 }
        limit_per_day: 1           # 제한 없으면 생략
    events:
      - id: snake_case 영문
        chance: 0~100 (%)
        condition: "hour 22~6"
        once: true | false         # 평생 한 번
        summary: 무슨 일이 일어나는지 1~3문장
        choices:
          - label: 선택지 문구
            condition: 없으면 생략
            effects: { stress: +5 }
            leads_to: none | encounter | event:<event id>
            summary: 고르면 어떻게 되는지

npcs:
  - id: snake_case 영문 (예: senior)
    name: 이름
    age: 20 이상 정수
    gender: 
    role: 플레이어와의 관계/직업 1문장
    appearance: 외모 1~2문장
    personality: 성격 2~3문장
    speech: 말투 특징과 예시 대사 2개
    start: { love: -100~100, lust: 0~100, dom: 0~100 }
    schedule:
      - { days: weekday | weekend | all, hours: [9, 18], location: LectureHall }
    stages:                         # 관계가 진행되는 단계. 낮은 단계부터
      - name: 단계 이름
        condition: "npc.<id>.love >= 0"
        summary: 이 단계에서 NPC가 어떻게 대하는지
        unlocks:                    # 이 단계에서 열리는 행동
          - label: 선택지 문구
            minutes: 30
            condition: 추가 조건, 없으면 생략
            effects: { npc.<id>.love: +3, stress: -5 }
            summary: 1~2문장
    encounter:                      # 이 NPC와 조우가 가능하면 작성, 아니면 생략
      trigger: 어떤 조건에서 조우로 이어지는지
      on_win: 플레이어가 이기면 생기는 일
      on_lose: 플레이어가 지면 생기는 일 (요약만)
      on_submit: 받아들이면 생기는 일 (요약만)

jobs:
  - id: snake_case
    location: 장소 id
    hours: [시작시, 끝시]
    shift_minutes: 240
    pay: 원
    effects: { fatigue: +18, stress: +5 }
    requirement: 없으면 생략
    events: 근무 중 이벤트 (위 events 스키마와 동일)
````

---

## 가져올 때 체크리스트

- [ ] 모든 NPC에 `age`가 있고 20 이상인가
- [ ] 스탯 이름이 위 표에 있는 것만 쓰였는가
- [ ] `connects`로 기존 장소 중 최소 하나와 연결돼 있는가
- [ ] 한 번에 ±30을 넘는 스탯 변화가 없는가 (넘으면 밸런스 시뮬레이션에서 걸린다)
- [ ] 장면 본문이 아니라 요약만 있는가 (본문은 구조가 확정된 뒤에 쓴다)
