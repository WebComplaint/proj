# Documentação da API — Web Complaint

Guia escrito em linguagem simples, para ser usado na apresentação do TCC.
Não é preciso saber programar para entender este documento.

---

## Parte 1 — O que é uma API, em uma analogia

Imagine um restaurante.

- Você senta na mesa e olha o **cardápio**. Você não entra na cozinha.
- Você faz o **pedido** ao garçom, usando as palavras do cardápio.
- A cozinha prepara e o garçom traz o **prato**.

Em um sistema web funciona igual:

| No restaurante | No sistema |
|---|---|
| O salão onde você senta | A tela que aparece no navegador |
| O cardápio | A lista de rotas da API |
| O pedido ao garçom | A requisição |
| A cozinha | O servidor e o banco de dados |
| O prato que chega | A resposta |

A **API** é o cardápio mais o garçom. É o conjunto de pedidos que o sistema
aceita receber. Ela existe para que a tela nunca converse diretamente com o
banco de dados, e assim toda regra e toda checagem de permissão aconteçam
sempre no mesmo lugar.

**Frase para a apresentação:** a API é a única porta de entrada dos dados, e
toda porta tem um porteiro.

---

## Parte 2 — Os quatro verbos

Todo pedido carrega um verbo que diz a intenção:

| Verbo | Significa | Exemplo no sistema |
|---|---|---|
| **GET** | Me traga uma informação | Consultar um protocolo |
| **POST** | Crie algo novo | Enviar uma denúncia |
| **PATCH** | Altere só uma parte | Mudar o status de um caso |
| **DELETE** | Apague | Não é usado neste sistema |

O sistema **não tem nenhuma rota DELETE**. Isso é uma decisão de projeto, e não
um esquecimento. Denúncias, histórico, usuários e categorias nunca são
apagados. Usuários e categorias são apenas desativados, para que o histórico
dos casos continue rastreável.

---

## Parte 3 — Os números de resposta

Toda resposta traz um número que resume o que aconteceu. Os que este sistema
usa são estes:

| Número | Significado | Quando aparece aqui |
|---|---|---|
| 200 | Deu certo | A consulta funcionou |
| 201 | Criado | A denúncia ou o comentário foi gravado |
| 400 | Pedido mal preenchido | Faltou um campo ou o formato está errado |
| 401 | Não sei quem você é | Não está logado |
| 403 | Sei quem você é, mas não pode | Está logado, mas não é administrador |
| 404 | Não encontrei | Protocolo ou denúncia inexistente |
| 429 | Tentativas demais | Passou de 5 consultas em 10 minutos |
| 500 | Erro do servidor | Falha inesperada do sistema |

A diferença entre **401** e **403** costuma render uma boa pergunta de banca.
401 é o porteiro dizendo "você não se identificou". 403 é o porteiro dizendo
"eu sei quem você é, e este andar não é seu".

---

## Parte 4 — Os dois grupos de rotas

O sistema tem 9 rotas, divididas em dois grupos bem separados:

**Grupo público** (4 rotas) — qualquer pessoa usa, sem login nenhum.
São as rotas de enviar denúncia, anexar arquivo e consultar protocolo.

**Grupo restrito** (5 rotas) — todas começam com `/api/painel/` e exigem
login da equipe da escola. Três delas exigem ainda ser administrador.

Essa separação é o desenho central do sistema: o aluno que denuncia nunca
precisa criar conta, e o dado sensível nunca sai por uma rota aberta.

---

# GRUPO PÚBLICO

## 1. Enviar uma denúncia

```
POST /api/denuncias
```

**Quem pode usar:** qualquer pessoa, sem login.

**O que faz:** grava uma denúncia nova e devolve o protocolo.

**O que precisa enviar:**

| Campo | Obrigatório | Observação |
|---|---|---|
| categoriaSlug | Sim | Uma das categorias ativas |
| descricao | Sim | Mínimo de 20 caracteres |
| anonima | Sim | Verdadeiro ou falso |
| aceiteTermos | Sim | Precisa ser verdadeiro |
| dataOcorrido | Não | Data aproximada, de 2000 até o momento atual (nunca no futuro) |
| local | Não | Até 120 caracteres |
| envolvidos | Não | Até 4000 caracteres |
| anexos | Não | Até 5 arquivos |
| denuncianteNome | Não | Só na denúncia identificada |
| denuncianteEmail | Condicional | Obrigatório se identificada |
| denuncianteTelefone | Sim | Com DDD, nas duas opções. Na anônima, só o administrador vê |

**O que devolve:** apenas o protocolo, e nada mais.

```json
{ "protocolo": "DEN-2026-A2B3C4" }
```

**O ponto de privacidade para a apresentação:** sendo a denúncia anônima, o
sistema grava nome e e-mail como vazios, mesmo que algo tenha sido digitado
antes de a pessoa mudar de ideia. A promessa de anonimato é cumprida na
gravação, e não escondendo campos na tela. O telefone é obrigatório nas duas
opções; na denúncia anônima, ele aparece no painel **somente para o
administrador** (a tela do caso e a rota `GET /api/painel/denuncias/{id}`
o escondem dos demais perfis).

**Possíveis respostas:** 201 (criado), 400 (campo errado), 404 (categoria
inexistente ou desativada), 500 (falha do servidor).

---

## 2. Anexar um arquivo

```
POST /api/upload
```

**Quem pode usar:** qualquer pessoa, sem login.

**O que faz:** recebe uma foto ou um PDF e guarda em uma pasta privada do
Supabase Storage. A equipe abre o anexo pelo painel, com um link que vale 1 hora.

**Regras de aceitação:**

| Regra | Valor |
|---|---|
| Formatos aceitos | jpg, jpeg, png, webp, pdf |
| Tamanho máximo | 10 MB por arquivo |
| Quantidade máxima | 5 arquivos por denúncia |

**O que devolve:** o endereço onde o arquivo ficou, o nome original, o tipo e o
tamanho.

**O ponto de segurança para a apresentação:** o arquivo é salvo com um nome
sorteado aleatoriamente, nunca com o nome original. Sem esse cuidado, alguém
poderia enviar um arquivo com nome malicioso e tentar sobrescrever partes do
próprio sistema. O nome original fica guardado apenas como texto, para ser
exibido na tela da equipe.

**Possíveis respostas:** 201 (criado), 400 (formato ou tamanho recusado), 500
(falha ao guardar o arquivo).

---

## 3. Consultar um protocolo

```
GET /api/denuncias/protocolo/DEN-2026-A2B3C4
```

**Quem pode usar:** qualquer pessoa que tenha o código.

**O que faz:** mostra a situação pública de uma denúncia.

Esta é a rota mais delicada do sistema, porque é a única que entrega
informação sem exigir login. Por isso ela tem três proteções em camadas:

**Proteção 1 — Limite de tentativas.** No máximo 5 consultas a cada 10
minutos por origem. Sem esse limite, um programa poderia testar milhares de
códigos por minuto até acertar um protocolo válido.

**Proteção 2 — Formato obrigatório.** O código precisa seguir exatamente o
padrão `DEN-AAAA-XXXXXX`. Qualquer coisa fora disso é recusada antes mesmo de
chegar ao banco de dados.

**Proteção 3 — Resposta mínima.** Esta é a mais importante.

| O que a resposta traz | O que a resposta NÃO traz |
|---|---|
| Protocolo | O texto do relato |
| Status atual | Os arquivos anexados |
| Prioridade | Local e pessoas envolvidas |
| Categoria | Nome, e-mail e telefone do denunciante |
| Data de abertura | As notas internas da equipe |
| Histórico marcado como público | |

Repare que não é a tela que esconde essas informações: elas nunca saem do
banco de dados. Alguém inspecionando o tráfego do site não as encontraria.

**Possíveis respostas:** 200 (deu certo), 400 (formato inválido), 404 (não
encontrado), 429 (tentativas demais).

**Detalhe de segurança na redação:** a mensagem do erro 404 diz "não foi
possível mostrar informações", e não "esse protocolo não existe". Confirmar
quais códigos existem ajudaria quem está testando códigos a saber quando
acertou.

---

## 4. Fazer login

```
Não é uma rota nossa. É feita direto pelo Supabase.
```

O e-mail e a senha vão do navegador direto para o Supabase, o serviço
especializado que cuida de autenticação. **A senha nunca passa pelo nosso
servidor e nunca é guardada por nós.** O sistema recebe apenas a resposta
"entrou" ou "não entrou".

A mensagem de erro é sempre a mesma, "E-mail ou senha inválidos", sem revelar
qual dos dois errou. Se dissesse "esse e-mail não existe", alguém poderia
testar endereços até descobrir quem tem conta na escola.

### 4.1. Esqueci minha senha

```
POST /api/senha/esqueci     { "email": "..." }
POST /api/senha/redefinir   { "token": "...", "senha": "...", "confirmacao": "..." }
```

**Quem pode usar:** qualquer pessoa, porque quem esqueceu a senha ainda não
conseguiu entrar.

**Como funciona:** a tela de login tem o link "Esqueci minha senha". A pessoa
informa o e-mail e, se ele for de uma conta ativa do painel, recebe um link
que vale por **1 hora** e uma única vez. Ao abrir o link, ela escolhe a senha
nova (mínimo de 10 caracteres), que é trocada pela mesma função protegida do
banco usada no cadastro de usuários.

**O cuidado de segurança:** a resposta do primeiro passo é sempre a mesma,
exista a conta ou não. Assim ninguém descobre quem tem acesso ao painel
testando e-mails. Há também limite de pedidos por endereço de internet e por
e-mail.

**Possíveis respostas:** 200, 400 (link inválido, expirado ou senha fraca),
429 (muitas tentativas).

---

# GRUPO RESTRITO

Todas as rotas abaixo exigem login. O pedido passa antes pelo **porteiro**
(`middleware.ts`), que confere três coisas em sequência: se a pessoa está
logada, se a conta dela está ativa e se ela tem permissão naquela área.

Depois disso, **cada rota confere de novo por conta própria**. Essa repetição
é deliberada, e chama-se defesa em camadas: se um dia o porteiro for mal
configurado, a checagem da rota continua barrando o acesso.

## 5. Listar denúncias

```
GET /api/painel/denuncias
```

**Quem pode usar:** qualquer membro da equipe (professor, coordenador,
diretor ou administrador).

**Filtros disponíveis:** protocolo, status, categoria, prioridade, tipo
(anônima ou identificada), responsável, data inicial, data final, ordenação e
página.

**O que devolve:** 20 denúncias por vez, mais a informação de paginação
(total de casos, página atual e total de páginas).

**Detalhe que vale citar:** nesta listagem o texto do relato **não é trazido**.
A lista mostra apenas protocolo, categoria, status, prioridade e responsável.
O conteúdo da denúncia só sai do banco quando alguém abre aquele caso
específico.

**Possíveis respostas:** 200, 400 (filtro inválido), 401 (não logado).

---

## 6. Ver uma denúncia completa

```
GET /api/painel/denuncias/{id}
```

**Quem pode usar:** qualquer membro da equipe.

**O que devolve:** tudo. O relato completo, a categoria, o responsável, os
anexos e o histórico inteiro, incluindo as notas internas.

**Comparação que rende uma boa explicação na banca:** é a mesma denúncia da
rota 3, consultada com dois níveis de acesso completamente diferentes. Quem
tem apenas o protocolo vê o andamento. Quem é da equipe vê o caso.

**Possíveis respostas:** 200, 401, 404.

---

## 7. Atualizar uma denúncia

```
PATCH /api/painel/denuncias/{id}
```

**Quem pode usar:** qualquer membro da equipe.

**O que pode ser alterado:** status, prioridade, responsável e um comentário
público sobre a mudança.

**O que NÃO pode ser alterado por rota nenhuma:** o texto do relato. A escola
não tem como editar o que a pessoa escreveu.

Esta rota encadeia quatro ações automaticamente:

1. **Confere a esteira do processo.** A mudança de status precisa ser
   permitida. Não é possível pular de "Recebida" direto para "Resolvida", sem
   ninguém ter analisado o caso.
2. **Altera a denúncia.**
3. **Grava no histórico** o status antigo, o novo, o comentário e quem fez a
   alteração.
4. **Envia e-mail**, se a denúncia for identificada e tiver e-mail cadastrado.

Os passos 2 e 3 acontecem juntos, em **transação**: ou os dois são salvos, ou
nenhum é. Assim nunca existe uma mudança de status sem registro de autor, e a
rastreabilidade do caso nunca se perde.

Já o passo 4 fica **fora** da transação. Se o serviço de e-mail estiver fora do
ar, a denúncia continua atualizada e apenas o aviso não sai. Uma falha de
notificação não pode desfazer o trabalho da equipe.

**A esteira de status completa:**

| Status atual | Para onde pode ir |
|---|---|
| Recebida | Em análise, Arquivada |
| Em análise | Em andamento, Arquivada |
| Em andamento | Resolvida, Arquivada |
| Resolvida | Em andamento (o caso reabriu) |
| Arquivada | Em andamento |

**Possíveis respostas:** 200, 400 (mudança de status não permitida), 401, 404.

---

## 8. Comentar em uma denúncia

```
POST /api/painel/denuncias/{id}/comentarios
```

**Quem pode usar:** qualquer membro da equipe.

Esta rota tem um único campo que muda tudo:

| Campo `publico` | O que acontece |
|---|---|
| **falso** | Nota interna. Só a equipe vê. Não dispara e-mail. |
| **verdadeiro** | Resposta ao denunciante. Aparece na consulta por protocolo e dispara e-mail, se a denúncia for identificada. |

É o mesmo campo de texto na tela, mas o destino da mensagem muda por completo.
Por isso a interface pergunta isso de forma bem explícita e escreve em palavras
o que vai acontecer, antes de salvar. Escolher errado significaria expor uma
nota interna a quem denunciou.

O valor padrão é "nota interna", a opção mais segura das duas: no descuido, a
mensagem fica com a equipe.

**Possíveis respostas:** 201, 400, 401, 404.

---

## 9. Ver as estatísticas

```
GET /api/painel/estatisticas
```

**Quem pode usar:** qualquer membro da equipe.

**O que devolve:** os mesmos números da tela inicial do painel — total do mês,
casos aguardando triagem, em andamento e resolvidos, os casos fora do prazo de
48 horas, o total por categoria, o total por mês e as 5 denúncias mais
recentes.

**Por que essa rota existe:** ela entrega os indicadores em formato de dados.
Isso permitiria que outro sistema da escola, ou um aplicativo futuro,
aproveitasse os mesmos números sem refazer as contas.

São números agregados, sem nome de ninguém.

**Possíveis respostas:** 200, 401, 500.

---

## 10. Gerenciar usuários

```
GET   /api/painel/usuarios     (listar)
POST  /api/painel/usuarios     (criar)
PATCH /api/painel/usuarios     (atualizar)
```

**Quem pode usar:** somente o administrador. Sem essa trava, qualquer
professor poderia criar um usuário administrador para si mesmo.

**Os quatro cargos:** Professor, Coordenador, Diretor e Administrador. Os
quatro veem e tratam denúncias; só o Administrador entra nas áreas de
configuração.

**O detalhe técnico que rende uma boa explicação:** criar um usuário significa
gravar em dois lugares ao mesmo tempo — a conta de login, que guarda a senha, e
a ficha do funcionário, que guarda o nome e o cargo. Se apenas uma das duas
desse certo, sobraria um usuário quebrado no sistema.

A solução foi passar as duas gravações para uma função protegida dentro do
próprio banco de dados. O site apenas pede que ela seja executada. Isso traz
três vantagens: as duas gravações viram uma operação só, o site nunca manipula
senhas diretamente, e a função fica em uma área do banco fechada para acesso
externo.

**A senha nunca é devolvida em resposta nenhuma.** Deixar o campo de senha em
branco ao editar mantém a senha atual, o que permite corrigir o nome ou o cargo
de alguém sem redefinir a senha da pessoa.

**Possíveis respostas:** 200, 201, 400, 401, 403.

---

## 11. Gerenciar categorias

```
GET   /api/painel/categorias     (listar)
POST  /api/painel/categorias     (criar)
PATCH /api/painel/categorias     (atualizar)
```

**Quem pode usar:** somente o administrador.

**O que pode ser configurado:** nome, apelido técnico, descrição, ícone,
prioridade inicial, ordem de exibição e se está ativa.

A **prioridade inicial** é o campo mais interessante. É aqui que a escola
registra que, para ela, certo tipo de caso é sempre grave. Categorias como
Assédio e Violência física já nascem com prioridade Alta, e a denúncia chega
destacada no painel antes mesmo de alguém ler o relato.

**Não existe rota para excluir categoria.** Para tirar uma de circulação, a
escola marca "ativa" como falso. Excluir de verdade quebraria as denúncias
antigas ligadas a ela.

**Possíveis respostas:** 200, 201, 400, 401, 403.

---

## 12. Exportar o relatório

```
GET /api/painel/relatorios/export?inicio=2026-01-01&fim=2026-03-31
```

**Quem pode usar:** somente o administrador.

**O que devolve:** uma planilha do Excel (`.xlsx`), com títulos e valores em
português ("Em análise", "Anônima") e as datas no horário de Brasília.

**As colunas da planilha:** protocolo, categoria, status, prioridade, tipo,
responsável, data de criação e data da última atualização.

**O que a planilha NÃO leva:** o texto do relato, os anexos e os dados pessoais
do denunciante.

**Por que a trava aqui é a mais alta:** baixar uma planilha é diferente de
olhar a tela. O arquivo sai do sistema e passa a viver no computador de alguém,
podendo ser reenviado por e-mail ou esquecido em um pen drive. Levar apenas o
mínimo necessário é o que a LGPD chama de **minimização de dados**.

**Possíveis respostas:** 200 (arquivo), 401, 403.

---

## Parte 5 — Tabela resumo das rotas

| # | Rota | Verbo | Quem pode |
|---|---|---|---|
| 1 | `/api/denuncias` | POST | Qualquer pessoa |
| 2 | `/api/upload` | POST | Qualquer pessoa |
| 3 | `/api/denuncias/protocolo/{protocolo}` | GET | Qualquer pessoa (5 por 10 min) |
| 4 | `/api/painel/denuncias` | GET | Equipe |
| 5 | `/api/painel/denuncias/{id}` | GET, PATCH | Equipe |
| 6 | `/api/painel/denuncias/{id}/comentarios` | POST | Equipe |
| 7 | `/api/painel/estatisticas` | GET | Equipe |
| 8 | `/api/painel/usuarios` | GET, POST, PATCH | Administrador |
| 9 | `/api/painel/categorias` | GET, POST, PATCH | Administrador |
| 10 | `/api/painel/relatorios/export` | GET | Administrador |
| 11 | `/api/senha/esqueci` | POST | Qualquer pessoa |
| 12 | `/api/senha/redefinir` | POST | Qualquer pessoa (com o link) |

---

## Parte 6 — Perguntas que a banca costuma fazer

**Como o sistema garante que a denúncia anônima é mesmo anônima?**
A regra está na rota que grava a denúncia. Sendo anônima, os campos de nome
e e-mail são gravados vazios, mesmo que algo tenha sido digitado antes. Esses
dados não chegam ao banco. Não é a tela que esconde: o dado não existe.
O único dado guardado é o telefone, obrigatório, e ele fica restrito ao
administrador: a equipe que trata o caso continua vendo apenas "Anônima".

**E se alguém tentar adivinhar protocolos de outras pessoas?**
Três barreiras. O código é sorteado por um gerador criptográfico, imprevisível.
O limite é de 5 consultas a cada 10 minutos. E, mesmo acertando um código, a
resposta traz apenas o andamento, nunca o conteúdo da denúncia.

**Por que o protocolo não usa as letras I, L, O nem os números 0 e 1?**
Porque são confundidos quando alguém anota o código no papel ou dita por
telefone. Menos confusão significa menos protocolo perdido, e o protocolo é a
única chave de uma denúncia anônima.

**O que acontece se o serviço de e-mail cair?**
Nada se perde. O envio de e-mail fica fora das transações e dentro de um
tratamento de erro. A denúncia continua salva e a atualização continua
registrada; apenas o aviso não sai. Não havendo serviço de e-mail configurado,
o sistema escreve a mensagem no registro do servidor e segue funcionando, o
que permite demonstrar o projeto sem contratar serviço nenhum.

**Por que a permissão é conferida várias vezes?**
Defesa em camadas. O porteiro confere, a rota da API confere de novo e a
própria tela confere uma terceira vez. Se uma das camadas falhar em uma
configuração futura, as outras continuam protegendo.

**Por que nada é excluído?**
Denúncia e histórico são registro permanente do que aconteceu. Usuários e
categorias são desativados em vez de apagados, para que o histórico dos casos
continue mostrando quem tratou o quê e sob qual categoria.
