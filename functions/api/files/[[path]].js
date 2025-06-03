// /functions/api/files/[[path]].js

// 辅助函数：根据文件名确定 Content-Type
function getContentTypeByExtension(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
        js: 'application/javascript', html: 'text/html', css: 'text/css',
        json: 'application/json', md: 'text/markdown', xml: 'application/xml',
        txt: 'text/plain', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf',
        // 根据需要添加更多类型
    };
    return map[ext] || 'application/octet-stream'; // 默认为二进制流
}


export async function onRequest({ request, env, params }) {
    // 简单的认证检查 (实际应用需要更安全的方式)
    // 您可以在这里添加基于 Worker 之间通信或 JWT 的更严格的认证检查
    // const isAuthenticated = true; // 假设在调用此Worker前已通过某种方式验证
    // if (!isAuthenticated) {
    //    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
    // }

    const R2_BUCKET = env.YOUR_R2_BUCKET; // 确保 YOUR_R2_BUCKET 已在Cloudflare Pages中正确绑定
    if (!R2_BUCKET) {
        console.error("R2 Bucket not bound or configured.");
        return new Response(JSON.stringify({ success: false, error: "服务器R2配置错误" }), { status: 500 });
    }

    const method = request.method;
    const pathSegments = params.path || []; // `path` 是 `[[path]].js` 提供的参数数组
    const filename = pathSegments.length > 0 ? pathSegments.join('/') : null;

    try {
        if (method === 'GET') {
            if (!filename) { // 列出文件 /api/files
                const listed = await R2_BUCKET.list();
                const files = listed.objects.map(obj => ({
                    key: obj.key,
                    size: obj.size,
                    uploaded: obj.uploaded,
                    // httpMetadata: obj.httpMetadata, // 可选
                    // customMetadata: obj.customMetadata, // 可选
                }));
                return new Response(JSON.stringify({ success: true, files }), { headers: { 'Content-Type': 'application/json' } });
            } else { // 获取文件内容 /api/files/some/file.txt
                const object = await R2_BUCKET.get(filename);
                if (object === null) {
                    return new Response(JSON.stringify({ success: false, error: "文件未找到" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }
                const headers = new Headers();
                object.writeHttpMetadata(headers); // 写入R2中存储的HTTP元数据，如Content-Type
                headers.set('ETag', object.httpEtag); // ETag用于缓存控制
                // 如果没有Content-Type, 则尝试从扩展名猜测
                if (!headers.has('Content-Type')) {
                    headers.set('Content-Type', getContentTypeByExtension(filename));
                }
                return new Response(object.body, { headers });
            }
        } else if (method === 'PUT' && filename) { // 保存/创建文件 /api/files/some/file.txt
            const contentType = request.headers.get('Content-Type') || getContentTypeByExtension(filename);
            await R2_BUCKET.put(filename, request.body, {
                httpMetadata: { contentType },
            });
            return new Response(JSON.stringify({ success: true, message: `文件 ${filename} 已保存。` }), { headers: { 'Content-Type': 'application/json' } });
        } else if (method === 'DELETE' && filename) { // 删除文件 /api/files/some/file.txt
            await R2_BUCKET.delete(filename);
            return new Response(JSON.stringify({ success: true, message: `文件 ${filename} 已删除。` }), { headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: false, error: "不支持的请求或路径。" }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        console.error(`R2 Error (${method} ${filename || '/'}):`, e);
        return new Response(JSON.stringify({ success: false, error: "R2 操作失败: " + e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}