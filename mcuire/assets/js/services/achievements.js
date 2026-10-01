// Achievements + challenges, computed from the cook log (never stored as
// truth on the client, so the rules can change without migrations).

import { store } from './store.js';

function cooked() {
  return store.kitchen.cookLog;
}

function distinctInCategory(categoryId) {
  const ids = new Set(cooked().map((l) => l.recipeId));
  return [...ids].filter((id) => store.recipe(id)?.categoryId === categoryId).length;
}

function ruleProgress(rule) {
  switch (rule.type) {
    case 'recipesCompleted': {
      const n = new Set(cooked().map((l) => l.recipeId)).size;
      return { value: Math.min(n, rule.count), target: rule.count };
    }
    case 'recipe':
      return { value: cooked().some((l) => l.recipeId === rule.recipeId) ? 1 : 0, target: 1 };
    case 'category':
      return { value: Math.min(distinctInCategory(rule.categoryId), rule.count), target: rule.count };
    case 'servings':
      return { value: cooked().some((l) => l.servings >= rule.min) ? 1 : 0, target: 1 };
    case 'certificate':
      return { value: store.certificate(rule.courseId) ? 1 : 0, target: 1 };
    default:
      return { value: 0, target: 1 };
  }
}

export function achievements() {
  return store.content.achievements.map((a) => {
    const p = ruleProgress(a.rule);
    return { ...a, ...p, earned: p.value >= p.target };
  });
}

function goalProgress(goal) {
  if (goal.categoryId) {
    return { value: Math.min(distinctInCategory(goal.categoryId), goal.distinct), target: goal.distinct, label: `${goal.distinct} different ${store.category(goal.categoryId).name.toLowerCase()}` };
  }
  const logs = cooked().filter((l) => l.recipeId === goal.recipeId);
  const name = store.recipe(goal.recipeId)?.title || 'recipe';
  if (goal.minServings) {
    return { value: logs.some((l) => l.servings >= goal.minServings) ? 1 : 0, target: 1, label: `Cook ${name} for ${goal.minServings}+ people` };
  }
  return { value: Math.min(logs.length, goal.times), target: goal.times, label: `Cook ${name} ${goal.times} times` };
}

export function challenges() {
  return store.content.challenges.map((c) => {
    const goals = c.goals.map(goalProgress);
    const value = goals.reduce((s, g) => s + g.value, 0);
    const target = goals.reduce((s, g) => s + g.target, 0);
    return { ...c, goals, value, target, done: value >= target };
  });
}

// Achievements newly earned since `before` (array of ids). Used for the completion celebration.
export function newlyEarned(beforeIds) {
  return achievements().filter((a) => a.earned && !beforeIds.includes(a.id));
}
