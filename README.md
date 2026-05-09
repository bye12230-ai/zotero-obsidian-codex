# AI Research Knowledge Site

从 `notes/` 目录中的 Markdown 自动生成可部署到 Netlify 的学术风格知识网站。

## 使用

```bash
npm install
npm run build
```

构建产物位于 `dist/`。新增 Markdown 时，只需把 `.md` 文件放入 `notes/`（支持子目录），再次运行 `npm run build` 即可。

## Netlify

仓库已包含 `netlify.toml`：

- Build command: `npm run build`
- Publish directory: `dist`

