export type UnitMode = 'metric' | 'household';

export type IngredientCategory = 'staple' | 'fresh' | 'fried' | 'braised' | 'seasoning';

export interface IngredientBaseline {
  id: string;
  name: string;
  category: IngredientCategory;
  ratio: number;
  displayRatio: string;
  base10Amount: number;
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
