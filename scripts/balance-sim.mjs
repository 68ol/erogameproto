/*
 * 밸런스 시뮬레이터
 *
 *   ./build.sh && node scripts/balance-sim.mjs [일수=30] [반복=5]
 *
 * 빌드된 dist/index.html을 헤드리스 브라우저로 열고 플레이 성향 3종으로 N일을 플레이한다.
 * 실제 게임 화면의 링크를 클릭하므로, 패시지에서 링크를 빼거나 라벨을 바꾸면 여기 정책도 맞춰야 한다.
 *
 * Playwright가 필요하다: 로컬 node_modules 또는 전역 설치.
 */
import { createRequire } from "module";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
function loadPlaywright() {
	try {
		return require("playwright");
	} catch {
		const globalRoot = execSync("npm root -g").toString().trim();
		return require(path.join(globalRoot, "playwright"));
	}
}

const DAYS = Number(process.argv[2] ?? 30);
const RUNS = Number(process.argv[3] ?? 5);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const gameUrl = "file://" + path.join(root, "dist/index.html");

/*
 * 플레이 성향. 페이지 안에서 실행된다.
 *   careful  : 밤에는 기숙사, 피곤하면 잔다, 조우에서는 도주/저항
 *   normal   : 무작위로 돌아다니되 피곤하면 자러 감, 조우 행동도 무작위
 *   reckless : 밤거리를 선호, 거의 안 잠, 조우에서는 늘 받아들임
 */
function playInPage({ policy, days }) {
	const { State, Engine } = SugarCube;
	const pick = arr => arr[Math.floor(Math.random() * arr.length)];
	const links = () => [...document.querySelectorAll("#passages a")];
	const find = (ls, ...words) => ls.find(a => words.some(w => a.textContent.includes(w)));
	const stat = k => State.variables.player.stats[k];

	const encounterChoice = {
		careful: ls => find(ls, "도망친다") && Math.random() < 0.6 ? find(ls, "도망친다") : find(ls, "밀쳐낸다"),
		/* 보통 플레이어도 대부분은 저항한다. 받아들임은 10% */
		normal: ls => Math.random() < 0.1 ? find(ls, "받아들인다") : pick(ls.filter(a => !a.textContent.includes("받아들인다"))),
		reckless: ls => find(ls, "받아들인다"),
	};

	function choose(ls) {
		const passage = State.passage;
		if (passage === "Encounter") return encounterChoice[policy](ls);
		if (passage === "Event_NightStranger") return find(ls, "뛰어서") || find(ls, "상대한다");
		if (ls.length === 1) return ls[0];

		const tired = stat("fatigue");
		const night = Time.isNight;
		const sleep = find(ls, "잔다");
		const homeward = find(ls, "기숙사", "캠퍼스로", "광장으로");

		if (policy === "careful") {
			if ((night || tired >= 70) && sleep) return sleep;
			if (night || tired >= 70) return homeward || ls[0];
			/* 낮에는 알바를 우선 */
			return find(ls, "알바", "카페로", "번화가") && Math.random() < 0.5
				? find(ls, "알바", "카페로", "번화가")
				: pick(ls.filter(a => a !== sleep));
		}
		if (policy === "normal") {
			if (tired >= 75) return sleep || homeward || ls[0];
			return pick(ls.filter(a => a !== sleep));
		}
		/* reckless */
		if (tired >= 90) return sleep || homeward || ls[0];
		if (night) return find(ls, "번화가", "거리로", "광장으로") || pick(ls);
		return pick(ls.filter(a => a !== sleep));
	}

	Engine.play("Dorm");
	const startDay = Time.day;
	const timeline = [];
	let steps = 0;
	while (Time.day - startDay < days && steps < 20000) {
		const ls = links();
		if (!ls.length) throw new Error(`막다른 패시지: ${State.passage}`);
		(choose(ls) || pick(ls)).click();
		steps++;
		const d = Time.day - startDay;
		if (!timeline[d]) timeline[d] = stat("trauma");
	}
	const V = State.variables;
	return {
		trauma: stat("trauma"),
		control: stat("control"),
		submission: stat("submission"),
		daring: stat("daring"),
		money: V.player.money,
		encounters: V.record.encounters,
		collapses: V.record.collapses,
		breakdowns: V.record.breakdowns,
		dayTrauma1000: timeline.findIndex(t => t >= 1000),
		day15Trauma: timeline[15] ?? null,
	};
}

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const results = {};

async function run(policy) {
	const page = await browser.newPage();
	const errors = [];
	page.on("pageerror", e => errors.push(e.message));
	await page.goto(gameUrl);
	await page.waitForFunction(() => window.SugarCube?.State?.passage === "Start");
	const r = await page.evaluate(playInPage, { policy, days: DAYS });
	if (errors.length) r.errors = errors;
	await page.close();
	return r;
}

for (const policy of ["careful", "normal", "reckless"]) {
	results[policy] = await Promise.all(Array.from({ length: RUNS }, () => run(policy)));
}
await browser.close();

const avg = (rs, k) => Math.round(rs.reduce((s, r) => s + r[k], 0) / rs.length);
const sumEnc = rs => {
	const t = {};
	for (const r of rs) for (const [k, v] of Object.entries(r.encounters)) t[k] = (t[k] || 0) + v;
	return Object.entries(t).map(([k, v]) => `${k}:${(v / rs.length).toFixed(1)}`).join(" ");
};

console.log(`${DAYS}일 × ${RUNS}회 평균`);
for (const [policy, rs] of Object.entries(results)) {
	const hit = rs.filter(r => r.dayTrauma1000 >= 0).map(r => r.dayTrauma1000);
	console.log(
		`${policy.padEnd(9)} 트라우마 ${String(avg(rs, "trauma")).padStart(4)} ` +
		`(범위 ${Math.min(...rs.map(r => r.trauma))}~${Math.max(...rs.map(r => r.trauma))}, 15일차 ${avg(rs, "day15Trauma")}) ` +
		`자제력 ${avg(rs, "control")} 순종 ${avg(rs, "submission")} 대담 ${avg(rs, "daring")} ` +
		`돈 ${avg(rs, "money")} 기절 ${avg(rs, "collapses")} 붕괴 ${avg(rs, "breakdowns")} ` +
		`| 조우 ${sumEnc(rs)}` +
		(hit.length ? ` | 1000 도달일 ${hit.join(",")}` : ""),
	);
	for (const r of rs) if (r.errors) console.log("  ERROR", r.errors);
}
