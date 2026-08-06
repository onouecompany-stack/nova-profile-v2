export default async function handler(req, res) {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (!kvUrl || !kvToken) {
        return res.status(500).json({ error: 'KV environment variables are not configured.' });
    }

    // データの取得 (GET)
    if (req.method === 'GET') {
        const tagId = req.query.tagId || 'default-tag';
        try {
            const response = await fetch(`${kvUrl}/get/profile_${tagId}`, {
                headers: { Authorization: `Bearer ${kvToken}` },
            });
            const data = await response.json();
            // Upstashのレスポンス構造に合わせてパース
            const profileData = data.result ? JSON.parse(data.result) : {};
            return res.status(200).json(profileData);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch from KV' });
        }
    }

    // データの保存 (POST)
    if (req.method === 'POST') {
        const { tagId, name, bio, link } = req.body;
        const targetTag = tagId || 'default-tag';
        const profileData = JSON.stringify({ name, bio, link });

        try {
            const response = await fetch(`${kvUrl}/set/profile_${targetTag}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${kvToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            });
            const data = await response.json();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to save to KV' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
