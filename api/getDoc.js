/**
 * 町内会・自治体向けチャットボット
 * Vercel Serverless Function - Get Document API
 *
 * 環境変数（Vercelの管理画面で設定）：
 * GAS_URL: GASのデプロイURL
 */

export default async function handler(req, res) {
  // CORSヘッダー設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gasUrl = process.env.GAS_URL;
    if (!gasUrl) {
      return res.status(500).json({ error: 'GAS_URLが設定されていません' });
    }

    const response = await fetch(`${gasUrl}?action=getDoc`);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `GASへのアクセスに失敗しました (${response.status})`
      });
    }

    const text = await response.text();

    if (!text || text.startsWith('データの読み込みに失敗')) {
      return res.status(500).json({ error: text || 'データの取得に失敗しました' });
    }

    return res.status(200).send(text);

  } catch (err) {
    console.error('getDoc.js error:', err);
    return res.status(500).json({ error: err.message || '予期しないエラーが発生しました' });
  }
}
