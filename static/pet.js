/**
 * Cangyv 像素宠物引擎 v2
 * Canvas逐像素绘制，32×32放大3倍，支持多姿态动画
 * 
 * 双宠物控制模型：
 * - 狸花猫（小狸）：AI饲养（喂食/洗澡），用户控制动作（走/歪头/抬爪/握手/抓/咬）
 * - 戴墨镜大狗（大墨）：用户饲养（喂食/洗澡），AI控制动作（走/歪头/抬爪/握手/抓/咬）
 */

// ── 16色调色板 ──
const PAL = {
    body:       '#A08060',  // 狸花猫底色
    stripe:     '#5C4033',  // 条纹
    belly:      '#E8DCC8',  // 肚子
    eye:        '#4CAF50',  // 眼睛
    eyeWhite:   '#F0F0F0',  // 眼白
    nose:       '#D4849A',  // 鼻子
    earInner:   '#D4849A',  // 耳内
    paw:        '#6B5344',  // 爪子
    tailStripe: '#5C4033',  // 尾巴条纹
    // 大狗色
    dogBody:    '#6B6B7B',
    dogDark:    '#3A3A4A',
    dogBelly:   '#9A9AAB',
    glassFrame: '#1a1a1a',
    glassLens:  '#2d2d5e',
    glassGlare: '#7c6cf0',
};

// ── 猫调色板映射 ──
const CAT_COLORS = {
    1: 'body', 2: 'stripe', 3: 'belly', 4: 'eye', 5: 'eyeWhite',
    6: 'nose', 7: 'earInner', 8: 'paw', 9: 'tailStripe'
};

// ── 狗调色板映射 ──
const DOG_COLORS = {
    'A': 'dogBody', 'B': 'dogDark', 'C': 'dogBelly',
    'D': 'glassFrame', 'E': 'glassLens', 'F': 'glassGlare', 'G': 'paw'
};

// ── 精灵数据（32×32） ──
// 对称生成函数：左16列 + 右16列(反转) = 32列对称行
function sym(L) { return L + L.split('').reverse().join(''); }

// ═══════════════════════════════════════
// 苍瞳 — 蛞蝓猫风格狸花猫
// 豆豆眼、圆润小头、长条柔软身体、细条纹尾
// ═══════════════════════════════════════
const CAT_IDLE = (() => {
    const L = [
        '0000000000000000',  // 0
        '0000000000000000',  // 1
        '0000000011000000',  // 2: tiny ear nubs
        '0000000111000000',  // 3: head top round
        '0000001111100000',  // 4: head wider
        '0000011111111111',  // 5: head widest (continuous)
        '0000021111111112',  // 6: M-stripe forehead
        '0000011111111111',  // 7: upper face
        '0000001111111111',  // 8: face — BEAN EYES here
        '0000000111111111',  // 9: lower face
        '0000000011111111',  // 10: nose area
        '0000000001111111',  // 11: chin
        '0000000001111111',  // 12: neck
        '0000000011111111',  // 13: upper body
        '0000001121111111',  // 14: body + back stripe
        '0000001133111111',  // 15: body + belly
        '0000001133111111',  // 16: body + belly
        '0000001121111111',  // 17: body + back stripe
        '0000000011111111',  // 18: lower body
        '0000000000110000',  // 19: stubby paws
        '0000000000110000',  // 20: stubby paws
        '0000000000000000',  // 21-31
        '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
        '0000000000000000', '0000000000000000', '0000000000000000', '0000000000000000',
        '0000000000000000', '0000000000000000',
    ];
    return L.map((l, y) => {
        const r = sym(l).split('');
        // BEAN EYES — just 2px each, no eye whites!
        if (y === 8) { r[12] = '4'; r[13] = '4'; r[18] = '4'; r[19] = '4'; }
        // Tiny nose
        if (y === 10) { r[15] = '6'; r[16] = '6'; }
        // Thin striped tail curls right
        if (y === 14) { r[24] = '1'; r[25] = '9'; }
        if (y === 15) { r[25] = '1'; r[26] = '9'; }
        if (y === 16) { r[26] = '1'; r[27] = '9'; }
        if (y === 17) { r[27] = '1'; r[28] = '9'; }
        if (y === 18) { r[27] = '1'; r[28] = '9'; }
        if (y === 19) { r[26] = '1'; r[27] = '9'; }
        if (y === 20) { r[25] = '9'; }
        return r.join('');
    });
})();

// 苍瞳 sleep — 蛞蝓猫趴着，头在左，身体向右延伸
const CAT_SLEEP = (() => {
    const s = Array(32).fill(null).map(() => Array(32).fill('0'));
    // 头（行12-17）— 圆润小头，闭眼
    for (let x = 4; x <= 12; x++) s[12][x] = '1';
    s[12][5] = '2'; s[12][10] = '2';  // 额头条纹
    for (let x = 3; x <= 13; x++) s[13][x] = '1';
    s[13][5] = '2'; s[13][10] = '2';
    for (let x = 3; x <= 13; x++) s[14][x] = '1';
    // 闭眼（一条线）
    s[14][6] = '1'; s[14][7] = '1'; s[14][10] = '1'; s[14][11] = '1';
    for (let x = 4; x <= 12; x++) s[15][x] = '1';
    s[15][8] = '6'; s[15][9] = '6';  // 鼻子
    for (let x = 5; x <= 11; x++) s[16][x] = '3';  // 下巴
    // 耳朵小突起
    s[11][5] = '1'; s[11][6] = '1'; s[11][10] = '1'; s[11][11] = '1';
    // 身体（行14-21，列12-27）— 长条柔软
    for (let x = 13; x <= 27; x++) s[14][x] = '1';
    s[14][18] = '2'; s[14][24] = '2';  // 背条纹
    for (let x = 13; x <= 27; x++) s[15][x] = '1';
    s[15][18] = '2'; s[15][24] = '2';
    for (let x = 14; x <= 26; x++) s[16][x] = '1';
    for (let x = 16; x <= 24; x++) s[17][x] = '3';  // 肚子
    for (let x = 15; x <= 25; x++) s[18][x] = '3';
    for (let x = 16; x <= 24; x++) s[19][x] = '1';
    for (let x = 17; x <= 23; x++) s[20][x] = '1';
    // 前爪
    s[17][6] = '8'; s[17][7] = '8'; s[17][11] = '8'; s[17][12] = '8';
    s[18][6] = '8'; s[18][7] = '8'; s[18][11] = '8'; s[18][12] = '8';
    // 后爪
    s[21][25] = '8'; s[21][26] = '8';
    s[22][25] = '8'; s[22][26] = '8';
    // 细条纹尾巴
    s[19][27] = '9'; s[19][28] = '1';
    s[18][28] = '9'; s[18][29] = '1';
    s[17][29] = '9'; s[17][30] = '1';
    s[16][30] = '9';
    return s.map(r => r.join(''));
})();

// 苍瞳 happy — 豆豆眼变弯月眯眼
const CAT_HAPPY = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    // 眯眼：清除bean eye，换成弯月线
    if (f[8]) { f[8][12] = '1'; f[8][13] = '4'; f[8][18] = '4'; f[8][19] = '1'; }
    // 微笑
    if (f[11]) { f[11][13] = '3'; f[11][18] = '3'; }
    return f.map(r => r.join(''));
})();

// 苍瞳 scratch — 伸爪，身体前倾
const CAT_SCRATCH = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    // 身体前倾：头部和上身向左偏1像素
    for (let y = 2; y <= 17; y++) {
        for (let x = 0; x < 31; x++) f[y][x] = f[y][x+1];
        f[y][31] = '0';
    }
    // 伸爪
    for (let x = 3; x <= 5; x++) f[17][x] = '8';
    for (let x = 2; x <= 4; x++) f[18][x] = '8';
    return f.map(r => r.join(''));
})();

// 苍瞳 eat — 低头吃
const CAT_EAT = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    // 清除原头部
    for (let y = 2; y <= 12; y++)
        for (let x = 0; x < 32; x++) f[y][x] = '0';
    // 头部下移2行
    const headData = [
        { y: 4, l: '00000000110000000000001100000000' },
        { y: 5, l: '00000001110000000000011100000000' },
        { y: 6, l: '00000011111000000000111110000000' },
        { y: 7, l: '00000111111111111111111111100000' },
        { y: 8, l: '00000211111111121111111112000000' },
        { y: 9, l: '00000111111111111111111111000000' },
        { y: 10, l: '00000011111111111111111110000000' },
        { y: 11, l: '00000001111111111111111100000000' },
        { y: 12, l: '00000000111111111111111000000000' },
        { y: 13, l: '00000000011111111111110000000000' },
        { y: 14, l: '00000000011111111111110000000000' },
    ];
    for (const h of headData)
        for (let x = 0; x < 32; x++) f[h.y][x] = h.l[x];
    // Bean eyes on row 10
    f[10][12] = '4'; f[10][13] = '4'; f[10][18] = '4'; f[10][19] = '4';
    // Nose
    f[12][15] = '6'; f[12][16] = '6';
    // Mouth open
    f[13][14] = '6'; f[13][15] = '6'; f[13][16] = '6'; f[13][17] = '6';
    // Food
    f[13][12] = '3'; f[13][13] = '3';
    return f.map(r => r.join(''));
})();

// 苍瞳 tilt — 歪头
const CAT_TILT = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    for (let y = 2; y <= 11; y++) {
        for (let x = 30; x >= 1; x--) f[y][x] = f[y][x-1];
        f[y][0] = '0';
    }
    return f.map(r => r.join(''));
})();

// 苍瞳 paw — 抬爪
const CAT_PAW = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    // 清除右爪
    for (let x = 20; x <= 21; x++) { f[19][x] = '0'; f[20][x] = '0'; }
    // 抬起
    for (let x = 19; x <= 21; x++) f[17][x] = '8';
    return f.map(r => r.join(''));
})();

// 苍瞳 bite — 张嘴伸爪
const CAT_BITE = (() => {
    const f = CAT_SCRATCH.map(r => r.split(''));
    // 张嘴
    for (let x = 14; x <= 17; x++) f[11][x] = '6';
    return f.map(r => r.join(''));
})();

// ═══════════════════════════════════════
// 玄镜 — 蛞蝓猫风格边牧大狗
// 戴墨镜、长条柔软身体、白色围脖、蓬松尾巴
// ═══════════════════════════════════════
const DOG_IDLE = (() => {
    const s = Array(32).fill(null).map(() => Array(32).fill('0'));
    // 小圆耳 — 行2-4（蛞蝓猫风格小突起）
    s[2][9]='A'; s[2][10]='A'; s[2][21]='A'; s[2][22]='A';
    s[3][8]='A'; s[3][9]='B'; s[3][10]='A'; s[3][21]='A'; s[3][22]='B'; s[3][23]='A';
    s[4][8]='A'; s[4][9]='A'; s[4][10]='A'; s[4][21]='A'; s[4][22]='A'; s[4][23]='A';
    // 圆润头部 — 行5-9（比猫大一圈）
    for (let x=7; x<=24; x++) s[5][x]='A';
    for (let x=6; x<=25; x++) s[6][x]='A';
    for (let x=6; x<=25; x++) s[7][x]='A';
    for (let x=7; x<=24; x++) s[8][x]='A';
    for (let x=8; x<=23; x++) s[9][x]='A';
    // 墨镜 — 行7-8（灵魂特征！）
    for (let x=7; x<=24; x++) { s[7][x]='D'; s[8][x]='D'; }
    // 镜片 — 左右各一块
    for (let x=8; x<=13; x++) s[7][x]='E';
    s[8][9]='F'; s[8][10]='F';  // 左镜片反光
    for (let x=18; x<=23; x++) s[7][x]='E';
    s[8][20]='F'; s[8][21]='F';  // 右镜片反光
    // 鼻子 — 行10
    for (let x=9; x<=22; x++) s[10][x]='A';
    s[10][14]='B'; s[10][15]='B'; s[10][16]='B'; s[10][17]='B';
    // 嘴 — 行11
    for (let x=10; x<=21; x++) s[11][x]='A';
    // 白色围脖 — 行12
    for (let x=8; x<=23; x++) s[12][x]='A';
    for (let x=10; x<=21; x++) s[12][x]='C';
    // 长条身体 — 行13-19（蛞蝓猫风格长条柔软）
    for (let x=7; x<=24; x++) s[13][x]='A';
    for (let x=10; x<=21; x++) s[13][x]='C';
    for (let x=6; x<=25; x++) s[14][x]='A';
    for (let x=11; x<=20; x++) s[14][x]='C';
    for (let x=6; x<=25; x++) s[15][x]='A';
    for (let x=11; x<=20; x++) s[15][x]='C';
    for (let x=6; x<=25; x++) s[16][x]='A';
    for (let x=11; x<=20; x++) s[16][x]='C';
    for (let x=6; x<=25; x++) s[17][x]='A';
    for (let x=11; x<=20; x++) s[17][x]='C';
    for (let x=7; x<=24; x++) s[18][x]='A';
    for (let x=12; x<=19; x++) s[18][x]='C';
    for (let x=8; x<=23; x++) s[19][x]='A';
    // 短腿 — 行20-21
    for (let x=9; x<=12; x++) { s[20][x]='A'; s[21][x]='A'; }
    for (let x=19; x<=22; x++) { s[20][x]='A'; s[21][x]='A'; }
    s[20][10]='G'; s[20][11]='G'; s[20][20]='G'; s[20][21]='G';
    // 蓬松尾巴 — 向右上方翘起
    s[14][26]='A'; s[14][27]='A';
    s[15][27]='A'; s[15][28]='A';
    s[16][28]='A'; s[16][29]='A';
    s[17][29]='A'; s[17][30]='A';
    s[16][30]='A'; s[16][31]='A';
    s[15][30]='A'; s[15][31]='A';
    return s.map(r => r.join(''));
})();

// 大狗变体生成器
function dogVariant(base, modifyFn) {
    const f = base.map(r => r.split(''));
    modifyFn(f);
    return f.map(r => r.join(''));
}

const DOG_HAPPY = dogVariant(DOG_IDLE, f => {
    // 眯眼：镜片反光消失，镜片变暗
    for (let y = 7; y <= 8; y++)
        for (let x = 0; x < 32; x++)
            if (f[y][x] === 'E' || f[y][x] === 'F') f[y][x] = 'D';
});

const DOG_SLEEP = dogVariant(DOG_IDLE, f => {
    // 闭眼：镜片变暗
    for (let y = 7; y <= 8; y++)
        for (let x = 0; x < 32; x++)
            if (f[y][x] === 'E' || f[y][x] === 'F') f[y][x] = 'D';
    // 下移2行模拟趴下
    for (let y = 29; y >= 2; y--)
        for (let x = 0; x < 32; x++)
            f[Math.min(y+2,31)][x] = f[y][x];
    for (let y = 0; y < 4; y++)
        for (let x = 0; x < 32; x++)
            f[y][x] = '0';
});

const DOG_EAT = dogVariant(DOG_IDLE, f => {
    // 低头：头部下移2行
    for (let y = 19; y >= 1; y--)
        for (let x = 0; x < 32; x++)
            f[Math.min(y+2,31)][x] = f[y][x];
    for (let y = 0; y < 3; y++)
        for (let x = 0; x < 32; x++)
            f[y][x] = '0';
});

const DOG_TILT = dogVariant(DOG_IDLE, f => {
    // 歪头：头部右偏1像素
    for (let y = 2; y <= 11; y++) {
        for (let x = 30; x >= 1; x--) f[y][x] = f[y][x-1];
        f[y][0] = '0';
    }
});

const DOG_PAW = dogVariant(DOG_IDLE, f => {
    // 抬右前爪
    for (let x = 19; x <= 22; x++) { f[20][x] = '0'; f[21][x] = '0'; }
    for (let x = 19; x <= 21; x++) f[18][x] = 'G';
});

const DOG_BITE = dogVariant(DOG_IDLE, f => {
    // 张嘴
    for (let x = 14; x <= 17; x++) f[11][x] = 'B';
    // 伸右前爪
    for (let x = 19; x <= 22; x++) { f[20][x] = '0'; f[21][x] = '0'; }
    for (let x = 19; x <= 21; x++) f[18][x] = 'G';
});

// ── 精灵映射 ──
const CAT_SPRITES = { idle: CAT_IDLE, sleep: CAT_SLEEP, happy: CAT_HAPPY, scratch: CAT_SCRATCH, eat: CAT_EAT, tilt: CAT_TILT, paw: CAT_PAW, bite: CAT_BITE };
const DOG_SPRITES = { idle: DOG_IDLE, sleep: DOG_SLEEP, happy: DOG_HAPPY, scratch: DOG_IDLE, eat: DOG_EAT, tilt: DOG_TILT, paw: DOG_PAW, bite: DOG_BITE };

// ── 精灵渲染器 ──
class PixelPetRenderer {
    constructor(canvas, pixelSize = 3) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pixelSize = pixelSize;
        this.canvas.width = 32 * pixelSize;
        this.canvas.height = 32 * pixelSize;
        this.ctx.imageSmoothingEnabled = false;
    }
    draw(sprite, colorMap, ox = 0, oy = 0) {
        const ps = this.pixelSize;
        for (let y = 0; y < sprite.length; y++) {
            const row = sprite[y];
            for (let x = 0; x < row.length; x++) {
                const ch = row[x];
                if (ch === '0') continue;
                const ck = colorMap[ch];
                if (!ck) continue;
                const c = PAL[ck];
                if (!c) continue;
                this.ctx.fillStyle = c;
                this.ctx.fillRect((x + ox) * ps, (y + oy) * ps, ps, ps);
            }
        }
    }
    clear() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}

// ── 宠物状态机 ──
class PixelPet {
    /**
     * @param {string} config.caretaker - 谁饲养（喂食/洗澡）：'ai' | 'user'
     * @param {string} config.actionController - 谁控制动作：'ai' | 'user'
     */
    constructor(config) {
        this.name = config.name;
        this.type = config.type;           // 'cat' | 'dog'
        this.caretaker = config.caretaker; // 谁饲养：'ai' | 'user'
        this.actionController = config.actionController; // 谁控制动作：'ai' | 'user'
        this.hunger = config.hunger ?? 70;
        this.mood = config.mood ?? 70;
        this.energy = config.energy ?? 70;
        this.state = 'idle';
        this.stateTimer = 0;
        this.onStateChange = config.onStateChange || (() => {});
        this.onStatsChange = config.onStatsChange || (() => {});
        this.onActionLog = config.onActionLog || (() => {});
        this._decayInterval = null;
        this._aiInterval = null;
        this._caretakerInterval = null;
    }

    start() {
        this._decayInterval = setInterval(() => this._decay(), 5000);
        // AI控制动作的宠物：自动做动作
        if (this.actionController === 'ai') {
            this._aiInterval = setInterval(() => this._aiAct(), 6000);
        }
        // AI饲养的宠物：AI自动喂食
        if (this.caretaker === 'ai') {
            this._caretakerInterval = setInterval(() => this._aiCare(), 10000);
        }
    }

    stop() {
        if (this._decayInterval) clearInterval(this._decayInterval);
        if (this._aiInterval) clearInterval(this._aiInterval);
        if (this._caretakerInterval) clearInterval(this._caretakerInterval);
    }

    _decay() {
        this.hunger = Math.max(0, this.hunger - 0.3);
        this.mood = Math.max(0, this.mood - 0.2);
        this.energy = Math.min(100, this.energy + 0.1);
        if (this.energy < 20 && this.state !== 'sleep') this.setState('sleep');
        else if (this.hunger < 20 && this.state !== 'eat') this.setState('eat');
        this.onStatsChange(this.getStats());
    }

    // AI自动控制动作（走动/歪头/抬爪/握手/抓/咬）
    _aiAct() {
        const actions = ['idle', 'idle', 'tilt', 'paw', 'scratch'];
        if (this.mood > 60) actions.push('happy');
        if (this.mood < 30) actions.push('bite');
        if (this.energy > 50) actions.push('scratch');
        const action = actions[Math.floor(Math.random() * actions.length)];
        this.doAction(action);
    }

    // AI自动饲养（喂食/洗澡）
    _aiCare() {
        if (this.hunger < 40) {
            this.hunger = Math.min(100, this.hunger + 20);
            this.onActionLog(`${this.name}被AI喂了食物 🍖`);
        }
        if (this.mood < 30) {
            this.mood = Math.min(100, this.mood + 15);
            this.onActionLog(`${this.name}被AI洗了澡 🛁`);
        }
        this.onStatsChange(this.getStats());
    }

    // 执行动作（任何人都可以调用，但UI层控制权限）
    doAction(action) {
        const validActions = ['idle', 'sleep', 'happy', 'scratch', 'eat', 'tilt', 'paw', 'bite'];
        if (!validActions.includes(action)) return;
        this.setState(action);
        // 动作3秒后回到idle
        if (action !== 'idle' && action !== 'sleep' && action !== 'eat') {
            setTimeout(() => { if (this.state === action) this.setState('idle'); }, 3000);
        }
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = Date.now();
        this.onStateChange(newState);
    }

    // 用户饲养操作（喂食/洗澡/玩耍）— 仅对caretaker='user'的宠物有效
    feed() {
        if (this.caretaker !== 'user') return false;
        this.hunger = Math.min(100, this.hunger + 25);
        this.setState('eat');
        setTimeout(() => { if (this.state === 'eat') this.setState('idle'); }, 3000);
        this.onStatsChange(this.getStats());
        this.onActionLog(`${this.name}被你喂了食物 🍖`);
        return true;
    }

    bathe() {
        if (this.caretaker !== 'user') return false;
        this.mood = Math.min(100, this.mood + 20);
        this.setState('happy');
        setTimeout(() => { if (this.state === 'happy') this.setState('idle'); }, 3000);
        this.onStatsChange(this.getStats());
        this.onActionLog(`${this.name}被你洗了澡 🛁`);
        return true;
    }

    play() {
        if (this.caretaker !== 'user') return false;
        this.mood = Math.min(100, this.mood + 15);
        this.energy = Math.max(0, this.energy - 15);
        this.setState('scratch');
        setTimeout(() => { if (this.state === 'scratch') this.setState('idle'); }, 3000);
        this.onStatsChange(this.getStats());
        this.onActionLog(`${this.name}和你玩耍 🎾`);
        return true;
    }

    getStats() {
        return { hunger: this.hunger, mood: this.mood, energy: this.energy, state: this.state };
    }

    getSprite() {
        const sprites = this.type === 'cat' ? CAT_SPRITES : DOG_SPRITES;
        const colors = this.type === 'cat' ? CAT_COLORS : DOG_COLORS;
        return { sprite: sprites[this.state] || sprites.idle, colorMap: colors };
    }
}

// ── 动画循环 ──
class PetAnimator {
    constructor(canvas, pet) {
        this.renderer = new PixelPetRenderer(canvas);
        this.pet = pet;
        this.running = false;
        this._raf = null;
        this._bobPhase = 0;
    }
    start() { this.running = true; this._animate(); }
    stop() { this.running = false; if (this._raf) cancelAnimationFrame(this._raf); }
    _animate() {
        if (!this.running) return;
        this._bobPhase += 0.05;
        const bobY = Math.sin(this._bobPhase) * (this.pet.state === 'sleep' ? 0 : 1);
        this.renderer.clear();
        const { sprite, colorMap } = this.pet.getSprite();
        this.renderer.draw(sprite, colorMap, 0, Math.round(bobY));
        this._raf = requestAnimationFrame(() => this._animate());
    }
}

// ── 导出 ──
if (typeof window !== 'undefined') {
    window.PixelPet = PixelPet;
    window.PetAnimator = PetAnimator;
    window.PixelPetRenderer = PixelPetRenderer;
}
