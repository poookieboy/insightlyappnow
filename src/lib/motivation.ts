const OPENERS = [
  "Let's win today 💪",
  "You're improving every day 📈",
  "Small steps, big wins 🚀",
  "Stay curious, stay sharp ✨",
  "Your future self will thank you 🌱",
];

const ON_COMPLETE = [
  "Crushed it! 🎉",
  "One step closer 🏁",
  "Keep that momentum 🔥",
  "Brain gains unlocked 🧠",
];

const ON_REVISION = [
  "Knowledge stacked 📚",
  "Smart move! 🤓",
  "That's how mastery starts ⚡",
];

const ON_INACTIVE = [
  "Hey 👀 we miss you — 5 minutes today?",
  "A little revision goes a long way 🌟",
  "Your books miss you 📖",
];

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const motivation = {
  opener: () => pick(OPENERS),
  onComplete: () => pick(ON_COMPLETE),
  onRevision: () => pick(ON_REVISION),
  onInactive: () => pick(ON_INACTIVE),
};
