import { RuleCategory } from "@/types/trade-rule"

export interface RuleTemplate {
    id: string
    name: string
    description: string
    rules: {
        title: string
        category: RuleCategory
        description: string
    }[]
}

export const RULE_TEMPLATES: RuleTemplate[] = [
    {
        id: 'scalping',
        name: 'スキャルピング（短期）',
        description: '数秒〜数分で決済する、回転率重視のスタイル向け。',
        rules: [
            {
                title: 'スプレッド拡大時は見送り',
                category: 'ENTRY',
                description: '経済指標発表前後や早朝など、スプレッドが通常より広い時はエントリーしない。'
            },
            {
                title: '損切りは3pips以内',
                category: 'RISK',
                description: 'エントリーと同時に逆指値を置く。含み損は絶対に引っ張らない。'
            },
            {
                title: '上位足の方向のみ',
                category: 'ENTRY',
                description: '5分足、15分足のトレンド方向に逆らわない。'
            },
            {
                title: '連敗したら休憩',
                category: 'MENTAL',
                description: '2連敗したら最低30分はチャートから離れる。'
            }
        ]
    },
    {
        id: 'day-trading',
        name: 'デイトレード（順張り）',
        description: '1日の値幅を狙う、最も標準的なスタイル向け。',
        rules: [
            {
                title: '欧州・NY時間のみ',
                category: 'ENTRY',
                description: 'ボラティリティが出る15時〜25時の間のみトレードする。'
            },
            {
                title: 'リスクリワード 1:1.5以上',
                category: 'RISK',
                description: '損失1に対して利益1.5以上が見込める局面でのみエントリーする。'
            },
            {
                title: '押し目・戻り目を待つ',
                category: 'ENTRY',
                description: '飛び乗りは禁止。短期足での反転パターンを確認してから入る。'
            },
            {
                title: '重要指標前はノーポジ',
                category: 'EXIT',
                description: '雇用統計やFOMCなどの重要指標発表前には全てのポジションを決済する。'
            }
        ]
    },
    {
        id: 'swing',
        name: 'スイングトレード',
        description: '数日〜数週間保有し、大きなトレンドを狙うスタイル向け。',
        rules: [
            {
                title: '日足のトレンドフォロー',
                category: 'ENTRY',
                description: '日足が明確なトレンドを形成している通貨ペアのみを選択する。'
            },
            {
                title: '資金管理は2%ルール',
                category: 'RISK',
                description: '1回のトレードの損失許容額は口座資金の2%以内とする。'
            },
            {
                title: '週末持ち越しチェック',
                category: 'RISK',
                description: '週末に大きなニュースリスクがある場合は、金曜日にポジションを縮小または決済する。'
            },
            {
                title: 'チャートを見すぎない',
                category: 'MENTAL',
                description: 'エントリー後は4時間おきのチェックに留め、一喜一憂しない。'
            }
        ]
    }
]
