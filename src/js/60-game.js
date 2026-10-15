/*
 * 게임 진행
 *
 * 모든 장소 이동/행동은 Game.advance(분, 목적지)를 거친다.
 *   1. 시간 경과 (시간 틱, 스탯 누적)
 *   2. 강제 전개가 예약돼 있으면 그쪽으로 (기절, 붕괴)
 *   3. 목적지가 장소면 랜덤 이벤트 굴림
 *   4. 아무것도 없으면 목적지로
 */
window.Game = {
	newGame() {
		const V = State.variables;
		V.time = setup.START_TIME;
		V.player = {
			name: "",
			money: 50000,
			stats: Stats.init(),
		};
		V.npcs = NPC.init();
		V.daily = {};
		V.forcedPassage = null;
		V.returnTo = null;
		V.enc = null;
		/* 누적 기록 (엔딩 조건, 밸런스 측정용) */
		V.record = { encounters: {}, collapses: 0, breakdowns: 0 };
	},

	advance(minutes, target, { events = true } = {}) {
		const V = State.variables;
		Time.pass(minutes);

		if (V.forcedPassage) {
			const forced = V.forcedPassage;
			V.forcedPassage = null;
			V.returnTo = target;
			Engine.play(forced);
			return;
		}

		if (events && Story.has(target) && Story.get(target).tags.includes("location")) {
			const ev = Events.roll(target);
			if (ev) {
				V.returnTo = target;
				Engine.play(ev.passage);
				return;
			}
		}

		Engine.play(target);
	},

	/* 이벤트/강제 전개 패시지에서 원래 가던 곳으로 복귀 */
	resume(fallback = "Dorm") {
		const V = State.variables;
		const target = V.returnTo || fallback;
		V.returnTo = null;
		Game.advance(0, target, { events: false });
	},
};

/*
 * <<act "라벨" 분 "목적지">> 실행할 코드 <</act>>
 *   클릭하면 안쪽 코드를 실행하고 Game.advance(분, 목적지)를 호출한다.
 *   분이 0보다 크면 라벨 뒤에 소요 시간을 표시한다.
 */
Macro.add("act", {
	tags: null,
	handler() {
		const [label, minutes = 0, target = passage()] = this.args;
		if (typeof label !== "string") return this.error("act: 첫 인자는 라벨 문자열이어야 합니다");
		const code = this.payload[0].contents;
		const text = minutes > 0 ? `${label} (${Time.formatDuration(minutes)})` : label;

		jQuery(document.createElement("a"))
			.addClass("link-internal act-link")
			.text(text)
			.ariaClick({ one: true }, this.shadowHandler(() => {
				if (code.trim()) $.wiki(code);
				Game.advance(minutes, target);
			}))
			.appendTo(this.output);
	},
});

/* <<encAction "talk">> : 조우 행동 링크 */
Macro.add("encAction", {
	handler() {
		const action = this.args[0];
		const def = setup.ENC_ACTIONS[action];
		if (!def) return this.error(`encAction: 알 수 없는 행동 "${action}"`);

		jQuery(document.createElement("a"))
			.addClass("link-internal act-link")
			.text(def.label)
			.ariaClick({ one: true }, () => Encounter.act(action))
			.appendTo(this.output);
	},
});
