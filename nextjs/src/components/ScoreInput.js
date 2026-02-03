import { useEffect, useMemo, useRef, useState } from "react";
const reactionGifs = {
  laugh: ["/ReactionGifs/Laughing.gif", "/ReactionGifs/Laughing2.gif"],
  good: "/ReactionGifs/Good.gif",
  thumbs: "/ReactionGifs/Thumbsup.gif",
};

const PRAISE_LINES = [
  "Not bad.",
  "Good try.",
  "Nice.",
  "Awesome.",
  "Solid hit!",
  "Sweet throw!",
  "Clean shot!",
  "Sharp aim!",
  "Great dart!",
  "Lovely line!",
  "Sweet spot!",
  "On the mark!",
  "Good form!",
  "That'll do.",
  "Strong toss!",
  "Smooth release!",
  "Nice touch!",
  "Well done!",
  "Good rhythm!",
  "Great focus!",
  "Steady hand!",
  "Clean follow!",
  "Sweet strike!",
  "Bright shot!",
  "Nice one!",
  "Great timing!",
  "Good pace!",
  "You’re locked in.",
  "Dialed in!",
  "Great effort!",
  "Cool finish!",
  "Solid control!",
  "Aim is true!",
  "Nice curve!",
  "Good arc!",
  "Nice snap!",
  "That’s crisp!",
  "Sweet aim!",
  "Great line!",
  "Perfect touch!",
  "Neat hit!",
  "That’s clean!",
  "Good precision!",
  "Strong point!",
  "Laser line!",
  "Great strike!",
  "Elite toss!",
  "Fantastic!",
  "Brilliant!",
  "Excellent!",
];

const ROAST_LINES = [
  "Not even close.",
  "Gravity wins.",
  "That was a choice.",
  "Aim harder.",
  "Try the board next time.",
  "The wall felt that.",
  "Oof.",
  "Missed by a mile.",
  "Nice try... not.",
  "Is the board okay?",
  "That dart is lonely.",
  "Warming up, right?",
  "That was bold.",
  "So close. Not.",
  "Airball classic.",
  "Maybe blink less.",
  "Unlucky... again.",
  "Rough throw.",
  "That hurt to watch.",
  "At least it left your hand.",
  "The floor approves.",
  "Board says no.",
  "Wrong zip code.",
  "Aim low, hit lower.",
  "Keep practicing.",
  "That was adorable.",
  "The dart is confused.",
  "Try the center... of the room.",
  "That’s not it.",
  "Oopsie.",
  "Yikes.",
  "That was wild.",
  "Are you okay?",
  "Maybe switch hands.",
  "Confidence > accuracy.",
  "The board dodged it.",
  "Too spicy, too far.",
  "Missed the memo.",
  "That’s a warm‑up.",
  "Bold strategy.",
  "The board laughed.",
  "Just a scratch.",
  "That was tragic.",
  "Out of practice?",
  "The dart blinked.",
  "Try again.",
  "Less power, more aim.",
  "That was brave.",
  "Not your best.",
  "We saw that.",
];

const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const BOARD = {
  size: 400,
  center: 200,
  outerRadius: 190,
  doubleInner: 160,
  doubleOuter: 190,
  tripleInner: 95,
  tripleOuter: 120,
  bullOuter: 24,
  bullInner: 12,
};

const polarToCartesian = (radius, angleDeg) => {
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: BOARD.center + radius * Math.cos(angleRad),
    y: BOARD.center + radius * Math.sin(angleRad),
  };
};

const describeWedge = (startAngle, endAngle, innerRadius, outerRadius) => {
  const startOuter = polarToCartesian(outerRadius, startAngle);
  const endOuter = polarToCartesian(outerRadius, endAngle);
  const startInner = polarToCartesian(innerRadius, endAngle);
  const endInner = polarToCartesian(innerRadius, startAngle);
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
};

const getThrowFromPoint = (x, y) => {
  const dx = x - BOARD.center;
  const dy = y - BOARD.center;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > BOARD.outerRadius) return null;
  if (distance <= BOARD.bullInner) return { label: "DBull", value: 50, type: "double-bull", band: "double-bull" };
  if (distance <= BOARD.bullOuter) return { label: "Bull", value: 25, type: "bull", band: "bull" };

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const normalized = (angle + 90 + 360) % 360;
  const segmentIndex = Math.floor(normalized / 18);
  const segmentValue = SEGMENTS[segmentIndex];

  if (distance >= BOARD.doubleInner && distance <= BOARD.doubleOuter) {
    return { label: `D${segmentValue}`, value: segmentValue * 2, type: "double", band: "double", segmentIndex };
  }

  if (distance >= BOARD.tripleInner && distance <= BOARD.tripleOuter) {
    return { label: `T${segmentValue}`, value: segmentValue * 3, type: "triple", band: "triple", segmentIndex };
  }

  return { label: `S${segmentValue}`, value: segmentValue, type: "single", band: "single", segmentIndex };
};

const getHitPointForDart = (dart) => {
  if (!dart) return null;
  if (dart.type === "bull" || dart.type === "double-bull") {
    return { x: BOARD.center, y: BOARD.center };
  }
  if (dart.type === "miss") {
    return null;
  }

  const segmentValue = Number(dart.label.replace(/\D/g, ""));
  const segmentIndex = SEGMENTS.indexOf(segmentValue);
  if (segmentIndex === -1) return null;

  const startAngle = segmentIndex * 18 - 90;
  const midAngle = startAngle + 9;

  let radius = (BOARD.bullOuter + BOARD.tripleInner) / 2;
  if (dart.type === "double") {
    radius = (BOARD.doubleInner + BOARD.doubleOuter) / 2;
  } else if (dart.type === "triple") {
    radius = (BOARD.tripleInner + BOARD.tripleOuter) / 2;
  }

  return polarToCartesian(radius, midAngle);
};

export default function ScoreInput({
  player,
  onScoreSubmit,
  onDartsRemainingChange,
  inputMode = "board",
  mascotEnabled = true,
  mode = "x01",
}) {
  const [darts, setDarts] = useState([]);
  const [activeSegment, setActiveSegment] = useState(null);
  const [ripple, setRipple] = useState(null);
  const [hitPoints, setHitPoints] = useState([]);
  const [dartKey, setDartKey] = useState(0);
  const [mascot, setMascot] = useState(null);
  const [mascotDebug, setMascotDebug] = useState(false);
  const [expandedScore, setExpandedScore] = useState(null);
  const boardRef = useRef(null);
  const audioCtxRef = useRef(null);
  const lastTapRef = useRef(0);
  const mascotTimerRef = useRef(null);
  const keyRef = useRef(0);

  const triggerFeedback = (dart) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      const pattern = dart.type === "double-bull" ? [30, 20, 30] : [20];
      navigator.vibrate(pattern);
    }

    if (typeof window === "undefined") return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const base = dart.type === "double-bull" ? 520 : dart.type === "bull" ? 440 : dart.type === "triple" ? 360 : dart.type === "double" ? 300 : 220;
      osc.type = "triangle";
      osc.frequency.value = base;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (err) {
      // Ignore audio failures (autoplay restrictions, unsupported APIs)
    }
  };

  useEffect(() => {
    setDarts([]);
    setActiveSegment(null);
    setRipple(null);
    setHitPoints([]);
    setDartKey(0);
    setMascot(null);
    setExpandedScore(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setMascotDebug(params.has("mascotDebug"));
    }
    onDartsRemainingChange(3);
  }, [player.id]);

  useEffect(() => {
    return () => {
      if (mascotTimerRef.current) {
        clearTimeout(mascotTimerRef.current);
      }
    };
  }, []);

  const segments = useMemo(() => {
    return SEGMENTS.map((value, index) => {
      const startAngle = index * 18 - 90;
      const endAngle = startAngle + 18;
      const labelAngle = startAngle + 9;
      const labelPos = polarToCartesian(BOARD.outerRadius - 18, labelAngle);
      return {
        value,
        index,
        startAngle,
        endAngle,
        labelPos,
      };
    });
  }, []);

  const nextKey = () => {
    keyRef.current += 1;
    return keyRef.current;
  };

  const addDart = (dart, pointOverride) => {
    if (darts.length >= 3) return;
    const updated = [...darts, dart];
    setDarts(updated);
    setActiveSegment(dart.segmentIndex ?? null);
    onDartsRemainingChange(3 - updated.length);
    triggerFeedback(dart);

    const point = pointOverride || getHitPointForDart(dart);
    if (point) {
      const token = nextKey();
      setRipple({ x: point.x, y: point.y, key: `ripple-${token}` });
      setDartKey(token);
      setHitPoints((prev) => [
        ...prev.slice(0, 2),
        { x: point.x, y: point.y, key: `dart-${token}` },
      ]);
    }

    const pickLaugh = () => reactionGifs.laugh[Math.floor(Math.random() * reactionGifs.laugh.length)];
    const pickLine = (lines) => lines[Math.floor(Math.random() * lines.length)];
    const forceGood = dart.value === 19 || dart.value === 25 || dart.value === 50;
    let gif = reactionGifs.good;
    let line = pickLine(PRAISE_LINES);
    if (!forceGood && dart.value >= 16) {
      gif = reactionGifs.thumbs;
      line = pickLine(PRAISE_LINES);
    } else if (dart.value > 0 && dart.value <= 9) {
      gif = pickLaugh();
      line = pickLine(ROAST_LINES);
    } else if (dart.value === 0) {
      gif = pickLaugh();
      line = pickLine(ROAST_LINES);
    }

    if (mascotEnabled) {
      setMascot({ gif, line, key: `mascot-${nextKey()}` });
      if (mascotTimerRef.current) {
        clearTimeout(mascotTimerRef.current);
      }
      mascotTimerRef.current = setTimeout(() => {
        setMascot(null);
      }, 1000);
    }
  };

  const getClientPoint = (event) => {
    if (event.touches && event.touches[0]) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    if (event.changedTouches && event.changedTouches[0]) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  };

  const handleBoardClick = (event) => {
    if (!boardRef.current || darts.length >= 3) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    const now = Date.now();
    if (now - lastTapRef.current < 250) return;
    lastTapRef.current = now;
    const rect = boardRef.current.getBoundingClientRect();
    const scaleX = BOARD.size / rect.width;
    const scaleY = BOARD.size / rect.height;
    const point = getClientPoint(event);
    const x = (point.x - rect.left) * scaleX;
    const y = (point.y - rect.top) * scaleY;

    const dart = getThrowFromPoint(x, y);
    if (dart) {
      setActiveSegment(dart.segmentIndex ?? null);
      addDart(dart, { x, y });
    }
  };

  const handleMiss = () => addDart({ label: "Miss", value: 0, type: "miss" });

  const quickThrows = useMemo(
    () => [
      { label: "T20", value: 60, type: "triple" },
      { label: "T19", value: 57, type: "triple" },
      { label: "Bull", value: 25, type: "bull" },
      { label: "DBull", value: 50, type: "double-bull" },
    ],
    []
  );

  const handleUndo = () => {
    if (darts.length === 0) return;
    const updated = darts.slice(0, -1);
    setDarts(updated);
    setHitPoints((prev) => prev.slice(0, -1));
    setDartKey(Date.now());
    onDartsRemainingChange(3 - updated.length);
  };

  const handleClear = () => {
    setDarts([]);
    setHitPoints([]);
    setDartKey(Date.now());
    onDartsRemainingChange(3);
  };

  const handleSubmit = () => {
    if (darts.length === 0) return;
    onScoreSubmit(player.id, darts);
    setDarts([]);
    setHitPoints([]);
    setDartKey(Date.now());
    onDartsRemainingChange(3);
  };

  const totalScore = darts.reduce((sum, dart) => sum + dart.value, 0);
  const liveScore = mode === "free" ? player.currentScore + totalScore : Math.max(0, player.currentScore - totalScore);
  const remainingDarts = 3 - darts.length;

  return (
    <div className="score-input">
      <div className="input-header">
        <div className="turn-banner">
          <span className="turn-chip">🎯 Your Turn</span>
          <h3>{player.name}</h3>
          <span className="turn-score">{liveScore}</span>
        </div>
        <div className="dart-display">
          {[0, 1, 2].map((index) => (
            <div key={index} className={`dart ${darts[index] ? "filled" : ""}`}>
              {darts[index] ? darts[index].label : "—"}
            </div>
          ))}
        </div>
        <div className="total-score">Total: {totalScore}</div>
      </div>

      <div className="dartboard-wrap">
        {(mascotEnabled && (mascot || mascotDebug)) && (
          <div
            className={`mascot-overlay ${mascotDebug ? "mascot-debug" : ""}`}
            key={(mascot || {}).key || "debug"}
          >
            <div className="mascot-overlay-stage">
              {mascot ? (
                <>
                  <img className="mascot-gif" src={mascot.gif} alt="Mascot reaction" />
                  <div className="mascot-caption">{mascot.line}</div>
                </>
              ) : (
                <span className="mascot-debug-text">Mascot debug mode</span>
              )}
            </div>
          </div>
        )}
        {inputMode === "board" ? (
          <div className="dartboard-grid">
            <div className="dartboard-container">
              <svg
                ref={boardRef}
                className="dartboard"
                viewBox={`0 0 ${BOARD.size} ${BOARD.size}`}
                role="button"
                aria-label="Dartboard"
                onPointerDown={handleBoardClick}
              >
            <rect
              x="0"
              y="0"
              width={BOARD.size}
              height={BOARD.size}
              fill="transparent"
              pointerEvents="all"
            />
            <circle className="board-outer" cx={BOARD.center} cy={BOARD.center} r={BOARD.outerRadius} />

            {segments.map((segment, index) => (
              <g key={`seg-${segment.value}`}>
                <path
                  className={`board-segment ${index % 2 === 0 ? "light" : "dark"} ${
                    activeSegment === index ? "active" : ""
                  }`}
                  d={describeWedge(segment.startAngle, segment.endAngle, BOARD.tripleOuter, BOARD.doubleInner)}
                />
                <path
                  className={`board-segment ${index % 2 === 0 ? "dark" : "light"} ${
                    activeSegment === index ? "active" : ""
                  }`}
                  d={describeWedge(segment.startAngle, segment.endAngle, BOARD.bullOuter, BOARD.tripleInner)}
                />
                <path
                  className={`board-ring ${index % 2 === 0 ? "ring-red" : "ring-green"} ${
                    activeSegment === index ? "active" : ""
                  }`}
                  d={describeWedge(segment.startAngle, segment.endAngle, BOARD.doubleInner, BOARD.doubleOuter)}
                />
                <path
                  className={`board-ring ${index % 2 === 0 ? "ring-green" : "ring-red"} ${
                    activeSegment === index ? "active" : ""
                  }`}
                  d={describeWedge(segment.startAngle, segment.endAngle, BOARD.tripleInner, BOARD.tripleOuter)}
                />
              </g>
            ))}

            <circle className="board-bull" cx={BOARD.center} cy={BOARD.center} r={BOARD.bullOuter} />
            <circle className="board-bull-inner" cx={BOARD.center} cy={BOARD.center} r={BOARD.bullInner} />

            {segments.map((segment) => (
              <text
                key={`label-${segment.value}`}
                x={segment.labelPos.x}
                y={segment.labelPos.y}
                className="board-number"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {segment.value}
              </text>
            ))}

            {hitPoints.map((point) => (
              <g
                key={point.key}
                className="board-dart"
                transform={`translate(${point.x} ${point.y}) rotate(-35) translate(-20 0)`}
              >
                <polygon points="-6,-4 18,0 -6,4" className="dart-body" />
                <polygon points="-12,-6 -2,0 -12,6" className="dart-grip" />
                <polygon points="-14,-7 -9,0 -14,7" className="dart-grip-ring" />
                <polygon points="18,-2 30,0 18,2" className="dart-tip" />
                <polygon points="-24,0 -34,-10 -18,-4" className="dart-fin" />
                <polygon points="-24,0 -34,10 -18,4" className="dart-fin" />
              </g>
            ))}

              {ripple && (
                <circle
                  key={ripple.key}
                  className="board-ripple"
                  cx={ripple.x}
                  cy={ripple.y}
                  r="6"
                />
              )}
              </svg>
            </div>
            {darts.length < 3 && (
              <div className="quick-throws vertical">
                {quickThrows.map((dart) => (
                  <button
                    key={dart.label}
                    type="button"
                    className={`quick-btn ${dart.type}`}
                    onClick={() => addDart(dart)}
                    disabled={darts.length >= 3}
                  >
                    {dart.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="score-grid">
            <div className="score-grid-header">Select score</div>
            <div className="score-grid-table">
              {(() => {
                const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
                const quickSuggestions = [
                  { label: "T20", value: 60, type: "triple" },
                  { label: "T19", value: 57, type: "triple" },
                  { label: "D20", value: 40, type: "double" },
                  { label: "DBull", value: 50, type: "double-bull" },
                ];
                const items = [
                  ...numbers.map((value) => ({ kind: "number", value })),
                  { kind: "number", value: 25 },
                  ...quickSuggestions.map((item) => ({ ...item, kind: "quick" })),
                ];
                return items.map((item, index) => {
                  const isBull = item.kind === "number" && item.value === 25;
                  const isExpanded = item.kind === "number" && expandedScore === item.value;
                  const columnIndex = (index % 5) + 1;
                  const overlayAlign = columnIndex <= 2 ? "overlay-left" : columnIndex === 3 ? "overlay-center" : "overlay-right";
                  return (
                    <div key={`row-${item.kind}-${item.value}-${index}`} className="score-grid-row compact">
                      <button
                        type="button"
                        className={`score-grid-circle ${isBull ? "bull" : ""} ${item.kind === "quick" ? "quick" : ""}`}
                        onClick={() => {
                          if (item.kind === "quick") {
                            addDart({ label: item.label, value: item.value, type: item.type });
                            return;
                          }
                          setExpandedScore(isExpanded ? null : item.value);
                        }}
                        disabled={darts.length >= 3}
                      >
                        {item.kind === "quick" ? item.label : item.value}
                      </button>
                      {isExpanded && (
                        <div className={`score-grid-segmented ${overlayAlign}`}>
                          {isBull ? (
                            <>
                              <button
                                type="button"
                                className="score-segment bull"
                                onClick={() => {
                                  addDart({ label: "Bull", value: 25, type: "bull" });
                                  setExpandedScore(null);
                                }}
                                disabled={darts.length >= 3}
                              >
                                25 Single
                              </button>
                              <button
                                type="button"
                                className="score-segment double-bull"
                                onClick={() => {
                                  addDart({ label: "DBull", value: 50, type: "double-bull" });
                                  setExpandedScore(null);
                                }}
                                disabled={darts.length >= 3}
                              >
                                25 Double
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="score-segment single"
                                onClick={() => {
                                  addDart({ label: `S${item.value}`, value: item.value, type: "single" });
                                  setExpandedScore(null);
                                }}
                                disabled={darts.length >= 3}
                              >
                                {item.value} Single
                              </button>
                              <button
                                type="button"
                                className="score-segment double"
                                onClick={() => {
                                  addDart({ label: `D${item.value}`, value: item.value * 2, type: "double" });
                                  setExpandedScore(null);
                                }}
                                disabled={darts.length >= 3}
                              >
                                {item.value} Double
                              </button>
                              <button
                                type="button"
                                className="score-segment triple"
                                onClick={() => {
                                  addDart({ label: `T${item.value}`, value: item.value * 3, type: "triple" });
                                  setExpandedScore(null);
                                }}
                                disabled={darts.length >= 3}
                              >
                                {item.value} Triple
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        <div className="dartboard-actions">
          <button type="button" className="throw-btn" onClick={handleMiss} disabled={darts.length >= 3}>
            <span className="label-icon">❌</span>
            Miss
            </button>
          <button type="button" className="throw-btn secondary" onClick={handleUndo} disabled={darts.length === 0}>
            <span className="label-icon">↩️</span>
            Undo
          </button>
          <button type="button" className="throw-btn secondary" onClick={handleClear} disabled={darts.length === 0}>
            <span className="label-icon">🧹</span>
            Clear
          </button>
        </div>
      </div>

      <div className="input-actions">
        <button onClick={handleSubmit} disabled={darts.length === 0} className="submit-btn" type="button">
          <span className="label-icon">✅</span>
          Submit Turn
        </button>
      </div>
    </div>
  );
}
