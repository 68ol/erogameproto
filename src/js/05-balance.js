/*
 * 밸런스 수치 모음. 숫자 조정은 여기서만 한다.
 * 조정 후에는 `node scripts/balance-sim.mjs` 로 30일 시뮬레이션 결과를 확인한다.
 *
 * 목표 곡선 (30일 기준, 자세한 내용은 docs/balance.md)
 *   신중한 플레이 : 트라우마 < 150,      자제력 > 800
 *   보통 플레이   : 트라우마 150 ~ 450,  자제력 500 ~ 900
 *   무모한 플레이 : 자제력 < 300,        트라우마 200 이상, 15일 안에 1000 도달 금지
 */
setup.BALANCE = {
	hourly: {
		stressDecay: -2,
		painDecay: -5,
		arousalDecay: -5,
		fatigueGain: 2,
		/* short → long 누적 */
		highStress: 70,
		highStressTrauma: 1,
		highPain: 50,
		highPainTrauma: 1,
	},

	sleep: {
		minutes: 480,
		stress: -25,
		/* 스트레스가 낮은 상태로 자면 트라우마가 조금 회복된다 */
		calmStress: 30,
		traumaHeal: -5,
		/* 자제력은 잘 때만 회복. 트라우마가 높으면 회복되지 않는다 */
		controlRecover: 15,
		controlRecoverBelowTrauma: 500,
	},

	encounter: {
		maxRounds: 8,
		roundMinutes: 2,
		/*
		 * 판정 난이도 = NPC dom × difficultyPerDom. 성공률 = 50 + (스킬 - 난이도) / 10 (5~95%)
		 * 시작 스킬 100, 평균 NPC(dom 50) 기준 → 도주 45%, 설득·밀치기 40%
		 */
		talk:  { difficultyPerDom: 4, resolve: -25, failStress: 8 },
		push:  { difficultyPerDom: 4, resolve: -35, failPain: 8 },
		flee:  { difficultyPerDom: 3, failFatigue: 5 },
		npcAggressive: { stress: 6, pain: 4 },
		npcSoft: { stress: 3, arousal: 5 },
		result: {
			escape:   { daring: 1, stress: -10 },
			win:      { daring: 2, stress: -15 },
			/* 스스로 받아들임: 트라우마는 적고 성향 변화가 크다 */
			submit:   { trauma: 8, control: -20, submission: 2 },
			/* 끝까지 버티다 짐: 트라우마가 크다 */
			lose:     { trauma: 15, control: -30, submission: 1, stress: 15 },
			collapse: { trauma: 10 },
		},
	},

	collapse: { trauma: 5, pain: 20, fatigue: 40, minutes: 360 },
	breakdown: { stress: 60, trauma: 25, control: -60 },

	events: {
		plazaNightStranger: 15,
		downtownNightStranger: 30,
		librarySenior: 40,
		/* 같은 group 이벤트는 하루 최대 이 횟수까지 */
		groupPerDay: { stranger: 2 },
	},

	economy: {
		/* 식비 등 생활비. 매일 0시에 빠진다 */
		dailyCost: 20000,
		/* 돈이 마이너스면 하루마다 스트레스 */
		debtStress: 15,
	},

	jobs: {
		/* maxFatigue: 이 피로 이상이면 근무 불가. perDay: 하루 최대 근무 횟수 */
		cafe: { minutes: 240, pay: 45000, fatigue: 18, stress: 5, maxFatigue: 60, perDay: 1 },
	},
};
