import { Activity, Area, PrototypeState } from "./types";
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function relativeDay(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dateKey(date);
}
export function prettyDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" },
) {
  return new Date(value + "T12:00:00").toLocaleDateString("en-US", options);
}
export function duration(minutes: number): string {
  if (minutes > 0 && minutes < 1) return "<1m";
  minutes = Math.round(minutes);
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${Math.floor(minutes / 60)}h${Math.round(minutes % 60) ? ` ${Math.round(minutes % 60)}m` : ""}`;
}
export function streak(activities: Activity[], area?: Area): number {
  const days = new Set(
    activities.filter((a) => !area || a.area === area).map((a) => a.date),
  );
  let count = 0,
    offset = days.has(relativeDay(0)) ? 0 : -1;
  while (days.has(relativeDay(offset))) {
    count++;
    offset--;
  }
  return count;
}
export function momentum(activities: Activity[]): number {
  const recent = activities.filter(
    (a) => a.date >= relativeDay(-13) && a.date <= relativeDay(0),
  );
  return Math.min(
    100,
    Math.round(
      (new Set(recent.map((a) => a.date)).size / 14) * 55 +
        Math.min(45, recent.length * 0.7),
    ),
  );
}
export function createSeed(): PrototypeState {
  const projects = [
    {
      id: "portfolio",
      name: "Portfolio",
      description: "A home for the work I care about.",
      color: "sage",
      milestones: [
        { id: "m1", title: "Find the structure", completed: true },
        { id: "m2", title: "Home & About", completed: true },
        { id: "m3", title: "Write the case studies", completed: false },
        { id: "m4", title: "Mobile polish", completed: false },
        { id: "m5", title: "Put it out into the world", completed: false },
      ],
    },
    {
      id: "notebook",
      name: "Developer Notebook",
      description: "Learning in public, one small idea at a time.",
      color: "clay",
      milestones: [
        { id: "n1", title: "Set up the notebook", completed: true },
        { id: "n2", title: "Publish the first three notes", completed: false },
      ],
    },
    {
      id: "search",
      name: "The next chapter",
      description: "Finding a team where I can do meaningful work.",
      color: "lavender",
      milestones: [],
    },
  ];
  const tasks = [
    {
      id: "t1",
      title: "Give the case study a clearer story",
      area: "do" as Area,
      category: "Portfolio",
      projectId: "portfolio",
      completed: false,
    },
    {
      id: "t2",
      title: "Write a note on React patterns",
      area: "do" as Area,
      category: "Coding",
      projectId: "notebook",
      completed: false,
    },
    {
      id: "t3",
      title: "Reach out to one interesting team",
      area: "do" as Area,
      category: "Job search",
      projectId: "search",
      completed: false,
    },
    {
      id: "t4",
      title: "Polish the About page",
      area: "do" as Area,
      category: "Portfolio",
      projectId: "portfolio",
      completed: true,
    },
    {
      id: "t5",
      title: "A long walk with Milo",
      area: "be" as Area,
      category: "Move",
      completed: false,
    },
    {
      id: "t6",
      title: "A little Italian conversation",
      area: "be" as Area,
      category: "Learn",
      completed: false,
    },
    {
      id: "t7",
      title: "Read a chapter, phone away",
      area: "be" as Area,
      category: "Rest",
      completed: false,
    },
  ];
  const examples = [
    {
      title: "Made the case study a little clearer",
      area: "do" as Area,
      category: "Portfolio",
      projectId: "portfolio",
      minutes: 65,
    },
    {
      title: "A note on something I learned",
      area: "do" as Area,
      category: "Coding",
      projectId: "notebook",
      minutes: 45,
    },
    {
      title: "Found a team worth reaching out to",
      area: "do" as Area,
      category: "Job search",
      projectId: "search",
      minutes: 30,
    },
    {
      title: "A walk with Milo",
      area: "be" as Area,
      category: "Move",
      minutes: 40,
      distanceKm: 3.2,
    },
    {
      title: "Italian, one conversation at a time",
      area: "be" as Area,
      category: "Learn",
      minutes: 25,
    },
    {
      title: "A few pages, a quiet evening",
      area: "be" as Area,
      category: "Rest",
      minutes: 35,
    },
  ];
  const activities: Activity[] = [];
  for (let i = 181; i >= 1; i--) {
    if (i === 17 || (i > 17 && (i * 13) % 11 < 3)) continue;
    for (let j = 0; j < 1 + ((i * 7) % 5); j++) {
      const available =
        i <= 16
          ? examples.filter((e) =>
              i >= 11 ? e.area === "be" : i === 8 ? e.area === "do" : true,
            )
          : examples;
      const example = available[(i + j * 3) % available.length];
      activities.push({
        ...example,
        id: `seed-${i}-${j}`,
        date: relativeDay(-i),
        kind: example.area === "do" ? "session" : "activity",
        source: "sample",
        minutes: example.minutes + (i % 3) * 5,
      });
    }
    if (
      i <= 10 &&
      !activities.some((a) => a.date === relativeDay(-i) && a.area === "do")
    )
      activities.push({
        ...examples[0],
        id: `extra-do-${i}`,
        date: relativeDay(-i),
        kind: "session",
        source: "sample",
      });
    if (
      i <= 7 &&
      !activities.some((a) => a.date === relativeDay(-i) && a.area === "be")
    )
      activities.push({
        ...examples[3],
        id: `extra-be-${i}`,
        date: relativeDay(-i),
        kind: "activity",
        source: "sample",
      });
  }
  activities.push(
    {
      id: "today-1",
      title: "Polished the About page",
      date: relativeDay(0),
      area: "do",
      category: "Portfolio",
      kind: "session",
      minutes: 50,
      projectId: "portfolio",
      note: "Finally feels like me. Simplified the intro and fixed the mobile spacing.",
      source: "sample",
    },
    {
      id: "today-2",
      title: "A slow morning walk with Milo",
      date: relativeDay(0),
      area: "be",
      category: "Move",
      kind: "activity",
      minutes: 38,
      distanceKm: 2.8,
      note: "Took the longer way through the park.",
      source: "sample",
    },
    {
      id: "today-3",
      title: "Italian over coffee",
      date: relativeDay(0),
      area: "be",
      category: "Learn",
      kind: "activity",
      minutes: 22,
      source: "sample",
    },
  );
  const month = relativeDay(0).slice(0, 7);
  return {
    version: 1,
    user: { id: "local-user", name: "Alex" },
    tasks,
    projects,
    activities,
    sessions: activities
      .filter((a) => a.kind === "session")
      .map((a) => ({
        id: `history-${a.id}`,
        taskId:
          a.projectId === "notebook"
            ? "t2"
            : a.projectId === "search"
              ? "t3"
              : "t1",
        startedAt: `${a.date}T09:00:00.000Z`,
        durationSeconds: a.minutes * 60,
        date: a.date,
        note: a.note || a.title,
      })),
    checkIns: [],
    challenges: [
      {
        id: "explore",
        title: "Be a beginner again.",
        description:
          "Three things you’ve never tried. No need to be good at any of them.",
        category: "Explore",
        target: 3,
        month,
      },
      {
        id: "build",
        title: "Make something, share something.",
        description:
          "Let one small thing you made find its way into the world.",
        category: "Build",
        target: 1,
        month,
      },
      {
        id: "stretch",
        title: "Take the slightly braver option.",
        description:
          "Go to an event on your own. Start a conversation. See what happens.",
        category: "Stretch",
        target: 2,
        month,
      },
    ],
    completions: [
      {
        id: "c1",
        challengeId: "explore",
        title: "The long way home",
        photo: "/memories/hills.svg",
        photoIsSample: true,
        note: "A trail I’d walked past a hundred times. Today I finally took it. Milo approved.",
        date: relativeDay(-4),
        location: "Outside the city",
        again: "Yes",
      },
      {
        id: "c2",
        challengeId: "stretch",
        title: "A table for one",
        photo: "/memories/cafe.svg",
        photoIsSample: true,
        note: "Took my book to a new café. Stayed for two hours. Being alone felt different here.",
        date: relativeDay(-10),
        location: "The little corner café",
        again: "Yes",
      },
      {
        id: "c3",
        challengeId: "build",
        title: "Something made by hand",
        photo: "/memories/studio.svg",
        photoIsSample: true,
        note: "First pottery class. An uneven little bowl, and a very good afternoon.",
        date: relativeDay(-22),
        location: "Sunday studio",
        again: "Maybe",
      },
    ],
  };
}
