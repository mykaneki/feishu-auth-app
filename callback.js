// api/callback.js
// 这是一个在 Vercel 上运行的 Node.js Serverless Function.
// 它的作用是安全地用 code 和你的 app_secret 换取 access_token.

export default async function handler(request, response) {
    // 只接受 POST 请求
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { code, appId, appSecret } = request.body;

        if (!code || !appId || !appSecret) {
            return response.status(400).json({ error: 'Missing required parameters: code, appId, or appSecret' });
        }

        const feishuApiUrl = 'https://open.feishu.cn/open-apis/authen/v1/access_token';

        const feishuResponse = await fetch(feishuApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                app_id: appId,
                app_secret: appSecret,
            }),
        });

        const result = await feishuResponse.json();

        if (result.code !== 0) {
            // 如果飞书返回错误，将错误信息传递给前端
            return response.status(400).json({ 
                error: `Feishu API Error: [${result.code}] ${result.msg}` 
            });
        }
        
        // 成功后，只把安全的数据返回给前端
        const responseData = {
            accessToken: result.data.access_token,
            refreshToken: result.data.refresh_token,
            expiresIn: result.data.expires_in,
            refreshExpiresIn: result.data.refresh_expires_in,
            timestamp: Date.now(),
        };

        // 设置CORS头，允许任何来源的前端访问这个API
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        return response.status(200).json(responseData);

    } catch (error) {
        // 处理网络请求或其他未知错误
        return response.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}
