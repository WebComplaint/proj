"use client";

/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Mostra o protocolo depois do envio e permite baixar um comprovante em
 * texto.
 *
 * Repare na terceira linha da funcao: logo apos ler o protocolo, o codigo o
 * APAGA da memoria da aba. Isso e proposital. Se a pessoa atualizar a
 * pagina ou voltar depois, o protocolo nao aparece mais.
 *
 * Pode parecer inconveniente, mas e uma escolha de seguranca: em um
 * computador compartilhado, como o da biblioteca da escola, o proximo
 * usuario nao encontra o protocolo de quem denunciou antes.
 *
 * Para a apresentacao: e um bom exemplo de privacidade pensada no detalhe.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { NeuButton, NeuCard, ProtocoloCard } from "@/components/ui";

export function ConfirmacaoDenuncia() {
  // BLOCO 1 - Guarda o protocolo que sera exibido na tela.
  const [protocolo, setProtocolo] = useState<string | null>(null);
  // Se a pessoa se identificou, o servidor enviou um link para confirmar o
  // e-mail. Este aviso explica que, sem confirmar, nenhum aviso chega.
  const [verificacaoEnviada, setVerificacaoEnviada] = useState(false);

  // BLOCO 2 - Assim que a tela abre, faz tres coisas em sequencia:
  //   1. le o protocolo deixado pela tela anterior;
  //   2. coloca-o na tela;
  //   3. APAGA-O da memoria da aba.
  //
  // O passo 3 e o mais importante e o mais contraintuitivo. Se a pessoa
  // atualizar a pagina, o protocolo nao volta a aparecer.
  // Por que fazer isso? Pense no computador da biblioteca da escola: sem esse
  // cuidado, o proximo aluno a usar aquela maquina poderia dar dois passos
  // para tras no navegador e encontrar o protocolo de quem denunciou antes.
  useEffect(() => {
    const storedProtocol = sessionStorage.getItem("ultimoProtocoloDenuncia");
    setProtocolo(storedProtocol);
    setVerificacaoEnviada(sessionStorage.getItem("ultimaDenunciaVerificacaoEnviada") === "1");
    sessionStorage.removeItem("ultimoProtocoloDenuncia");
    sessionStorage.removeItem("ultimaDenunciaVerificacaoEnviada");
  }, []);

  // BLOCO 3 - Botao "Baixar comprovante".
  // Monta um arquivo de texto na hora, dentro do proprio navegador, e faz o
  // download comecar. Nada e enviado ao servidor neste processo: o comprovante
  // nasce e fica no computador da pessoa.
  function downloadReceipt() {
    if (!protocolo) {
      return;
    }

    const content = [
      "Comprovante de denúncia escolar",
      "",
      `Protocolo: ${protocolo}`,
      "Guarde este código. Ele é a única forma de acompanhar uma denúncia anônima.",
      "",
      "Este comprovante não substitui atendimento de emergência."
    ].join("\n");
    // Cria um arquivo temporario na memoria, simula o clique em um link de
    // download e depois descarta o arquivo temporario para nao ocupar memoria.
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = `comprovante-${protocolo}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // BLOCO 4 - SEM PROTOCOLO NA MEMORIA.
  // Acontece quando a pessoa atualiza a pagina ou chega aqui por um link
  // direto. A tela explica com franqueza que o codigo so aparece uma vez e
  // oferece os dois caminhos possiveis, em vez de mostrar uma tela vazia.
  if (!protocolo) {
    return (
      <NeuCard title="Protocolo não disponível" description="Por segurança, o protocolo só aparece uma vez logo após o envio.">
        <div className="grid gap-3 sm:flex">
          <Link className="btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/denunciar">
            Fazer denúncia
          </Link>
          <Link className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/acompanhar">
            Acompanhar denúncia
          </Link>
        </div>
      </NeuCard>
    );
  }

  // BLOCO 5 - COM PROTOCOLO: mostra o cartao de destaque com o codigo, o
  // aviso de guardar e os botoes de baixar comprovante e acompanhar.
  return (
    <div className="grid gap-6">
      <ProtocoloCard protocolo={protocolo} />
      <NeuCard title="Guarde este código" variant="pressed">
        <p className="text-sm leading-6 text-text-secondary">
          Ele é a única forma de acompanhar uma denúncia anônima. Se você fechar esta tela, o protocolo não será exibido novamente.
        </p>
        <div className="mt-5 grid gap-3 sm:flex">
          <NeuButton className="w-full sm:w-auto" onClick={downloadReceipt}>
            Baixar comprovante
          </NeuButton>
          <Link
            className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto"
            href={`/acompanhar/${protocolo}`}
          >
            Acompanhar denúncia
          </Link>
        </div>
      </NeuCard>
      {verificacaoEnviada && (
        <NeuCard title="Confirme seu e-mail">
          <p className="text-sm leading-6 text-text-secondary">
            Enviamos um link para o e-mail que você informou. Os avisos sobre o andamento só serão enviados depois que você
            confirmar. O link vale por 24 horas. Se não confirmar, você ainda pode acompanhar tudo pelo protocolo.
          </p>
        </NeuCard>
      )}
    </div>
  );
}
