export interface WeeklyPlan {
    mode: 'protect' | 'improve' | 'grow' | 'distance';
    busyness: 'relaxed' | 'normal' | 'busy';
    mental: 'high' | 'medium' | 'low';
    focusPairs: string[]; // USD/JPY, etc.
    limits: {
        trade_count: number;
        loss_amount: number;
        consecutive_loss_stop: '2' | '3' | 'none';
        no_look: { enabled: boolean; start: string; end: string };
    };
    eventSettings: {
        stop_window: number; // 0 (OFF), 15, 30, 60
        use_stop_window: boolean;
    };
    rules: { id: string; label: string; active: true }[];
    theme: { id: string; label: string; condition: string };
    ignoredPairs: string[]; // List of pairs to ignore for this week ("触らない")
}

export interface WeeklyReview {
    completedAt: string;
    score: number;
    badges: string[];
    survey: {
        is_followed: 'yes' | 'partial' | 'no';
        break_factor: string;
        next_change: string;
        note: string;
    };
    ai_feedback: {
        good: string;
        bad: string;
        keep: string;
    };
}

export interface WeeklyStrategy {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    plan: WeeklyPlan;
    review: WeeklyReview;
    created_at: string;
    updated_at: string;
}

// UI Choices Constants
export const PAIR_OPTIONS = ['USD/JPY', 'EUR/USD', 'GBP/JPY', 'AUD/JPY', 'EUR/JPY', 'GBP/USD', 'XAU/USD', 'BTC/USD']; // Example defaults

export const THEME_CANDIDATES = {
    protect: [
        { id: 'wait', label: '待つ練習（厳選）', condition: '新規は週上限内／チェックリスト全通過のみ' },
        { id: 'stop_limit', label: '止まる練習（上限で終了）', condition: '上限到達時にその週は新規0' },
        { id: 'no_look_guard', label: '見ない時間を守る', condition: '見ない時間にアプリ起動0' },
    ],
    improve: [
        { id: 'check_habit', label: 'チェックリスト習慣化', condition: '新規の前にチェック実施率100%' },
        { id: 'loss_fixed', label: '損切り固定', condition: '損切り変更0回' },
        { id: 'interval', label: '1回ごとに区切る', condition: '決済から30分空けて次の新規' },
    ],
    grow: [
        { id: 'rule_opportunity', label: 'ルール厳守で機会を見る', condition: '停止窓中0回／チェック未通過0回' },
        { id: 'pair_focus', label: 'ペア集中', condition: '新規は監視ペア内のみ' },
        { id: 'cooldown', label: 'クールダウン徹底', condition: '連続エントリー禁止を守る' },
    ],
    distance: [
        { id: 'ignore_pair', label: '触らないペアを守る', condition: '“触らないON”のペアは新規0' },
        { id: 'low_freq', label: '週3回だけ', condition: '新規回数が3回以下' },
        { id: 'no_look_prio', label: '見ない時間を最優先', condition: '見ない時間の起動0／新規0' },
    ]
};

export const RULE_CANDIDATES = [
    { id: 'stop_window', label: '停止窓中は新規禁止' },
    { id: 'limit_stop', label: '上限到達で停止（回数/損失）' },
    { id: 'consecutive_stop', label: '連敗停止が発動したら終了' },
    { id: 'no_look', label: '見ない時間中はアプリを開かない' },
    { id: 'check_first', label: 'チェックリスト未通過なら新規しない' },
    { id: 'no_chasing', label: '飛び乗り禁止' },
    { id: 'no_revenge', label: '取り返しトレード禁止' },
];
