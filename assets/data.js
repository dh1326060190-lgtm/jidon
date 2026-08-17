/* 肌动 · 空白初始数据（无示例记录）
 * 打开即空白工作台，由使用者本人录入自己的真实数据。
 * persona 为中性占位；categories 为功能分类；
 * exercises / routines 是 App 内置「动作字典 + 训练套路模板」（功能性工具，非私人示例数据），
 *   清空数据时随 SEED 复位，可自由增删。
 */
(function () {
  window.SEED = {
    version: 3,
    persona: {
      name: '', age: '', height: '', goal: '', started: '',
      startWeight: '', startFat: '', waterTarget: 2500, streak: 0,
      gender: '', activityLevel: 1.375,
      slogan: '强壮不是口号，是每一次训练留下的证据'
    },
    categories: [
      { key: 'training', label: '训练' },
      { key: 'exercise', label: '动作' },
      { key: 'body', label: '体态' },
      { key: 'measure', label: '围度' },
      { key: 'diet', label: '饮食' },
      { key: 'sleep', label: '恢复' },
      { key: 'record', label: '纪录' }
    ],
    // —— 动作字典：家庭哑铃 + 弹力带场景（可增删）——
    exercises: [
      { id: 'e1', name: '哑铃平板卧推', muscle: '胸', equipment: '哑铃', sets: 4, reps: 8, rest: 75, note: '主项。沉肩收背，杠铃轨迹落于乳头连线，触胸即推，不弹震。' },
      { id: 'e2', name: '哑铃上斜卧推', muscle: '胸', equipment: '哑铃', sets: 3, reps: 10, rest: 60, note: '上胸。椅背约 30°，哑铃下放至锁骨两侧，肘部 45° 外展。' },
      { id: 'e3', name: '哑铃飞鸟', muscle: '胸', equipment: '哑铃', sets: 3, reps: 12, rest: 45, note: '微屈肘，开胸不甩，顶峰挤压胸肌 1 秒。' },
      { id: 'e4', name: '哑铃站姿肩推', muscle: '肩', equipment: '哑铃', sets: 3, reps: 10, rest: 60, note: '不耸肩，核心收紧，哑铃不过耳外侧，推至头顶微夹。' },
      { id: 'e5', name: '哑铃侧平举', muscle: '肩', equipment: '哑铃', sets: 3, reps: 12, rest: 45, note: '小重量，肘略高于腕，到肩平即停，避免借力甩。' },
      { id: 'e6', name: '弹力带面拉', muscle: '肩后束', equipment: '弹力带', sets: 3, reps: 15, rest: 45, note: '改善圆肩。双手外旋至脸同高，挤肩胛骨。' },
      { id: 'e7', name: '哑铃单臂划船', muscle: '背', equipment: '哑铃', sets: 4, reps: 10, rest: 75, note: '主项。支撑手同侧膝撑凳，背阔主导把哑铃拉向髋。' },
      { id: 'e8', name: '哑铃俯身划船', muscle: '背', equipment: '哑铃', sets: 3, reps: 12, rest: 60, note: '脊柱中立微前倾，肘贴身向后上拉。' },
      { id: 'e9', name: '弹力带直臂下压', muscle: '背', equipment: '弹力带', sets: 3, reps: 15, rest: 45, note: '直臂由前上方向下压，背阔收紧，不耸肩。' },
      { id: 'e10', name: '哑铃二头弯举', muscle: '臂', equipment: '哑铃', sets: 3, reps: 12, rest: 45, note: '肘贴身固定，仅前臂动，顶峰停顿。' },
      { id: 'e11', name: '哑铃仰卧臂屈伸', muscle: '臂', equipment: '哑铃', sets: 3, reps: 10, rest: 45, note: '大臂固定贴耳，只动前臂下放与举起。' },
      { id: 'e12', name: '哑铃高脚杯深蹲', muscle: '腿', equipment: '哑铃', sets: 4, reps: 12, rest: 75, note: '主项。哑铃抱于胸前，核心全程收紧，蹲至大腿低于水平。' },
      { id: 'e13', name: '哑铃罗马尼亚硬拉', muscle: '腿', equipment: '哑铃', sets: 3, reps: 12, rest: 60, note: '髋后推，哑铃沿腿下放，腘绳与臀发力，背挺直。' },
      { id: 'e14', name: '哑铃分腿箭步蹲', muscle: '腿', equipment: '哑铃', sets: 3, reps: 10, rest: 60, note: '前后分腿，膝盖不内扣，后膝轻触地即起。' },
      { id: 'e15', name: '弹力带髋外展', muscle: '臀', equipment: '弹力带', sets: 3, reps: 15, rest: 45, note: '侧卧或站姿，臀侧发力外展，改善假胯宽。' },
      { id: 'e16', name: '哑铃站姿提踵', muscle: '小腿', equipment: '哑铃', sets: 3, reps: 20, rest: 30, note: '全幅起落，顶峰停顿 1 秒。' },
      { id: 'e17', name: '平板支撑', muscle: '核心', equipment: '徒手', sets: 3, reps: 60, rest: 45, note: '腰不塌不弓，腹主动收缩，呼吸平稳。' },
      { id: 'e18', name: '卷腹', muscle: '核心', equipment: '徒手', sets: 3, reps: 15, rest: 45, note: '下背贴地，靠腹卷起肩胛离地，不拽脖子。' }
    ],
    // —— 训练套路模板：三分化（每周 3 天）——
    routines: [
      { id: 'r1', name: '推日 · 胸肩三头', split: '推', items: [
        { exId: 'e1', sets: 4, reps: 8, rest: 75 }, { exId: 'e2', sets: 3, reps: 10, rest: 60 },
        { exId: 'e3', sets: 3, reps: 12, rest: 45 }, { exId: 'e4', sets: 3, reps: 10, rest: 60 },
        { exId: 'e11', sets: 3, reps: 10, rest: 45 } ] },
      { id: 'r2', name: '拉日 · 背二头后束', split: '拉', items: [
        { exId: 'e7', sets: 4, reps: 10, rest: 75 }, { exId: 'e8', sets: 3, reps: 12, rest: 60 },
        { exId: 'e6', sets: 3, reps: 15, rest: 45 }, { exId: 'e10', sets: 3, reps: 12, rest: 45 },
        { exId: 'e9', sets: 3, reps: 15, rest: 45 } ] },
      { id: 'r3', name: '腿日 · 腿臀核心', split: '腿', items: [
        { exId: 'e12', sets: 4, reps: 12, rest: 75 }, { exId: 'e13', sets: 3, reps: 12, rest: 60 },
        { exId: 'e14', sets: 3, reps: 10, rest: 60 }, { exId: 'e15', sets: 3, reps: 15, rest: 45 },
        { exId: 'e16', sets: 3, reps: 20, rest: 30 }, { exId: 'e17', sets: 3, reps: 60, rest: 45 } ] }
    ],
    records: [],
    media: [],
    activities: [],
    achievements: [],
    reminders: [],
    settings: { reminderOn: false, storeNote: '数据保存在本机浏览器（localStorage）。换手机或清浏览器前请先「导出备份」，丢失后可「从备份导入」恢复。' }
  };
})();
