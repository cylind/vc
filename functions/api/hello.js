// /functions/api/hello.js
export async function onRequestGet({ request, env }) {
    console.log("Hello function invoked!"); // 在Worker中添加日志
    return new Response(JSON.stringify({ message: "Hello from Cloudflare Function!" }), {
        headers: { 'Content-Type': 'application/json' }
    });
}