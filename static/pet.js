/**
 * Cangyv 像素宠物引擎 v2
 * Canvas逐像素绘制，32×32放大3倍，支持多姿态动画
 * 
 * 双宠物控制模型：
 * - 狸花猫（苍瞳）：AI饲养（喂食/洗澡），用户控制动作
 * - 边牧（玄镜）：用户饲养（喂食/洗澡），AI控制动作
 */

// ── 16色调色板 ──
const PAL = {
    body:       '#C4954A',  // 狸花猫棕褐色底色
    stripe:     '#5A3820',  // 深棕条纹
    belly:      '#E8DCC8',  // 肚子/下巴
    eye:        '#8BC34A',  // 黄绿色眼睛
    eyeWhite:   '#F0F0F0',  // 眼白
    nose:       '#D4849A',  // 鼻子
    earInner:   '#D4849A',  // 耳内
    paw:        '#6B5344',  // 爪子
    tailStripe: '#5A3820',  // 尾巴条纹
    // 边牧色
    dogBody:    '#9A9A9A',  // 灰毛
    dogDark:    '#404040',  // 深灰
    dogBelly:   '#E8E8E8',  // 白围脖/肚子
    dogWhite:   '#FFFFFF',  // 纯白（流星斑/爪尖）
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
    'D': 'glassFrame', 'E': 'glassLens', 'F': 'glassGlare', 'G': 'paw',
    'H': 'dogWhite'
};

// ── 精灵数据（32×32） ──
function sym(L) { return L + L.split('').reverse().join(''); }

// 狸花猫 idle
const CAT_IDLE = (() => {
    const L = [
        '0000000000000000',
        '0000000110000000',
        '0000001111000000',
        '0000011711000000',
        '0000011711000000',
        '0000011111000000',
        '0000001111111111',
        '0000021111111112',
        '0000001111111111',
        '0000000115554411',
        '0000000115554411',
        '0000000111111166',
        '0000000111111133',
        '0000001111111111',
        '0000012111111333',
        '0000012111111333',
        '0000012111111333',
        '0000001111111111',
        '0000000011188811',
        '0000000011188811',
        '0000000001111111',
        '0000000000111111',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',
    ];
    return L.map((l, y) => {
        const r = sym(l).split('');
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

// 狸花猫 sleep
const CAT_SLEEP = (() => {
    const s = Array(32).fill(null).map(() => Array(32).fill('0'));
    s[10][5]='1'; s[10][6]='1'; s[10][11]='1'; s[10][12]='1';
    s[11][4]='1'; s[11][5]='7'; s[11][6]='1'; s[11][7]='1'; s[11][10]='1'; s[11][11]='1'; s[11][12]='7'; s[11][13]='1';
    s[12][4]='1'; s[12][5]='7'; s[12][6]='1'; s[12][7]='1'; s[12][10]='1'; s[12][11]='1'; s[12][12]='7'; s[12][13]='1';
    for (let x=4; x<=13; x++) s[13][x]='1';
    s[14][5]='5'; s[14][6]='4'; s[14][7]='5'; s[14][10]='5'; s[14][11]='4'; s[14][12]='5';
    s[15][8]='6'; s[15][9]='6';
    for (let x=7; x<=10; x++) s[16][x]='3';
    for (let x=12; x<=27; x++) s[14][x]='1';
    s[14][16]='2'; s[14][22]='2';
    for (let x=13; x<=27; x++) s[15][x]='1';
    s[15][16]='2'; s[15][22]='2';
    for (let x=14; x<=26; x++) s[16][x]='1';
    s[16][16]='2'; s[16][22]='2';
    for (let x=15; x<=23; x++) s[17][x]='3';
    for (let x=14; x<=24; x++) s[18][x]='3';
    for (let x=15; x<=23; x++) s[19][x]='3';
    for (let x=16; x<=22; x++) s[20][x]='1';
    s[17][5]='8'; s[17][6]='8'; s[17][11]='8'; s[17][12]='8';
    s[18][5]='8'; s[18][6]='8'; s[18][11]='8'; s[18][12]='8';
    s[20][25]='8'; s[20][26]='8';
    s[21][25]='8'; s[21][26]='8';
    s[18][27]='9'; s[18][28]='1';
    s[17][28]='9'; s[17][29]='1';
    s[16][29]='9'; s[16][30]='1';
    s[15][30]='9';
    return s.map(r => r.join(''));
})();

// ── 大狗精灵 ──
// 灰色边牧 idle - 正面蹲坐戴墨镜
const DOG_IDLE = (() => {
    const s = Array(32).fill(null).map(() => Array(32).fill('0'));
    // 耳朵（边牧立耳）- 行1-5
    s[1][7]='A'; s[1][8]='B'; s[1][23]='A'; s[1][24]='B';
    s[2][6]='A'; s[2][7]='A'; s[2][8]='B'; s[2][23]='A'; s[2][24]='B'; s[2][25]='A';
    s[3][5]='A'; s[3][6]='A'; s[3][7]='B'; s[3][8]='A'; s[3][9]='A';
    s[3][22]='A'; s[3][23]='A'; s[3][24]='B'; s[3][25]='A'; s[3][26]='A';
    s[4][5]='A'; s[4][6]='A'; s[4][7]='B'; s[4][8]='A'; s[4][9]='A';
    s[4][22]='A'; s[4][23]='A'; s[4][24]='B'; s[4][25]='A'; s[4][26]='A';
    s[5][5]='A'; s[5][6]='A'; s[5][7]='A'; s[5][8]='A'; s[5][9]='A';
    s[5][22]='A'; s[5][23]='A'; s[5][24]='A'; s[5][25]='A'; s[5][26]='A';
    // 头 - 行6-8
    for (let x=6; x<=25; x++) { s[6][x]='A'; s[7][x]='A'; }
    // 白色流星斑（额头到鼻梁）- 行6-13居中
    for (let x=13; x<=18; x++) s[6][x]='H';
    for (let x=14; x<=17; x++) s[7][x]='H';
    // 头部两侧深灰
    for (let x=6; x<=8; x++) { s[8][x]='B'; s[8][23]='B'; }
    for (let x=9; x<=22; x++) s[8][x]='A';
    // 墨镜 - 行9-11
    for (let x=6; x<=25; x++) { s[9][x]='D'; s[10][x]='D'; s[11][x]='D'; }
    // 白色流星斑穿过墨镜上方
    for (let x=14; x<=17; x++) s[9][x]='H';
    s[10][8]='E'; s[10][9]='E'; s[10][10]='E'; s[10][11]='E';
    s[11][8]='E'; s[11][9]='F'; s[11][10]='E'; s[11][11]='E';
    s[10][20]='E'; s[10][21]='E'; s[10][22]='E'; s[10][23]='E';
    s[11][20]='E'; s[11][21]='E'; s[11][22]='E'; s[11][23]='E';
    // 墨镜下方 - 行12-15
    for (let x=6; x<=25; x++) s[12][x]='A';
    for (let x=14; x<=17; x++) s[12][x]='H';  // 流星斑延续
    for (let x=7; x<=24; x++) s[13][x]='A';
    for (let x=14; x<=17; x++) s[13][x]='H';  // 流星斑到鼻梁
    for (let x=8; x<=23; x++) s[14][x]='A';
    s[14][14]='B'; s[14][15]='B'; s[14][16]='B'; s[14][17]='B';  // 鼻子
    for (let x=9; x<=22; x++) s[15][x]='A';
    s[15][13]='C'; s[15][18]='C';  // 嘴边白毛
    // 身体 - 行16-21
    for (let x=7; x<=24; x++) s[16][x]='C';  // 白色围脖
    for (let x=5; x<=26; x++) s[17][x]='A';
    s[17][5]='B'; s[17][26]='B';
    for (let x=5; x<=26; x++) s[18][x]='A';
    for (let x=10; x<=21; x++) s[18][x]='C';
    for (let x=5; x<=26; x++) s[19][x]='A';
    for (let x=10; x<=21; x++) s[19][x]='C';
    for (let x=6; x<=25; x++) s[20][x]='A';
    for (let x=11; x<=20; x++) s[20][x]='C';
    for (let x=7; x<=24; x++) s[21][x]='A';
    // 前腿 - 行22-24
    for (let x=7; x<=11; x++) s[22][x]='A';
    for (let x=20; x<=24; x++) s[22][x]='A';
    for (let x=12; x<=19; x++) s[22][x]='C';
    for (let x=7; x<=11; x++) s[23][x]='A';
    for (let x=20; x<=24; x++) s[23][x]='A';
    for (let x=12; x<=19; x++) s[23][x]='C';
    for (let x=7; x<=11; x++) s[24][x]='H';   // 白爪
    for (let x=20; x<=24; x++) s[24][x]='H';  // 白爪
    // 尾巴
    s[17][27]='B'; s[17][28]='A';
    s[18][28]='B'; s[18][29]='A';
    s[19][27]='B'; s[19][28]='A';
    s[20][26]='B';
    return s.map(r => r.join(''));
})();

// ── 猫派生姿态 ──
const CAT_HAPPY = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    for (let x = 8; x <= 12; x++) { f[9][x] = '1'; f[10][x] = '1'; }
    for (let x = 19; x <= 23; x++) { f[9][x] = '1'; f[10][x] = '1'; }
    f[9][8]='5'; f[9][9]='4'; f[9][10]='5';
    f[9][21]='5'; f[9][22]='4'; f[9][23]='5';
    f[12][13]='3'; f[12][18]='3';
    return f.map(r => r.join(''));
})();

const CAT_SCRATCH = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    for (let y = 1; y <= 16; y++) {
        for (let x = 0; x < 31; x++) f[y][x] = f[y][x+1];
        f[y][31] = '0';
    }
    for (let x = 3; x <= 6; x++) f[16][x] = '8';
    for (let x = 2; x <= 5; x++) f[17][x] = '8';
    return f.map(r => r.join(''));
})();

const CAT_EAT = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    for (let y = 1; y <= 12; y++) {
        for (let x = 0; x < 32; x++) f[y][x] = '0';
    }
    const headRows = [
        '00000001100000000000000110000000',
        '00000011110000000000001111000000',
        '00000117110000000000011711000000',
        '00000117110000000000011711000000',
        '00000111110000000000011111000000',
        '00000011111111111111111111000000',
        '00000211111111121111111111200000',
        '00000011111111111111111111000000',
        '00000001155544111144555110000000',
        '00000001155544111144555110000000',
        '00000001111111666611111110000000',
        '00000001111111333311111110000000',
    ];
    for (let i = 0; i < headRows.length; i++) {
        for (let x = 0; x < 32; x++) f[i + 3][x] = headRows[i][x];
    }
    const bodyRows = [
        '00000011111111111111111111000000',
        '00000121111113333311111112100000',
        '00000121111113333311111112100000',
        '00000121111113333311111112100000',
        '00000011111111111111111111000000',
    ];
    for (let i = 0; i < bodyRows.length; i++) {
        for (let x = 0; x < 32; x++) f[i + 13][x] = bodyRows[i][x];
    }
    for (let x = 14; x <= 17; x++) f[14][x] = '6';
    f[14][12] = '3'; f[14][13] = '3';
    return f.map(r => r.join(''));
})();

const CAT_TILT = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    for (let y = 1; y <= 10; y++) {
        for (let x = 30; x >= 1; x--) f[y][x] = f[y][x-1];
        f[y][0] = '0';
    }
    return f.map(r => r.join(''));
})();

const CAT_PAW = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    for (let x = 18; x <= 20; x++) { f[18][x] = '1'; f[19][x] = '0'; }
    for (let x = 18; x <= 20; x++) f[16][x] = '8';
    return f.map(r => r.join(''));
})();

const CAT_BITE = (() => {
    const f = CAT_SCRATCH.map(r => r.split(''));
    for (let x = 14; x <= 17; x++) f[12][x] = '6';
    return f.map(r => r.join(''));
})();

// ── 狗派生姿态 ──
function dogVariant(base, modifyFn) {
    const f = base.map(r => r.split(''));
    modifyFn(f);
    return f.map(r => r.join(''));
}

const DOG_HAPPY = dogVariant(DOG_IDLE, f => {
    for (let y = 10; y <= 11; y++)
        for (let x = 0; x < 32; x++)
            if (f[y][x] === 'E' || f[y][x] === 'F') f[y][x] = 'D';
});

const DOG_SLEEP = dogVariant(DOG_IDLE, f => {
    for (let y = 10; y <= 11; y++)
        for (let x = 0; x < 32; x++)
            if (f[y][x] === 'E' || f[y][x] === 'F') f[y][x] = 'D';
    for (let y = 29; y >= 4; y--)
        for (let x = 0; x < 32; x++)
            f[Math.min(y+2,31)][x] = f[y][x];
    for (let y = 0; y < 4; y++)
        for (let x = 0; x < 32; x++)
            f[y][x] = '0';
});

const DOG_EAT = dogVariant(DOG_IDLE, f => {
    for (let y = 15; y >= 1; y--)
        for (let x = 0; x < 32; x++)
            f[Math.min(y+2,31)][x] = f[y][x];
    for (let y = 0; y < 3; y++)
        for (let x = 0; x < 32; x++)
            f[y][x] = '0';
});

const DOG_TILT = dogVariant(DOG_IDLE, f => {
    for (let y = 1; y <= 15; y++) {
        for (let x = 30; x >= 1; x--) f[y][x] = f[y][x-1];
        f[y][0] = '0';
    }
});

const DOG_PAW = dogVariant(DOG_IDLE, f => {
    for (let x = 20; x <= 24; x++) { f[23][x] = '0'; f[24][x] = '0'; }
    for (let x = 21; x <= 24; x++) f[20][x] = 'G';
});

const DOG_BITE = dogVariant(DOG_IDLE, f => {
    for (let x = 14; x <= 17; x++) f[15][x] = 'B';
    for (let x = 20; x <= 24; x++) { f[23][x] = '0'; f[24][x] = '0'; }
    for (let x = 21; x <= 24; x++) f[20][x] = 'G';
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
    constructor(config) {
        this.name = config.name;
        this.type = config.type;
        this.caretaker = config.caretaker;
        this.actionController = config.actionController;
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
        if (this.actionController === 'ai') {
            this._aiInterval = setInterval(() => this._aiAct(), 6000);
        }
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
    _aiAct() {
        const actions = ['idle', 'idle', 'tilt', 'paw', 'scratch'];
        if (this.mood > 60) actions.push('happy');
        if (this.mood < 30) actions.push('bite');
        if (this.energy > 50) actions.push('scratch');
        const action = actions[Math.floor(Math.random() * actions.length)];
        this.doAction(action);
    }
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
    doAction(action) {
        const validActions = ['idle', 'sleep', 'happy', 'scratch', 'eat', 'tilt', 'paw', 'bite'];
        if (!validActions.includes(action)) return;
        this.setState(action);
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
