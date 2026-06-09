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

const CAT_IDLE = [
    '00000000000000000000000000000000',
    '00000000001110000111000000000000',
    '00000000100710001710000000000000',
    '00000001100110001101000000000000',
    '00000001111111111111000000000000',
    '00000021122111221122000000000000',
    '00000011155111155110000000000000',
    '00000011154111154110000000000000',
    '00000011111666111110000000000000',
    '00000001111111111110000000000000',
    '00000022113311133122000000000000',
    '00000011133111331110000000000000',
    '00000111331111331111000000000000',
    '00000111331111331111000000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00000111331111331111000000000000',
    '00000111881111881111000000000000',
    '00000011881111881110000000000000',
    '00000001111111111100000000000000',
    '00000000011111110000000000000000',
    '00000000011111110000000000000000',
    '00000000111111111000000000000000',
    '00000001991111991000000000000000',
    '00000001991111991000000000000000',
    '00000000199119910000000000000000',
    '00000000019999100000000000000000',
    '00000000001991000000000000000000',
    '00000000000110000000000000000000',
    '00000000000000000000000000000000',
];


const CAT_SLEEP = [
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000011111111111110000000000',
    '00000001122222222222211000000000',
    '00000011221111111112211000000000',
    '00000011111111111111110000000000',
    '00000011133111133111000000000000',
    '00000011133111133111000000000000',
    '00000011111111111111000000000000',
    '00000011133111133111000000000000',
    '00000011133111133111000000000000',
    '00000011111111111111000000000000',
    '00000001111111111111000000000000',
    '00000001113311133110000000000000',
    '00000001113311133110000000000000',
    '00000000111111111100000000000000',
    '00000000011111111000000000000000',
    '00000000119911991000000000000000',
    '00000000119911991000000000000000',
    '00000000019999100000000000000000',
    '00000000001991000000000000000000',
    '00000000000110000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
];


const CAT_HAPPY = [
    '00000000000000000000000000000000',
    '00000000001110000111000000000000',
    '00000000100710001710000000000000',
    '00000001100110001101000000000000',
    '00000001111111111111000000000000',
    '00000021122111221122000000000000',
    '00000011122111122111000000000000',
    '00000011122111122111000000000000',
    '00000011111666111111000000000000',
    '00000001111111111110000000000000',
    '00000022113311133122000000000000',
    '00000011133111331110000000000000',
    '00000111331111331111000000000000',
    '00000111331111331111000000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00000111331111331111000000000000',
    '00000111881111881111000000000000',
    '00000011881111881110000000000000',
    '00000001111111111100000000000000',
    '00000000011111110000000000000000',
    '00000000011111110000000000000000',
    '00000000111111111000000000000000',
    '00000001991111991000000000000000',
    '00000001991111991000000000000000',
    '00000000199119910000000000000000',
    '00000000019999100000000000000000',
    '00000000001991000000000000000000',
    '00000000000110000000000000000000',
    '00000000000000000000000000000000',
];


const CAT_SCRATCH = [
    '00000000000000000000000000000000',
    '00000000001110000111000000000000',
    '00000000100710001710000000000000',
    '00000001100110001101000000000000',
    '00000001111111111111000000000000',
    '00000021122111221122000000000000',
    '00000011155111155110000000000000',
    '00000011154111154110000000000000',
    '00000011111666111110000000000000',
    '00000001111111111100000000000000',
    '00000022113311133122000000000000',
    '00000011133111331110000000000000',
    '00000111331111331111000000000000',
    '00000111331111331111000000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00000111331111331111000000000000',
    '00000111881111881111000000000000',
    '00000011881111881110000000000000',
    '00000001111111111100000000000000',
    '00000000011111110000000000000000',
    '00000000011111110000000000000000',
    '00000000111111111000000000000000',
    '00000088991111991000000000000000',
    '00000088991111991000000000000000',
    '00000088199119910000000000000000',
    '00000088019999100000000000000000',
    '00000088001991000000000000000000',
    '00000000000110000000000000000000',
    '00000000000000000000000000000000',
];


const CAT_EAT = [
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
    '00000001111111111111000000000000',
    '00000021122111221122000000000000',
    '00000011155111155110000000000000',
    '00000011154111154110000000000000',
    '00000011111666111110000000000000',
    '00000001111111111100000000000000',
    '00000022113311133122000000000000',
    '00000011133111331110000000000000',
    '00000111331111331111000000000000',
    '00000111331111331111000000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00001111331111331111100000000000',
    '00000111331111331111000000000000',
    '00000111881111881111000000000000',
    '00000011881111881110000000000000',
    '00000001111111111100000000000000',
    '00000000011111110000000000000000',
    '00000000011111110000000000000000',
    '00000000111111111000000000000000',
    '00000001991111991000000000000000',
    '00000001991111991000000000000000',
    '00000000199119910000000000000000',
    '00000000019999100000000000000000',
    '00000000001991000000000000000000',
    '00000000000110000000000000000000',
    '00000000000000000000000000000000',
];


const CAT_TILT = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    for (let y = 1; y <= 9; y++) {
        for (let x = 30; x >= 1; x--) {
            f[y][x] = f[y][x-1];
        }
        f[y][0] = '0';
    }
    return f.map(r => r.join(''));
})();


const CAT_PAW = (() => {
    const f = CAT_IDLE.map(r => r.split(''));
    for (let x = 13; x <= 16; x++) {
        f[19][x] = '1'; f[20][x] = '0';
    }
    for (let x = 13; x <= 16; x++) {
        f[16][x] = '8';
    }
    return f.map(r => r.join(''));
})();


const CAT_BITE = (() => {
    const f = CAT_SCRATCH.map(r => r.split(''));
    for (let x = 14; x <= 17; x++) {
        f[10][x] = '6';
    }
    return f.map(r => r.join(''));
})();


const DOG_IDLE = [
    '00000000000000000000000000000000',
    '00000000AAB0000BBAA0000000000000',
    '0000000AABBA00ABBBAA000000000000',
    '0000000ABBBAAAAABBBBA00000000000',
    '0000000ABBBAAAAABBBBA00000000000',
    '000000ABDDEEDDDEEDDBA00000000000',
    '000000ABDDEEDDDEEDDBA00000000000',
    '000000ABDEFFEDDEFFEDBA0000000000',
    '0000000ABBBBBBBBBBBA00000000000',
    '0000000AABBCCBBCCBBA00000000000',
    '000000ABBBCCCCCCCBBBA00000000000',
    '00000ABBBCCCCCCCCCBBBA0000000000',
    '00000ABBBCCCCCCCCCBBBA0000000000',
    '0000AABBBCCCCCCCCCBBBAA000000000',
    '0000AABBBCCCCCCCCCBBBAA000000000',
    '0000AABBBCCCCCCCCCBBBAA000000000',
    '0000AABBBCCCCCCCCCBBBAA000000000',
    '00000ABBBCCCCCCCCCBBBA0000000000',
    '00000ABBBCCCCCCCCCBBBA0000000000',
    '00000ABBGCCCCCCCCGBBA00000000000',
    '000000ABGCCCCCCCGBA0000000000000',
    '0000000ABBBBBBBBBBA0000000000000',
    '00000000AABBBBBBAA00000000000000',
    '00000000AABBBBBBAA00000000000000',
    '0000000AABBBBBBBBAA0000000000000',
    '0000000AABBBBBBBBAA0000000000000',
    '0000000AABBBBBBBBAA0000000000000',
    '00000000AABBBBBBAA00000000000000',
    '000000000AABBBAA0000000000000000',
    '0000000000AAAA000000000000000000',
    '00000000000000000000000000000000',
    '00000000000000000000000000000000',
];


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
