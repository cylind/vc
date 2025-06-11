# Monaco 在线编辑器 - 高级版

这是一个基于 Monaco Editor 构建的高级在线代码编辑器，集成了 Cloudflare R2 对象存储服务，旨在提供一个功能丰富、类似桌面 IDE 的浏览器内编码体验。

## 核心功能

*   **强大的代码编辑体验：**
    *   基于微软的 **Monaco Editor**，提供语法高亮、智能提示（部分语言）、代码折叠等高级编辑功能。
    *   支持多种编程语言，包括但不限于 JavaScript, Python, HTML, CSS, JSON, Markdown 等。
    *   高度可定制的编辑器设置：
        *   主题切换 (例如: `vs-dark`, `hc-light`)
        *   字体大小调整
        *   行号显示模式
        *   空白字符渲染方式
        *   光标样式选择
        *   自动换行开关
        *   代码缩略图 (Minimap) 开关

*   **Cloudflare R2 存储集成：**
    *   通过密码认证安全连接到用户的 R2 存储桶。
    *   内置文件浏览器，支持：
        *   列出 R2 存储桶中的文件
        *   打开 R2 中的文件到编辑器
        *   保存编辑器内容到 R2（新建或覆盖）
        *   重命名 R2 中的文件
        *   删除 R2 中的文件
    *   直接在编辑器中创建新文件并保存到 R2。

*   **本地文件交互：**
    *   支持从用户本地计算机上传文件到编辑器。
    *   支持将编辑器中的内容下载到用户本地计算机。

*   **用户友好的界面 (UI)：**
    *   采用经典的 VS Code 式布局：顶部菜单栏、活动栏（左侧）、主侧边栏（文件浏览器/设置）、编辑区域、底部状态栏。
    *   **顶部菜单栏：** 文件 (新建, 打开, 保存到R2, 下载), 编辑 (撤销, 重做, 查找, 替换), 选择 (全选), 查看 (切换Minimap, 切换自动换行), 转到 (转到行), 帮助 (关于)。
    *   **活动栏：** 快速访问文件浏览器 (R2), 查找功能, 编辑器设置。
    *   **底部状态栏：** 显示光标位置 (行号, 列号), 缩进设置 (Tab大小, 空格/Tab), 文件编码 (概念性, 默认为UTF-8), 当前语言模式。点击可快速修改相关设置。

## 技术栈

*   **前端：**
    *   HTML5
    *   CSS3 (包括 [Tailwind CSS](https://tailwindcss.com/))
    *   JavaScript (ES6+)
    *   [Monaco Editor](https://microsoft.github.io/monaco-editor/)
*   **后端 (Cloudflare Pages Functions)：**
    *   使用 Cloudflare Pages 的 [Functions](https://developers.cloudflare.com/pages/functions/) 功能，它基于 Cloudflare Workers。
    *   JavaScript (Node.js 运行时环境) - 用于处理 API 请求，如 R2 认证和文件操作。
    *   API 接口定义在 `functions/api/` 目录下，会自动被 Cloudflare Pages 部署为服务端点。
*   **云存储：**
    *   [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)

## 项目架构概览

```mermaid
graph TD
    A[用户浏览器] -->|加载 HTML, CSS, JS| B(index.html - Monaco 在线编辑器)
    B -->|API 请求 (e.g., /api/files, /api/auth)| C{后端 Serverless Functions}
    C -->|与 R2 API 交互| D[Cloudflare R2 存储桶]

    subgraph "前端 (在浏览器中运行)"
        direction LR
        B_UI[UI 界面 (HTML/CSS)]
        B_Monaco[Monaco Editor 核心]
        B_AppLogic[应用逻辑 (JS - R2交互, 文件处理, 编辑器控制)]
    end

    subgraph "后端 (Serverless)"
        direction LR
        C_Auth([functions/api/auth.js])
        C_FileOps([functions/api/files/])
    end

    B_UI -- 包含 --> B_Monaco
    B_UI -- 驱动 --> B_AppLogic
    B_AppLogic -- 调用 --> B_Monaco
    B_AppLogic -- 发起 --> C
```

## 如何部署与运行

本项目设计为直接部署在 **Cloudflare Pages** 上。

1.  **Fork 本仓库**
    将此项目 Fork 到您自己的 GitHub 账户。

2.  **在 Cloudflare 创建 Pages 项目**
    *   登录到您的 Cloudflare 仪表板。
    *   导航到 **Workers & Pages** > **创建应用程序** > **Pages**。
    *   选择 **连接到 Git** 并选择您刚刚 Fork 的仓库。

3.  **配置构建和部署**
    *   **生产分支：** 选择 `main` 或您的主分支。
    *   **构建设置：**
        *   **框架预设：** 选择 `无`。
        *   **构建命令：** 无需构建命令，可以留空。
        *   **构建输出目录：** 留空或设置为 `/`。
    *   点击 **保存并部署**。

4.  **配置环境变量**
    部署完成后，导航到您项目的 **设置** > **环境变量**，并添加以下变量。请注意，对于 Pages Functions，您**不需要**提供 `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` 或 `R2_SECRET_ACCESS_KEY`，因为我们将通过下面的“R2 存储桶绑定”来授予访问权限。

    *   `R2_ACCESS_PASSWORD`: 用于访问编辑器的密码。这是您自定义的密码，用于在编辑器中连接 R2 时进行验证。

5.  **绑定 R2 存储桶**
    *   在项目设置中，导航到 **函数** > **R2 存储桶绑定**。
    *   点击 **添加绑定**。
    *   **变量名称：** `YOUR_R2_BUCKET` (此名称必须与 `functions/api/**/*.js` 代码中使用的 `env.YOUR_R2_BUCKET` 完全匹配)。
    *   **R2 存储桶：** 选择您希望用于存储文件的 R2 存储桶。

6.  **重新部署**
    完成环境变量和 R2 绑定后，返回项目的部署页面，触发一次新的部署以使设置生效。

7.  **访问和使用**
    部署成功后，访问您的 `*.pages.dev` 域名。
    *   点击左侧活动栏的文件浏览器图标。
    *   在弹出的模态框中输入您在 `R2_ACCESS_PASSWORD` 环境变量中设置的密码。
    *   连接成功后，即可开始在线编辑和管理 R2 中的文件。