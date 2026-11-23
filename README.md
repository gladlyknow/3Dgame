# Tire Town School — Episode 01 Demo

《Tire Town School》配套 3D 学习游戏的第一集可玩 Demo。当前版本只聚焦 **Eddy's First Day / 艾迪的第一天**，用于验证儿童驾驶手感、校园空间、故事节奏、双语学习反馈和整体美术方向。

## 当前版本

- 六段连续剧情：入校、校园揭示、礼让长车、快车惊吓、轮胎角落、Poppy 问候。
- 键盘与手机触屏驾驶，低位稳定跟车镜头。
- 危险路口自动安全制动；没有失败、扣分或倒计时。
- 英文语音、英文主字幕和简体中文辅助字幕。
- 模块化 TypeScript 工程，角色、校园、输入、UI 和剧情状态机分离。
- 当前 3D 资产为经过视觉设计的可玩灰盒，尚不是最终授权角色模型。

详细范围与验收标准见 [第一集 Demo 规格](./docs/EPISODE01_DEMO.md)。视觉方向见 [阶段 1 视觉规范](./design/preproduction/VISUAL_DIRECTION.md)。

## 本地运行

```bash
pnpm install --frozen-lockfile
pnpm dev
```

桌面端：`WASD` 或方向键驾驶，`Space` 鸣笛。触屏端使用画面两侧的方向键和踏板。

生产构建：

```bash
pnpm build
```

构建结果位于 `dist/`。

## Cloudflare Pages

- Production branch: `main`
- Build command: `pnpm build`
- Build output directory: `dist`
- Root directory: `/`
- Node.js: `22`

不要填写部署命令，也不要把输出目录设置为 `/`。功能分支用于预览验收，通过后再合并到 `main`。

## IP 与儿童安全

本仓库当前使用原创的概念模型和程序化场景。正式商用前，需要用已获授权的角色模型、Logo、配音、剧集文本和品牌规范替换临时内容。游戏不要求儿童输入个人信息，也不含广告或失败惩罚。
