/**
 * 町内会・自治体向けチャットボット
 * Vercel Serverless Function - Chat API
 *
 * 環境変数（Vercelの管理画面で設定）：
 * ANTHROPIC_API_KEY: AnthropicのAPIキー
 */

const MODEL = 'claude-sonnet-4-20250514';

function buildSystemPrompt(docContent) {
  return `あなたは「町内会・自治体向けチャットボット」です。
町内会、マンション管理組合、自治体などの地域コミュニティに関する相談に、親切・丁寧・わかりやすくお答えします。

■ あなたの役割
・町内会のルール・規則に関する質問に答える
・行事・イベント情報を案内する
・役員の連絡先を提供する
・ゴミ出しなどの生活ルールを説明する
・よくある質問に回答する
・専門家への相談窓口を案内する

■ 回答ルール（形式）
・マークダウン記号（#、*など）は一切使用しない
・箇条書きは「・」を使う
・一度の返答は300文字以内を目安にする
・難しい言葉は避けて、高齢者にも分かりやすく説明する
・重要な情報は繰り返して強調する

■ 回答ルール（内容）
・提供されたドキュメントの情報を優先して回答する
・ドキュメントに記載のない情報は「詳しくは担当の役員にお問い合わせください」と伝える
・日付や条件は「変更になる場合があります」と補足する
・法律や専門知識が必要な場合は「専門家への相談をおすすめします」と添える
・高齢の方向けに、電話番号や役員の名前は特に丁寧に説明する

■ 態度・トーン
・親しみやすく、丁寧に、高齢者にも優しく
・ユーザーが困っている様子のときはまず共感してから案内する
・回答の最後に「ご不明な点はお気軽にお問い合わせください😊」など次の一言を添える

■ 参照データ
${docContent || 'データを読み込み中です。'}`;
}

export default async function handler(req, res) {
  // CORSヘッダー設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, docContent } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'APIキーが設定されていません' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(docContent),
        messages: messages
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `APIエラー (${response.status})`
      });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || '（回答を取得できませんでした）';
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('chat.js error:', err);
    return res.status(500).json({ error: err.message || '予期しないエラーが発生しました' });
  }
}
