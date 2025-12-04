export interface ReferenceCard {
  id: string;
  title: string;
  description: string;
  type: 'moon' | 'sun' | 'general';
}

export interface RulePreset {
  id: string;
  name: string;
  description: string;
  rules_content: string;
  cards_data: ReferenceCard[]; // ou any[] se o formato variar
  created_at?: string;
}