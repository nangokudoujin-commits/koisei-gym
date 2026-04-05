// resultLogic.js
// 診断結果オブジェクトを組み立てる

import { SINGLE_TYPES } from "./typeDefinitions.js";

// 【1】診断結果オブジェクトを組み立てる
export function buildResult(judgeResult, safetyTriggers, step2Answers) {
  const { mainType, totalScore, zone, highTypes, scores } = judgeResult;
  const {
    needsFollowB,
    needsFollowC,
    needsRedZone,
    needsFreezeOrFawn,
  } = safetyTriggers;

  // タイプ定義を取得（存在しない場合はフォールバック）
  const typeDef = SINGLE_TYPES[mainType] || {
    name: mainType,
    mapArea: "-",
    mapAreaKey: "CENTER",
    coreText: "（タイプ定義を追加予定）",
  };

  // 安全網フォローメッセージの組み立て
  const followMessages = [];
  if (needsFollowB)        followMessages.push("一人で抱えすぎるなよブー");
  if (needsFollowC)        followMessages.push("限界超えてるなら逃げていいブー");
  if (needsRedZone)        followMessages.push("今日だけは自分を責めるなブー");
  if (needsFreezeOrFawn)   followMessages.push("黙ってた分だけ、お前は十分頑張ったブー");

  // OSプロフィールの組み立て
  const s2 = step2Answers || {};
  const osProfile = {
    responseStyle: s2.S2Q1 === "A" ? "システム・解決型"
                 : s2.S2Q1 === "B" ? "情緒・共有型"
                 : "",
    contextStyle:  s2.S2Q2 === "A" ? "ローコンテキスト・明言型"
                 : s2.S2Q2 === "B" ? "ハイコンテキスト・空気読み型"
                 : "",
    depthStyle:    s2.S2Q3 === "A" ? "深く・じっくり"
                 : s2.S2Q3 === "B" ? "広く・こまめに"
                 : "",
  };

  return {
    mainType,
    typeName:     typeDef.name,
    nickname:     typeDef.nickname     || typeDef.name,
    officialName: typeDef.officialName || "",
    bugName:      typeDef.bugName      || "",
    warning:      typeDef.warning      || "",
    mapArea:      typeDef.mapArea,
    mapLabel:     typeDef.mapLabel     || typeDef.mapArea,
    mapAreaKey:   typeDef.mapAreaKey,
    coreText:     typeDef.coreText,
    zone,
    totalScore,
    scores:       scores || {},
    coachAccept:  typeDef.coachAccept  || "",
    coachCut:     typeDef.coachCut     || "",
    coachAction:  typeDef.coachAction  || "",
    followMessages,
    osProfile,
  };
}
