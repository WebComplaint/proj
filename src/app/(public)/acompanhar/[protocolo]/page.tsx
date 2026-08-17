import { AcompanhamentoProtocolo } from "@/components/publico/acompanhamento-protocolo";

type AcompanharProtocoloPageProps = {
  params: {
    protocolo: string;
  };
};

export default function AcompanharProtocoloPage({ params }: AcompanharProtocoloPageProps) {
  const protocolo = decodeURIComponent(params.protocolo).trim().toUpperCase();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <AcompanhamentoProtocolo protocolo={protocolo} />
    </main>
  );
}
