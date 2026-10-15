/*
 * 랜덤 이벤트
 *
 * 장소로 이동할 때마다 해당 장소의 이벤트를 굴린다.
 *   location : 이벤트가 터지는 장소 패시지 이름
 *   chance   : 발생 확률 (%)
 *   when     : 추가 조건 (시간대, NPC 상태, 스탯 등)
 *   daily    : true면 하루 한 번만
 *   group    : 같은 그룹끼리 하루 발생 횟수를 공유 (상한은 BALANCE.events.groupPerDay)
 *   passage  : 발생 시 이동할 패시지. 끝나면 State.variables.returnTo 로 돌아간다.
 */
setup.EVENTS = [
	{
		id: "plaza_night_stranger",
		location: "CampusPlaza",
		get chance() { return setup.BALANCE.events.plazaNightStranger; },
		when: () => Time.isNight,
		group: "stranger",
		passage: "Event_NightStranger",
	},
	{
		id: "downtown_night_stranger",
		location: "Downtown",
		get chance() { return setup.BALANCE.events.downtownNightStranger; },
		when: () => Time.isNight,
		group: "stranger",
		passage: "Event_NightStranger",
	},
	{
		id: "library_meet_senior",
		location: "Library",
		get chance() { return setup.BALANCE.events.librarySenior; },
		when: () => !NPC.state("senior").met && !Time.isNight,
		daily: true,
		passage: "Event_MeetSenior",
	},
];

window.Events = {
	roll(location) {
		const V = State.variables;
		const candidates = setup.EVENTS
			.filter(ev => ev.location === location)
			.filter(ev => !(ev.daily && V.daily[`ev_${ev.id}`]))
			.filter(ev => !ev.group || (V.daily[`group_${ev.group}`] || 0) < setup.BALANCE.events.groupPerDay[ev.group])
			.filter(ev => !ev.when || ev.when());

		for (const ev of candidates.shuffle()) {
			if (random(1, 100) <= ev.chance) {
				if (ev.daily) V.daily[`ev_${ev.id}`] = true;
				if (ev.group) V.daily[`group_${ev.group}`] = (V.daily[`group_${ev.group}`] || 0) + 1;
				return ev;
			}
		}
		return null;
	},
};
