export interface AbilityScore {
  score: number;
  modifier: number;
}

export interface Skill {
  name: string;
  attribute: string;
  proficiency: 'U' | 'T' | 'E' | 'M' | 'L';
  item: number;
  armor: number;
  misc: number;
}

export interface Feat {
  id: string;
  name: string;
  type: 'Ancestry' | 'Class' | 'General' | 'Skill' | 'Bonus';
  level: number;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  bulk: string;
  description?: string;
}

export interface CharacterData {
  name: string;
  level: number;
  class: string;
  ancestry: string;
  heritage: string;
  background: string;
  deity: string;
  alignment: string;
  size: string;
  playerName: string;
  xp: number;
  heroPoints: number;
  speed: number;
  
  // Atributos
  abilities: {
    str: AbilityScore;
    dex: AbilityScore;
    con: AbilityScore;
    int: AbilityScore;
    wis: AbilityScore;
    cha: AbilityScore;
  };

  // Defesa
  hp: { current: number; max: number; temp: number; dying: number; wounded: number };
  ac: { value: number; item: number; shield: number; misc: number; cap: number };
  saves: {
    fortitude: { proficiency: string; misc: number };
    reflex: { proficiency: string; misc: number };
    will: { proficiency: string; misc: number };
  };

  // Perícias
  skills: Record<string, Skill>;
  
  // Dados Novos
  money: { cp: number; sp: number; gp: number; pp: number };
  feats: Feat[];
  inventory: Item[];
  
  // Bio Detalhada
  appearance: string;
  personality: string;
  attitude: string;
  beliefs: string;
  likes: string;
  dislikes: string;
  catchphrases: string;
  ethnicity: string;
  nationality: string;
  birthplace: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
}