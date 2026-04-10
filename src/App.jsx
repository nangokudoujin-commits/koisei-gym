import { useState, useEffect } from "react";
import './App.css';
import onibutaImg from './assets/onibuta.png';
import soraImg from './assets/空.png';
import titleImg from './assets/タイトル.png';
import bg1Img from './assets/背景1.png';
import bg2Img from './assets/背景2.png';
import pinPinkImg from './assets/pin_pink.png';
import pinBlueImg from './assets/pin_blue.png';
import pinPurpleImg from './assets/pin_purple.png';
import { anchorQuestions } from './シングル向けの質問/anchor';
import { step1Questions } from './シングル向けの質問/step1';
import { step2Questions } from './シングル向けの質問/step2';
import { step3Questions } from './シングル向けの質問/step3';
import { calcTypeScores, judgeMainType, getSafetyTriggers } from './シングル向けの質問/scoreLogic';
import { buildResult } from './シングル向けの質問/resultLogic';

function ProgressBar({ percent }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ background: "rgba(0,0,0,0.12)", borderRadius: "10px", height: "6px", marginBottom: "6px" }}>
        <div style={{ background: "linear-gradient(90deg, #ff6b9d, #ff9a3c)", height: "100%", borderRadius: "10px", width: percent + "%", transition: "width 0.4s" }} />
      </div>
      <p style={{ textAlign: "right", fontSize: "12px", color: "#666" }}>{percent}%</p>
    </div>
  );
}

// レーダーチャートコンポーネント
function RadarChart({ scores }) {
  const types = ["A","B","C","D","E","F","G"];
  const labels = { A:"回避", B:"不安", C:"適応", D:"刺激", E:"完璧", F:"救済", G:"融合" };
  const getColor = (score) => score >= 12 ? "#e74c3c" : score >= 7 ? "#f39c12" : "#27ae60";
  const getLevel = (score) => score >= 12 ? "HIGH" : score >= 7 ? "MID" : "LOW";

  const cx = 150, cy = 150, r = 100;
  const angleStep = (2 * Math.PI) / 7;

  const points = types.map((t, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const score = scores[t] || 3;
    const ratio = (score - 3) / 12;
    const pr = r * ratio;
    return {
      x: cx + pr * Math.cos(angle),
      y: cy + pr * Math.sin(angle),
      lx: cx + (r + 20) * Math.cos(angle),
      ly: cy + (r + 20) * Math.sin(angle),
      score,
      label: labels[t],
      color: getColor(score),
      type: t,
    };
  });

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(" ");

  // グリッドライン（3段階）
  const gridLevels = [0.33, 0.66, 1.0];

  return (
    <div style={{ textAlign: "center", marginBottom: "16px" }}>
      <p style={{ fontSize: "14px", fontWeight: "bold", color: "#c0304a", marginBottom: "8px" }}>📊 恋クセレーダー</p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* グリッド */}
          {gridLevels.map((lv, gi) => {
            const gpts = types.map((t, i) => {
              const angle = -Math.PI / 2 + i * angleStep;
              return `${cx + r * lv * Math.cos(angle)},${cy + r * lv * Math.sin(angle)}`;
            }).join(" ");
            return <polygon key={gi} points={gpts} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />;
          })}
          {/* 軸線 */}
          {points.map((p, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />;
          })}
          {/* データポリゴン */}
          <polygon points={polyPoints} fill="rgba(192,48,74,0.25)" stroke="#c0304a" strokeWidth="2" />
          {/* 各頂点の色付き円 */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="5" fill={p.color} stroke="white" strokeWidth="1.5" />
          ))}
          {/* ラベル */}
          {points.map((p, i) => (
            <text key={i} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fontWeight="bold" fill={p.color}>
              {p.label}
            </text>
          ))}
        </svg>
      </div>
      {/* 凡例 */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", fontSize: "0.8rem", marginTop: "8px", flexWrap: "wrap" }}>
        <span style={{ color: "#e74c3c" }}>🔴 HIGH（12〜15点）自爆警戒</span>
        <span style={{ color: "#f39c12" }}>🟡 MID（7〜11点）要注意</span>
        <span style={{ color: "#27ae60" }}>🟢 LOW（3〜6点）安全圏</span>
      </div>
    </div>
  );
}

// 自爆MAPコンポーネント（画像+ピン）
function SelfDestructMap({ mapAreaKey, mapLabel, position, selectedColor }) {
  const pinImg = selectedColor === 'ブルー' ? pinBlueImg
               : selectedColor === 'パープル' ? pinPurpleImg
               : pinPinkImg;

  // SVGプロット範囲からピン座標を計算
  const pinLeft = ((65 + (position.x / 100) * 370) / 500 * 100).toFixed(2) + "%";
  const pinTop  = ((70 + (position.y / 100) * 370) / 500 * 100).toFixed(2) + "%";

  const areaList = [
    { key: "TOP_RIGHT",   color: "#bde0f0", name: "絶対零度の天空城",   desc: "傷つく前に距離を取り、理想に合うかを厳しく見極める傾向" },
    { key: "TOP_LEFT",    color: "#f5b8a0", name: "灼熱のテーマパーク", desc: "つながりを強く求め、熱量で関係を動かしすぎる傾向" },
    { key: "BOTTOM_RIGHT",color: "#c8c8c8", name: "無菌室の独房",       desc: "深く関わる前に閉じて、ひとりで安全を保とうとする傾向" },
    { key: "BOTTOM_LEFT", color: "#8fc8b0", name: "底なしの深海沼",     desc: "相手に合わせすぎて、自分の気持ちや境界を見失いやすい傾向" },
    { key: "CENTER",      color: "#c8e86e", name: "セキュア型",         desc: "近づく・離れるを、相手や状況に応じて柔軟に選べる傾向" },
    { key: "BLACKHOLE",   color: "#c8a8e8", name: "ブラックホール",     desc: "つながりたいのに怖くなり、近づいては離れるループに入りやすい状態" },
    { key: "LEFT_BORDER", color: "#f5c888", name: "沸騰する水際",       desc: "嫌われたくなくて合わせ続け、限界で感情があふれやすい状態" },
  ];

  const currentArea = areaList.find(a => a.key === mapAreaKey);

  return (
    <div style={{ textAlign: "center", marginBottom: "20px" }}>
      <p style={{ fontSize: "14px", fontWeight: "bold", color: "#c0304a", marginBottom: "8px" }}>🗺️ 恋の自爆MAP</p>

      {/* MAP本体 */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
          {/* SVG背景 */}
          <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              <clipPath id="cc5">
                <circle cx="250" cy="255" r="185"/>
              </clipPath>
            </defs>
            <rect x="65" y="70" width="185" height="185" fill="#bde0f0" fillOpacity="0.45" clipPath="url(#cc5)"/>
            <rect x="250" y="70" width="185" height="185" fill="#f5b8a0" fillOpacity="0.45" clipPath="url(#cc5)"/>
            <rect x="65" y="255" width="185" height="185" fill="#c8c8c8" fillOpacity="0.38" clipPath="url(#cc5)"/>
            <rect x="250" y="255" width="185" height="185" fill="#8fc8b0" fillOpacity="0.42" clipPath="url(#cc5)"/>
            <circle cx="250" cy="255" r="185" fill="none" stroke="#999" strokeWidth="1" strokeOpacity="0.5"/>
            <circle cx="250" cy="255" r="93" fill="none" stroke="#aaa" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="4,4"/>
            <circle cx="250" cy="255" r="139" fill="none" stroke="#aaa" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="4,4"/>
            <line x1="65" y1="255" x2="435" y2="255" stroke="#666" strokeWidth="1" strokeOpacity="0.7"/>
            <line x1="250" y1="70" x2="250" y2="440" stroke="#666" strokeWidth="1" strokeOpacity="0.7"/>
            {/* セキュア型（中央緑円） */}
            <circle cx="250" cy="255" r="50" fill="#c8e86e" fillOpacity="0.85"/>
            <circle cx="250" cy="255" r="50" fill="none" stroke="#8aaa20" strokeWidth="1" strokeOpacity="0.6"/>
            {/* ブラックホール（中央・セキュア型の上に重ねる） */}
            <circle cx="250" cy="255" r="21" fill="#c8a8e8" fillOpacity="0.75"/>
            <circle cx="250" cy="255" r="21" fill="none" stroke="#8855cc" strokeWidth="1.2"/>
            {/* 沸騰する水際（x:80,y:65 → svgX=361, svgY=310） */}
            <circle cx="361" cy="310" r="21" fill="#f5c888" fillOpacity="0.75"/>
            <circle cx="361" cy="310" r="21" fill="none" stroke="#d4860a" strokeWidth="1.2"/>
            {/* 軸ラベル */}
            <text x="250" y="44" textAnchor="middle" fontSize="12" fill="#333" fontWeight="500">自発的</text>
            <text x="250" y="468" textAnchor="middle" fontSize="12" fill="#333" fontWeight="500">受動的</text>
            <text x="53" y="259" textAnchor="end" fontSize="11" fill="#333">回避傾向</text>
            <text x="447" y="259" textAnchor="start" fontSize="11" fill="#333">不安傾向</text>
          </svg>

          {/* ピン */}
          <img src={pinImg} alt="あなたの位置"
            style={{
              position: "absolute",
              left: pinLeft,
              top: pinTop,
              width: "48px",
              height: "auto",
              transform: "translate(-50%, -100%)",
              filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))",
            }} />
        </div>
      </div>

      {/* エリア説明一覧 */}
      <div style={{ margin: "12px auto", maxWidth: "320px", textAlign: "left" }}>
        {areaList.map(area => (
          <div key={area.key} style={{
            display: "flex", alignItems: "flex-start", gap: "8px",
            marginBottom: "8px",
            opacity: mapAreaKey === area.key ? 1 : 0.65,
          }}>
            <span style={{
              width: "12px", height: "12px", borderRadius: "50%",
              background: area.color, flexShrink: 0, marginTop: "3px",
              border: "1px solid rgba(0,0,0,0.15)",
            }} />
            <p style={{ fontSize: "0.78rem", color: "#333", margin: 0, lineHeight: "1.6" }}>
              <strong>{area.name}</strong><br />
              {area.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MidMessage({ message, onContinue }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.centerBlock}>
          <div style={styles.bigEmoji}>
            <img src={onibutaImg} alt="鬼豚コーチ" style={{ width: "160px", height: "160px", objectFit: "contain", mixBlendMode: "multiply", background: "transparent" }} />
            💦
          </div>
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
          <div style={styles.bigEmoji}>
            <img src={onibutaImg} alt="鬼豚コーチ" style={{ width: "160px", height: "160px", objectFit: "contain", mixBlendMode: "multiply", background: "transparent" }} />
            {emoji}
          </div>
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
  const [screen, setScreen]         = useState('start');
  const [currentQ, setCurrentQ]     = useState(0);
  const [answers, setAnswers]       = useState({});
  const [result, setResult]         = useState(null);
  const [s3Buffer, setS3Buffer]     = useState([]);
  const [selectedColor, setSelectedColor] = useState('ピンク');
  const [selectedAge, setSelectedAge]     = useState(null);

  // ===== デバッグモード（開発環境のみ有効） =====
  const IS_DEV = import.meta.env.DEV === true; // Viteの開発環境フラグ

  useEffect(() => {
    if (!IS_DEV) return; // 本番環境では完全無効
    const params = new URLSearchParams(window.location.search);
    const debugType = params.get('debug');
    if (!debugType) return;

    const validTypes = ['A','B','C','D','E','F','G','AB','AD','AE','BC','BE','BG','CG','DG','CF','FG','SECURE'];
    const typeMap = { 'EB': 'BE', 'FC': 'CF' };
    const normalizedType = typeMap[debugType.toUpperCase()] || debugType.toUpperCase();
    if (!validTypes.includes(normalizedType)) return;

    const types = ['A','B','C','D','E','F','G'];
    const fakeScores = {};
    types.forEach(t => { fakeScores[t] = 3; });

    if (normalizedType !== 'SECURE') {
      normalizedType.split('').filter(c => types.includes(c)).forEach(t => { fakeScores[t] = 15; });
    }

    const judgeResult    = judgeMainType(fakeScores);
    const safetyTriggers = getSafetyTriggers(fakeScores, {}, {});
    const res            = buildResult(judgeResult, safetyTriggers, { S2Q1: 'A', S2Q2: 'A', S2Q3: 'A' });
    setResult(res);
    setScreen('result');
  }, []);

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
      console.log('=== DEBUG ===');
      console.log('step1Answers:', newAnswers);
      console.log('typeScores:', typeScores);
      console.log('judgeResult:', judgeResult);
      console.log('buildResult:', res);
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
      <div style={{ background: "#000", margin: 0, padding: 0 }}>
        {/* 背景1.png：画面幅いっぱい・縦横比保持 */}
        <img src={bg1Img} alt="背景"
          style={{ width: "100%", height: "auto", display: "block" }} />

        {/* 診断スタートボタン：画像の直下 */}
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 32px" }}>
          <button
            className="start-button"
            onClick={() => { setScreen('color_select'); }}>
            診断スタート
          </button>
        </div>
      </div>
    );
  }

  // COLOR SELECT（性別選択）
  if (screen === 'color_select') {
    const colorOptions = [
      { label: '女性',           value: 'ピンク',  bg: '#fff0f5', border: '#e91e8c' },
      { label: '男性',           value: 'ブルー',  bg: '#f0f7ff', border: '#1da1f2' },
      { label: 'ノンバイナリー', value: 'パープル',bg: '#f5f0ff', border: '#9b59b6' },
      { label: 'その他・回答しない', value: 'なし', bg: '#f5f5f5', border: '#aaa'  },
    ];
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.centerBlock}>
            <div style={styles.bigEmoji}>
              <img src={onibutaImg} alt="鬼豚コーチ" style={{ width: "160px", height: "160px", objectFit: "contain", mixBlendMode: "multiply" }} />
            </div>
            <h2 style={styles.doneTitle}>性別を教えてブー！</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "16px" }}>
              {colorOptions.map(opt => (
                <button key={opt.label}
                  onClick={() => { setSelectedColor(opt.value); setScreen('age_select'); }}
                  style={{
                    padding: "14px", borderRadius: "10px",
                    border: `2px solid ${opt.border}`,
                    background: opt.bg,
                    fontSize: "15px", fontWeight: "bold",
                    color: "#333", cursor: "pointer",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button style={{ ...styles.backBtn, marginTop: "16px" }} onClick={() => setScreen('start')}>← 戻る</button>
          </div>
        </div>
      </div>
    );
  }

  // AGE SELECT（年代選択）
  if (screen === 'age_select') {
    const ageOptions = [
      '10代', '20代', '30代', '40代', '50代', '60代以上', '回答しない'
    ];
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.centerBlock}>
            <div style={styles.bigEmoji}>
              <img src={onibutaImg} alt="鬼豚コーチ" style={{ width: "160px", height: "160px", objectFit: "contain", mixBlendMode: "multiply" }} />
            </div>
            <h2 style={styles.doneTitle}>年代を教えてブー！</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "16px" }}>
              {ageOptions.map(age => (
                <button key={age}
                  onClick={() => {
                    setSelectedAge(age === '回答しない' ? null : age);
                    setCurrentQ(0);
                    setScreen('anchor');
                  }}
                  style={{
                    padding: "14px", borderRadius: "10px",
                    border: "2px solid rgba(255,107,157,0.5)",
                    background: "rgba(255,255,255,0.9)",
                    fontSize: "15px", fontWeight: "bold",
                    color: "#333", cursor: "pointer",
                  }}>
                  {age}
                </button>
              ))}
            </div>
            <button style={{ ...styles.backBtn, marginTop: "16px" }} onClick={() => setScreen('color_select')}>← 戻る</button>
          </div>
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
            <img src={onibutaImg} alt="鬼豚コーチ" style={{ width: "160px", height: "160px", objectFit: "contain", marginBottom: "8px", mixBlendMode: "multiply", background: "transparent" }} />
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
            <img src={onibutaImg} alt="鬼豚コーチ" style={{ width: "160px", height: "160px", objectFit: "contain", marginBottom: "8px", mixBlendMode: "multiply", background: "transparent" }} />
            <h1 style={styles.appTitle}>鬼豚コーチの【恋クセ】パーソナルジム</h1>
          </div>
          <ProgressBar percent={percent} />
          <p style={styles.stepLabel}>STEP1　{currentQ + 1} / {step1Questions.length}</p>
          <p style={styles.questionText}>{q.question}</p>
          <div style={styles.scaleWrap}>
            <div style={styles.scaleLabels}>
              <span style={{ textAlign: "left" }}>まったく当てはまらない</span>
              <span style={{ textAlign: "right" }}>非常に当てはまる</span>
            </div>
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
        emoji="🧠"
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
            <img src={onibutaImg} alt="鬼豚コーチ" style={{ width: "160px", height: "160px", objectFit: "contain", marginBottom: "8px", mixBlendMode: "multiply", background: "transparent" }} />
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
        emoji="⚡"
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
            <img src={onibutaImg} alt="鬼豚コーチ" style={{ width: "160px", height: "160px", objectFit: "contain", marginBottom: "8px", mixBlendMode: "multiply", background: "transparent" }} />
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
    const zoneLabel = result.zone === 'RED' ? '自爆警戒レベル' : result.zone === 'YELLOW' ? '要注意ゾーン' : '恋愛安全圏';
    const zoneColor = result.zone === 'RED' ? '#ff4444' : result.zone === 'YELLOW' ? '#ff9a3c' : '#44cc88';
    const shareText = encodeURIComponent(`鬼豚コーチの【恋クセ】パーソナルジムで恋の自爆パターンを診断してもらいました！\nわたしのタイプは「${result.nickname}」でした。\nあなたも診断してみてブー！\n#恋クセ診断 #鬼豚コーチ`);
    const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <ProgressBar percent={100} />

          {/* タイプ情報エリア */}
          <div style={styles.centerBlock}>
            <div style={styles.bigEmoji}>
              <img src={onibutaImg} alt="鬼豚コーチ" style={{ width: "160px", height: "160px", objectFit: "contain", mixBlendMode: "multiply", background: "transparent" }} />
              🎊
            </div>
            <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>あなたの恋クセタイプ</p>

            {/* ① タイプ名（nickname） */}
            <h2 style={{ ...styles.doneTitle, fontSize: "26px", marginBottom: "4px" }}>{result.nickname}</h2>

            {/* ② 公式名（officialName） */}
            {result.officialName && (
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>（{result.officialName}）</p>
            )}

            {/* ③ バグ名（bugName） */}
            {result.bugName && (
              <p style={{ fontSize: "0.9rem", color: "#c0304a", marginBottom: "10px", fontWeight: "bold" }}>
                👾 {result.bugName}
              </p>
            )}

            {/* ④ 取扱注意（warning） */}
            {result.warning && (
              <div style={{ background: "#fff9e6", border: "1px solid #f39c12", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#c0392b", fontWeight: "bold", marginBottom: "4px" }}>⚠️ 取扱注意</p>
                <p style={{ fontSize: "0.85rem", color: "#333", lineHeight: "1.7", margin: 0 }}>{result.warning}</p>
              </div>
            )}

            {/* ⑥ 自爆危険度メーター */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${zoneColor}`, borderRadius: "10px", padding: "10px 16px", marginBottom: "20px", display: "inline-block" }}>
              <span style={{ color: zoneColor, fontWeight: "bold", fontSize: "15px" }}>
                ⚠️ {zoneLabel}（{result.totalScore}点）
              </span>
            </div>
          </div>

          {/* レーダーチャート */}
          <RadarChart scores={result.scores} />

          {/* 自爆MAP（回答しない場合は非表示） */}
          {selectedColor !== 'なし' && (
            <SelfDestructMap mapAreaKey={result.mapAreaKey} mapLabel={result.mapLabel} position={result.position} selectedColor={selectedColor} />
          )}

          {/* ③ 鬼豚コーチのセリフ */}
          <div style={{ ...styles.infoBox, marginBottom: "16px" }}>
            <p style={styles.infoTitle}>🐷 鬼豚コーチより</p>
            {/* ラベリング防止文 */}
            <p style={{ fontSize: "13px", color: "#aaa", lineHeight: "1.8", marginBottom: "14px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
              これは今のお前の恋愛パターンの傾向だブー。性格でも人格でもないブー。相手・状況・成長で変わるブー。
            </p>
            {/* coachAccept = section1（自爆スイッチ）+ section2（強み） */}
            {result.coachAccept && result.coachAccept.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: "14px", color: i === 0 ? "#ddd" : "#aef", lineHeight: "1.9", marginBottom: "14px" }}>{para}</p>
            ))}
            {/* coachCut = section3（危険性） */}
            {result.coachCut && (
              <p style={{ fontSize: "14px", color: "#ff9a3c", lineHeight: "1.9", marginBottom: "14px" }}>{result.coachCut}</p>
            )}
            {/* coachAction = 今日やること */}
            {result.coachAction && (
              <div style={{ borderTop: "1px solid rgba(255,107,157,0.3)", paddingTop: "14px", marginTop: "4px" }}>
                <p style={{ fontSize: "13px", color: "#ff6b9d", fontWeight: "bold", marginBottom: "6px" }}>🎯 今日やること</p>
                <p style={{ fontSize: "14px", color: "#ffccdd", lineHeight: "1.9" }}>{result.coachAction}</p>
              </div>
            )}
          </div>

          {/* 安全網フォロー */}
          {result.followMessages.length > 0 && (
            <div style={{ ...styles.infoBox, marginBottom: "16px", borderColor: "rgba(255,200,100,0.4)" }}>
              <p style={{ ...styles.infoTitle, color: "#ffcc44" }}>🐷 追加メッセージ</p>
              {result.followMessages.map((msg, i) => (
                <p key={i} style={{ fontSize: "14px", color: "#ffcc44", lineHeight: "1.8" }}>・{msg}</p>
              ))}
            </div>
          )}

          {/* OSプロフィール */}
          <div style={{ ...styles.infoBox, marginBottom: "24px" }}>
            <p style={styles.infoTitle}>🧠 あなたのコミュニケーションOS</p>
            {[["応答スタイル", result.osProfile.responseStyle], ["伝え方", result.osProfile.contextStyle], ["深さ", result.osProfile.depthStyle]].map(([label, val]) => (
              <p key={label} style={{ fontSize: "13px", color: "#ddd", lineHeight: "1.8" }}>
                <span style={{ color: "#aaa" }}>{label}：</span>{val || "-"}
              </p>
            ))}
          </div>

          {/* SNSシェアボタン */}
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: "12px" }}>
            <button style={{ ...styles.primaryBtn, background: "linear-gradient(90deg, #1da1f2, #0d8ecf)" }}>
              🐦 Xでシェアするブー！
            </button>
          </a>

          {/* ボタン1：もっと深く */}
          <a href="#" style={{ display: "block", textDecoration: "none", marginBottom: "12px" }}>
            <button style={styles.primaryBtn}>
              🔍 もっと深く自分を知りたい人はこちら
            </button>
          </a>

          {/* ボタン2：カップル診断 */}
          <a href="#" style={{ display: "block", textDecoration: "none", marginBottom: "20px" }}>
            <button style={{ ...styles.primaryBtn, background: "linear-gradient(90deg, #9b59b6, #e91e8c)" }}>
              💑 パートナーと一緒に診断したい人はこちら
            </button>
          </a>

          {/* もう一度 */}
          <button style={{ ...styles.backBtn, width: "100%", textAlign: "center" }} onClick={() => { setScreen('start'); setCurrentQ(0); setAnswers({}); setResult(null); setS3Buffer([]); setSelectedColor('ピンク'); setSelectedAge(null); }}>
            もう一度やり直す
          </button>

          {/* REDゾーン時ホットライン */}
          {result.zone === 'RED' && (
            <div style={{ marginTop: "20px", padding: "14px 16px", background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: "10px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#ffaaaa", lineHeight: "1.9" }}>
                今日だけは自分を責めるなブー。<br />
                一人で抱えすぎていると感じたら<br />
                <strong>よりそいホットライン：0120-279-338（24時間無料）</strong>
              </p>
            </div>
          )}

          {/* 免責文 */}
          <p style={{ marginTop: "20px", fontSize: "11px", color: "#888", lineHeight: "1.8", textAlign: "center" }}>
            本診断は現在の恋愛パターンの傾向を示すものです。<br />
            性格・人格を規定するものではありません。<br />
            状況・相手・成長によって変化します。
          </p>
        </div>
      </div>
    );
  }

  return null;
}

var styles = {
  container:     { minHeight: "100vh", backgroundImage: `url(${bg2Img})`, backgroundSize: "50%", backgroundPosition: "center", backgroundRepeat: "repeat", backgroundAttachment: "fixed", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "sans-serif" },
  card:          { background: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,182,193,0.6)", borderRadius: "20px", padding: "32px", maxWidth: "600px", width: "100%", color: "#222" },
  header:        { textAlign: "center", marginBottom: "16px" },
  pigIcon:       { fontSize: "48px", marginBottom: "8px" },
  appTitle:      { fontSize: "18px", fontWeight: "bold", color: "#c0304a", marginBottom: "6px" },
  subtitle:      { fontSize: "12px", color: "#555", lineHeight: "1.6" },
  infoBox:       { background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,107,157,0.4)", borderRadius: "12px", padding: "20px", marginBottom: "20px" },
  infoTitle:     { fontSize: "14px", fontWeight: "bold", color: "#c0304a", marginBottom: "12px" },
  infoText:      { fontSize: "13px", lineHeight: "1.8", color: "#333", marginBottom: "10px" },
  infoNote:      { fontSize: "11px", color: "#666", lineHeight: "1.6", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "10px", marginTop: "6px" },
  primaryBtn:    { width: "100%", padding: "14px", background: "linear-gradient(90deg, #ff6b9d, #ff9a3c)", border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "bold", cursor: "pointer" },
  stepLabel:     { fontSize: "12px", color: "#c0304a", fontWeight: "bold", marginBottom: "8px" },
  questionText:  { fontSize: "15px", lineHeight: "1.7", marginBottom: "20px", fontWeight: "bold", color: "#222" },
  options:       { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" },
  optionBtn:     { background: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,107,157,0.4)", borderRadius: "10px", padding: "11px 14px", color: "#333", cursor: "pointer", textAlign: "left", fontSize: "13px" },
  optionSelected:{ background: "rgba(255,107,157,0.25)", border: "1px solid #ff6b9d", color: "#333" },
  scaleWrap:     { marginBottom: "20px" },
  scaleLabels:   { display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666", marginBottom: "10px" },
  scaleBtns:     { display: "flex", gap: "8px", justifyContent: "center" },
  scaleBtn:      { width: "48px", height: "48px", borderRadius: "50%", border: "2px solid rgba(255,107,157,0.4)", background: "rgba(255,255,255,0.9)", color: "#333", fontSize: "16px", cursor: "pointer" },
  scaleBtnOn:    { background: "rgba(255,107,157,0.3)", border: "2px solid #ff6b9d", color: "#333" },
  btnRow:        { display: "flex", gap: "10px", alignItems: "center", marginTop: "8px" },
  backBtn:       { padding: "12px 18px", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,107,157,0.4)", borderRadius: "10px", color: "#555", fontSize: "13px", cursor: "pointer" },
  nextBtn:       { padding: "13px", background: "linear-gradient(90deg, #ff6b9d, #ff9a3c)", border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "bold", cursor: "pointer" },
  disabledBtn:   { opacity: 0.4, cursor: "not-allowed" },
  centerBlock:   { textAlign: "center", padding: "10px 0" },
  bigEmoji:      { fontSize: "64px", marginBottom: "16px" },
  doneTitle:     { color: "#c0304a", fontSize: "20px", marginBottom: "12px" },
  doneText:      { fontSize: "14px", lineHeight: "1.8", color: "#444", marginBottom: "16px" },
};
