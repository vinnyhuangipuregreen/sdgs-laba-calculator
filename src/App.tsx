import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Scale,
  Droplets,
  Users,
  Clock,
  Copy,
  Check,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  BookOpen,
  ChefHat,
  Info,
  Volume2,
  VolumeX,
  CheckCircle2,
  Timer,
  Flame,
  Utensils,
  Filter,
  ChevronRight,
  X
} from 'lucide-react';

// ==========================================
// 1. Design Tokens & Constants (src/constants/colors.ts)
// ==========================================
export const LABA_COLORS = {
  primary: '#12823D',   // 永續主綠：主按鈕 (CTA)、滑桿軌道高亮、完成徽章、LINE 複製按鈕
  tech: '#0EA5A4',      // 科技湖水藍：SOP 步驟節點、計時器倒數進度環、分頁選中態
  data: '#2454DE',      // 專業數據藍：運算所得之重量/容量數值、數據統計容器、單位切換鈕
  nature: '#65A30D',    // 自然草綠：三寶時蔬標籤、健康提示徽章、大鍋 (≥50人) 警示橫幅
  surface: '#F0F5F8',   // 頁面背景：全站底色
  text: '#12332F',      // 主要文字：主標題、食材品名、核心步驟內文
  textMuted: '#64748B', // 次要文字
} as const;

// ==========================================
// 2. Types (src/types/recipe.ts)
// ==========================================
export type UnitMode = 'metric' | 'household';

export type IngredientCategory = 'staple' | 'fresh' | 'fried' | 'braised' | 'seasoning';

export interface IngredientBaseline {
  id: string;
  name: string;
  category: IngredientCategory;
  ratio: number;        // 精確運算係數 (以 10 人份 3500ml 為基準推導)
  displayRatio: string; // SRS 規格表顯示之基準比率 (Ci)
  base10Amount: number; // 10 人份規格用量
  unit: 'g' | 'ml' | 'root';
  prepInstruction: string;
}

export interface CalculatedIngredient extends IngredientBaseline {
  calculatedGrams: number;
  displayAmount: string;
  householdAmount: string;
}

export interface SopStepNode {
  stepIndex: number;
  phaseCode: string;
  timeOffsetMin: number | null;
  timeLabel: string;
  durationSec: number;
  title: string;
  actionDetail: string;
  targetIngredients: string[];
  grandMasterNote: string;
}

// ==========================================
// 3. Recipe Baseline Constants (src/constants/recipeConstants.ts)
// ==========================================
export const CATEGORY_META: Record<
  IngredientCategory,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  staple: {
    label: '主食雙米',
    color: '#0EA5A4',
    bgColor: 'rgba(14, 165, 164, 0.1)',
    borderColor: 'rgba(14, 165, 164, 0.3)',
  },
  fresh: {
    label: '三寶時蔬',
    color: '#65A30D',
    bgColor: 'rgba(101, 163, 13, 0.12)',
    borderColor: 'rgba(101, 163, 13, 0.35)',
  },
  fried: {
    label: '酥炸定型',
    color: '#0EA5A4',
    bgColor: 'rgba(14, 165, 164, 0.1)',
    borderColor: 'rgba(14, 165, 164, 0.3)',
  },
  braised: {
    label: '煨滷軟料',
    color: '#65A30D',
    bgColor: 'rgba(101, 163, 13, 0.12)',
    borderColor: 'rgba(101, 163, 13, 0.35)',
  },
  seasoning: {
    label: '爆香與調味',
    color: '#0EA5A4',
    bgColor: 'rgba(14, 165, 164, 0.1)',
    borderColor: 'rgba(14, 165, 164, 0.3)',
  },
};

export const INGREDIENT_BASELINE: IngredientBaseline[] = [
  {
    id: 'rice_ponlai',
    name: '蓬萊米',
    category: 'staple',
    ratio: 280 / 3500,
    displayRatio: '0.0800',
    base10Amount: 280,
    unit: 'g',
    prepInstruction: '主米：洗淨瀝乾，入鍋前須用熱油翻炒至吃油散開。',
  },
  {
    id: 'rice_glutinous',
    name: '圓糯米',
    category: 'staple',
    ratio: 95 / 3500,
    displayRatio: '0.0271',
    base10Amount: 95,
    unit: 'g',
    prepInstruction: '增稠：與蓬萊米混和，提供適度黏稠度。',
  },
  {
    id: 'veg_bokchoy',
    name: '青江菜葉',
    category: 'fresh',
    ratio: 120 / 3500,
    displayRatio: '0.0343',
    base10Amount: 120,
    unit: 'g',
    prepInstruction: '三寶時蔬：滾水燙熟沖冷水，切 0.7cm 丁，起鍋前放。',
  },
  {
    id: 'taro_cubes',
    name: '芋頭丁',
    category: 'fried',
    ratio: 120 / 3500,
    displayRatio: '0.0343',
    base10Amount: 120,
    unit: 'g',
    prepInstruction: '切 1cm 丁，入油鍋炸過定型，煮入粥中易爛不碎。',
  },
  {
    id: 'carrot_cubes',
    name: '紅蘿蔔丁',
    category: 'fresh',
    ratio: 120 / 3500,
    displayRatio: '0.0343',
    base10Amount: 120,
    unit: 'g',
    prepInstruction: '三寶根莖：切 1cm 丁，過油微炸逼出水分與胡蘿蔔素。',
  },
  {
    id: 'peanut_raw',
    name: '花生 (乾生豆)',
    category: 'braised',
    ratio: 85 / 3500,
    displayRatio: '0.0243',
    base10Amount: 85,
    unit: 'g',
    prepInstruction: '前晚泡水，預先蒸煮至軟爛「入口即化」狀態。',
  },
  {
    id: 'lotus_seed',
    name: '蓮子 (乾生)',
    category: 'braised',
    ratio: 80 / 3500,
    displayRatio: '0.0229',
    base10Amount: 80,
    unit: 'g',
    prepInstruction: '預先蒸透至鬆軟、入口即化；可依喜好加入白果。',
  },
  {
    id: 'tofu_fried',
    name: '油豆腐丁',
    category: 'braised',
    ratio: 100 / 3500,
    displayRatio: '0.0286',
    base10Amount: 100,
    unit: 'g',
    prepInstruction: '切 1cm 丁，油炸定型備用。',
  },
  {
    id: 'youtiao',
    name: '老油條',
    category: 'fried',
    ratio: 2.0 / 3500,
    displayRatio: '0.00057 (根/ml)',
    base10Amount: 2.0,
    unit: 'root',
    prepInstruction: '切段不可過碎，起鍋前 5 分鐘下鍋吸附香氣。',
  },
  {
    id: 'oil_fry_rice',
    name: '炒米油',
    category: 'seasoning',
    ratio: 38.5 / 3500,
    displayRatio: '0.0110 (ml/ml)',
    base10Amount: 38.5,
    unit: 'ml',
    prepInstruction: '爆香薑泥與炒米專用好油，達到油米相融核心。',
  },
  {
    id: 'ginger_paste',
    name: '老薑泥',
    category: 'seasoning',
    ratio: 10 / 3500,
    displayRatio: '0.0028',
    base10Amount: 10,
    unit: 'g',
    prepInstruction: '磨細泥，僅取其清香，粥品中吃不出薑顆粒。',
  },
  {
    id: 'soy_sauce',
    name: '滷料醬油',
    category: 'seasoning',
    ratio: 87.5 / 3500,
    displayRatio: '0.0250 (ml/ml)',
    base10Amount: 87.5,
    unit: 'ml',
    prepInstruction: '與油膏、水小火煨滷花生、蓮子、油豆腐至完全收汁。',
  },
  {
    id: 'soy_paste',
    name: '滷料油膏',
    category: 'seasoning',
    ratio: 19.0 / 3500,
    displayRatio: '0.0054 (ml/ml)',
    base10Amount: 19.0,
    unit: 'ml',
    prepInstruction: '提供醬色厚度與微甘回韻。',
  },
  {
    id: 'salt',
    name: '主鍋食鹽',
    category: 'seasoning',
    ratio: 9.8 / 3500,
    displayRatio: '0.0028',
    base10Amount: 9.8,
    unit: 'g',
    prepInstruction: '主鍋調味，於起鍋前 5 分鐘下。',
  },
  {
    id: 'mushroom_powder',
    name: '香菇精/昆布粉',
    category: 'seasoning',
    ratio: 9.8 / 3500,
    displayRatio: '0.0028',
    base10Amount: 9.8,
    unit: 'g',
    prepInstruction: '純素提鮮使用。',
  },
  {
    id: 'pepper_powder',
    name: '白胡椒粉',
    category: 'seasoning',
    ratio: 6.2 / 3500,
    displayRatio: '0.0018',
    base10Amount: 6.2,
    unit: 'g',
    prepInstruction: '提引辛香，微香即可。',
  },
];

// ==========================================
// 4. SOP Steps Constants (src/constants/sopSteps.ts)
// ==========================================
export const SOP_STEPS: SopStepNode[] = [
  {
    stepIndex: 0,
    phaseCode: 'Phase 0',
    timeOffsetMin: null,
    timeLabel: '煮前完成',
    durationSec: 300,
    title: '食材前置與煨滷',
    actionDetail:
      '1. 花生泡透煮爛；蓮子蒸軟。\n2. 芋頭、油豆腐切丁炸過。\n3. 以醬油、油膏煨滷花生/蓮子/豆腐至收汁。',
    targetIngredients: ['花生 (乾生豆)', '蓮子 (乾生)', '芋頭丁', '油豆腐丁', '滷料醬油', '滷料油膏'],
    grandMasterNote: '每樣材料都是兵將，必須先處理到入口即化的程度才能下鍋，不生硬分離。',
  },
  {
    stepIndex: 1,
    phaseCode: 'Phase 1',
    timeOffsetMin: 0,
    timeLabel: 'T = 0 分',
    durationSec: 300,
    title: '油米相融與起鍋',
    actionDetail:
      '滾水於主鍋煮沸。平底鍋下油爆香薑泥，入生米翻炒至吸油冒熱氣，趁熱沖入滾水鍋，同時下炸紅蘿蔔丁。',
    targetIngredients: ['蓬萊米', '圓糯米', '炒米油', '老薑泥', '紅蘿蔔丁'],
    grandMasterNote: '米比油的組織力強，同炒能使油軟化被米吸收，煮出的粥水面絕不泛浮油。',
  },
  {
    stepIndex: 2,
    phaseCode: 'Phase 2',
    timeOffsetMin: 5,
    timeLabel: 'T = 5 分',
    durationSec: 300,
    title: '下炸芋頭丁',
    actionDetail: '主鍋維持中火微滾，加入炸好的芋頭丁。開始用鍋鏟由底部輕輕推動翻身。',
    targetIngredients: ['芋頭丁'],
    grandMasterNote: '芋頭必須先炸過，下鍋後耐煮且帶香氣，定時翻身預防鍋底沉澱焦巴。',
  },
  {
    stepIndex: 3,
    phaseCode: 'Phase 3',
    timeOffsetMin: 10,
    timeLabel: 'T = 10 分',
    durationSec: 300,
    title: '加入煨滷配料',
    actionDetail: '將已收乾湯汁的滷花生、滷蓮子、滷油豆腐全部下鍋熬煮。',
    targetIngredients: ['花生 (乾生豆)', '蓮子 (乾生)', '油豆腐丁'],
    grandMasterNote: '先滷後煮使醬香與食材甜味緩慢滲透米湯，形成「五味調和，百味香」。',
  },
  {
    stepIndex: 4,
    phaseCode: 'Phase 4',
    timeOffsetMin: 15,
    timeLabel: 'T = 15 分',
    durationSec: 300,
    title: '調味與酥香油條',
    actionDetail: '加入食鹽、香菇精、胡椒粉調味，隨即投入切段的老油條輕拌入味。',
    targetIngredients: ['主鍋食鹽', '香菇精/昆布粉', '白胡椒粉', '老油條'],
    grandMasterNote: '油條不可切過碎，增添色澤、口感與粥香。',
  },
  {
    stepIndex: 5,
    phaseCode: 'Phase 5',
    timeOffsetMin: 20,
    timeLabel: 'T = 20 分',
    durationSec: 300,
    title: '落青翠菜葉與熄火',
    actionDetail: '投入預燙冷鎮、切細丁的青江菜葉，輕推拌勻後立即熄火。',
    targetIngredients: ['青江菜葉'],
    grandMasterNote: '僅取青菜葉，起鍋前放才能保持翠綠如玉；太早入鍋葉片變黑失色。',
  },
  {
    stepIndex: 6,
    phaseCode: 'Phase 6',
    timeOffsetMin: 25,
    timeLabel: 'T = 25 分',
    durationSec: 300,
    title: '蓋鍋燜透醞釀',
    actionDetail: '蓋緊鍋蓋，離火靜置燜透 5 分鐘。開蓋後質地稠潤、油水完全交融，即可盛碗。',
    targetIngredients: ['全鍋合味'],
    grandMasterNote: '如做麵醒麵，利用餘溫讓米膠凝結，達到稠而不爛、水米不分的圓融境界。',
  },
];

// ==========================================
// 5. Utility Functions (src/utils/unitConverter.ts & formatLineText.ts)
// ==========================================
function formatChineseFraction(value: number): string {
  const whole = Math.floor(value + 0.02);
  const rem = value - whole;

  const candidates: Array<{ val: number; text: string }> = [
    { val: 0, text: '' },
    { val: 1 / 8, text: '1/8' },
    { val: 1 / 6, text: '1/6' },
    { val: 1 / 4, text: '1/4' },
    { val: 1 / 3, text: '1/3' },
    { val: 3 / 8, text: '3/8' },
    { val: 1 / 2, text: '1/2' },
    { val: 5 / 8, text: '5/8' },
    { val: 2 / 3, text: '2/3' },
    { val: 3 / 4, text: '3/4' },
    { val: 5 / 6, text: '5/6' },
    { val: 7 / 8, text: '7/8' },
    { val: 1, text: 'FULL' },
  ];

  let best = candidates[0];
  let minDiff = Math.abs(rem - best.val);
  for (const c of candidates) {
    const diff = Math.abs(rem - c.val);
    if (diff < minDiff) {
      minDiff = diff;
      best = c;
    }
  }

  if (best.text === 'FULL') {
    return `${whole + 1}`;
  }
  if (whole === 0 && best.text === '') {
    return value.toFixed(1);
  }
  if (whole === 0) {
    return best.text;
  }
  if (best.text === '') {
    return `${whole}`;
  }
  return `${whole} 又 ${best.text}`;
}

export function convertGramsToHousehold(id: string, calculatedGrams: number): string {
  // 10 人份基準對照，等比例動態換算家用量杯/大匙/小匙
  switch (id) {
    case 'rice_ponlai': {
      // 280g => 1 又 7/8 米杯 (1.875 米杯)
      const cups = (calculatedGrams / 280) * 1.875;
      return `約 ${formatChineseFraction(cups)} 米杯`;
    }
    case 'rice_glutinous': {
      // 95g => 5/8 米杯 (0.625 米杯)
      const cups = (calculatedGrams / 95) * 0.625;
      return `約 ${formatChineseFraction(cups)} 米杯`;
    }
    case 'veg_bokchoy': {
      // 120g => 燙切後約 1 又 1/4 杯 (1.25 杯)
      const cups = (calculatedGrams / 120) * 1.25;
      return `燙切後約 ${formatChineseFraction(cups)} 杯`;
    }
    case 'taro_cubes':
    case 'carrot_cubes': {
      // 120g => 約 1 又 1/4 杯 (1.25 杯)
      const cups = (calculatedGrams / 120) * 1.25;
      return `約 ${formatChineseFraction(cups)} 杯`;
    }
    case 'peanut_raw': {
      // 85g => 約 5/8 杯 (0.625 杯)
      const cups = (calculatedGrams / 85) * 0.625;
      return `約 ${formatChineseFraction(cups)} 杯`;
    }
    case 'lotus_seed': {
      // 80g => 約 5/6 杯 (5/6 杯)
      const cups = (calculatedGrams / 80) * (5 / 6);
      return `約 ${formatChineseFraction(cups)} 杯`;
    }
    case 'tofu_fried': {
      // 100g => 約 1 又 1/4 杯 (1.25 杯)
      const cups = (calculatedGrams / 100) * 1.25;
      return `約 ${formatChineseFraction(cups)} 杯`;
    }
    case 'youtiao': {
      return `切 0.7cm 段 (約 ${calculatedGrams.toFixed(1)} 根)`;
    }
    case 'oil_fry_rice': {
      // 38.5ml => 約 2.5 大匙 (tbsp)
      const tbsp = (calculatedGrams / 38.5) * 2.5;
      return `約 ${Number(tbsp.toFixed(2))} 大匙 (tbsp)`;
    }
    case 'ginger_paste': {
      // 10g => 約 0.7 大匙 (tbsp)
      const tbsp = (calculatedGrams / 10) * 0.7;
      return `約 ${Number(tbsp.toFixed(1))} 大匙 (tbsp)`;
    }
    case 'soy_sauce': {
      // 87.5ml => 約 6.0 大匙 (tbsp)
      const tbsp = (calculatedGrams / 87.5) * 6.0;
      return `約 ${tbsp.toFixed(1)} 大匙 (tbsp)`;
    }
    case 'soy_paste': {
      // 19.0ml => 約 1.25 大匙 (tbsp)
      const tbsp = (calculatedGrams / 19.0) * 1.25;
      return `約 ${Number(tbsp.toFixed(2))} 大匙 (tbsp)`;
    }
    case 'salt':
    case 'mushroom_powder': {
      // 9.8g => 約 0.6 大匙 (tbsp)
      const tbsp = (calculatedGrams / 9.8) * 0.6;
      return `約 ${Number(tbsp.toFixed(1))} 大匙 (tbsp)`;
    }
    case 'pepper_powder': {
      // 6.2g => 約 1.25 小匙 (tsp)
      const tsp = (calculatedGrams / 6.2) * 1.25;
      return `約 ${Number(tsp.toFixed(2))} 小匙 (tsp)`;
    }
    default:
      return `${calculatedGrams} g`;
  }
}

export function formatMetricAmount(unit: 'g' | 'ml' | 'root', amount: number): string {
  if (unit === 'root') {
    return `${amount.toFixed(1)} 根`;
  }
  if (unit === 'ml') {
    return `${Number.isInteger(amount) ? amount.toFixed(1) : amount} ml`;
  }
  return `${amount} g`;
}

export function formatLineText(
  servings: number,
  waterVolumeLiters: string,
  waterVolumeMl: number,
  unitMode: UnitMode,
  ingredients: CalculatedIngredient[],
  checkedItems: Record<string, boolean> = {}
): string {
  const lines: string[] = [
    `🥣 【佛光山正統典座・臘八粥採買與備料清單】`,
    `━━━━━━━━━━━━━━━━━━`,
    `👥 預計供應人數：${servings} 人份`,
    `💧 基準總水量：${waterVolumeLiters} L (${waterVolumeMl.toLocaleString()} ml)`,
    `⚖️ 顯示單位：${unitMode === 'metric' ? '公制專業磅秤 (g / ml)' : '家用量杯湯匙估算'}`,
  ];

  if (servings >= 50) {
    lines.push(`⚠️ 大鍋提示：大寮寺院大鍋烹煮 (≥50人)，熄火後燜透時間建議延長至 10~15 分鐘！`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`📋 【食材採買與前置處理 BOM】`);

  ingredients.forEach((item, index) => {
    const primaryVal = item.displayAmount;
    const secondaryVal =
      unitMode === 'metric'
        ? item.householdAmount
        : formatMetricAmount(item.unit, item.calculatedGrams);
    lines.push(
      `${checkedItems[item.id] ? '(V) ' : ''}${index + 1}. ${item.name}：${primaryVal} (${secondaryVal})\n   └ 工藝：${item.prepInstruction}`
    );
  });

  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`⏱️ 【25分鐘 6階段典座工藝口訣】`);
  lines.push(`• Phase 0 (煮前)：花生蓮子蒸爛，芋頭豆腐炸定型，醬油油膏煨滷收汁`);
  lines.push(`• T=0m：薑泥熱油炒生米至吸油，沖入滾水鍋＋下紅蘿蔔丁`);
  lines.push(`• T=5m：下炸芋頭丁，中火微滾輕推鍋底防焦`);
  lines.push(`• T=10m：下收汁滷花生、滷蓮子、滷油豆腐熬煮`);
  lines.push(`• T=15m：下鹽、香菇精、白胡椒粉調味＋下老油條段`);
  lines.push(`• T=20m：下燙熟冷鎮青江菜葉丁，拌勻立即熄火`);
  lines.push(
    `• T=25m：蓋緊鍋蓋靜置燜透 ${servings >= 50 ? '10~15' : '5'} 分鐘，油水交融即成！`
  );

  return lines.join('\n');
}

// ==========================================
// 6. Custom Hooks (src/hooks/useLabaCalculator.ts & useStepTimer.ts)
// ==========================================
export function useLabaCalculator(initialServings = 10) {
  const [servings, setServingsState] = useState<number>(initialServings);
  const [unitMode, setUnitMode] = useState<UnitMode>('metric');

  // 單人份熟粥體積基準 (ml)
  const SERVING_VOLUME_ML = 350;

  // 限定 1 <= N <= 300
  const setServings = useCallback((nextVal: number) => {
    const clamped = Math.min(300, Math.max(1, Math.round(nextVal)));
    setServingsState(clamped);
  }, []);

  // 人數連動水量 (ml)
  const waterVolumeMl = useMemo(() => servings * SERVING_VOLUME_ML, [servings]);

  // 水量連動人數變更 (雙向無死鎖推導)
  const handleWaterVolumeChange = useCallback((liters: number) => {
    if (Number.isNaN(liters) || liters <= 0) return;
    const calculatedServings = Math.min(
      300,
      Math.max(1, Math.round((liters * 1000) / SERVING_VOLUME_ML))
    );
    setServingsState(calculatedServings);
  }, []);

  // 動態食材清單衍生運算
  const ingredients = useMemo<CalculatedIngredient[]>(() => {
    return INGREDIENT_BASELINE.map((item) => {
      const calculatedGrams = Math.round(waterVolumeMl * item.ratio * 10) / 10;
      const householdText = convertGramsToHousehold(item.id, calculatedGrams);
      const metricText = formatMetricAmount(item.unit, calculatedGrams);

      return {
        ...item,
        calculatedGrams,
        householdAmount: householdText,
        displayAmount: unitMode === 'metric' ? metricText : householdText,
      };
    });
  }, [waterVolumeMl, unitMode]);

  // 統計數據：總生米重 (蓬萊米 + 圓糯米)、總固形配料重
  const summaryMetrics = useMemo(() => {
    const ponlai = ingredients.find((i) => i.id === 'rice_ponlai')?.calculatedGrams || 0;
    const glutinous = ingredients.find((i) => i.id === 'rice_glutinous')?.calculatedGrams || 0;
    const totalRawRiceGrams = Math.round((ponlai + glutinous) * 10) / 10;

    const solidVeggiesAndBraised = ingredients
      .filter((i) => i.unit === 'g' && i.id !== 'rice_ponlai' && i.id !== 'rice_glutinous')
      .reduce((acc, cur) => acc + cur.calculatedGrams, 0);

    return {
      totalRawRiceGrams,
      ponlaiGrams: ponlai,
      glutinousGrams: glutinous,
      totalSolidGrams: Math.round(solidVeggiesAndBraised * 10) / 10,
      estimatedBowls: servings,
    };
  }, [ingredients, servings]);

  return {
    servings,
    setServings,
    waterVolumeMl,
    waterVolumeLiters: (waterVolumeMl / 1000).toFixed(2),
    handleWaterVolumeChange,
    unitMode,
    setUnitMode,
    ingredients,
    summaryMetrics,
    isLargeBatch: servings >= 50,
  };
}

export function useStepTimer() {
  const [activeStep, setActiveStep] = useState<SopStepNode | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(300);
  const [totalSec, setTotalSec] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const intervalRef = useRef<number | null>(null);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.14 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.14 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.48);
      });
    } catch {
      // Ignore audio errors if blocked before gesture
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (activeStep) {
            setCompletedSteps((prevMap) => ({ ...prevMap, [activeStep.stepIndex]: true }));
          }
          playChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, activeStep, playChime]);

  const openStepTimer = useCallback((step: SopStepNode, isLargeBatch: boolean) => {
    const duration = step.stepIndex === 6 && isLargeBatch ? 720 : step.durationSec;
    setActiveStep(step);
    setTotalSec(duration);
    setRemainingSec(duration);
    setIsRunning(false);
  }, []);

  const closeStepTimer = useCallback(() => {
    setIsRunning(false);
    setActiveStep(null);
  }, []);

  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setRemainingSec(totalSec);
  }, [totalSec]);

  const toggleStepCompleted = useCallback((stepIndex: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepIndex]: !prev[stepIndex],
    }));
  }, []);

  return {
    activeStep,
    remainingSec,
    totalSec,
    isRunning,
    completedSteps,
    soundEnabled,
    setSoundEnabled,
    openStepTimer,
    closeStepTimer,
    toggleRunning,
    resetTimer,
    toggleStepCompleted,
  };
}

// ==========================================
// 7. UI Components
// ==========================================

// 7.1 UnitToggle (src/components/common/UnitToggle.tsx)
interface UnitToggleProps {
  unitMode: UnitMode;
  onChange: (mode: UnitMode) => void;
}

const UnitToggle: React.FC<UnitToggleProps> = ({ unitMode, onChange }) => {
  return (
    <div
      className="inline-flex items-center rounded-xl p-1 bg-slate-100 border border-slate-200 shadow-inner"
      role="group"
      aria-label="計量單位切換"
    >
      <button
        type="button"
        onClick={() => onChange('metric')}
        style={
          unitMode === 'metric'
            ? { backgroundColor: LABA_COLORS.data, color: '#FFFFFF' }
            : { color: LABA_COLORS.text }
        }
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
      >
        <Scale className="w-3.5 h-3.5" />
        <span>公制 (g / ml)</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('household')}
        style={
          unitMode === 'household'
            ? { backgroundColor: LABA_COLORS.data, color: '#FFFFFF' }
            : { color: LABA_COLORS.text }
        }
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
      >
        <Utensils className="w-3.5 h-3.5" />
        <span>家用量杯</span>
      </button>
    </div>
  );
};

// 7.2 Header (src/components/common/Header.tsx)
interface HeaderProps {
  unitMode: UnitMode;
  onUnitChange: (mode: UnitMode) => void;
  onOpenTheoryModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ unitMode, onUnitChange, onOpenTheoryModal }) => {
  return (
    <section className="ds-container tool-page-header"><div className="content-card">
      <a className="tool-return" href="/#food">← 返回智慧工具箱</a>
      <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: LABA_COLORS.primary }}
          >
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-lg sm:text-xl font-bold tracking-tight"
                style={{ color: LABA_COLORS.text }}
              >
                臘八粥食材試算表
              </h1>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: LABA_COLORS.tech }}
              >
                v1.1.0 正式版
              </span>
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: LABA_COLORS.nature }}
              >
                <Sparkles className="w-3 h-3" />
                SDGs 永續蔬食典座工藝
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              佛光山正統典座烹飪心法・星雲大師臘八粥講習規約量化工程系統
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={onOpenTheoryModal}
            aria-label="典座心法與公式"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm hover:opacity-95 transition"
            style={{ backgroundColor: LABA_COLORS.primary }}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden xs:inline">典座心法與公式</span>
          </button>
          <UnitToggle unitMode={unitMode} onChange={onUnitChange} />
        </div>
      </div>
    </div></section>
  );
};

// 7.3 LargeBatchBanner (src/components/calculator/LargeBatchBanner.tsx)
interface LargeBatchBannerProps {
  servings: number;
  isLargeBatch: boolean;
}

const LargeBatchBanner: React.FC<LargeBatchBannerProps> = ({ servings, isLargeBatch }) => {
  if (!isLargeBatch) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl p-4 text-white shadow-md transition-all duration-300 flex items-start gap-3"
      style={{ backgroundColor: LABA_COLORS.nature }}
    >
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="text-xs sm:text-sm leading-relaxed">
        <div className="font-bold text-sm sm:text-base flex items-center gap-2">
          <span>大寮寺院大鍋烹煮警示（目前設定：{servings} 人份）</span>
        </div>
        <p className="mt-1 opacity-95">
          大寮寺院大鍋烹煮，燜透時間建議延長至 <strong>10~15 分鐘</strong>。大鍋蓄熱強、底部易沉澱，Phase 2 起請使用長柄大鏟由鍋底規律翻動，避免焦巴。
        </p>
      </div>
    </div>
  );
};

// 7.4 MetricSummaryCards (src/components/calculator/MetricSummaryCards.tsx)
interface MetricSummaryCardsProps {
  servings: number;
  waterVolumeMl: number;
  waterVolumeLiters: string;
  totalRawRiceGrams: number;
  ponlaiGrams: number;
  glutinousGrams: number;
  totalSolidGrams: number;
}

const MetricSummaryCards: React.FC<MetricSummaryCardsProps> = ({
  servings,
  waterVolumeMl,
  waterVolumeLiters,
  totalRawRiceGrams,
  ponlaiGrams,
  glutinousGrams,
  totalSolidGrams,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 總水量統計卡 */}
      <div
        className="rounded-2xl p-3.5 text-white shadow-sm relative overflow-hidden"
        style={{ backgroundColor: LABA_COLORS.data }}
      >
        <div className="flex items-center justify-between text-xs font-medium opacity-90">
          <span>基準總水量 (W)</span>
          <Droplets className="w-4 h-4" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-2xl font-extrabold tracking-tight">{waterVolumeLiters}</span>
          <span className="text-xs font-semibold opacity-90">L (公升)</span>
        </div>
        <div className="mt-1 text-[11px] opacity-90">
          精算容量：{waterVolumeMl.toLocaleString()} ml
        </div>
      </div>

      {/* 總生米重統計卡 */}
      <div
        className="rounded-2xl p-3.5 text-white shadow-sm relative overflow-hidden"
        style={{ backgroundColor: LABA_COLORS.data }}
      >
        <div className="flex items-center justify-between text-xs font-medium opacity-90">
          <span>總生米重量</span>
          <Scale className="w-4 h-4" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-2xl font-extrabold tracking-tight">{totalRawRiceGrams}</span>
          <span className="text-xs font-semibold opacity-90">g (公克)</span>
        </div>
        <div className="mt-1 text-[11px] opacity-90 truncate">
          蓬萊 {ponlaiGrams}g + 圓糯 {glutinousGrams}g
        </div>
      </div>

      {/* 成品碗數與配料統計 */}
      <div className="col-span-2 rounded-2xl bg-white border border-slate-200 p-3.5 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium">單人份熟粥標準 (Vserving)</span>
          <div className="text-sm font-bold mt-0.5" style={{ color: LABA_COLORS.text }}>
            350 ml / 碗 <span className="text-xs font-normal text-slate-500">（390cc 湯碗 9 分滿）</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium">固形食材總重</span>
          <div className="text-base font-extrabold" style={{ color: LABA_COLORS.data }}>
            {(totalRawRiceGrams + totalSolidGrams).toFixed(1)} g
          </div>
        </div>
      </div>
    </div>
  );
};

// 7.5 DualControlPanel (src/components/calculator/DualControlPanel.tsx)
interface DualControlPanelProps {
  servings: number;
  setServings: (val: number) => void;
  waterVolumeMl: number;
  waterVolumeLiters: string;
  handleWaterVolumeChange: (liters: number) => void;
}

const QUICK_PRESETS = [
  { label: '小家庭 (4人)', servings: 4 },
  { label: '基準配方 (10人)', servings: 10 },
  { label: '社區聚會 (20人)', servings: 20 },
  { label: '大寮結緣 (50人)', servings: 50 },
  { label: '寺院百人鍋 (100人)', servings: 100 },
  { label: '法會大鍋 (300人)', servings: 300 },
];

const DualControlPanel: React.FC<DualControlPanelProps> = ({
  servings,
  setServings,
  waterVolumeMl,
  waterVolumeLiters,
  handleWaterVolumeChange,
}) => {
  const [waterInputText, setWaterInputText] = useState<string>(waterVolumeLiters);
  const [isEditingWater, setIsEditingWater] = useState<boolean>(false);

  useEffect(() => {
    if (!isEditingWater) {
      setWaterInputText(waterVolumeLiters);
    }
  }, [waterVolumeLiters, isEditingWater]);

  const servingsPercent = ((servings - 1) / (300 - 1)) * 100;
  const currentLitersNum = waterVolumeMl / 1000;
  const waterPercent = ((currentLitersNum - 0.35) / (105 - 0.35)) * 100;

  return (
    <section
      aria-label="人數與水量雙向連動控制面板"
      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-5"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold" style={{ color: LABA_COLORS.text }}>
            雙向連動控制盤
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            支援「以人數推算水量」或「以鍋具水量反推人數」線性動態縮放
          </p>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
          style={{ backgroundColor: LABA_COLORS.primary }}
        >
          1 ~ 300 人
        </span>
      </div>

      {/* 控制項 1：以人數驅動 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="servings-input"
            className="text-sm font-bold flex items-center gap-1.5"
            style={{ color: LABA_COLORS.text }}
          >
            <Users className="w-4 h-4" style={{ color: LABA_COLORS.primary }} />
            <span>預計供應人數 (N)</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="servings-input"
              type="number"
              min={1}
              max={300}
              step={1}
              value={servings}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!Number.isNaN(val)) {
                  setServings(val);
                }
              }}
              className="w-20 text-right font-extrabold text-base px-2.5 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2"
              style={{ color: LABA_COLORS.data }}
            />
            <span className="text-xs font-semibold text-slate-500">人份</span>
          </div>
        </div>

        {/* 全幅寬度滑桿 (RWD 100% full-width, 主色 #16A34A) */}
        <div className="w-full pt-1">
          <input
            id="servings-slider"
            type="range"
            min={1}
            max={300}
            step={1}
            value={servings}
            aria-label="人數調整滑桿"
            onChange={(e) => setServings(parseInt(e.target.value, 10))}
            style={{
              accentColor: LABA_COLORS.primary,
              background: `linear-gradient(to right, ${LABA_COLORS.primary} 0%, ${LABA_COLORS.primary} ${servingsPercent}%, #E2E8F0 ${servingsPercent}%, #E2E8F0 100%)`,
            }}
            className="w-full h-2.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
            <span>1 人 (0.35L)</span>
            <span>50 人 (大寮門檻)</span>
            <span>150 人</span>
            <span>300 人 (105L)</span>
          </div>
        </div>
      </div>

      {/* 控制項 2：以水量驅動 */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="water-liters-input"
            className="text-sm font-bold flex items-center gap-1.5"
            style={{ color: LABA_COLORS.text }}
          >
            <Droplets className="w-4 h-4" style={{ color: LABA_COLORS.data }} />
            <span>基準總水量 (W)</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="water-liters-input"
              type="number"
              min={0.35}
              max={105}
              step={0.35}
              value={isEditingWater ? waterInputText : waterVolumeLiters}
              onFocus={() => {
                setIsEditingWater(true);
                setWaterInputText(waterVolumeLiters);
              }}
              onBlur={() => {
                setIsEditingWater(false);
                const parsed = parseFloat(waterInputText);
                if (!Number.isNaN(parsed) && parsed > 0) {
                  handleWaterVolumeChange(parsed);
                } else {
                  setWaterInputText(waterVolumeLiters);
                }
              }}
              onChange={(e) => {
                setWaterInputText(e.target.value);
                const parsed = parseFloat(e.target.value);
                if (!Number.isNaN(parsed) && parsed > 0) {
                  handleWaterVolumeChange(parsed);
                }
              }}
              className="w-24 text-right font-extrabold text-base px-2.5 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2"
              style={{ color: LABA_COLORS.data }}
            />
            <span className="text-xs font-semibold text-slate-500">L (公升)</span>
          </div>
        </div>

        {/* 水量同步滑桿 */}
        <div className="w-full pt-1">
          <input
            id="water-slider"
            type="range"
            min={0.35}
            max={105}
            step={0.35}
            value={currentLitersNum}
            aria-label="水量調整滑桿"
            onChange={(e) => handleWaterVolumeChange(parseFloat(e.target.value))}
            style={{
              accentColor: LABA_COLORS.primary,
              background: `linear-gradient(to right, ${LABA_COLORS.primary} 0%, ${LABA_COLORS.primary} ${waterPercent}%, #E2E8F0 ${waterPercent}%, #E2E8F0 100%)`,
            }}
            className="w-full h-2.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
            <span>0.35 L</span>
            <span>3.50 L (10人)</span>
            <span>7.00 L (20人)</span>
            <span>105.00 L</span>
          </div>
        </div>
      </div>

      {/* 快速情境預設按鈕 */}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-500 mb-2">快速場景切換：</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {QUICK_PRESETS.map((preset) => {
            const isSelected = servings === preset.servings;
            return (
              <button
                key={preset.servings}
                type="button"
                onClick={() => setServings(preset.servings)}
                style={
                  isSelected
                    ? { backgroundColor: LABA_COLORS.primary, color: '#FFFFFF' }
                    : { backgroundColor: '#F1F5F9', color: LABA_COLORS.text }
                }
                className="px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:opacity-90 text-center"
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// 7.6 CategoryBadge (src/components/recipe-bom/CategoryBadge.tsx)
interface CategoryBadgeProps {
  category: IngredientCategory;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const meta = CATEGORY_META[category];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0"
      style={{
        color: meta.color,
        backgroundColor: meta.bgColor,
        borderColor: meta.borderColor,
      }}
    >
      {meta.label}
    </span>
  );
};

// 7.7 CopyLineButton (src/components/recipe-bom/CopyLineButton.tsx)
interface CopyLineButtonProps {
  servings: number;
  waterVolumeLiters: string;
  waterVolumeMl: number;
  unitMode: UnitMode;
  ingredients: CalculatedIngredient[];
  checkedItems: Record<string, boolean>;
}

const CopyLineButton: React.FC<CopyLineButtonProps> = ({
  servings,
  waterVolumeLiters,
  waterVolumeMl,
  unitMode,
  ingredients,
  checkedItems,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = formatLineText(servings, waterVolumeLiters, waterVolumeMl, unitMode, ingredients, checkedItems);
    const fallbackCopy = (str: string) => {
      const textarea = document.createElement('textarea');
      textarea.value = str;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        // ignore
      }
      document.body.removeChild(textarea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }, [servings, waterVolumeLiters, waterVolumeMl, unitMode, ingredients, checkedItems]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{ backgroundColor: LABA_COLORS.primary }}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          <span>已複製 LINE 採買清單！</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>一鍵複製 LINE 採買清單</span>
        </>
      )}
    </button>
  );
};

// 7.8 IngredientTable (src/components/recipe-bom/IngredientTable.tsx)
interface IngredientTableProps {
  ingredients: CalculatedIngredient[];
  unitMode: UnitMode;
  servings: number;
  waterVolumeLiters: string;
  waterVolumeMl: number;
}

const IngredientTable: React.FC<IngredientTableProps> = ({
  ingredients,
  unitMode,
  servings,
  waterVolumeLiters,
  waterVolumeMl,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | 'all'>('all');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const filteredIngredients = useMemo(() => {
    if (selectedCategory === 'all') return ingredients;
    return ingredients.filter((item) => item.category === selectedCategory);
  }, [ingredients, selectedCategory]);

  const toggleItemChecked = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <section
      aria-label="食材採買清單與前置說明 (BOM)"
      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4"
    >
      {/* 標題與複製按鈕 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold" style={{ color: LABA_COLORS.text }}>
              食材採買清單 (BOM)
            </h2>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: LABA_COLORS.primary }}
            >
              已備妥 {checkedCount} / {ingredients.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            點擊食材列可標記備料完成；切換上方單位按鈕可檢視「公制磅秤」或「家用量杯」
          </p>
        </div>

        <CopyLineButton
          servings={servings}
          waterVolumeLiters={waterVolumeLiters}
          waterVolumeMl={waterVolumeMl}
          unitMode={unitMode}
          ingredients={ingredients}
          checkedItems={checkedItems}
        />
      </div>

      {/* 分類篩選列 (#0EA5A4 分頁選中態) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {(
          [
            { key: 'all', label: '全部食材 (16)' },
            { key: 'staple', label: '主食雙米 (2)' },
            { key: 'fresh', label: '三寶時蔬 (2)' },
            { key: 'fried', label: '酥炸定型 (2)' },
            { key: 'braised', label: '煨滷軟料 (3)' },
            { key: 'seasoning', label: '爆香調味 (7)' },
          ] as const
        ).map((tab) => {
          const active = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedCategory(tab.key)}
              style={
                active
                  ? { backgroundColor: LABA_COLORS.tech, color: '#FFFFFF' }
                  : { backgroundColor: '#F1F5F9', color: LABA_COLORS.text }
              }
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 行動裝置 (< 640px)：單列卡片式滑動清單 (避免水平滾動條) */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {filteredIngredients.map((item) => {
          const isChecked = !!checkedItems[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggleItemChecked(item.id)}
              className={`rounded-xl border p-3.5 transition-all cursor-pointer ${
                isChecked ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                    style={{
                      backgroundColor: isChecked ? LABA_COLORS.primary : '#CBD5E1',
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div
                      className={`font-bold text-sm ${isChecked ? 'line-through opacity-60' : ''}`}
                      style={{ color: LABA_COLORS.text }}
                    >
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      基準係數 Ci = {item.displayRatio}
                    </div>
                  </div>
                </div>
                <CategoryBadge category={item.category} />
              </div>

              <div className="mt-2.5 flex items-baseline justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                <span className="text-xs text-slate-500">應備份量</span>
                <div className="text-right">
                  <span
                    className="text-base font-extrabold"
                    style={{ color: LABA_COLORS.data }}
                  >
                    {item.displayAmount}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {unitMode === 'metric'
                      ? `家用估算：${item.householdAmount}`
                      : `公制精算：${formatMetricAmount(item.unit, item.calculatedGrams)}`}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-700">前置工藝：</span>
                {item.prepInstruction}
              </p>
            </div>
          );
        })}
      </div>

      {/* 平板與桌面裝置 (≥ 640px)：響應式專業 BOM 表格 */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
              <th className="py-3 pl-3.5 pr-2 w-10">狀態</th>
              <th className="py-3 px-2.5">食材名稱 / 係數</th>
              <th className="py-3 px-2.5">分類</th>
              <th className="py-3 px-2.5 text-right">動態試算用量</th>
              <th className="py-3 pl-2.5 pr-3.5">前置處理規格與典座工藝說明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {filteredIngredients.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <tr
                  key={item.id}
                  onClick={() => toggleItemChecked(item.id)}
                  className={`transition-colors cursor-pointer ${
                    isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50/90'
                  }`}
                >
                  <td className="py-3 pl-3.5 pr-2 align-top">
                    <span
                      className="w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-xs mt-0.5"
                      style={{
                        backgroundColor: isChecked ? LABA_COLORS.primary : '#CBD5E1',
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </td>
                  <td className="py-3 px-2.5 align-top">
                    <div
                      className={`font-bold ${isChecked ? 'line-through opacity-60' : ''}`}
                      style={{ color: LABA_COLORS.text }}
                    >
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Ci: {item.displayRatio}
                    </div>
                  </td>
                  <td className="py-3 px-2.5 align-top">
                    <CategoryBadge category={item.category} />
                  </td>
                  <td className="py-3 px-2.5 align-top text-right whitespace-nowrap">
                    <div
                      className="font-extrabold text-sm sm:text-base"
                      style={{ color: LABA_COLORS.data }}
                    >
                      {item.displayAmount}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {unitMode === 'metric'
                        ? item.householdAmount
                        : formatMetricAmount(item.unit, item.calculatedGrams)}
                    </div>
                  </td>
                  <td className="py-3 pl-2.5 pr-3.5 align-top text-xs text-slate-600 leading-relaxed max-w-xs">
                    {item.prepInstruction}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// 7.9 StepCard (src/components/cooking-sop/StepCard.tsx)
interface StepCardProps {
  step: SopStepNode;
  waterVolumeMl: number;
  isLargeBatch: boolean;
  isCompleted: boolean;
  onToggleCompleted: (stepIndex: number) => void;
  onStartTimer: (step: SopStepNode) => void;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  waterVolumeMl,
  isLargeBatch,
  isCompleted,
  onToggleCompleted,
  onStartTimer,
}) => {
  const [showMasterNote, setShowMasterNote] = useState<boolean>(true);

  const dynamicActionDetail = useMemo(() => {
    if (step.stepIndex === 1) {
      return `滾水 ${waterVolumeMl.toLocaleString()} ml 於主鍋煮沸。平底鍋下油爆香薑泥，入生米翻炒至吸油冒熱氣，趁熱沖入滾水鍋，同時下炸紅蘿蔔丁。`;
    }
    if (step.stepIndex === 6 && isLargeBatch) {
      return `蓋緊鍋蓋，離火靜置燜透 10~15 分鐘（大鍋蓄熱燜釀）。開蓋後質地稠潤、油水完全交融，即可盛碗。`;
    }
    return step.actionDetail;
  }, [step, waterVolumeMl, isLargeBatch]);

  return (
    <div className="relative pl-7 pb-5 last:pb-0">
      {/* 時間軸垂直導線 */}
      {step.stepIndex < 6 && (
        <div
          className="absolute left-[11px] top-6 bottom-0 w-0.5"
          style={{
            backgroundColor: isCompleted ? LABA_COLORS.primary : 'rgba(14, 165, 164, 0.35)',
          }}
        />
      )}

      {/* 時間軸步驟節點 (#0EA5A4) */}
      <button
        type="button"
        onClick={() => onToggleCompleted(step.stepIndex)}
        title="點擊切換完成狀態"
        className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform hover:scale-110"
        style={{
          backgroundColor: isCompleted ? LABA_COLORS.primary : LABA_COLORS.tech,
        }}
      >
        {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.stepIndex}
      </button>

      {/* 卡片本體 */}
      <div
        className={`rounded-xl border p-3.5 transition-all ${
          isCompleted
            ? 'bg-emerald-50/40 border-emerald-200'
            : 'bg-slate-50/70 border-slate-200 hover:border-teal-300'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-extrabold px-2 py-0.5 rounded-md text-white"
              style={{ backgroundColor: LABA_COLORS.tech }}
            >
              {step.phaseCode}・{step.timeLabel}
            </span>
            <h3
              className={`text-sm font-bold ${isCompleted ? 'line-through opacity-65' : ''}`}
              style={{ color: LABA_COLORS.text }}
            >
              {step.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {isCompleted && (
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: LABA_COLORS.primary }}
              >
                已完成
              </span>
            )}
            <button
              type="button"
              onClick={() => onStartTimer(step)}
              style={{ backgroundColor: LABA_COLORS.primary }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-xs font-semibold shadow-sm hover:opacity-95 transition"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>計時</span>
            </button>
          </div>
        </div>

        {/* 步驟說明 */}
        <p className="mt-2 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
          {dynamicActionDetail}
        </p>

        {/* 涉及食材標籤 */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {step.targetIngredients.map((ingName) => (
            <span
              key={ingName}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600"
            >
              {ingName}
            </span>
          ))}
        </div>

        {/* 星雲大師典座心法要點 Tooltip / 摺疊區 */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/70">
          <button
            type="button"
            onClick={() => setShowMasterNote((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-bold"
            style={{ color: LABA_COLORS.tech }}
          >
            <Sparkles className="w-3 h-3" />
            <span>星雲大師典座心法要點</span>
            <ChevronRight
              className={`w-3 h-3 transition-transform ${showMasterNote ? 'rotate-90' : ''}`}
            />
          </button>
          {showMasterNote && (
            <blockquote className="mt-1.5 text-xs text-slate-600 bg-white/90 rounded-lg p-2.5 border-l-4 italic"
              style={{ borderLeftColor: LABA_COLORS.tech }}
            >
              「{step.grandMasterNote}」
            </blockquote>
          )}
        </div>
      </div>
    </div>
  );
};

// 7.10 SopTimeline (src/components/cooking-sop/SopTimeline.tsx)
interface SopTimelineProps {
  waterVolumeMl: number;
  isLargeBatch: boolean;
  completedSteps: Record<number, boolean>;
  onToggleCompleted: (stepIndex: number) => void;
  onStartStepTimer: (step: SopStepNode) => void;
}

const SopTimeline: React.FC<SopTimelineProps> = ({
  waterVolumeMl,
  isLargeBatch,
  completedSteps,
  onToggleCompleted,
  onStartStepTimer,
}) => {
  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <section
      aria-label="25 分鐘 6 階段工藝時序與倒數計時器 (SOP)"
      className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5" style={{ color: LABA_COLORS.tech }} />
            <h2 className="text-base sm:text-lg font-bold" style={{ color: LABA_COLORS.text }}>
              25 分鐘 6 階段工藝時序 (SOP)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            油米相融、先炸後煮、入口即化、燜透醞釀
          </p>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
          style={{ backgroundColor: LABA_COLORS.tech }}
        >
          進度 {completedCount}/7
        </span>
      </div>

      {/* 階段清單 */}
      <div className="pt-1">
        {SOP_STEPS.map((step) => (
          <StepCard
            key={step.stepIndex}
            step={step}
            waterVolumeMl={waterVolumeMl}
            isLargeBatch={isLargeBatch}
            isCompleted={!!completedSteps[step.stepIndex]}
            onToggleCompleted={onToggleCompleted}
            onStartTimer={onStartStepTimer}
          />
        ))}
      </div>
    </section>
  );
};

// 7.11 CookingTimerModal (src/components/cooking-sop/CookingTimerModal.tsx)
interface CookingTimerModalProps {
  activeStep: SopStepNode | null;
  remainingSec: number;
  totalSec: number;
  isRunning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onClose: () => void;
  onMarkStepComplete: (stepIndex: number) => void;
}

const CookingTimerModal: React.FC<CookingTimerModalProps> = ({
  activeStep,
  remainingSec,
  totalSec,
  isRunning,
  soundEnabled,
  onToggleSound,
  onToggleRunning,
  onReset,
  onClose,
  onMarkStepComplete,
}) => {
  if (!activeStep) return null;

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSec > 0 ? (totalSec - remainingSec) / totalSec : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timer-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: LABA_COLORS.tech }}
            >
              {activeStep.phaseCode} ({activeStep.timeLabel})
            </span>
            <h3
              id="timer-modal-title"
              className="text-lg font-extrabold mt-1.5"
              style={{ color: LABA_COLORS.text }}
            >
              {activeStep.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleSound}
              aria-label="切換提示音"
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉計時器視窗"
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 圓形倒數進度環 (#0EA5A4) */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r={radius}
                stroke="#E2E8F0"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="90"
                cy="90"
                r={radius}
                stroke={remainingSec === 0 ? LABA_COLORS.primary : LABA_COLORS.tech}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="none"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-slate-400">剩餘時間</span>
              <span
                className="text-4xl font-black tracking-tight font-mono mt-0.5"
                style={{ color: LABA_COLORS.data }}
              >
                {formattedTime}
              </span>
              <span className="text-[11px] font-medium text-slate-500 mt-1">
                {remainingSec === 0 ? '時間到！請進行下一步' : isRunning ? '計時進行中...' : '已暫停 / 待啟動'}
              </span>
            </div>
          </div>
        </div>

        {/* 動作與心法提示 */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {activeStep.actionDetail}
          </p>
          <p className="text-xs italic font-medium" style={{ color: LABA_COLORS.tech }}>
            💡 典座心法：「{activeStep.grandMasterNote}」
          </p>
        </div>

        {/* 控制按鈕列 */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleRunning}
            style={{ backgroundColor: LABA_COLORS.primary }}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-95 transition"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>暫停計時</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{remainingSec === 0 ? '重新開始' : '啟動倒數'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm inline-flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onMarkStepComplete(activeStep.stepIndex);
              onClose();
            }}
            style={{ backgroundColor: LABA_COLORS.primary }}
            className="px-4 py-3 rounded-xl text-white font-bold text-sm inline-flex items-center gap-1.5 shadow-sm hover:opacity-95 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>完成此步</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 8. Main App Entry (src/App.tsx)
// ==========================================
export default function App() {
  const {
    servings,
    setServings,
    waterVolumeMl,
    waterVolumeLiters,
    handleWaterVolumeChange,
    unitMode,
    setUnitMode,
    ingredients,
    summaryMetrics,
    isLargeBatch,
  } = useLabaCalculator(10);

  const {
    activeStep,
    remainingSec,
    totalSec,
    isRunning,
    completedSteps,
    soundEnabled,
    setSoundEnabled,
    openStepTimer,
    closeStepTimer,
    toggleRunning,
    resetTimer,
    toggleStepCompleted,
  } = useStepTimer();

  const [showTheoryModal, setShowTheoryModal] = useState<boolean>(false);

  return (
    <div
      className="min-h-screen flex flex-col font-sans antialiased"
      style={{ backgroundColor: LABA_COLORS.surface, color: LABA_COLORS.text }}
    >
      {/* 頂部導覽列 */}
      <Header
        unitMode={unitMode}
        onUnitChange={setUnitMode}
        onOpenTheoryModal={() => setShowTheoryModal(true)}
      />

      {/* 主內容容器：RWD 三斷點響應式排版
          - Mobile (< 640px): 單欄縱向堆疊
          - Tablet (640px ~ 1024px): md:grid-cols-12 雙欄流式版面 (左5 / 右7)
          - Desktop (> 1024px): lg:grid-cols-12 三欄式儀表板 (左3 / 中5 / 右4)
      */}
      <main className="ds-container flex-1">
        <div className="laba-grid">
          {/* 左側欄：雙向連動控制盤 + 大鍋警示 + 數據統計卡 */}
          <div className="laba-control space-y-4">
            <DualControlPanel
              servings={servings}
              setServings={setServings}
              waterVolumeMl={waterVolumeMl}
              waterVolumeLiters={waterVolumeLiters}
              handleWaterVolumeChange={handleWaterVolumeChange}
            />

            <LargeBatchBanner servings={servings} isLargeBatch={isLargeBatch} />

            <MetricSummaryCards
              servings={servings}
              waterVolumeMl={waterVolumeMl}
              waterVolumeLiters={waterVolumeLiters}
              totalRawRiceGrams={summaryMetrics.totalRawRiceGrams}
              ponlaiGrams={summaryMetrics.ponlaiGrams}
              glutinousGrams={summaryMetrics.glutinousGrams}
              totalSolidGrams={summaryMetrics.totalSolidGrams}
            />
          </div>

          {/* 中央欄：食材採買清單 (BOM) */}
          <div className="laba-bom">
            <IngredientTable
              ingredients={ingredients}
              unitMode={unitMode}
              servings={servings}
              waterVolumeLiters={waterVolumeLiters}
              waterVolumeMl={waterVolumeMl}
            />
          </div>

          {/* 右側欄：25 分鐘 6 階段工藝時序與倒數計時器 (SOP) */}
          <div className="laba-sop">
            <SopTimeline
              waterVolumeMl={waterVolumeMl}
              isLargeBatch={isLargeBatch}
              completedSteps={completedSteps}
              onToggleCompleted={toggleStepCompleted}
              onStartStepTimer={(step) => openStepTimer(step, isLargeBatch)}
            />
          </div>
        </div>
      </main>

      {/* 頁尾資訊 */}
      <footer className="platform-footer">
        <div className="platform-footer-inner">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: LABA_COLORS.primary }}
            />
            <span>
              <strong>sdgs-laba-calculator</strong>・臘八粥食材試算表 (SRS v1.1.0 Approved)
            </span>
          </div>
          <div>
            核心理論相依：佛光山正統典座烹飪心法、星雲大師臘八粥講習規約
          </div>
        </div>
      </footer>

      {/* 階段倒數計時器彈窗 */}
      <CookingTimerModal
        activeStep={activeStep}
        remainingSec={remainingSec}
        totalSec={totalSec}
        isRunning={isRunning}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onToggleRunning={toggleRunning}
        onReset={resetTimer}
        onClose={closeStepTimer}
        onMarkStepComplete={(idx) => {
          if (!completedSteps[idx]) {
            toggleStepCompleted(idx);
          }
        }}
      />

      {/* 典座心法與數學模型說明彈窗 */}
      {showTheoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="theory-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" style={{ color: LABA_COLORS.primary }} />
                <h3
                  id="theory-modal-title"
                  className="text-lg font-extrabold"
                  style={{ color: LABA_COLORS.text }}
                >
                  佛光山典座四大工藝與量化數學模型
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTheoryModal(false)}
                aria-label="關閉理論說明視窗"
                className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">
                  1. 雙向線性動態縮放模型 (Calculation Engine)
                </div>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    單人份熟粥成品體積：<strong style={{ color: LABA_COLORS.data }}>Vserving = 350 ml</strong>（約 390cc 湯碗 9 分滿）
                  </li>
                  <li>
                    以人數驅動：<strong style={{ color: LABA_COLORS.data }}>Wml = N × 350 ml</strong>
                  </li>
                  <li>
                    以水量驅動：<strong style={{ color: LABA_COLORS.data }}>N = Round((Wliter × 1000) / 350)</strong>，反向精算 Wml = N × 350 ml
                  </li>
                  <li>
                    食材用量推導公式：<strong style={{ color: LABA_COLORS.data }}>Mi = Wml × Ci</strong>（Ci 為各食材基準係數）
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="font-bold" style={{ color: LABA_COLORS.primary }}>
                    ① 油米相融
                  </div>
                  <p className="text-xs mt-1">
                    生米入鍋前以熱油與薑泥翻炒至吃油散開，沖入滾水後粥面絕不泛浮油。
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="font-bold" style={{ color: LABA_COLORS.tech }}>
                    ② 先炸後煮
                  </div>
                  <p className="text-xs mt-1">
                    芋頭丁、紅蘿蔔丁與油豆腐丁皆先過油微炸定型，久煮易爛卻不碎糊。
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="font-bold" style={{ color: LABA_COLORS.nature }}>
                    ③ 入口即化
                  </div>
                  <p className="text-xs mt-1">
                    花生與蓮子預先蒸煮軟爛，再以醬油、油膏煨滷至收汁，五味調和百味香。
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200">
                  <div className="font-bold" style={{ color: LABA_COLORS.data }}>
                    ④ 燜透醞釀
                  </div>
                  <p className="text-xs mt-1">
                    起鍋前落翠綠青江菜葉並熄火，蓋鍋靜置燜透 5 分鐘（大鍋 10~15 分鐘），達到水米不分的圓融境界。
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTheoryModal(false)}
                style={{ backgroundColor: LABA_COLORS.primary }}
                className="px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-95 transition"
              >
                了解並返回試算表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
