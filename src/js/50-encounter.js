/*
 * 조우 (턴제)
 *
 * Encounter.start({ npc, returnTo }) 로 시작해서 "Encounter" 패시지에서 진행한다.
 * 플레이어가 행동을 고르면 → 판정 → NPC 턴 → 종료 조건 확인.
 *
 * NPC의 resolve(의지)가 0이 되면 플레이어 승리, 플레이어가 도주에 성공하면 탈출,
 * 받아들이거나 라운드 제한에 걸리면 패배. 결과는 V.enc.result 에 남고 "EncounterEnd"로 간다.
 *
 * 장면 텍스트는 Encounter 패시지와 setup.ENC_TEXT 에서 작가가 채운다.
 */
setup.ENC_ACTIONS = {
	talk:   { label: "말로 설득한다" },
	push:   { label: "밀쳐낸다" },
	flee:   { label: "도망친다" },
	submit: { label: "받아들인다" },
};

window.Encounter = {
	start({ npc, npcId = null, returnTo }) {
		const V = State.variables;
		V.enc = {
			npcId,
			name: npc.name,
			age: npc.age,
			dom: npc.dom,
			resolve: 100,
			round: 0,
			log: [],
			result: null,
			returnTo,
		};
		Engine.play("Encounter");
	},

	log(text) {
		State.variables.enc.log.push(text);
	},

	act(action) {
		const V = State.variables;
		const enc = V.enc;
		const b = setup.BALANCE.encounter;
		enc.round++;
		enc.log = [];

		switch (action) {
			case "talk":
				if (Stats.check("social", enc.dom * b.talk.difficultyPerDom)) {
					enc.resolve += b.talk.resolve;
					Encounter.log("말이 먹혔다. 상대가 머뭇거린다.");
				} else {
					Stats.change("stress", b.talk.failStress);
					Encounter.log("상대는 듣는 척도 하지 않는다.");
				}
				break;
			case "push":
				if (Stats.check("athletics", enc.dom * b.push.difficultyPerDom)) {
					enc.resolve += b.push.resolve;
					Encounter.log("힘껏 밀쳐냈다. 상대가 비틀거린다.");
				} else {
					Stats.change("pain", b.push.failPain);
					Encounter.log("오히려 손목을 붙잡혔다.");
				}
				break;
			case "flee":
				if (Stats.check("athletics", enc.dom * b.flee.difficultyPerDom)) {
					Encounter.finish("escape");
					return;
				}
				Stats.change("fatigue", b.flee.failFatigue);
				Encounter.log("도망치려 했지만 길이 막혔다.");
				break;
			case "submit":
				Encounter.finish("submit");
				return;
			default:
				throw new Error(`알 수 없는 조우 행동: ${action}`);
		}

		if (enc.resolve <= 0) {
			Encounter.finish("win");
			return;
		}

		Encounter.npcTurn();
		Time.pass(b.roundMinutes);

		if (V.forcedPassage) {
			Encounter.finish("collapse");
			return;
		}
		if (enc.round >= b.maxRounds) {
			Encounter.finish("lose");
			return;
		}
		Engine.play("Encounter");
	},

	npcTurn() {
		const b = setup.BALANCE.encounter;
		const enc = State.variables.enc;
		if (random(1, 100) <= enc.dom) {
			Stats.apply(b.npcAggressive);
			Encounter.log(`${enc.name}이(가) 거칠게 다가온다.`);
		} else {
			Stats.apply(b.npcSoft);
			Encounter.log(`${enc.name}이(가) 낮은 목소리로 무언가 속삭인다.`);
		}
	},

	finish(result) {
		const V = State.variables;
		const enc = V.enc;
		enc.result = result;

		Stats.apply(setup.BALANCE.encounter.result[result]);
		V.record.encounters[result] = (V.record.encounters[result] || 0) + 1;

		if (enc.npcId) {
			NPC.change(enc.npcId, "dom", result === "win" ? -5 : 5);
		}

		/* 강제 전개(기절 등)가 예약돼 있으면 EncounterEnd의 "계속" 링크에서 Game.advance가 처리한다. */
		Engine.play("EncounterEnd");
	},
};
