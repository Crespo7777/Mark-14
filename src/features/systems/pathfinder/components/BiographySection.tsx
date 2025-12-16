import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  ScrollText, 
  Heart, 
  Shield, 
  Flag, 
  Languages, 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  Crown, 
  BookOpen, 
  Scale 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const BiographySection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register } = useFormContext();

  // Componente de Campo Estilizado (Underlined Style)
  const BioField = ({ label, name, icon: Icon, placeholder }: any) => (
    <div className="space-y-1 group">
      <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider group-hover:text-primary transition-colors">
        {Icon && <Icon className="w-3 h-3 opacity-70" />}
        {label}
      </Label>
      <Input 
        {...register(name)} 
        placeholder={placeholder}
        className="h-8 border-b border-t-0 border-x-0 rounded-none bg-transparent px-0 focus-visible:ring-0 border-muted-foreground/20 focus:border-primary font-medium text-sm transition-all placeholder:text-muted-foreground/30" 
        readOnly={isReadOnly}
      />
    </div>
  );

  // Componente de Stat Pequeno (Caixa)
  const StatBox = ({ label, name, suffix = "" }: any) => (
    <div className="bg-muted/10 border border-border/40 rounded-lg p-2 flex flex-col items-center justify-center hover:bg-muted/20 transition-colors">
        <span className="text-[9px] uppercase font-bold text-muted-foreground mb-1">{label}</span>
        <div className="flex items-baseline gap-1">
            <Input 
                {...register(name)} 
                className="h-6 w-16 text-center bg-transparent border-none p-0 text-sm font-bold shadow-none focus-visible:ring-0" 
                placeholder="-"
                readOnly={isReadOnly}
            />
            {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
        </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-10">
      
      {/* 1. CARTÃO DE IDENTIDADE (HERO SECTION) */}
      <Card className="border-t-4 border-t-primary shadow-sm bg-gradient-to-br from-card to-accent/5">
         <CardHeader className="pb-2 border-b border-border/10">
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase text-primary tracking-widest">
               <User className="w-4 h-4"/> Identidade & Origem
            </CardTitle>
         </CardHeader>
         <CardContent className="p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                 <BioField label="Nome Real / Alias" name="player_name" icon={User} />
                 <BioField label="Ancestralidade" name="ancestry" icon={User} />
                 <BioField label="Herança" name="heritage" icon={Crown} />
                 
                 <BioField label="Background (Antecedente)" name="background" icon={BookOpen} />
                 <BioField label="Divindade" name="deity" icon={Shield} />
                 <BioField label="Alinhamento" name="alignment" icon={Scale} />
                 
                 <BioField label="Local de Nascimento" name="details.birthplace" icon={MapPin} />
                 <BioField label="Etnia" name="details.ethnicity" icon={Flag} />
                 <BioField label="Nacionalidade" name="details.nationality" icon={Flag} />
             </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 2. DADOS FÍSICOS (Coluna Esquerda - Menor) */}
          <div className="lg:col-span-4 space-y-6">
              <Card className="h-full border-l-4 border-l-blue-500/50">
                 <CardHeader className="pb-2 border-b border-border/10 bg-blue-50/5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase text-muted-foreground">
                       <Eye className="w-4 h-4 text-blue-500"/> Fisiologia
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 space-y-4">
                     {/* Stats Grid */}
                     <div className="grid grid-cols-2 gap-2">
                         <StatBox label="Idade" name="details.age" suffix="anos" />
                         <StatBox label="Altura" name="details.height" />
                         <StatBox label="Peso" name="details.weight" />
                         <StatBox label="Gênero" name="details.gender" />
                     </div>
                     
                     <Separator />
                     
                     <div className="space-y-3">
                         <BioField label="Pronomes" name="details.pronouns" />
                         <div className="space-y-1">
                             <Label className="text-[10px] font-bold uppercase text-muted-foreground">Descrição Visual</Label>
                             <Textarea 
                                {...register("details.appearance")} 
                                className="min-h-[120px] bg-muted/10 border-muted resize-none text-xs leading-relaxed focus:bg-background transition-colors" 
                                placeholder="Cabelos, olhos, cicatrizes, vestuário..."
                                readOnly={isReadOnly}
                             />
                         </div>
                     </div>
                 </CardContent>
              </Card>
          </div>

          {/* 3. PSICOLOGIA (Coluna Direita - Maior) */}
          <div className="lg:col-span-8 space-y-6">
              <Card className="h-full border-l-4 border-l-purple-500/50">
                 <CardHeader className="pb-2 border-b border-border/10 bg-purple-50/5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase text-muted-foreground">
                       <Heart className="w-4 h-4 text-purple-500"/> Perfil Psicológico
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <BioField label="Atitude Padrão" name="details.attitude" icon={User} placeholder="Ex: Cauteloso, Otimista..." />
                        <BioField label="Crenças / Código" name="details.beliefs" icon={Shield} placeholder="Ex: Proteger os fracos..." />
                     </div>
                     
                     {/* LIKES & DISLIKES (REVISADO - PREMIUM) */}
                     <div className="bg-muted/5 rounded-xl border border-border/40 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                            {/* Likes */}
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-bold uppercase text-emerald-600 flex items-center gap-2 tracking-widest group-hover:text-emerald-500 transition-colors">
                                    <ThumbsUp className="w-3.5 h-3.5"/> Gostos & Motivações
                                </Label>
                                <Input 
                                    {...register("details.likes")} 
                                    className="h-9 border-b-2 border-t-0 border-x-0 rounded-none bg-transparent px-0 border-emerald-200 focus:border-emerald-500 focus-visible:ring-0 text-sm font-medium placeholder:text-emerald-900/20" 
                                    placeholder="O que o personagem ama..." 
                                    readOnly={isReadOnly}
                                />
                            </div>

                            {/* Divisor Vertical (Apenas Desktop) */}
                            <div className="hidden md:block absolute left-1/2 top-1 bottom-1 w-px bg-border/40 -translate-x-1/2" />

                            {/* Dislikes */}
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-bold uppercase text-red-600 flex items-center gap-2 tracking-widest group-hover:text-red-500 transition-colors">
                                    <ThumbsDown className="w-3.5 h-3.5"/> Desgostos & Aversões
                                </Label>
                                <Input 
                                    {...register("details.dislikes")} 
                                    className="h-9 border-b-2 border-t-0 border-x-0 rounded-none bg-transparent px-0 border-red-200 focus:border-red-500 focus-visible:ring-0 text-sm font-medium placeholder:text-red-900/20" 
                                    placeholder="O que o personagem odeia..." 
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                             Traços de Personalidade & Manias
                         </Label>
                         <Textarea 
                            {...register("details.personality")} 
                            className="min-h-[100px] bg-muted/10 border-muted resize-none text-sm leading-relaxed focus:bg-background transition-colors shadow-sm" 
                            placeholder="Descreva a personalidade profundamente..."
                            readOnly={isReadOnly}
                         />
                     </div>
                 </CardContent>
              </Card>
          </div>
      </div>

      {/* 4. DIÁRIO E IDIOMAS */}
      <Card className="bg-card shadow-sm border-t-4 border-t-yellow-600/50">
         <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
             
             {/* Idiomas */}
             <div className="p-6 md:col-span-1 bg-yellow-50/5 space-y-4">
                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                    <Languages className="w-4 h-4"/>
                    <span className="text-xs font-bold uppercase tracking-wider">Idiomas Conhecidos</span>
                </div>
                <Textarea 
                    {...register("details.languages")} 
                    className="min-h-[180px] h-full border-yellow-200/30 bg-background/50 text-sm resize-none focus:border-yellow-400/50" 
                    placeholder="Listar idiomas..."
                    readOnly={isReadOnly}
                />
             </div>

             {/* Notas de Campanha */}
             <div className="p-6 md:col-span-2 space-y-4">
                 <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <ScrollText className="w-4 h-4"/>
                    <span className="text-xs font-bold uppercase tracking-wider">Biografia Completa & Notas de Campanha</span>
                 </div>
                 <Textarea 
                    {...register("notes")} 
                    className="min-h-[200px] bg-muted/5 border-dashed border-muted-foreground/20 font-serif text-sm leading-relaxed p-4 shadow-inner focus:border-primary/30 focus:bg-background transition-all" 
                    placeholder="Escreva a história do seu personagem, anotações de sessão e segredos aqui..."
                    readOnly={isReadOnly}
                 />
             </div>
         </CardContent>
      </Card>
    </div>
  );
};