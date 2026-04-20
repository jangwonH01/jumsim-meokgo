import { Button, TextField } from '@toss/tds-mobile';
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
  const [items, setItems] = useState<string[]>(() => loadItems());
  const [pick, setPick] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [draft, setDraft] = useState('');

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
        <button
          type="button"
          className="back"
          onClick={() => nav(-1)}
          aria-label="뒤로 가기"
        >
          ←
        </button>
        <h1>랜덤 룰렛</h1>
      </div>

      <div className="result-dish" aria-live="polite" aria-atomic="true">
        {pick ?? '메뉴를 뽑아주세요'}
      </div>

      <div className="stack">
        <Button
          display="full"
          size="xlarge"
          color="primary"
          onClick={spin}
          disabled={items.length === 0}
          loading={spinning}
        >
          {spinning ? '돌리는 중' : '🎲 룰렛 돌리기'}
        </Button>

        <div>
          <p className="card-title" style={{ margin: '18px 0 10px' }}>
            내 메뉴 ({items.length})
          </p>
          <div className="tag-row">
            {items.map((it) => (
              <span className="tag" key={it}>
                {it}
                <button
                  type="button"
                  onClick={() => removeItem(it)}
                  aria-label={`${it} 삭제`}
                >
                  ×
                </button>
              </span>
            ))}
            {items.length === 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                메뉴를 추가하거나 기본 리스트로 초기화해주세요
              </span>
            )}
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <TextField
              variant="box"
              placeholder="새 메뉴 추가"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
          </div>
          <Button
            size="large"
            variant="weak"
            color="primary"
            onClick={addItem}
            disabled={!draft.trim()}
          >
            추가
          </Button>
        </div>

        <Button
          display="full"
          size="large"
          variant="weak"
          color="dark"
          onClick={resetDefaults}
        >
          기본 리스트로 초기화
        </Button>
      </div>
    </main>
  );
}
