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

  // ===== 隠しタイプ判定（通常判定より優先） =====

  // ① 全回路オーバーヒート：HIGHが5個以上
  if (highTypes.length >= 5) {
    return { highTypes, mainType: "OVERHEAT", thirdType: null, totalScore, zone, scores: typeScores };
  }

  // ② フルシールドモード：HIGHが0 かつ 総合スコアが30点以下
  if (highTypes.length === 0 && totalScore <= 30) {
    return { highTypes, mainType: "FULLSHIELD", thirdType: null, totalScore, zone, scores: typeScores };
  }

  // ③ 輪郭ぼかしモード：HIGHが0 かつ（LOWが0 または 総合スコアが31〜49点）
  if (highTypes.length === 0) {
    const lowTypes = types.filter(t => getTypeLevel(typeScores[t]) === "LOW");
    if (lowTypes.length === 0 || (totalScore >= 31 && totalScore <= 49)) {
      return { highTypes, mainType: "BLUR", thirdType: null, totalScore, zone, scores: typeScores };
    }
  }

  // ④ 矛盾ショート：矛盾ペアが2ペア以上同時成立
  const paradoxPairs = [
    ["A", "B"],
    ["A", "G"],
    ["C", "E"],
  ];
  const activePairs = paradoxPairs.filter(
    ([a, b]) => getTypeLevel(typeScores[a]) === "HIGH" && getTypeLevel(typeScores[b]) === "HIGH"
  );
  if (activePairs.length >= 2) {
    return { highTypes, mainType: "PARADOX", thirdType: null, totalScore, zone, scores: typeScores };
  }

  // ===== 通常タイプ判定 =====

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
