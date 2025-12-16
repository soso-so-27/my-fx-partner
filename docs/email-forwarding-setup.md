# Cloudflare Registrar でドメイン購入 & メール転送設定

---

## Step 0: Cloudflare アカウント作成 (未登録の場合)

1.  [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) にアクセス
2.  メールアドレスとパスワードを入力して登録
3.  確認メールが届くのでリンクをクリック

---

## Step 1: ドメインを検索・購入

1.  [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン
2.  左メニューから **Domain Registration** > **Register Domains** をクリック
3.  希望のドメイン名を検索 (例: `my-fx-journal`, `tradelog`, `fx-partner`)

**おすすめのドメイン例:**
| ドメイン案 | 予想価格 (年間) |
|-----------|----------------|
| `my-fx-journal.com` | ~$10 (~¥1,500) |
| `fx-partner.dev` | ~$12 (~¥1,800) |
| `tradelog.app` | ~$15 (~¥2,200) |
| `fxjournal.xyz` | ~$10 (~¥1,500) |

4.  利用可能なドメインを選択して **Purchase** をクリック
5.  支払い情報を入力 (クレジットカード or PayPal)
6.  購入完了！ドメインは即座にCloudflareで使用可能になります

---

## Step 2: Email Routing を有効化

1.  Cloudflareダッシュボードで **購入したドメイン** を選択
2.  左メニューから **Email** > **Email Routing** をクリック
3.  **Enable Email Routing** をクリック
4.  Cloudflareが自動でMXレコードを設定するか確認 → **Add records and enable** をクリック
5.  ステータスが **Active** に変わったらOK

---

## Step 3: Cloudflare Worker を作成

1.  左メニューから **Workers & Pages** をクリック
2.  **Create** > **Create Worker** を選択
3.  名前を入力: `fx-email-worker`
4.  **Deploy** をクリック (デフォルトコードのまま)
5.  デプロイ後、**Edit code** をクリック
6.  **エディタ内のコードを全て削除**し、以下を貼り付け:

```javascript
export default {
    async email(message, env, ctx) {
        const toAddress = message.to;
        const fromAddress = message.from;
        const subject = message.headers.get("subject") || "";

        const rawEmail = await new Response(message.raw).text();

        let bodyText = "";
        try {
            const textMatch = rawEmail.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\r\n$)/i);
            if (textMatch) {
                bodyText = textMatch[1];
            } else {
                bodyText = rawEmail;
            }
        } catch (e) {
            bodyText = rawEmail;
        }

        const payload = {
            to: toAddress,
            from: fromAddress,
            subject: subject,
            body: bodyText
        };

        console.log("Processing:", fromAddress, "->", toAddress);

        const response = await fetch(env.API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-webhook-secret": env.EMAIL_INGEST_SECRET
            },
            body: JSON.stringify(payload)
        });

        console.log("API:", response.status);
    }
};
```

7.  右上の **Deploy** をクリック

---

## Step 4: Worker に環境変数を追加

1.  Worker一覧から `fx-email-worker` をクリック
2.  **Settings** タブ > **Variables and Secrets** をクリック
3.  **Add** をクリックして以下を追加:

| Type | Variable name | Value |
|------|---------------|-------|
| Text | `API_ENDPOINT` | `https://my-fx-partner.vercel.app/api/webhooks/email-inbound` |
| Secret | `EMAIL_INGEST_SECRET` | `ahH15QI/zdl2uCFSZjC96STTr2dpV/P/` |

4.  **Deploy** をクリック

---

## Step 5: Email Routing と Worker を接続

1.  Cloudflareダッシュボードでドメインを選択
2.  **Email** > **Email Routing** > **Routing rules** タブ
3.  **Create address** をクリック
4.  以下を設定:

| Field | Value |
|-------|-------|
| Custom address | `import` |
| Action | Send to a Worker |
| Destination | `fx-email-worker` |

5.  **Save** をクリック

> これで `import@あなたのドメイン.com` 宛のメールがWorkerに転送されます。
> `import+xxxx@...` 形式もこのルールでカバーされます（Cloudflareは `+` 以降を無視）。

---

## Step 6: Vercel に環境変数を追加

1.  [Vercel ダッシュボード](https://vercel.com/) にログイン
2.  `my-fx-partner` プロジェクトを選択
3.  **Settings** > **Environment Variables**
4.  以下を追加:

| Key | Value | Environments |
|-----|-------|--------------|
| `EMAIL_INGEST_SECRET` | `ahH15QI/zdl2uCFSZjC96STTr2dpV/P/` | Production, Preview, Development |

5.  **Save** をクリック

---

## Step 7: アプリをデプロイ

ローカルで実行:
```bash
npx vercel --prod
```

---

## Step 8: 設定画面を更新

アプリの `/settings` ページで表示されるアドレスを、購入したドメインに更新する必要があります。

**ファイル:** `src/app/settings/page.tsx`

現在:
```
import+{user.id}@your-domain.com
```

購入後に実際のドメインに置き換え:
```
import+{user.id}@あなたのドメイン.com
```

---

## Step 9: テスト

1.  アプリの設定画面 (`/settings`) を開く
2.  「メール転送連携」に表示されるアドレスをコピー:
    `import+あなたのユーザーID@あなたのドメイン.com`
3.  Gmailなどから上記アドレスにテストメール送信:
    - 件名: `Trade Confirmation`
    - 本文: `buy 0.1 USDJPY at 150.00`
4.  数秒後、ジャーナルにトレードが追加されれば成功🎉

---

## トラブルシューティング

| 症状 | 確認ポイント |
|------|-------------|
| メールが届かない | Email Routing が Active か確認 |
| Worker エラー | Workers & Pages > Logs でエラー確認 |
| 401 Unauthorized | SECRET が Vercel と Worker で一致しているか |
| トレード登録されない | Vercel Functions ログを確認 |

---

## 次のアクション

1.  ✅ Cloudflare でドメインを購入
2.  ✅ 購入したドメイン名を教えてください
3.  → 私がコードを更新します
