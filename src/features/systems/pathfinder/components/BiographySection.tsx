import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, User, Heart, MessageSquare } from "lucide-react";

export const BiographySection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register } = useFormContext();

  const BioBlock = ({ label, name, icon: Icon, placeholder, height = "h-20" }: any) => (
    <div className="space-y-1">
        <Label className="text-xs flex items-center gap-1 text-muted-foreground font-bold uppercase tracking-wider">
            {Icon && <Icon className="w-3 h-3" />} {label}
        </Label>
        <Textarea 
            {...register(name)} 
            placeholder={placeholder} 
            className={`${height} bg-muted/20 border-transparent resize-none`} 
            readOnly={isReadOnly}
        />
    </div>
  );

  return (
    <div className="space-y-6">
        {/* Dados Físicos */}
        <Card>
            <CardHeader className="p-4 pb-2 border-b"><CardTitle className="text-base font-bold flex items-center gap-2"><User className="w-4 h-4"/> Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Idade</Label><Input {...register("details.age")} className="h-8 bg-muted/10" readOnly={isReadOnly}/></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Gênero</Label><Input {...register("details.gender")} className="h-8 bg-muted/10" readOnly={isReadOnly}/></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Pronomes</Label><Input {...register("details.pronouns")} className="h-8 bg-muted/10" readOnly={isReadOnly}/></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Altura</Label><Input {...register("details.height")} className="h-8 bg-muted/10" readOnly={isReadOnly}/></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Peso</Label><Input {...register("details.weight")} className="h-8 bg-muted/10" readOnly={isReadOnly}/></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Etnia</Label><Input {...register("details.ethnicity")} className="h-8 bg-muted/10" readOnly={isReadOnly}/></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Nacionalidade</Label><Input {...register("details.nationality")} className="h-8 bg-muted/10" readOnly={isReadOnly}/></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Local Nasc.</Label><Input {...register("details.birthplace")} className="h-8 bg-muted/10" readOnly={isReadOnly}/></div>
            </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
            <CardContent className="p-4">
                <BioBlock label="Aparência Física" name="details.appearance" icon={ScrollText} placeholder="Descreva a aparência física do personagem..." height="h-28" />
            </CardContent>
        </Card>

        {/* Personalidade Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardContent className="p-4 space-y-4">
                    <BioBlock label="Personalidade" name="details.personality" icon={User} placeholder="Como seu personagem se comporta..." />
                    <BioBlock label="Atitude" name="details.attitude" icon={User} placeholder="Atitude geral..." />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 space-y-4">
                    <BioBlock label="Crenças" name="details.beliefs" icon={Heart} placeholder="Valores e crenças..." />
                    <div className="grid grid-cols-2 gap-2">
                        <BioBlock label="Gostos" name="details.likes" placeholder="..." height="h-16"/>
                        <BioBlock label="Desgostos" name="details.dislikes" placeholder="..." height="h-16"/>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
};