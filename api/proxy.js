// api/proxy.js
// 这是一个通用的飞书 API 代理函数。
// 它的作用是接收前端的请求，安全地附加上 Authorization 头，然后转发给飞书服务器。

export default async function handler(request, response) {
    // 设置CORS头，允许任何来源的前端访问
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理浏览器的 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { feishuApi, method = 'GET', body = null } = request.body;
        const accessToken = request.headers.authorization;

        if (!feishuApi || !accessToken) {
            return response.status(400).json({ error: 'Missing feishuApi path or access token' });
        }

        const feishuApiUrl = `https://open.feishu.cn/open-apis${feishuApi}`;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken, // 从前端请求头中获取 token
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const feishuResponse = await fetch(feishuApiUrl, options);
        const result = await feishuResponse.json();

        if (result.code !== 0) {
            return response.status(400).json({ 
                error: `Feishu API Error: [${result.code}] ${result.msg}` 
            });
        }

        return response.status(200).json(result.data);

    } catch (error) {
        return response.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}
