// /functions/api/auth.js - 调试版本
export async function onRequest({ request, env }) {
    console.log(`[/api/auth] Received request method: ${request.method}`); // 增加日志

    if (request.method === 'POST') {
        try {
            const { password } = await request.json();
            const storedPassword = env.R2_ACCESS_PASSWORD;

            if (!storedPassword) {
                console.error("[/api/auth] Server configuration error: R2_ACCESS_PASSWORD not set.");
                return new Response(JSON.stringify({ success: false, error: "服务器配置错误 (密码未设置)。" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
            if (password === storedPassword) {
                console.log("[/api/auth] Authentication successful.");
                return new Response(JSON.stringify({ success: true, message: "认证成功 (来自 onRequest)" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } else {
                console.log("[/api/auth] Invalid password attempt.");
                return new Response(JSON.stringify({ success: false, error: "密码无效 (来自 onRequest)" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }
        } catch (e) {
            console.error("[/api/auth] Auth POST error (in onRequest):", e.message, e.stack);
            return new Response(JSON.stringify({ success: false, error: "请求处理失败: " + e.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
    } else {
        console.log(`[/api/auth] Method ${request.method} not allowed. Expected POST.`);
        return new Response(JSON.stringify({ success: false, error: `方法 ${request.method} 不被 /api/auth 允许。请使用 POST。` }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
    }
}