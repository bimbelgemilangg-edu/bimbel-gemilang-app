// /api/questionQualityGate.js
// Final structural + semantic sanity checks.
import { clean, fingerprint } from './_lib/gemilangResearch.js';

export function validateQuestion(question, allowedTypes = ['multiple']) {
  if (!question || !allowedTypes.includes(question.type)) return { ok: false, reason: 'type_invalid' };
  if (!clean(question.question)) return { ok: false, reason: 'question_empty' };
  if (!clean(question.explanation)) return { ok: false, reason: 'explanation_empty' };
  if (!clean(question.answerVerification)) return { ok: false, reason: 'verification_empty' };

  if (question.type === 'multiple') {
    if (!Array.isArray(question.options) || question.options.length !== 4) return { ok: false, reason: 'options_invalid' };
    if (!Number.isInteger(question.correct) || question.correct < 0 || question.correct > 3) return { ok: false, reason: 'correct_invalid' };
  }

  if (question.type === 'multiselect') {
    if (!Array.isArray(question.options) || question.options.length < 2) return { ok: false, reason: 'options_invalid' };
    if (!Array.isArray(question.correctAnswers) || question.correctAnswers.length < 1) return { ok: false, reason: 'correct_answers_invalid' };
  }

  if (question.type === 'truefalse' && (!Array.isArray(question.statements) || question.statements.length < 2)) return { ok: false, reason: 'statements_invalid' };
  if (question.type === 'shortanswer' && !clean(question.shortAnswer)) return { ok: false, reason: 'shortanswer_empty' };
  if (question.type === 'causeeffect' && (!clean(question.cause) || !clean(question.effect))) return { ok: false, reason: 'causeeffect_invalid' };
  if (question.type === 'matching' && (!Array.isArray(question.matchingPairs) || question.matchingPairs.length < 2)) return { ok: false, reason: 'matching_invalid' };
  if (question.type === 'reading' && (!clean(question.readingText) || !Array.isArray(question.subQuestions) || question.subQuestions.length < 2)) return { ok: false, reason: 'reading_invalid' };

  return { ok: true, fingerprint: fingerprint(question.question) };
}

export function dedupeQuestions(questions = [], exclude = []) {
  const seen = new Set(exclude.map(fingerprint));
  const output = [];
  for (const question of questions) {
    const key = fingerprint(question.question);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(question);
  }
  return output;
}

export default { validateQuestion, dedupeQuestions };