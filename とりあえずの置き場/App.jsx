import { useState } from "react";
import { anchorQuestions } from './シングル向けの質問/anchor';
import { step1Questions } from './シングル向けの質問/step1';
import { step2Questions } from './シングル向けの質問/step2';
import { step3Questions } from './シングル向けの質問/step3';
import { calcTypeScores, judgeMainType, getSafetyTriggers } from './シングル向けの質問/scoreLogic';
import { buildResult } from './シングル向けの質問/resultLogic';

function ProgressBar({ percent }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "6px", marginBottom: "6px" }}>
        <div style={{ background: "linear-gradient(90deg, #ff6b9d, #ff9a3c)", height: "100%", borderRadius: "10px", width: percent + "%", transition: "width 0.4s" }} />
      </div>
      <p style={{ textAlign: "right", fontSize: "12px", color: "#aaa" }}>{percent}%</p>
    </div>
  );
}

function MidMessage({ message, onContinue }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.centerBlock}>
          <div style={styles.bigEmoji}>🐷💦</div>
          <p style={{ fontSize: "16px", lineHeight: "1.9", color: "white", fontWeight: "bold", textAlign: "center" }}>{message}</p>
          <button style={{ ...styles.primaryBtn, marginTop: "20px" }} onClick={onContinue}>続けるブー！</button>
        </div>
      </div>
    </div>
  );
}

function IntroScreen({ emoji, title, message, onNext, onBack }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.centerBlock}>
          <div style={styles.bigEmoji}>{emoji}</div>
          <h2 style={styles.doneTitle}>{title}</h2>
          <div style={styles.infoBox}>
            <p style={{ fontSize: "15px", lineHeight: "1.9", color: "white", fontWeight: "bold" }}>{message}</p>
          </div>
          <div style={styles.btnRow}>
            <button style={styles.backBtn} onClick={onBack}>← 戻る</button>
            <button style={{ ...styles.nextBtn, flex: 1 }} onClick={onNext}>いくブー！ →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen]     = useState('start');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers]   = useState({});
  const [result, setResult]     = useState(null);
  const [s3Buffer, setS3Buffer] = useState([]);

  const totalQ = anchorQuestions.length + step1Questions.length + step2Questions.length + step3Questions.length;

  function calcPercent() {
    if (screen === 'start') return 0;
    if (screen === 'anchor') return Math.round((currentQ / totalQ) * 100);
    if (screen === 'step1' || screen === 'step1_mid') {
      return Math.round(((anchorQuestions.length + currentQ) / totalQ) * 100);
    }
    if (screen === 'step2_intro' || screen === 'step2') {
      const base = anchorQuestions.length + step1Questions.length;
      return Math.round(((base + (screen === 'step2_intro' ? 0 : currentQ)) / totalQ) * 100);
    }
    if (screen === 'step3_intro' || screen === 'step3') {
      const base = anchorQuestions.length + step1Questions.length + step2Questions.length;
      return Math.round(((base + (screen === 'step3_intro' ? 0 : currentQ)) / totalQ) * 100);
    }
    return 100;
  }

  function handleAnchorAnswer(id, value) {
    const newAnswers = { ...answers, [id]: value };
    setAnswers(newAnswers);
    if (currentQ < anchorQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setCurrentQ(0);
      setScreen('step1');
    }
  }

  function handleStep1Answer(id, value) {
    const newAnswers = { ...answers, [id]: value };
    setAnswers(newAnswers);
    const next = currentQ + 1;
    if (next === 10 || next === 20) {
      setCurrentQ(next);
      setScreen('step1_mid');
    } else if (next >= step1Questions.length) {
      setCurrentQ(0);
      setScreen('step2_intro');
    } else {
      setCurrentQ(next);
    }
  }

  function handleStep2Answer(id, value) {
    const newAnswers = { ...answers, [id]: value };
    setAnswers(newAnswers);
    const next = currentQ + 1;
    if (next >= step2Questions.length) {
      setCurrentQ(0);
      setScreen('step3_intro');
    } else {
      setCurrentQ(next);
    }
  }

  function toggleS3Option(optionId) {
    setS3Buffer(prev => prev.includes(optionId) ? prev.filter(x => x !== optionId) : [...prev, optionId]);
  }

  function handleStep3Next(id) {
    const newAnswers = { ...answers, [id]: s3Buffer };
    setAnswers(newAnswers);
    setS3Buffer([]);
    const next = currentQ + 1;
    if (next >= step3Questions.length) {
      const typeScores     = calcTypeScores(newAnswers);
      const judgeResult    = judgeMainType(typeScores);
      const safetyTriggers = getSafetyTriggers(typeScores, newAnswers, newAnswers);
      const step2Ans       = { S2Q1: newAnswers.S2Q1, S2Q2: newAnswers.S2Q2, S2Q3: newAnswers.S2Q3 };
      const res            = buildResult(judgeResult, safetyTriggers, step2Ans);
      setResult(res);
      setScreen('result');
    } else {
      setCurrentQ(next);
    }
  }

  const percent = calcPercent();

  // START
  if (screen === 'start') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.pigIcon}>🐷</div>
            <h1 style={styles.appTitle}>鬼豚コーチの【恋クセ】パーソナルジム</h1>
            <p style={styles.subtitle}>心理テストで、あなたの「恋の自爆パターン」を徹底分析。<br />短い恋の傾向を理解するために、鬼豚コーチがサポートするブー！</p>
          </div>
          <div style={styles.infoBox}>
            <p style={styles.infoTitle}>📝 はじめる前に</p>
            <p style={styles.infoText}>特定の1人を思い浮かべてください。</p>
            <p style={styles.infoText}>付き合っていた人でも、好きだった人でも構いません。</p>
            <p style={styles.infoText}>その人との記憶を持ちながら、以下の質問に答えてブー。</p>
            <p style={styles.infoNote}>※ このチェックは結果を断定するものではなく、自分の恋愛パターンに気づくきっかけを作るものだブー。</p>
          </div>
          <button style={styles.primaryBtn} onClick={() => { setCurrentQ(0); setScreen('anchor'); }}>
            🐷 診断をはじめるブー！
          </button>
        </div>
      </div>
    );
  }

  // ANCHOR
  if (screen === 'anchor') {
    const q = anchorQuestions[currentQ];
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.pigIcon}>🐷</div>
            <h1 style={styles.appTitle}>鬼豚コーチの【恋クセ】パーソナルジム</h1>
          </div>
          <ProgressBar percent={percent} />
          <p style={styles.stepLabel}>導入　{currentQ + 1} / {anchorQuestions.length}</p>
          <p style={styles.questionText}>{q.question}</p>
          <div style={styles.options}>
            {q.options.map((opt, i) => (
              <button key={i}
                style={answers[q.id] === opt ? { ...styles.optionBtn, ...styles.optionSelected } : styles.optionBtn}
                onClick={() => handleAnchorAnswer(q.id, opt)}>
                {opt}
              </button>
            ))}
          </div>
          <div style={styles.btnRow}>
            <button style={styles.backBtn} onClick={() => { if (currentQ > 0) { setCurrentQ(currentQ - 1); } else { setScreen('start'); } }}>← 戻る</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP1 中間メッセージ
  if (screen === 'step1_mid') {
    const msg = currentQ === 10 ? "折り返しだブー。正直に答えてるか？ブー" : "もう少しだブー。最後まで付き合えブー";
    return <MidMessage message={msg} onContinue={() => setScreen('step1')} />;
  }

  // STEP1
  if (screen === 'step1') {
    const q = step1Questions[currentQ];
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.pigIcon}>🐷</div>
            <h1 style={styles.appTitle}>鬼豚コーチの【恋クセ】パーソナルジム</h1>
          </div>
          <ProgressBar percent={percent} />
          <p style={styles.stepLabel}>STEP1　{currentQ + 1} / {step1Questions.length}</p>
          <p style={styles.questionText}>{q.question}</p>
          <div style={styles.scaleWrap}>
            <div style={styles.scaleLabels}><span>まったく当てはまらない</span><span>非常に当てはまる</span></div>
            <div style={styles.scaleBtns}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n}
                  style={answers[q.id] === n ? { ...styles.scaleBtn, ...styles.scaleBtnOn } : styles.scaleBtn}
                  onClick={() => handleStep1Answer(q.id, n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.btnRow}>
            <button style={styles.backBtn} onClick={() => { if (currentQ > 0) { setCurrentQ(currentQ - 1); } else { setCurrentQ(anchorQuestions.length - 1); setScreen('anchor'); } }}>← 戻る</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP2 イントロ
  if (screen === 'step2_intro') {
    return (
      <IntroScreen
        emoji="🐷🧠"
        title="STEP2 スタートだブー！"
        message="次はお前のコミュニケーションのOSを見るブー。直感で答えろブー！"
        onNext={() => { setCurrentQ(0); setScreen('step2'); }}
        onBack={() => { setCurrentQ(step1Questions.length - 1); setScreen('step1'); }}
      />
    );
  }

  // STEP2
  if (screen === 'step2') {
    const q = step2Questions[currentQ];
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.pigIcon}>🐷</div>
            <h1 style={styles.appTitle}>鬼豚コーチの【恋クセ】パーソナルジム</h1>
          </div>
          <ProgressBar percent={percent} />
          <p style={styles.stepLabel}>STEP2　{currentQ + 1} / {step2Questions.length}</p>
          <p style={styles.questionText}>{q.question}</p>
          <div style={styles.options}>
            {[
              { key: 'A', label: q.optionA.label, text: q.optionA.text },
              { key: 'B', label: q.optionB.label, text: q.optionB.text },
            ].map(opt => (
              <button key={opt.key}
                style={answers[q.id] === opt.key ? { ...styles.optionBtn, ...styles.optionSelected } : styles.optionBtn}
                onClick={() => handleStep2Answer(q.id, opt.key)}>
                <strong>{opt.label}</strong><br />
                <span style={{ fontSize: "12px" }}>{opt.text}</span>
              </button>
            ))}
          </div>
          <div style={styles.btnRow}>
            <button style={styles.backBtn} onClick={() => { if (currentQ > 0) { setCurrentQ(currentQ - 1); } else { setScreen('step2_intro'); } }}>← 戻る</button>
          </div>
        </div>
      </div>
    );
  }

  // STEP3 イントロ
  if (screen === 'step3_intro') {
    return (
      <IntroScreen
        emoji="🐷⚡"
        title="最後だブー！"
        message="バグが起きたときのお前を見るブー。正直に答えろブー！"
        onNext={() => { setCurrentQ(0); setS3Buffer([]); setScreen('step3'); }}
        onBack={() => { setCurrentQ(step2Questions.length - 1); setScreen('step2'); }}
      />
    );
  }

  // STEP3
  if (screen === 'step3') {
    const q = step3Questions[currentQ];
    const saved = answers[q.id] || [];
    const current = s3Buffer.length > 0 ? s3Buffer : saved;
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.pigIcon}>🐷</div>
            <h1 style={styles.appTitle}>鬼豚コーチの【恋クセ】パーソナルジム</h1>
          </div>
          <ProgressBar percent={percent} />
          <p style={styles.stepLabel}>STEP3　{currentQ + 1} / {step3Questions.length}</p>
          <p style={styles.questionText}>{q.question}</p>
          <div style={styles.options}>
            {q.options.map(opt => (
              <button key={opt.id}
                style={current.includes(opt.id) ? { ...styles.optionBtn, ...styles.optionSelected } : styles.optionBtn}
                onClick={() => toggleS3Option(opt.id)}>
                <strong>{opt.label}</strong>　{opt.text}
              </button>
            ))}
          </div>
          <div style={styles.btnRow}>
            <button style={styles.backBtn} onClick={() => { setS3Buffer([]); if (currentQ > 0) { setCurrentQ(currentQ - 1); } else { setScreen('step3_intro'); } }}>← 戻る</button>
            <button
              style={{ ...styles.nextBtn, flex: 1, ...(current.length === 0 ? styles.disabledBtn : {}) }}
              disabled={current.length === 0}
              onClick={() => handleStep3Next(q.id)}>
              {currentQ < step3Questions.length - 1 ? "次へ →" : "完了！結果を見るブー！"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULT
  if (screen === 'result' && result) {
    const zoneColor = result.zone === 'RED' ? '#ff4444' : result.zone === 'YELLOW' ? '#ff9a3c' : '#44cc88';
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <ProgressBar percent={100} />
          <div style={styles.centerBlock}>
            <div style={styles.bigEmoji}>🐷🎊</div>
            <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>あなたの恋クセタイプ</p>
            <h2 style={{ ...styles.doneTitle, fontSize: "24px" }}>{result.typeName}</h2>
            <p style={{ fontSize: "13px", color: "#ff9a3c", marginBottom: "8px" }}>📍 {result.mapArea}</p>
            <div style={{ ...styles.infoBox, marginBottom: "16px" }}>
              <p style={{ fontSize: "15px", color: "white", lineHeight: "1.8", fontWeight: "bold" }}>「{result.coreText}」</p>
            </div>
          </div>

          <div style={{ ...styles.infoBox, marginBottom: "16px" }}>
            <p style={styles.infoTitle}>🐷 鬼豚コーチより</p>
            <p style={{ fontSize: "14px", color: "#ddd", lineHeight: "1.8", marginBottom: "10px" }}>{result.coachAccept || "（受容セリフが入ります）"}</p>
            <p style={{ fontSize: "14px", color: "#ff9a3c", lineHeight: "1.8", marginBottom: "10px" }}>{result.coachCut || "（斬るセリフが入ります）"}</p>
            <p style={{ fontSize: "14px", color: "#ff6b9d", lineHeight: "1.8", fontWeight: "bold" }}>🎯 今日やること：{result.coachAction || "（今日やることが入ります）"}</p>
          </div>

          {result.followMessages.length > 0 && (
            <div style={{ ...styles.infoBox, marginBottom: "16px", borderColor: "rgba(255,200,100,0.4)" }}>
              <p style={{ ...styles.infoTitle, color: "#ffcc44" }}>🐷 追加メッセージ</p>
              {result.followMessages.map((msg, i) => (
                <p key={i} style={{ fontSize: "14px", color: "#ffcc44", lineHeight: "1.8" }}>・{msg}</p>
              ))}
            </div>
          )}

          <div style={{ ...styles.infoBox, marginBottom: "16px" }}>
            <p style={styles.infoTitle}>🧠 あなたのコミュニケーションOS</p>
            {[["応答スタイル", result.osProfile.responseStyle], ["伝え方", result.osProfile.contextStyle], ["深さ", result.osProfile.depthStyle]].map(([label, val]) => (
              <p key={label} style={{ fontSize: "13px", color: "#ddd", lineHeight: "1.8" }}>
                <span style={{ color: "#aaa" }}>{label}：</span>{val || "-"}
              </p>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: "13px", color: zoneColor, marginBottom: "20px" }}>
            全体負荷スコア：{result.totalScore}点　ゾーン：{result.zone}
          </p>

          <button style={{ ...styles.primaryBtn, marginBottom: "12px", background: "linear-gradient(90deg, #1da1f2, #0d8ecf)" }}>
            🐦 結果をシェアするブー！（準備中）
          </button>
          <button style={{ ...styles.primaryBtn, marginBottom: "20px" }}>
            🐷 もっと詳しく知りたいブー（準備中）
          </button>
          <button style={styles.backBtn} onClick={() => { setScreen('start'); setCurrentQ(0); setAnswers({}); setResult(null); setS3Buffer([]); }}>
            もう一度やり直す
          </button>
        </div>
      </div>
    );
  }

  return null;
}

var styles = {
  container:     { minHeight: "100vh", background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b69 50%, #1a0a2e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "sans-serif" },
  card:          { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "32px", maxWidth: "600px", width: "100%", color: "white" },
  header:        { textAlign: "center", marginBottom: "16px" },
  pigIcon:       { fontSize: "48px", marginBottom: "8px" },
  appTitle:      { fontSize: "18px", fontWeight: "bold", color: "#ff6b9d", marginBottom: "6px" },
  subtitle:      { fontSize: "12px", color: "#ccc", lineHeight: "1.6" },
  infoBox:       { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,107,157,0.3)", borderRadius: "12px", padding: "20px", marginBottom: "20px" },
  infoTitle:     { fontSize: "14px", fontWeight: "bold", color: "#ff9a3c", marginBottom: "12px" },
  infoText:      { fontSize: "13px", lineHeight: "1.8", color: "#ddd", marginBottom: "10px" },
  infoNote:      { fontSize: "11px", color: "#aaa", lineHeight: "1.6", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px", marginTop: "6px" },
  primaryBtn:    { width: "100%", padding: "14px", background: "linear-gradient(90deg, #ff6b9d, #ff9a3c)", border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "bold", cursor: "pointer" },
  stepLabel:     { fontSize: "12px", color: "#ff9a3c", fontWeight: "bold", marginBottom: "8px" },
  questionText:  { fontSize: "15px", lineHeight: "1.7", marginBottom: "20px", fontWeight: "bold" },
  options:       { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" },
  optionBtn:     { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", padding: "11px 14px", color: "white", cursor: "pointer", textAlign: "left", fontSize: "13px" },
  optionSelected:{ background: "rgba(255,107,157,0.3)", border: "1px solid #ff6b9d" },
  scaleWrap:     { marginBottom: "20px" },
  scaleLabels:   { display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#aaa", marginBottom: "10px" },
  scaleBtns:     { display: "flex", gap: "8px", justifyContent: "center" },
  scaleBtn:      { width: "48px", height: "48px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: "16px", cursor: "pointer" },
  scaleBtnOn:    { background: "rgba(255,107,157,0.5)", border: "2px solid #ff6b9d" },
  btnRow:        { display: "flex", gap: "10px", alignItems: "center", marginTop: "8px" },
  backBtn:       { padding: "12px 18px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", color: "white", fontSize: "13px", cursor: "pointer" },
  nextBtn:       { padding: "13px", background: "linear-gradient(90deg, #ff6b9d, #ff9a3c)", border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "bold", cursor: "pointer" },
  disabledBtn:   { opacity: 0.4, cursor: "not-allowed" },
  centerBlock:   { textAlign: "center", padding: "10px 0" },
  bigEmoji:      { fontSize: "64px", marginBottom: "16px" },
  doneTitle:     { color: "#ff6b9d", fontSize: "20px", marginBottom: "12px" },
  doneText:      { fontSize: "14px", lineHeight: "1.8", color: "#ccc", marginBottom: "16px" },
};
