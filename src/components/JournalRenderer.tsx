import { cn } from "@/lib/utils";

interface JournalRendererProps {
  content: string;
  className?: string;
}

export function JournalRenderer({ content, className }: JournalRendererProps) {
  if (!content) return null;

  return (
    <div 
      className={cn(
        // Classes base do Tailwind Typography (prose)
        "prose prose-neutral dark:prose-invert max-w-none",
        
        // Estilização de Cabeçalhos
        "prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
        
        // Estilização de Texto e Parágrafos
        "prose-p:leading-relaxed prose-p:text-muted-foreground",
        "prose-strong:text-foreground",
        
        // Estilização de Links
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
        
        // Estilização de Listas
        "prose-li:marker:text-primary/50",
        
        // Estilização de Citações (Blockquotes)
        "prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:rounded-r-sm",
        
        // Estilização de Imagens
        "prose-img:rounded-md prose-img:border prose-img:border-border prose-img:shadow-md",
        
        // Estilização de Código
        "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
        
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  );
}