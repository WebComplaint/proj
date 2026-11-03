/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E o TERMO DE CONSENTIMENTO que a pessoa aceita antes de enviar a denuncia.
 *
 * Ele explica, em linguagem simples e seguindo a LGPD (Lei 13.709/2018),
 * para que os dados sao usados, quem os ve, por quanto tempo ficam guardados
 * e quais direitos a pessoa tem. O formulario de denuncia mostra um resumo
 * deste termo e um link para esta pagina, que abre em outra aba para nao
 * apagar o que ja foi preenchido.
 *
 * Cada clausula corresponde a algo que o sistema faz de verdade. Por exemplo,
 * a de "denuncia anonima" descreve exatamente a regra da rota /api/denuncias
 * e da tela de detalhe do caso no painel.
 *
 * Para a apresentacao: e o documento que sustenta o aceite do formulario.
 */

import Link from "next/link";
import { NeuCard } from "@/components/ui";

export const metadata = { title: "Termo de consentimento" };

// BLOCO UNICO - As clausulas do termo, na ordem em que a pessoa le.
const clausulas: Array<{ titulo: string; itens: string[] }> = [
  {
    titulo: "1. Para que os dados são usados",
    itens: [
      "Registrar a sua denúncia e gerar o protocolo de acompanhamento.",
      "Permitir que a equipe autorizada da escola apure o caso e tome as providências necessárias.",
      "Entrar em contato com você, quando for preciso esclarecer o relato ou proteger alguém.",
      "Os dados não são usados para nenhuma outra finalidade, como propaganda ou avaliação de alunos e funcionários."
    ]
  },
  {
    titulo: "2. Quais dados são coletados",
    itens: [
      "O relato: categoria, descrição, data aproximada, local, pessoas envolvidas e os arquivos anexados, se houver.",
      "Um telefone com DDD, obrigatório nas denúncias anônimas e nas identificadas.",
      "Nome e e-mail, apenas se você escolher se identificar.",
      "O sistema não guarda o endereço de internet (IP) nem outras marcas do seu aparelho junto com a denúncia."
    ]
  },
  {
    titulo: "3. Denúncia anônima",
    itens: [
      "Nome e e-mail não são pedidos nem armazenados.",
      "O telefone fica visível somente para a administração da escola. Professores, coordenadores e diretores que tratam o caso não o veem.",
      "O telefone só é usado se for necessário esclarecer o relato ou em situação de risco a alguém."
    ]
  },
  {
    titulo: "4. Quem tem acesso",
    itens: [
      "Somente a equipe autorizada da escola, com login e senha pessoais, acessa as denúncias no painel.",
      "A consulta pública pelo protocolo mostra apenas o andamento e as respostas da escola, nunca os seus dados.",
      "A planilha de relatório exportada pela administração não leva o relato nem os seus dados pessoais."
    ]
  },
  {
    titulo: "5. Compartilhamento",
    itens: [
      "Os dados não são vendidos nem repassados a empresas.",
      "Quando houver suspeita de violência contra criança ou adolescente, a escola tem o dever legal de comunicar o Conselho Tutelar e, se for o caso, outras autoridades (Estatuto da Criança e do Adolescente, art. 13 e art. 245).",
      "Os dados também podem ser fornecidos por ordem judicial ou exigência legal."
    ]
  },
  {
    titulo: "6. Por quanto tempo os dados ficam guardados",
    itens: [
      "Pelo tempo necessário para tratar o caso e cumprir as obrigações legais da escola.",
      "Depois disso, os dados pessoais podem ser eliminados ou mantidos de forma que não identifiquem você."
    ]
  },
  {
    titulo: "7. Seus direitos",
    itens: [
      "Você pode pedir à escola a confirmação de que seus dados são tratados, o acesso a eles, a correção de dados incorretos e a eliminação dos dados desnecessários (LGPD, art. 18).",
      "Para isso, procure a secretaria ou a direção da escola e informe o protocolo da denúncia.",
      "Você pode revogar este consentimento a qualquer momento. A revogação não desfaz o que já foi feito com base nele, e a escola pode precisar manter alguns dados para cumprir a lei."
    ]
  },
  {
    titulo: "8. Segurança",
    itens: [
      "As informações trafegam por conexão segura, os anexos ficam em uma pasta privada e cada acesso ao painel exige login.",
      "Todas as mudanças no caso ficam registradas no histórico, com o nome de quem as fez."
    ]
  }
];

export default function TermoDeConsentimentoPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <section className="surface-neuro p-6 sm:p-8">
        <p className="text-sm font-bold text-text-secondary">Privacidade e LGPD</p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]">
          Termo de consentimento
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
          Ao marcar &quot;Li e aceito o termo de consentimento e a política de privacidade&quot; e enviar a denúncia, você
          concorda com o tratamento dos seus dados nas condições abaixo, conforme a Lei Geral de Proteção de Dados
          (Lei 13.709/2018).
        </p>
      </section>

      <div className="grid gap-4">
        {clausulas.map((clausula) => (
          <NeuCard key={clausula.titulo} as="article" title={clausula.titulo}>
            <ul className="grid list-disc gap-2 pl-5 text-sm leading-6 text-text-secondary">
              {clausula.itens.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </NeuCard>
        ))}
      </div>

      {/* A mesma ressalva honesta da pagina de privacidade: o texto final
          precisa ser revisado pela instituicao antes da publicacao. */}
      <NeuCard title="Importante" variant="pressed">
        <p className="text-sm leading-6 text-text-secondary">
          Este termo descreve o funcionamento do sistema e deve ser revisado pela instituição, que é a responsável pelos
          dados (controladora), antes da publicação. Em caso de emergência, não espere a resposta da denúncia: ligue 190
          ou para o Disque 100.
        </p>
      </NeuCard>

      <div className="grid gap-3 sm:flex">
        <Link className="btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/denunciar">
          Fazer denúncia
        </Link>
        <Link className="btn-secondary inline-flex min-h-11 w-full items-center justify-center px-5 py-4 sm:w-auto" href="/privacidade">
          Política de privacidade
        </Link>
      </div>
    </main>
  );
}
