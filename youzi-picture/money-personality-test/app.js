/**
 * 赚钱人格测试 - 主逻辑
 * 配置说明：
 * - 修改 BUY_URL 变量来设置购买链接
 * - 修改 QUESTIONS 数组来更改题目
 * - 修改 RESULTS 对象来更改结果文案
 */

// =========================================
// 全局配置（这里可以修改）
// =========================================
const CONFIG = {
  // 购买完整版报告的链接，替换成你的支付链接
  BUY_URL: 'https://your-payment-link.com',

  // 品牌名
  BRAND: '赚钱人格测试',

  // 副标题
  SUBTITLE: '测出你最适合的搞钱路径',
};

// =========================================
// 题目数据（12道题）
// =========================================
const QUESTIONS = [
  {
    id: 1,
    question: '你看到别人靠副业赚钱，第一反应更像是：',
    options: [
      { text: '先试试，能不能马上卖出第一单', type: 'seller' },
      { text: '研究一下别人是怎么表达和吸粉的', type: 'content' },
      { text: '我能不能做个更好用的版本', type: 'tool' },
      { text: '这类用户到底最缺什么', type: 'observer' }
    ]
  },
  {
    id: 2,
    question: '如果给你一周时间做个副业，你更愿意：',
    options: [
      { text: '直接做个能卖的产品先挂出去', type: 'seller' },
      { text: '先发内容，看看大家对什么最感兴趣', type: 'content' },
      { text: '先把模板、资料、流程整理好', type: 'tool' },
      { text: '先设计一个稳定执行的计划', type: 'system' }
    ]
  },
  {
    id: 3,
    question: '你更容易因为哪件事拖延？',
    options: [
      { text: '总想等一个更好的机会再上', type: 'observer' },
      { text: '担心发出去没人看', type: 'content' },
      { text: '觉得产品还不够完善', type: 'tool' },
      { text: '计划还没理清楚', type: 'system' }
    ]
  },
  {
    id: 4,
    question: '你最希望别人因为你而愿意付费的是：',
    options: [
      { text: '你能帮他快速拿到结果', type: 'seller' },
      { text: '你讲得明白、表达有吸引力', type: 'content' },
      { text: '你做的工具真的省时间', type: 'tool' },
      { text: '你很懂他，能给他支持和建议', type: 'service' }
    ]
  },
  {
    id: 5,
    question: '如果让你长期做一件事，你更能接受：',
    options: [
      { text: '每天冲销量、盯转化', type: 'seller' },
      { text: '持续发内容、积累粉丝', type: 'content' },
      { text: '不断优化产品细节', type: 'tool' },
      { text: '不断复盘和调整流程', type: 'system' }
    ]
  },
  {
    id: 6,
    question: '遇到一个新项目时，你通常会先：',
    options: [
      { text: '看能不能立刻上线试卖', type: 'seller' },
      { text: '想它适合怎么包装传播', type: 'content' },
      { text: '想怎么把它做成工具或模板', type: 'tool' },
      { text: '想怎么把整个流程设计顺', type: 'system' }
    ]
  },
  {
    id: 7,
    question: '你更擅长哪种状态下赚钱？',
    options: [
      { text: '快节奏、边做边改', type: 'seller' },
      { text: '靠表达、靠内容影响别人', type: 'content' },
      { text: '靠产品本身好用', type: 'tool' },
      { text: '靠信任、靠长期关系', type: 'service' }
    ]
  },
  {
    id: 8,
    question: '你最怕哪种赚钱方式？',
    options: [
      { text: '做很久都没人买', type: 'seller' },
      { text: '一直要硬着头皮成交', type: 'content' },
      { text: '交付太重，把自己绑死', type: 'service' },
      { text: '整体太乱，越做越失控', type: 'system' }
    ]
  },
  {
    id: 9,
    question: '别人夸你时，哪句你最常听到？',
    options: [
      { text: '你行动真的很快', type: 'seller' },
      { text: '你很会说，也很会写', type: 'content' },
      { text: '你整理得好清楚', type: 'tool' },
      { text: '你做事很稳，很有条理', type: 'system' }
    ]
  },
  {
    id: 10,
    question: '如果第一次尝试没赚到钱，你更可能：',
    options: [
      { text: '马上换个方式再试', type: 'seller' },
      { text: '去研究是不是表达没打中人', type: 'content' },
      { text: '优化产品内容和结构', type: 'tool' },
      { text: '复盘整个路径哪里出问题', type: 'system' }
    ]
  },
  {
    id: 11,
    question: '你更喜欢哪种产品？',
    options: [
      { text: '能快速出单的小产品', type: 'seller' },
      { text: '能持续吸引人的内容产品', type: 'content' },
      { text: '能反复售卖的工具型产品', type: 'tool' },
      { text: '能让用户一直留下来的服务', type: 'service' }
    ]
  },
  {
    id: 12,
    question: '现在最阻碍你赚钱的，最像哪一种？',
    options: [
      { text: '执行太散，容易冲动乱做', type: 'seller' },
      { text: '想表达，但不够稳定', type: 'content' },
      { text: '会做东西，但不会卖', type: 'tool' },
      { text: '想得多，起步慢', type: 'system' }
    ]
  }
];

// =========================================
// 结果数据（6种赚钱人格）
// =========================================
const RESULTS = {
  seller: {
    id: 'seller',
    name: '爆发卖货型',
    emoji: '🚀',
    tagline: '你的赚钱开关：先开枪，再瞄准',
    description: '你是天生的行动派，看到别人赚钱第一反应是"我也能卖"。你擅长快速验证、快速试错、快速迭代。对你来说，最好的学习方式是直接开干，在卖的的过程里找感觉。你适合虚拟产品、热点带货、低价引流品，用高频率换高反馈。',
    strengths: [
      '行动力超强，想到就干，不会想太多',
      '对市场和机会敏感，能快速响应热点',
      '擅长用销量和数据验证想法'
    ],
    pitfalls: [
      '容易冲动，追热点追到最后没沉淀',
      '产品打磨不够，口碑容易崩',
      '缺乏长期规划，收入忽高忽低'
    ],
    color: '#FF6B6B'
  },
  content: {
    id: 'content',
    name: '内容吸粉型',
    emoji: '🎨',
    tagline: '你的赚钱开关：用表达换信任',
    description: '你擅长用内容建立影响力，你的价值在于"说得清楚、写得动人"。你适合小红书图文、短视频、个人IP、知识型产品。对你来说，粉丝和信任是最值钱的资产，内容是杠杆，一个人也能撬动大生意。',
    strengths: [
      '表达能力强，能把复杂的事讲明白',
      '擅长用内容建立信任和影响力',
      '能持续产出，有内容敏感度'
    ],
    pitfalls: [
      '只发内容不敢卖，粉丝多了变不了现',
      '数据差的时候容易自我怀疑',
      '追求完美，发得不够频繁'
    ],
    color: '#4ECDC4'
  },
  tool: {
    id: 'tool',
    name: '工具生产型',
    emoji: '🔧',
    tagline: '你的赚钱开关：一次制作，无限售卖',
    description: '你是天生的产品经理，擅长把知识、流程、经验变成可复用的工具。模板、提示词、资料包、自动发货的数字产品都是你的菜。你适合"睡后收入"模式，一份时间卖出无限份，规模效应是你的朋友。',
    strengths: [
      '擅长把零散知识结构化、产品化',
      '能做出好用、易用的工具和模板',
      '一次投入，长期复利的思维强'
    ],
    pitfalls: [
      '过度打磨，产品没上线就优化了十版',
      '会做不会卖，工具做完了不知道给谁',
      '上线太慢，错过最佳窗口期'
    ],
    color: '#45B7D1'
  },
  service: {
    id: 'service',
    name: '陪伴服务型',
    emoji: '💝',
    tagline: '你的赚钱开关：用共情换深度信任',
    description: '你擅长理解人、支持人，你的价值在于"你很懂我"。咨询、陪跑、社群运营、情绪价值类服务都是你的优势领域。高客单价、长期关系、复购和转介绍是你的增长引擎。',
    strengths: [
      '共情力强，能准确理解别人的需求',
      '擅长建立深度信任和长期关系',
      '高客单价服务是你的舒适区'
    ],
    pitfalls: [
      '容易把自己做累，时间换钱上限低',
      '不好意思提价，价值被低估',
      '交付太重，规模化困难'
    ],
    color: '#96CEB4'
  },
  observer: {
    id: 'observer',
    name: '观察选品型',
    emoji: '🔍',
    tagline: '你的赚钱开关：先看清，再出手',
    description: '你对需求和市场缺口有天生的敏感度，擅长在别人还没看到的时候发现机会。你适合细分赛道产品、痛点型资料、需求验证后再投入。你的优势是"看得准"，一旦出手胜率很高。',
    strengths: [
      '对市场需求敏感，能发现别人看不到的机会',
      '擅长调研和分析，决策质量高',
      '谨慎但精准，出手一次比得上别人十次'
    ],
    pitfalls: [
      '研究太久不动手，机会窗口过了',
      '过度分析导致决策瘫痪',
      '错失先发优势，被行动派抢先'
    ],
    color: '#FFEAA7'
  },
  system: {
    id: 'system',
    name: '系统运营型',
    emoji: '⚙️',
    tagline: '你的赚钱开关：搭好系统，自动运转',
    description: '你擅长搭流程、做优化、让项目稳定运转。你适合多产品组合、内容矩阵、自动化流程、小而稳的长期生意。你的优势不是爆发，而是持续、稳定、可复制，时间是你的朋友。',
    strengths: [
      '擅长设计流程和系统，做事有条理',
      '优化能力强，能让项目越来越顺',
      '稳健风格，适合做长期生意'
    ],
    pitfalls: [
      '起步太慢，还没卖就先搭了全套系统',
      '过度优化，过早追求自动化',
      '错过快速验证阶段的宝贵反馈'
    ],
    color: '#DDA0DD'
  }
};

// 结果优先级（并列时按此顺序）
const PRIORITY = ['tool', 'content', 'seller', 'system', 'observer', 'service'];

// =========================================
// 状态管理
// =========================================
let currentQuestion = 0;
let answers = []; // 存储每个答案对应的人格类型
let history = []; // 存储每道题的选择索引，用于返回上一题

// =========================================
// DOM 元素
// =========================================
const pages = {
  home: document.getElementById('home-page'),
  quiz: document.getElementById('quiz-page'),
  result: document.getElementById('result-page'),
  preview: document.getElementById('preview-page')
};

const elements = {
  startBtn: document.getElementById('start-btn'),
  backBtn: document.getElementById('back-btn'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  questionNumber: document.getElementById('question-number'),
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options-container'),
  unlockBtn: document.getElementById('unlock-btn'),
  previewUnlockBtn: document.getElementById('preview-unlock-btn'),
  restartBtn: document.getElementById('restart-btn'),
  previewBackBtn: document.getElementById('preview-back-btn'),
  saveCardBtn: document.getElementById('save-card-btn'),
  otherTypesContainer: document.getElementById('other-types')
};

// =========================================
// 工具函数
// =========================================
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function switchPage(pageName) {
  Object.values(pages).forEach(page => page.classList.remove('active'));
  pages[pageName].classList.add('active');
  window.scrollTo(0, 0);
}

// =========================================
// 测试逻辑
// =========================================
function startQuiz() {
  currentQuestion = 0;
  answers = [];
  history = [];
  switchPage('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[currentQuestion];

  // 更新进度
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  elements.progressFill.style.width = `${progress}%`;
  elements.progressText.textContent = `${currentQuestion + 1}/${QUESTIONS.length}`;

  // 更新题目
  elements.questionNumber.textContent = `Q${q.id}`;
  elements.questionText.textContent = q.question;

  // 更新选项
  elements.optionsContainer.innerHTML = '';
  q.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${String.fromCharCode(65 + index)}. ${opt.text}`;
    btn.addEventListener('click', () => selectOption(index));
    elements.optionsContainer.appendChild(btn);
  });

  // 显示/隐藏返回按钮
  elements.backBtn.style.visibility = currentQuestion > 0 ? 'visible' : 'hidden';

  // 添加动画
  elements.optionsContainer.style.animation = 'none';
  setTimeout(() => {
    elements.optionsContainer.style.animation = 'fadeIn 0.4s ease-out';
  }, 10);
}

function selectOption(index) {
  const q = QUESTIONS[currentQuestion];
  const selectedType = q.options[index].type;

  // 保存答案
  answers.push(selectedType);
  history.push(index);

  // 进入下一题或显示结果
  if (currentQuestion < QUESTIONS.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else {
    showResult();
  }
}

function goBack() {
  if (currentQuestion > 0) {
    currentQuestion--;
    answers.pop();
    history.pop();
    renderQuestion();
  }
}

// =========================================
// 计算结果
// =========================================
function calculateResult() {
  // 统计各类型出现次数
  const counts = {};
  answers.forEach(type => {
    counts[type] = (counts[type] || 0) + 1;
  });

  // 找出最高分的类型
  let maxCount = 0;
  let candidates = [];

  Object.entries(counts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      candidates = [type];
    } else if (count === maxCount) {
      candidates.push(type);
    }
  });

  // 如果有并列，按优先级选择
  if (candidates.length === 1) {
    return candidates[0];
  }

  // 按优先级排序，返回第一个
  for (const type of PRIORITY) {
    if (candidates.includes(type)) {
      return type;
    }
  }

  return candidates[0];
}

// =========================================
// 显示结果
// =========================================
function showResult() {
  const resultType = calculateResult();
  const result = RESULTS[resultType];

  // 填充结果数据
  document.getElementById('result-title').textContent = result.name;
  document.getElementById('result-tagline').textContent = result.tagline;
  document.getElementById('result-emoji').textContent = result.emoji;
  document.getElementById('result-description').textContent = result.description;

  // 填充优势
  const strengthsList = document.getElementById('result-strengths');
  strengthsList.innerHTML = result.strengths.map(s => `<li>${s}</li>`).join('');

  // 填充坑点
  const pitfallsList = document.getElementById('result-pitfalls');
  pitfallsList.innerHTML = result.pitfalls.map(p => `<li>${p}</li>`).join('');

  // 渲染其他类型卡片
  renderOtherTypes(resultType);

  // 切换页面
  switchPage('result');

  // 滚动到顶部
  window.scrollTo(0, 0);
}

function renderOtherTypes(currentType) {
  const otherTypes = Object.values(RESULTS).filter(r => r.id !== currentType);

  elements.otherTypesContainer.innerHTML = otherTypes.map(type => `
    <div class="type-card">
      <div class="emoji">${type.emoji}</div>
      <div class="name">${type.name}</div>
    </div>
  `).join('');
}

// =========================================
// 解锁完整版
// =========================================
function unlockFullReport() {
  // 跳转到购买链接
  window.open(CONFIG.BUY_URL, '_blank');
}

// =========================================
// 预览完整版报告
// =========================================
function showPreview() {
  switchPage('preview');
  window.scrollTo(0, 0);
}

function backToResult() {
  switchPage('result');
  window.scrollTo(0, 0);
}

// =========================================
// 保存结果卡片（提示用户截图）
// =========================================
function saveResultCard() {
  showToast('📸 长按结果卡片即可保存截图分享！');
}

// =========================================
// 重新测试
// =========================================
function restartQuiz() {
  currentQuestion = 0;
  answers = [];
  history = [];
  switchPage('home');
}

// =========================================
// 事件绑定
// =========================================
function bindEvents() {
  // 开始测试
  elements.startBtn.addEventListener('click', startQuiz);

  // 返回上一题
  elements.backBtn.addEventListener('click', goBack);

  // 解锁完整版
  elements.unlockBtn.addEventListener('click', unlockFullReport);
  elements.previewUnlockBtn.addEventListener('click', unlockFullReport);

  // 重新测试
  elements.restartBtn.addEventListener('click', restartQuiz);

  // 预览页返回
  elements.previewBackBtn.addEventListener('click', backToResult);

  // 保存卡片
  elements.saveCardBtn.addEventListener('click', saveResultCard);

  // 键盘支持（上一题）
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pages.quiz.classList.contains('active')) {
      goBack();
    }
  });
}

// =========================================
// 初始化
// =========================================
function init() {
  bindEvents();

  // 设置购买链接
  elements.unlockBtn.dataset.url = CONFIG.BUY_URL;
  elements.previewUnlockBtn.dataset.url = CONFIG.BUY_URL;

  console.log('[赚钱人格测试] 初始化完成');
  console.log('[配置] 购买链接:', CONFIG.BUY_URL);
}

// 启动
document.addEventListener('DOMContentLoaded', init);
