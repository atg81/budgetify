// src/lib/localService.js
// Simple localStorage-backed service for budgets and recurring rules

const budgetsKey = (userId) => `budgetify_budgets_${userId}`;
const recurringKey = (userId) => `budgetify_recurring_${userId}`;

export function getBudgets(userId) {
  try {
    const raw = localStorage.getItem(budgetsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBudgets(userId, budgets) {
  localStorage.setItem(budgetsKey(userId), JSON.stringify(budgets || []));
}

export function getRecurring(userId) {
  try {
    const raw = localStorage.getItem(recurringKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecurring(userId, rules) {
  localStorage.setItem(recurringKey(userId), JSON.stringify(rules || []));
}

export default {
  getBudgets,
  saveBudgets,
  getRecurring,
  saveRecurring
};
