// /functions/api/auth.js
export async function onRequestPost({ request, env }) {
    try {
        const { password } = await request.json();
        const storedPassword = env.R2_ACCESS_PASSWORD;

        if (!storedPassword) {
            console.error("Server configuration error: R2_ACCESS_PASSWORD not set.");
            return new Response(JSON.stringify({ success: false, error: "服务器配置错误。" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        if (password === storedPassword) {
            // 实际应用中，这里应该返回一个安全的会话令牌 (JWT)
            return new Response(JSON.stringify({ success: true, message: "认证成功" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
            return new Response(JSON.stringify({ success: false, error: "密码无效" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
    } catch (e) {
        console.error("Auth error:", e);
        return new Response(JSON.stringify({ success: false, error: "请求处理失败: " + e.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
}