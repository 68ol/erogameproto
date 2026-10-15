/*
 * 플레이어 스탯 (2단 구조)
 *
 *   short : 장면 안에서 빠르게 오르내리는 게이지. 상한에 닿으면 강제 전개(기절, 붕괴)가 발생한다.
 *   long  : 천천히 누적되는 수치. short 게이지가 높은 상태로 시간이 흐르면 여기에 쌓인다.
 *   trait : 성향. 선택지 게이팅에 쓴다. (예: daring 30 이상이어야 열리는 선택지)
 *   skill : 판정 성공률.
 */
setup.STATS = {
	stress:     { label: "스트레스", tier: "short", min: 0, max: 100,  init: 0 },
	fatigue:    { label: "피로",     tier: "short", min: 0, max: 100,  init: 0 },
	pain:       { label: "고통",     tier: "short", min: 0, max: 100,  init: 0 },
	arousal:    { label: "흥분",     tier: "short", min: 0, max: 100,  init: 0 },

	trauma:     { label: "트라우마", tier: "long",  min: 0, max: 1000, init: 0 },
	control:    { label: "자제력",   tier: "long",  min: 0, max: 1000, init: 1000 },
	awareness:  { label: "자각",     tier: "long",  min: 0, max: 1000, init: 0 },

	daring:     { label: "대담함",   tier: "trait", min: 0, max: 100,  init: 0 },
	submission: { label: "순종",     tier: "trait", min: 0, max: 100,  init: 0 },

	study:      { label: "학업",     tier: "skill", min: 0, max: 1000, init: 100 },
	athletics:  { label: "운동",     tier: "skill", min: 0, max: 1000, init: 100 },
	social:     { label: "화술",     tier: "skill", min: 0, max: 1000, init: 100 },
};

setup.STAT_ORDER = {};
for (const [key, def] of Object.entries(setup.STATS)) {
	(setup.STAT_ORDER[def.tier] ??= []).push(key);
}

window.Stats = {
	init() {
		const stats = {};
		for (const [key, def] of Object.entries(setup.STATS)) stats[key] = def.init;
		return stats;
	},

	get(key) {
		return State.variables.player.stats[key];
	},

	set(key, value) {
		const def = setup.STATS[key];
		if (!def) throw new Error(`알 수 없는 스탯: ${key}`);
		State.variables.player.stats[key] = Math.clamp(Math.round(value), def.min, def.max);
		Stats.checkOverflow();
	},

	change(key, delta) {
		Stats.set(key, Stats.get(key) + delta);
	},

	percent(key) {
		const def = setup.STATS[key];
		return Math.round(((Stats.get(key) - def.min) / (def.max - def.min)) * 100);
	},

	/* 사이드바 색상용 0~4 단계 */
	level(key) {
		return Math.min(4, Math.floor(Stats.percent(key) / 20));
	},

	/* 스킬 판정: 스킬 값과 난이도로 성공 확률을 정한다. 5%~95% 범위. */
	check(key, difficulty) {
		const chance = Math.clamp(50 + (Stats.get(key) - difficulty) / 10, 5, 95);
		return random(1, 100) <= chance;
	},

	/*
	 * short 게이지가 상한에 닿았을 때의 강제 전개.
	 * 여기서는 바로 이동하지 않고 V.forcedPassage에 예약만 한다.
	 * 실제 이동은 Game.advance가 처리한다.
	 */
	checkOverflow() {
		const V = State.variables;
		const s = V.player.stats;
		if (V.forcedPassage) return;
		if (s.fatigue >= setup.STATS.fatigue.max || s.pain >= setup.STATS.pain.max) {
			V.forcedPassage = "Collapse";
		} else if (s.stress >= setup.STATS.stress.max) {
			V.forcedPassage = "Breakdown";
		}
	},

	/* { stress: 5, trauma: -3 } 형태의 변화량을 한 번에 적용 */
	apply(deltas) {
		for (const [key, delta] of Object.entries(deltas)) Stats.change(key, delta);
	},

	/* 매시간 호출: short → long 누적, 자연 회복 */
	hourlyTick() {
		const b = setup.BALANCE.hourly;
		const s = State.variables.player.stats;
		if (s.stress >= b.highStress) Stats.change("trauma", b.highStressTrauma);
		if (s.pain >= b.highPain) Stats.change("trauma", b.highPainTrauma);
		if (s.control <= 0) Stats.change("awareness", 1);

		Stats.change("stress", b.stressDecay);
		Stats.change("pain", b.painDecay);
		Stats.change("arousal", b.arousalDecay);
		Stats.change("fatigue", b.fatigueGain);
	},

	sleep() {
		const b = setup.BALANCE.sleep;
		const calm = Stats.get("stress") < b.calmStress;
		Stats.set("fatigue", 0);
		Stats.change("stress", b.stress);
		if (calm) Stats.change("trauma", b.traumaHeal);
		if (Stats.get("trauma") < b.controlRecoverBelowTrauma) Stats.change("control", b.controlRecover);
	},
};
