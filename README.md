# 静心数独

一个无需构建工具或后端的 9×9 网页数独游戏。它包含四档难度、唯一解题目生成、候选笔记、提示、撤销、计时与自动存档。

## 运行

直接打开 `index.html` 即可。也可以在项目目录启动静态服务器：

```bash
python3 -m http.server 8000
```

然后访问 <http://localhost:8000>。

## 测试

```bash
node tests/sudoku.test.js
```
