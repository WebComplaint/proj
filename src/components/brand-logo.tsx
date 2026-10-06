/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Desenha a logo do Web Complaint com o nome do projeto ao lado.
 * Aparece no topo das telas publicas e do painel.
 *
 * Para a apresentacao: pode pular, e um elemento visual.
 */

import Image from "next/image";
import { cn } from "@/lib/cn";

type BrandLogoProps = {
  className?: string;
  showText?: boolean;
};

// BLOCO UNICO - A logo com o nome do projeto ao lado.
// A imagem tem texto alternativo ("Logo do Web Complaint") para quem usa
// leitor de tela, e o "priority" pede ao navegador que a carregue primeiro,
// por ser a primeira coisa visivel no topo da pagina.
export function BrandLogo({ className, showText = true }: BrandLogoProps) {
  return (
    <div className={cn("flex min-h-11 items-center gap-3", className)}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base shadow-neuro-inset">
        <Image
          alt="Logo do Web Complaint"
          className="h-10 w-10 object-contain"
          height={40}
          priority
          src="/img/logo.svg"
          unoptimized
          width={40}
        />
      </span>
      {showText && (
        <span>
          <span className="block font-heading text-lg font-bold leading-6 text-text-primary">Web Complaint</span>
          <span className="block text-xs font-semibold leading-4 text-text-secondary">Canal seguro da escola</span>
        </span>
      )}
    </div>
  );
}
