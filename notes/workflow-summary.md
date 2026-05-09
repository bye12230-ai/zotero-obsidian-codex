# Zotero–Obsidian–Codex指南

---

## 整个工作流到底是什么？

PDF文献  
↓  
Zotero 管理  
↓  
Obsidian 整理知识  
↓  
Codex + Skills 分析

---

## 第一部分：每个软件负责什么

### 1. Zotero

Zotero 是：  
文献管理器

它负责：  
- 存 PDF  
- 存文献条目  
- 自动生成引用  
- 管理标签  
- 做文献分类  
- 写批注  
- 同步论文

你可以理解成：  
学术版收藏夹 + PDF 图书馆, 全部结构化。

---

### 2. Obsidian

Obsidian 是：  
知识组织工具  
网络化知识，它们会互相链接，形成：  
**知识网络**

#### Obsidian 负责什么

- 研究笔记  
- 思考过程  
- 理论关联  
- 概念网络  
- 灵感整理  
- 论文框架

你可以理解成：  
AI 时代的大脑

#### Obsidian 为什么适合 AI

因为它使用 **Markdown**，Markdown 是 AI 最容易读取的文本格式  
所以：  
- GPT  
- Claude  
- Codex  
都特别喜欢 Obsidian。

#### Obsidian 双向链接与知识图谱

- 双向链接：笔记互相关联，概念与文献节点既能引用也能被引用  
- 知识图谱（Graph View）：  
  - 可视化知识网络  
  - 辅助发现研究空白、理清主题结构、规划写作  

---

### 3. Codex

#### Codex 和 ChatGPT 的区别

- ChatGPT：单轮聊天  
- Codex：项目级 AI 工作空间

Codex 会：  
- 读取整个项目文件夹  
- 理解项目结构  
- 自动分析 Markdown  
- 自动执行任务  

---

## 第二部分：三者联合工作流

| 步骤       | 工具    | 操作与目标                                    |
|------------|--------|-----------------------------------------------|
| 文献收集   | Zotero | PDF/数据库/网页收集，导出 CSV、元数据整理      |
| 文献整理   | Obsidian | CSV → Markdown；建立笔记、双向链接、Graph View |
| 文献分析   | Codex  | 分析 Markdown 内容：趋势、缺口、研究方向       |
| 输出       | Obsidian/网页 | 生成研究报告、知识图谱、写作素材、网页展示     |

---

## 第三部分：Zotero + Codex 写作方向初研究试验

- **STEP 1：Zotero 文献库搭建**  
  导出文献（格式建议）：CSV（最直观，方便后续处理）  
  包含必要信息，尤其是摘要（Codex 分析核心）  

- **STEP 2：将 CSV 转换为 Markdown 表格**  
  - 法 1: [ConvertCSV.com CSV→Markdown](https://www.convertcsv.com/csv-to-markdown.htm)  
  - 法 2: Excel/Google Sheets → 使用公式拼接每行生成 Markdown  
  - 法 3: 文献量大可用 Python 脚本批量生成 Markdown  

  目的：让 Codex 能直接读取表格中的文献信息，提升模型理解和分析质量。  

- **STEP 3：Codex 分析**  
  我有一组关于“XXX主题”的文献在上传的条目里：  
  （粘贴 Markdown 表格文件）  
  请帮我：  
  1. 分析研究趋势  
  2. 找出研究空白/未解决问题  
  3. 给出潜在写作方向或研究角度  
  4. 推荐核心参考文献（标 DOI 或标题）  

在回答中结合核心期刊、近年的研究进展，不仅局限于提供的文献。

---

## 第四部分：Skills

- **AI 工作流程说明书**  
  使用的两个 Skills  

### 1. Research Vault Literature Retrieval
作用：  
- 检索本地知识库  
- 阅读 Markdown  
- 搜索论文  
- 提取研究主题  
- 建立知识关联  

### 2. Zotero Analytical Workflow Skills
作用：  
- 分析文献关系  
- 找理论脉络  
- 找研究缺口  
- 比较研究方法  
- 生成综述结构  

---

## 第五部分：Skills 到底装在哪里？

放在项目文件夹里，正确结构示例：

```text
AI-Research-Site/
│
├── notes/
├── pdfs/
└── .codex/
    └── skills/
        ├── Research Vault Literature Retrieval/
        └── Zotero Analytical Workflow Skills/