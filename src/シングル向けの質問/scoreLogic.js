// scoreLogic.js
// STEP1スコア計算・タイプ判定・安全網トリガー

// 【1】STEP1の回答からA〜G各タイプのスコアを計算
export function calcTypeScores(answers) {
  const types = ["A", "B", "C", "D", "E", "F", "G"];
  const scores = {};
  for (const type of types) {
    scores[type] =
      (answers[`${type}1`] || 0) +
      (answers[`${type}2`] || 0) +
      (answers[`${type}3`] || 0);
  }
  return scores;
}

// 【2】スコアをLOW/MID/HIGHに変換
export function getTypeLevel(score) {
  if (score >= 12) return "HIGH";
  if (score >= 7) return "MID";
  return "LOW";
}

// 【3】メインタイプ・複合タイプ・全体ゾーンを判定
export function judgeMainType(typeScores) {
  const types = ["A", "B", "C", "D", "E", "F", "G"];

  // HIGH タイプを抽出
  const highTypes = types.filter(t => getTypeLevel(typeScores[t]) === "HIGH");

  // 全体合計
  const totalScore = types.reduce((sum, t) => sum + (typeScores[t] || 0), 0);

  // ゾーン判定
  let zone;
  if (totalScore >= 70) zone = "RED";
  else if (totalScore >= 45) zone = "YELLOW";
  else zone = "GREEN";

  // tiebreak優先順：C→F→B→G→A→D→E
  const TIEBREAK_ORDER = ["C","F","B","G","A","D","E"];

  // mainType判定
  let mainType;
  let thirdType = null; // 3位タイプ（補足表示用）

  if (highTypes.length === 0) {
    mainType = "SECURE";
  } else if (highTypes.length === 1) {
    mainType = highTypes[0];
  } else if (highTypes.length === 2) {
    mainType = [...highTypes].sort().join("");
  } else {
    // 3個以上→tiebreak優先順で上位2タイプを選択
    const sorted = [...highTypes].sort((a, b) => {
      const scoreA = typeScores[a], scoreB = typeScores[b];
      if (scoreB !== scoreA) return scoreB - scoreA;
      return TIEBREAK_ORDER.indexOf(a) - TIEBREAK_ORDER.indexOf(b);
    });
    const top2 = sorted.slice(0, 2).sort();
    mainType = top2.join("");
    // 3位タイプを補足用に保持
    thirdType = sorted[2] || null;
  }

  return { highTypes, mainType, thirdType, totalScore, zone, scores: typeScores };
}

// 【4】安全網トリガーの判定
export function getSafetyTriggers(typeScores, step1Answers, step3Answers) {
  const types = ["A", "B", "C", "D", "E", "F", "G"];
  const totalScore = types.reduce((sum, t) => sum + (typeScores[t] || 0), 0);

  const s3q1 = step3Answers?.S3Q1 || [];

  return {
    needsFollowB: typeScores.B >= 12 && step1Answers?.B3 === 5,
    needsFollowC: typeScores.C >= 12 && step1Answers?.C3 === 5,
    needsRedZone: totalScore >= 70,
    needsFreezeOrFawn: s3q1.includes("freeze") || s3q1.includes("fawn"),
  };
}
