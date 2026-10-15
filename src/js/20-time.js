/*
 * 게임 시간. $time은 1일차(월요일) 00:00부터 흐른 분(minute).
 * 모든 행동은 Time.pass(분)으로 시간을 소모하고, 시/일 경계를 넘을 때마다 틱이 돈다.
 */
setup.WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
setup.START_TIME = 8 * 60; // 1일차 08:00 시작

window.Time = {
	get now() { return State.variables.time; },
	get minute() { return Time.now % 60; },
	get hour() { return Math.floor(Time.now / 60) % 24; },
	get day() { return Math.floor(Time.now / 1440) + 1; },
	get weekdayIndex() { return (Time.day - 1) % 7; },
	get weekday() { return setup.WEEKDAYS[Time.weekdayIndex]; },
	get isWeekend() { return Time.weekdayIndex >= 5; },

	get period() {
		const h = Time.hour;
		if (h < 6) return "새벽";
		if (h < 12) return "아침";
		if (h < 18) return "낮";
		if (h < 22) return "저녁";
		return "밤";
	},

	get isNight() { return Time.hour >= 22 || Time.hour < 6; },

	between(fromHour, toHour) {
		const h = Time.hour;
		return fromHour <= toHour ? h >= fromHour && h < toHour : h >= fromHour || h < toHour;
	},

	label() {
		const hh = String(Time.hour).padStart(2, "0");
		const mm = String(Time.minute).padStart(2, "0");
		return `${Time.day}일차 (${Time.weekday}) ${hh}:${mm} · ${Time.period}`;
	},

	formatDuration(minutes) {
		if (minutes < 60) return `${minutes}분`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m ? `${h}시간 ${m}분` : `${h}시간`;
	},

	pass(minutes) {
		const V = State.variables;
		for (let i = 0; i < minutes; i++) {
			V.time++;
			if (V.time % 60 === 0) Time.onHour();
			if (V.time % 1440 === 0) Time.onDay();
		}
	},

	onHour() {
		Stats.hourlyTick();
	},

	onDay() {
		State.variables.daily = {};
	},
};
