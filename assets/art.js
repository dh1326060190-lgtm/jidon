/* 肌动 · 原创视觉素材库
 * 全部为内置 SVG，离线可用、无外链、无版权风险。
 * 主色炭黑 #202628；强调赤陶 #C24B3A；辅助深绿 #3E5C50；纸感 #F4F1EA。
 */
(function () {
  const INK = '#202628';
  const ACCENT = '#C24B3A';
  const GREEN = '#3E5C50';
  const TAUP = '#8A8276';
  const PAPER = '#F4F1EA';

  // 通用描边风格
  const line = `fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
  const lineA = `fill="none" stroke="${ACCENT}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
  const lineG = `fill="none" stroke="${GREEN}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;

  // —— 品牌符号：肌动首字「肌」意象 + 训练日志(哑铃) + 肌肉解剖(肱二头曲线) ——
  const logo =
    `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="肌动">
      <rect x="6" y="6" width="108" height="108" rx="26" fill="${INK}"/>
      <g transform="translate(60 60)">
        <!-- 哑铃横杆 -->
        <line x1="-34" y1="14" x2="34" y2="14" ${lineA}/>
        <rect x="-44" y="2" width="12" height="24" rx="4" fill="${PAPER}"/>
        <rect x="32" y="2" width="12" height="24" rx="4" fill="${PAPER}"/>
        <rect x="-38" y="-2" width="6" height="32" rx="3" fill="${PAPER}"/>
        <rect x="32" y="-2" width="6" height="32" rx="3" fill="${PAPER}"/>
        <!-- 肱二头肌肉曲线（解剖意象） -->
        <path d="M -20 -34 C -6 -44 14 -40 22 -22 C 26 -12 22 0 10 4" ${line}/>
        <path d="M -20 -34 C -30 -28 -33 -14 -24 -6" ${line}/>
        <!-- 训练日志勾选点 -->
        <circle cx="14" cy="-20" r="5" fill="${ACCENT}"/>
      </g>
    </svg>`;

  // —— 应用图标（正方形画布，小尺寸仍清晰）——
  const icon =
    `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="肌动 App">
      <rect width="1024" height="1024" rx="220" fill="${INK}"/>
      <g transform="translate(512 512)">
        <line x1="-300" y1="120" x2="300" y2="120" stroke="${ACCENT}" stroke-width="52" stroke-linecap="round"/>
        <rect x="-380" y="20" width="100" height="200" rx="34" fill="${PAPER}"/>
        <rect x="280" y="20" width="100" height="200" rx="34" fill="${PAPER}"/>
        <rect x="-320" y="-20" width="52" height="280" rx="26" fill="${PAPER}"/>
        <rect x="268" y="-20" width="52" height="280" rx="26" fill="${PAPER}"/>
        <path d="M -170 -300 C -60 -400 150 -360 220 -190 C 260 -100 220 30 90 70" fill="none" stroke="${PAPER}" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M -170 -300 C -270 -240 -300 -100 -210 -50" fill="none" stroke="${PAPER}" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="120" cy="-170" r="44" fill="${ACCENT}"/>
      </g>
    </svg>`;

  // —— 场景插画：哑铃 ——
  const dumbbell =
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="400" height="300" fill="${PAPER}"/>
      <circle cx="60" cy="60" r="40" fill="none" stroke="${TAUP}" stroke-width="3" opacity="0.5"/>
      <g transform="translate(70 120)">
        <line x1="0" y1="60" x2="260" y2="60" ${line}/>
        <rect x="-26" y="14" width="34" height="92" rx="10" fill="${INK}"/>
        <rect x="252" y="14" width="34" height="92" rx="10" fill="${INK}"/>
        <rect x="-6" y="30" width="14" height="60" rx="6" fill="${TAUP}"/>
        <rect x="252" y="30" width="14" height="60" rx="6" fill="${TAUP}"/>
        <path d="M 60 60 q 70 -40 140 0" ${lineA}/>
      </g>
      <text x="200" y="270" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="20" fill="${TAUP}">自由重量 · 力量训练</text>
    </svg>`;

  // —— 场景插画：训练动作连拍（硬拉四连帧）——
  const sequence =
    `<svg viewBox="0 0 400 230" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="400" height="230" fill="${PAPER}"/>
      ${[0,1,2,3].map(i=>{
        const x = 18 + i*96;
        const lift = [10, 34, 60, 86][i];
        return `<g transform="translate(${x} 30)">
          <rect x="0" y="0" width="84" height="170" rx="10" fill="#fff" stroke="${TAUP}" stroke-width="2"/>
          <!-- 杠铃 -->
          <line x1="6" y1="${120-lift}" x2="78" y2="${120-lift}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
          <rect x="2" y="${108-lift}" width="10" height="24" rx="3" fill="${INK}"/>
          <rect x="72" y="${108-lift}" width="10" height="24" rx="3" fill="${INK}"/>
          <!-- 人物 -->
          <circle cx="42" cy="${60-lift*0.4}" r="12" fill="${INK}"/>
          <path d="M 42 ${72-lift*0.4} L 42 110" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
          <path d="M 42 ${80-lift*0.4} L 18 ${110-lift}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
          <path d="M 42 ${80-lift*0.4} L 66 ${110-lift}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
          <path d="M 30 170 L 40 118 M 54 170 L 44 118" stroke="${TAUP}" stroke-width="6" stroke-linecap="round"/>
          <text x="42" y="160" text-anchor="middle" font-size="11" fill="${TAUP}">${['预备','离心','锁定','顶峰'][i]}</text>
        </g>`;
      }).join('')}
    </svg>`;

  // —— 场景插画：餐盘（俯拍减脂餐）——
  const plate =
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="400" height="300" fill="${PAPER}"/>
      <circle cx="200" cy="150" r="120" fill="#fff" stroke="${TAUP}" stroke-width="3"/>
      <circle cx="200" cy="150" r="96" fill="none" stroke="${TAUP}" stroke-width="2" opacity="0.6"/>
      <!-- 鸡胸 -->
      <path d="M 150 110 q 40 -20 70 6 q 18 30 -10 52 q -44 16 -64 -12 q -10 -28 4 -46Z" fill="${INK}"/>
      <!-- 西兰花 -->
      <g fill="${GREEN}">
        <circle cx="250" cy="120" r="16"/><circle cx="270" cy="132" r="14"/><circle cx="244" cy="140" r="12"/>
      </g>
      <!-- 糙米 -->
      <g fill="${ACCENT}" opacity="0.85">
        <circle cx="170" cy="200" r="6"/><circle cx="186" cy="206" r="6"/><circle cx="202" cy="200" r="6"/>
        <circle cx="160" cy="214" r="6"/><circle cx="178" cy="218" r="6"/><circle cx="196" cy="216" r="6"/>
      </g>
      <!-- 番茄 -->
      <circle cx="250" cy="190" r="14" fill="${ACCENT}"/>
      <text x="200" y="288" text-anchor="middle" font-size="18" fill="${TAUP}">高蛋白 · 控碳水 · 膳食纤维</text>
    </svg>`;

  // —— 场景插画：体测曲线（体重/体脂趋势）——
  const curve =
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="400" height="300" fill="${PAPER}"/>
      <line x1="50" y1="40" x2="50" y2="250" stroke="${INK}" stroke-width="3"/>
      <line x1="50" y1="250" x2="370" y2="250" stroke="${INK}" stroke-width="3"/>
      ${[0,1,2,3,4,5].map(i=>`<line x1="${70+i*54}" y1="40" x2="${70+i*54}" y2="250" stroke="${TAUP}" stroke-width="1" opacity="0.3"/>`).join('')}
      <!-- 体重曲线 -->
      <path d="M 70 70 L 124 92 L 178 112 L 232 138 L 286 158 L 340 172" ${lineA}/>
      <!-- 体脂曲线 -->
      <path d="M 70 110 L 124 126 L 178 138 L 232 156 L 286 168 L 340 178" ${lineG}/>
      <circle cx="70" cy="70" r="5" fill="${ACCENT}"/><circle cx="340" cy="172" r="5" fill="${ACCENT}"/>
      <circle cx="70" cy="110" r="5" fill="${GREEN}"/><circle cx="340" cy="178" r="5" fill="${GREEN}"/>
      <text x="200" y="288" text-anchor="middle" font-size="16" fill="${TAUP}">体重 ↓ 体脂 ↓ · 12 周趋势</text>
    </svg>`;

  // —— 场景插画：补水瓶 ——
  const bottle =
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="400" height="300" fill="${PAPER}"/>
      <g transform="translate(150 40)">
        <rect x="20" y="0" width="60" height="22" rx="6" fill="${INK}"/>
        <rect x="30" y="22" width="40" height="14" fill="${TAUP}"/>
        <rect x="14" y="36" width="72" height="200" rx="20" fill="#fff" stroke="${INK}" stroke-width="5"/>
        <!-- 水位 -->
        <path d="M 18 150 q 32 14 64 0 L 82 232 q -32 14 -64 0 Z" fill="${GREEN}" opacity="0.85"/>
        <text x="50" y="200" text-anchor="middle" font-size="22" fill="#fff" font-weight="bold">2.1L</text>
      </g>
      <text x="200" y="282" text-anchor="middle" font-size="18" fill="${TAUP}">今日补水 · 目标 2.5L</text>
    </svg>`;

  // —— 场景插画：恢复状态（睡眠/静息）——
  const recovery =
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="400" height="300" fill="${PAPER}"/>
      <!-- 静息心率曲线 -->
      <path d="M 30 150 q 40 -30 80 0 q 40 30 80 0 q 40 -30 80 0 q 40 30 80 0" fill="none" stroke="${GREEN}" stroke-width="5" stroke-linecap="round"/>
      <!-- 月与休息人形 -->
      <circle cx="320" cy="70" r="34" fill="${INK}"/>
      <path d="M 300 70 a 34 34 0 1 0 28 -28" fill="${PAPER}"/>
      <g transform="translate(120 175)">
        <circle cx="0" cy="0" r="16" fill="${ACCENT}"/>
        <path d="M -22 90 q 22 -100 22 -54 q 0 -46 22 0 q 0 -46 22 54 q -22 28 -44 0Z" fill="${INK}"/>
      </g>
      <text x="200" y="285" text-anchor="middle" font-size="18" fill="${TAUP}">深睡 1h40m · 静息 52bpm</text>
    </svg>`;

  // —— 场景插画：户外跑（额外素材）——
  const run =
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="400" height="300" fill="${PAPER}"/>
      <line x1="0" y1="230" x2="400" y2="230" stroke="${TAUP}" stroke-width="4"/>
      <!-- 跑者 -->
      <g transform="translate(180 90)" fill="${INK}">
        <circle cx="0" cy="0" r="16"/>
        <path d="M 0 18 L 6 70" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
        <path d="M 0 34 L -34 50" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <path d="M 2 36 L 40 30" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <path d="M 4 70 L 36 110" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
        <path d="M 4 70 L -22 104" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      </g>
      <path d="M 60 70 q 60 -20 120 0" stroke="${ACCENT}" stroke-width="4" fill="none"/>
      <text x="200" y="280" text-anchor="middle" font-size="18" fill="${TAUP}">周末户外跑 · 8km 有氧</text>
    </svg>`;

  // —— 空状态插画（空器械架 + 伸展人形）——
  const empty =
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <rect width="400" height="300" fill="${PAPER}"/>
      <g transform="translate(200 150)">
        <!-- 空哑铃架 -->
        <rect x="-90" y="40" width="180" height="10" rx="4" fill="${TAUP}"/>
        <rect x="-80" y="50" width="8" height="50" fill="${TAUP}"/>
        <rect x="72" y="50" width="8" height="50" fill="${TAUP}"/>
        <circle cx="-50" cy="30" r="10" fill="none" stroke="${TAUP}" stroke-width="3"/>
        <circle cx="50" cy="30" r="10" fill="none" stroke="${TAUP}" stroke-width="3"/>
        <!-- 伸展小人 -->
        <g fill="${ACCENT}">
          <circle cx="0" cy="-60" r="14"/>
          <path d="M 0 -46 L 0 -6" stroke="${ACCENT}" stroke-width="9" stroke-linecap="round"/>
          <path d="M 0 -34 L -40 -54" stroke="${ACCENT}" stroke-width="8" stroke-linecap="round"/>
          <path d="M 0 -34 L 40 -54" stroke="${ACCENT}" stroke-width="8" stroke-linecap="round"/>
          <path d="M 0 -6 L -28 40" stroke="${ACCENT}" stroke-width="9" stroke-linecap="round"/>
          <path d="M 0 -6 L 28 40" stroke="${ACCENT}" stroke-width="9" stroke-linecap="round"/>
        </g>
      </g>
      <text x="200" y="270" text-anchor="middle" font-size="17" fill="${TAUP}">还没有记录，先从一次训练开始</text>
    </svg>`;

  // —— 首页主视觉（透明底，叠在炭黑之上，保证白字对比度）——
  const hero =
    `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(255 70)" opacity="0.96">
        <line x1="-44" y1="120" x2="44" y2="120" stroke="${PAPER}" stroke-width="9" stroke-linecap="round"/>
        <rect x="-58" y="98" width="15" height="44" rx="4" fill="${PAPER}"/>
        <rect x="43" y="98" width="15" height="44" rx="4" fill="${PAPER}"/>
        <rect x="-50" y="104" width="7" height="32" rx="3" fill="${TAUP}"/>
        <rect x="43" y="104" width="7" height="32" rx="3" fill="${TAUP}"/>
      </g>
      <path d="M 250 150 C 300 118 352 150 362 204" fill="none" stroke="${ACCENT}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="362" cy="204" r="7" fill="${ACCENT}"/>
      <g opacity="0.45" stroke="${PAPER}" stroke-width="3" fill="none">
        <path d="M 28 258 q 32 -22 64 0 q 32 22 64 0"/>
        <path d="M 60 285 q 26 -16 52 0"/>
      </g>
      <circle cx="120" cy="60" r="10" fill="none" stroke="${PAPER}" stroke-width="3" opacity="0.5"/>
    </svg>`;

  // —— 功能图标组（统一线性语言，24x24）——
  const ic = (p) => `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const icons = {
    training: ic('<path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/>'),           // 哑铃
    exercise: ic('<circle cx="12" cy="5" r="2"/><path d="M12 7v6m0 0l-4 6m4-6l4 6M8 13h8"/>'), // 动作
    body: ic('<circle cx="12" cy="5" r="2.4"/><path d="M12 7.4V14m0 0l-3 6m3-6l3 6M7 10h10"/>'), // 体态
    measure: ic('<path d="M4 4v16h16"/><path d="M8 8h2M8 12h3M8 16h2"/>'),     // 围度/尺
    diet: ic('<path d="M12 3a9 9 0 0 0 0 18"/><path d="M12 3a9 9 0 0 1 0 18"/><path d="M12 3v18"/>'), // 餐盘
    sleep: ic('<path d="M21 12.8A7.5 7.5 0 1 1 11.2 3a6 6 0 0 0 9.8 9.8z"/>'), // 月
    record: ic('<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0z"/>'),        // 奖杯
    calendar: ic('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'),
    chart: ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    media: ic('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>'),
    settings: ic('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'),
    add: ic('<path d="M12 5v14M5 12h14"/>'),
    search: ic('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>'),
    filter: ic('<path d="M3 4h18l-7 8v6l-4 2v-8z"/>'),
    edit: ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    trash: ic('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
    check: ic('<path d="M20 6L9 17l-5-5"/>'),
    timer: ic('<circle cx="12" cy="13" r="8"/><path d="M12 13V9M9 2h6"/>'),
    water: ic('<path d="M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11z"/>'),
    trophy: ic('<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/>'),
    arrow: ic('<path d="M9 6l6 6-6 6"/>'),
    close: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    camera: ic('<path d="M3 8h3l2-3h8l2 3h3v12H3z"/><circle cx="12" cy="13" r="3.5"/>'),
    sort: ic('<path d="M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l3 3M17 20l-3-3"/>'),
    tag: ic('<path d="M3 12l9-9 9 9-9 9z"/><circle cx="14" cy="9" r="1.5"/>'),
    home: ic('<path d="M3 11l9-8 9 8M5 10v10h14V10"/>'),
    more: ic('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
    download: ic('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    bell: ic('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>'),
    share: ic('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>'),
    upload: ic('<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>'),
    copy: ic('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  };

  window.ART = {
    logo, icon, hero, dumbbell, sequence, plate, curve, bottle, recovery, run, empty, icons,
    coverList: ['dumbbell', 'sequence', 'plate', 'curve', 'bottle', 'recovery', 'run'],
    svg: function (key) {
      return ({
        dumbbell, sequence, plate, curve, bottle, recovery, run, empty
      })[key] || empty;
    }
  };
})();
