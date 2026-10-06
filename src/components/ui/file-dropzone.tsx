"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a area de anexos, onde a pessoa arrasta arquivos ou toca para escolher
 * no celular.
 *
 * Os dois caminhos existem de proposito: arrastar funciona bem no
 * computador, mas nao existe no celular, onde a maioria dos alunos vai usar
 * o sistema.
 *
 * Para a apresentacao: e a entrada de provas da denuncia.
 */

import type { InputHTMLAttributes } from "react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";

type FileDropzoneProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  files?: Array<{ name: string; size: string }>;
  error?: string;
};

export function FileDropzone({ label, files = [], error, className, id, ...props }: FileDropzoneProps) {
  // BLOCO 1 - Cria um identificador unico para ligar o titulo ao campo.
  const generatedId = useId();
  const inputId = id ?? generatedId;

  // Guarda se ha um arquivo sendo arrastado por cima da area agora.
  const [dragging, setDragging] = useState(false);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-text-secondary" htmlFor={inputId}>
        {label}
      </label>
      <div
        className={cn(
          "rounded-calm border border-dashed border-ocean-600/35 bg-base p-5 text-center shadow-neuro-inset transition-[border-color,box-shadow] duration-200 ease-calm",
          dragging && "border-turquoise-500 shadow-neuro-sm",
          error && "border-danger-600",
          className
        )}
        // BLOCO 2 - Reacoes ao arrastar um arquivo.
        // Entrou na area: destaca a borda. Saiu: volta ao normal.
        // O preventDefault no onDragOver e obrigatorio: sem ele, o navegador
        // abriria o arquivo em vez de deixar a pagina recebe-lo.
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => setDragging(false)}
      >
        {/* BLOCO 3 - O campo de arquivo de verdade fica escondido.
            O "sr-only" o esconde dos olhos mas o mantem para leitores de tela
            e para o teclado. O visual bonito e desenhado em volta dele, sem
            perder a acessibilidade do campo original do navegador. */}
        <input id={inputId} type="file" className="sr-only" aria-invalid={Boolean(error)} {...props} />
        <p className="font-bold text-text-primary">Arraste arquivos aqui</p>
        <p className="mt-1 text-sm text-text-secondary">ou toque para selecionar no dispositivo</p>
        {/* O botao "Selecionar arquivo" existe porque arrastar nao funciona
            no celular, onde a maioria dos alunos vai usar o sistema. Os dois
            caminhos levam ao mesmo campo escondido acima. */}
        <label className="btn-secondary mt-4 inline-flex cursor-pointer items-center justify-center px-4 py-3" htmlFor={inputId}>
          Selecionar arquivo
        </label>
      </div>
      {files.length > 0 && (
        <ul className="grid gap-2">
          {files.map((file) => (
            <li key={file.name} className="surface-neuro-sm flex items-center justify-between gap-3 px-4 py-3">
              <span className="truncate text-sm font-bold">{file.name}</span>
              <span className="text-sm text-text-secondary">{file.size}</span>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm leading-5 text-danger-600">{error}</p>}
    </div>
  );
}
