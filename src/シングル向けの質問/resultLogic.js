// resultLogic.js
// 診断結果オブジェクトを組み立てる

import { SINGLE_TYPES } from "./typeDefinitions.js";

// 各タイプの一言説明（汎用複合テンプレ用）
const TYPE_SHORT_DESC = {
  A: "傷つく前に距離を取り、深く関わる前に閉じる傾向",
  B: "強くつながりを求め、相手の変化に過敏に反応する傾向",
  C: "波風を避けて合わせすぎ、自分の気持ちを後回しにする傾向",
  D: "安定に退屈を感じ、自ら関係に変化を起こしやすい傾向",
  E: "理想に合うかを厳しく見極め、欠点で相手を切り捨てやすい傾向",
  F: "相手を救うことに強い動機を持ち、尽くしすぎる傾向",
  G: "相手と完全に溶け合おうとし、自他の区別が薄くなる傾向",
};

// 未定義複合型の汎用テンプレを生成
function buildFallbackType(mainType, typeScores) {
  const types = mainType.split('').filter(c => SINGLE_TYPES[c]);
  if (types.length < 2) return null;

  const [tA, tB] = types;
  const defA = SINGLE_TYPES[tA];
  const defB = SINGLE_TYPES[tB];
  if (!defA || !defB) return null;

  const px = Math.floor(((defA.position?.x ?? 50) + (defB.position?.x ?? 50)) / 2);
  const py = Math.floor(((defA.position?.y ?? 50) + (defB.position?.y ?? 50)) / 2);

  // mapAreaKeyを座標から判定
  let mapAreaKey;
  if (px < 50 && py < 50)       mapAreaKey = "TOP_LEFT";
  else if (px >= 50 && py < 50)  mapAreaKey = "TOP_RIGHT";
  else if (px < 50 && py >= 50)  mapAreaKey = "BOTTOM_LEFT";
  else                            mapAreaKey = "BOTTOM_RIGHT";

  return {
    name:         `${defA.officialName} × ${defB.officialName} 複合型`,
    nickname:     `${defA.nickname} × ${defB.nickname}`,
    officialName: `${defA.officialName} × ${defB.officialName} 複合型`,
    bugName:      `${defA.bugName} × ${defB.bugName}`,
    warning:      `${defA.officialName}と${defB.officialName}の両方が高い複合型です`,
    mapArea:      "-",
    mapLabel:     "-",
    mapAreaKey,
    position:     { x: px, y: py, z: null },
    coreText:     `${defA.officialName}と${defB.officialName}の両方が高い複合型です。${TYPE_SHORT_DESC[tA]}と${TYPE_SHORT_DESC[tB]}が同時に働きやすい状態です。`,
    coachAccept:  `お前には『${defA.bugName}』と『${defB.bugName}』が同時に作動している。両方がバグを起こすと、出口のない地獄のループに入り込むブー。\n\nでも、それはお前が弱いからじゃない。両方の感受性を持っているからこそ、どちらの痛みも誰よりも深く理解できるブー。`,
    coachCut:     `だが、その二つのバグが連鎖して暴走すると最悪だブー。どちらに行っても苦しい状況を自分で作り出してしまうんだブー。`,
    coachAction:  `今日から意識すること、1つだけ教えるブー。『自分が今どちらのバグで動いているか、名前をつけて観察する』ことだ。感情が動いた時、「これは${tA}バグか？${tB}バグか？」と一歩引いて見る。この単純な筋トレから始めるんだブー！`,
  };
}

// 【1】診断結果オブジェクトを組み立てる
export function buildResult(judgeResult, safetyTriggers, step2Answers) {
  const { mainType, thirdType, totalScore, zone, highTypes, scores } = judgeResult;
  const {
    needsFollowB,
    needsFollowC,
    needsRedZone,
    needsFreezeOrFawn,
  } = safetyTriggers;

  // タイプ定義を取得（未定義の場合は汎用複合テンプレ）
  let typeDef = SINGLE_TYPES[mainType];
  if (!typeDef) {
    typeDef = buildFallbackType(mainType, scores) || {
      name: mainType,
      mapArea: "-",
      mapAreaKey: "CENTER",
      coreText: "（タイプ定義を追加予定）",
      position: { x: 50, y: 50, z: null },
    };
  }

  // 安全網フォローメッセージの組み立て
  const followMessages = [];
  if (needsFollowB)      followMessages.push("一人で抱えすぎるなよブー");
  if (needsFollowC)      followMessages.push("限界超えてるなら逃げていいブー");
  if (needsRedZone)      followMessages.push("今日だけは自分を責めるなブー");
  if (needsFreezeOrFawn) followMessages.push("黙ってた分だけ、お前は十分頑張ったブー");

  // 3位タイプの補足メッセージ
  if (thirdType && SINGLE_TYPES[thirdType]) {
    followMessages.push(`※${SINGLE_TYPES[thirdType].officialName}の傾向も混ざりやすい状態です`);
  }

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
    position:     typeDef.position     || { x: 50, y: 50, z: null },
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
