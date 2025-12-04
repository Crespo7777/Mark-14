export interface GameCard {
  id: string;
  room_id: string;
  front_image: string;
  back_image: string;
  label?: string;
  position_x: number;
  position_y: number;
  is_face_up: boolean;
  is_tapped: boolean; // Novo: Para virar 90 graus
  scale: number;
  z_index: number;
  owner_id?: string | null;
}