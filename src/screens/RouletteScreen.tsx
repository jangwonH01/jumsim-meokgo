import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULTS = [
  '김치찌개',
  '된장찌개',
  '국밥',
  '제육덮밥',
  '냉면',
  '돈까스',
  '파스타',
  '샐러드',
  '라멘',
  '초밥',
  '쌀국수',
  '비빔밥',
];

const LS_KEY = 'jumsim-meokgo.roulette.items';

function loadItems(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return parsed.length ? (parsed as string[]) : DEFAULTS;
    }
    return DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export default function RouletteScreen() {
  const nav = useNavigate();
  const [items, setItems] = useState<string[]>(DEFAULTS);
  const [pick, setPick] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setItems(loadItems());
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const spin = () => {
    if (items.length === 0) return;
    setSpinning(true);
    let tick = 0;
    const interval = setInterval(() => {
      setPick(items[Math.floor(Math.random() * items.length)]);
      tick += 1;
      if (tick >= 14) {
        clearInterval(interval);
        setPick(items[Math.floor(Math.random() * items.length)]);
        setSpinning(false);
      }
    }, 80);
  };

  const addItem = () => {
    const v = draft.trim();
    if (!v) return;
    if (items.includes(v)) {
      setDraft('');
      return;
    }
    setItems([...items, v]);
    setDraft('');
  };

  const removeItem = (v: string) => {
    setItems(items.filter((x) => x !== v));
  };

  const resetDefaults = () => {
    setItems(DEFAULTS);
    setPick(null);
  };

  return (
    <main className="screen">
      <div className="screen-header">
        <button type="button" className="back" onClick={() => nav(-1)}>
          ←
        </button>
        <h1>랜덤 룰렛</h1>
      </div>

      <div className="result-dish">{pick ?? '메뉴를 뽑아주세요'}</div>

      <div className="stack">
        <button
          type="button"
          className="btn"
          onClick={spin}
          disabled={spinning || items.length === 0}
        >
          {spinning ? '돌리는 중…' : '🎲 룰렛 돌리기'}
        </button>

        <div>
          <p className="card-title" style={{ margin: '18px 0 10px' }}>
            내 메뉴 ({items.length})
          </p>
          <div className="tag-row">
            {items.map((it) => (
              <span className="tag" key={it}>
                {it}
                <button type="button" onClick={() => removeItem(it)} aria-label="삭제">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="row">
          <input
            className="input"
            placeholder="새 메뉴 추가"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <button type="button" className="btn btn-ghost" onClick={addItem} style={{ width: 'auto', padding: '0 18px' }}>
            추가
          </button>
        </div>

        <button type="button" className="btn btn-ghost" onClick={resetDefaults}>
          기본 리스트로 초기화
        </button>
      </div>
    </main>
  );
}
