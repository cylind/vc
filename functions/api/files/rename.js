// /functions/api/files/rename.js
// (确保此路径不会与 /functions/api/files/[[path]].js 冲突，
// Pages Functions 通常会优先匹配更具体的路径)
// 或者，您可以将此逻辑合并到 [[path]].js 中，通过检查 request.url 来区分

export async function onRequestPost({ request, env }) {
    const R2_BUCKET = env.YOUR_R2_BUCKET;
     if (!R2_BUCKET) {
        console.error("R2 Bucket not bound or configured.");
        return new Response(JSON.stringify({ success: false, error: "服务器R2配置错误" }), { status: 500 });
    }

    try {
        const { oldFilename, newFilename } = await request.json();
        if (!oldFilename || !newFilename || oldFilename === newFilename) {
            return new Response(JSON.stringify({ success: false, error: "需要提供有效且不同的新旧文件名。" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 检查新文件名是否已存在 (可选, R2 put 会覆盖)
        // const existingNew = await R2_BUCKET.head(newFilename);
        // if (existingNew) {
        //     return new Response(JSON.stringify({ success: false, error: `目标文件 "${newFilename}" 已存在。` }), { status: 409 });
        // }

        const object = await R2_BUCKET.get(oldFilename);
        if (object === null) {
            return new Response(JSON.stringify({ success: false, error: "源文件未找到。" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        // 复制对象: 将旧对象内容写入新键
        await R2_BUCKET.put(newFilename, object.body, {
             httpMetadata: object.httpMetadata, // 保留元数据
             customMetadata: object.customMetadata, // 保留自定义元数据
        });

        // 删除旧对象
        await R2_BUCKET.delete(oldFilename);

        return new Response(JSON.stringify({ success: true, message: `文件已从 ${oldFilename} 重命名为 ${newFilename}` }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        console.error("Rename Error:", e);
        return new Response(JSON.stringify({ success: false, error: "重命名文件失败: " + e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}