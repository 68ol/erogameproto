/*
 * NPC
 *
 * 네임드 NPC는 setup.NPC_DEFS에 정의한다. 이름, 성격, 역할은 임시값이니 자유롭게 바꾼다.
 * 나이는 반드시 setup.MIN_NPC_AGE(20) 이상이어야 하며, 아니면 게임 시작 시 에러로 막는다.
 *
 * 관계 수치
 *   love : 호감   (-100 ~ 100)
 *   lust : 욕구   (0 ~ 100)
 *   dom  : 지배성 (0 ~ 100)  높을수록 조우에서 공격적으로 나온다
 */
setup.NPC_DEFS = {
	senior: {
		name: "선배(임시)",
		age: 24,
		role: "같은 과 4학년 선배",
		personality: "다정해 보이지만 속을 알 수 없다",
		init: { love: 10, lust: 0, dom: 40 },
	},
	barista: {
		name: "점장(임시)",
		age: 31,
		role: "알바하는 카페의 점장",
		personality: "엄격하고 계산적이다",
		init: { love: 0, lust: 0, dom: 60 },
	},
};

setup.NPC_RANGES = {
	love: [-100, 100],
	lust: [0, 100],
	dom: [0, 100],
};

function assertAdult(npc, id) {
	if (typeof npc.age !== "number" || npc.age < setup.MIN_NPC_AGE) {
		throw new Error(`NPC "${id}"의 나이(${npc.age})가 최소 나이 ${setup.MIN_NPC_AGE}세 미만입니다.`);
	}
}

for (const [id, def] of Object.entries(setup.NPC_DEFS)) assertAdult(def, id);

window.NPC = {
	init() {
		const npcs = {};
		for (const [id, def] of Object.entries(setup.NPC_DEFS)) {
			npcs[id] = { ...clone(def.init), met: false };
		}
		return npcs;
	},

	def(id) {
		const def = setup.NPC_DEFS[id];
		if (!def) throw new Error(`알 수 없는 NPC: ${id}`);
		return def;
	},

	state(id) {
		return State.variables.npcs[id];
	},

	name(id) {
		return NPC.def(id).name;
	},

	change(id, key, delta) {
		const [min, max] = setup.NPC_RANGES[key];
		const npc = NPC.state(id);
		npc[key] = Math.clamp(npc[key] + delta, min, max);
	},

	meet(id) {
		NPC.state(id).met = true;
	},

	/*
	 * 랜덤 조우용 일회성 NPC. 나이는 MIN_NPC_AGE 이상에서만 뽑는다.
	 */
	generate() {
		const descs = ["낯선 남자", "낯선 여자", "취한 남자", "취한 여자", "정장 차림의 남자", "후드를 쓴 여자"];
		const npc = {
			name: descs[random(0, descs.length - 1)],
			age: random(setup.MIN_NPC_AGE, 45),
			dom: random(20, 90),
		};
		assertAdult(npc, "generated");
		return npc;
	},
};
