const { defineConfig } = require('cz-git');

const CONTRACT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
];

const CJK = /[\u4e00-\u9fff]/;

module.exports = defineConfig({
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (message) => message.startsWith("Merge branch '"),
    (message) => message.startsWith("Merge remote-tracking branch '"),
    (message) => message.startsWith('Merge pull request #'),
    (message) => /^Revert\s+["']/.test(message.trim()),
  ],
  plugins: [
    {
      rules: {
        'no-cjk-in-commit'(parsed) {
          const { subject = '', body = '', footer = '' } = parsed;
          const texts = [subject, body, footer].filter(Boolean);
          const hit = texts.some((t) => CJK.test(t));
          return [
            !hit,
            hit
              ? 'commit subject, body, and footer must be English only (CJK U+4E00–U+9FFF is not allowed)'
              : '',
          ];
        },
      },
    },
  ],
  rules: {
    'type-enum': [2, 'always', CONTRACT_TYPES],
    'scope-case': [2, 'always', 'kebab-case'],
    'no-cjk-in-commit': [2, 'always'],
  },
  prompt: {
    messages: {
      type: '选择本次变更的类型（方向键）：',
      scope: '填写影响范围 scope（可选，建议 kebab-case）：',
      customScope: '自定义 scope：',
      subject: '用英文写简短祈使句描述（subject，勿使用中文）：\n',
      body: '补充详细说明（可选，须为英文；换行可用 "|"）：\n',
      breaking: '破坏性变更 BREAKING CHANGE（可选，须为英文）：\n',
      footerPrefixSelect: '选择 ISSUE 前缀（可选）：',
      customFooterPrefix: '自定义 ISSUE 前缀：',
      footer: '关联 ISSUE，如 #31（可选）：\n',
      generatingByAI: '正在生成 subject…',
      generatedSelectByAI: '从 AI 建议中选择 subject：',
      confirmCommit: '确认提交以上说明？',
    },
    types: [
      { value: 'feat', name: 'feat:     新功能', emoji: ':sparkles:' },
      { value: 'fix', name: 'fix:      修复缺陷', emoji: ':bug:' },
      { value: 'docs', name: 'docs:     文档', emoji: ':memo:' },
      { value: 'style', name: 'style:    格式/样式（不改变语义）', emoji: ':lipstick:' },
      { value: 'refactor', name: 'refactor: 重构', emoji: ':recycle:' },
      { value: 'perf', name: 'perf:     性能', emoji: ':zap:' },
      { value: 'test', name: 'test:     测试', emoji: ':white_check_mark:' },
      { value: 'build', name: 'build:    构建或依赖', emoji: ':package:' },
      { value: 'ci', name: 'ci:       CI 配置', emoji: ':ferris_wheel:' },
      { value: 'chore', name: 'chore:    其他杂项（不修改 src/test）', emoji: ':hammer:' },
    ],
    useEmoji: false,
    allowCustomScopes: true,
    allowEmptyScopes: true,
    breaklineChar: '|',
  },
});
