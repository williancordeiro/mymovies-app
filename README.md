# My Movies

## Sobre

O **My Movies** é um aplicativo desenvolvido para oferecer aos usuários uma forma simples e organizada de acompanhar filmes já lançados ou com lançamento previsto. A plataforma permitirá consultar informações sobre os títulos, registrar avaliações por meio de notas e criar listas personalizadas de filmes assistidos, facilitando o acompanhamento do histórico e das preferências de cada usuário.

Esta aplicação é uma nova implementação do projeto My Movies, desenvolvida a partir dos aprendizados e das funcionalidades presentes nos projetos anteriores:

- [My Movies — backend em PHP](https://github.com/williancordeiro/mymovies)
- [My Movies — frontend em Angular](https://github.com/williancordeiro/mymovies-angular)

## Tecnologias utilizadas

O aplicativo será desenvolvido com as seguintes tecnologias:

| Tecnologia | Breve descrição |
| --- | --- |
| **React Native** | Framework utilizado para o desenvolvimento da aplicação móvel multiplataforma. |
| **Expo** | Plataforma e conjunto de ferramentas empregados para simplificar o desenvolvimento, os testes e a distribuição do aplicativo. |

## Protótipos de telas

Os protótipos apresentam a proposta visual e os principais fluxos de navegação do aplicativo. As telas foram desenvolvidas no [Lunacy](https://www.lunacyapp.com/), ferramenta utilizada para criação e compartilhamento de interfaces.

[Acessar os protótipos de telas](https://www.lunacyapp.com/player/br/2HO0CNs8CEyN6-Mr0PKtOQ/mymovies-app/e820J4ktgUGFtFOcXE3Cbg?layer=3tj_ibVkTkiqTHf96wK-8Q)

## Modelagem do banco de dados

O diagrama representa a estrutura planejada para o banco de dados, incluindo suas entidades, atributos e relacionamentos. A modelagem foi elaborada no [DrawDB](https://www.drawdb.app/), ferramenta voltada à criação e visualização de diagramas de bancos de dados.

[Acessar a modelagem do banco de dados](https://www.drawdb.app/editor/diagrams/f9851988-e019-429f-826a-b34921ad0328)

## Planejamento de sprints

O planejamento considera o período letivo de agosto a novembro de 2026 e divide o desenvolvimento em oito sprints quinzenais. A organização foi definida com base na análise das implementações anteriores, que já contemplam recursos como autenticação, perfis de usuário, catálogo, busca, detalhes e avaliações de filmes. Nesta nova versão, essas experiências servirão como referência para uma implementação revisada, com destaque para a criação e o gerenciamento de listas de filmes assistidos.

| Sprint | Período | Objetivos e entregas |
| --- | --- | --- |
| **Sprint 1 — Descoberta e definição** | 03/08 a 16/08 | Analisar os projetos anteriores; levantar requisitos funcionais e não funcionais; definir o escopo do produto, as histórias de usuário e os critérios de aceite; organizar o backlog inicial. |
| **Sprint 2 — UX e arquitetura** | 17/08 a 30/08 | Elaborar e validar os protótipos das telas; definir a identidade visual e os fluxos de navegação; escolher as tecnologias; estabelecer a arquitetura da aplicação e os padrões do projeto. |
| **Sprint 3 — Dados e estrutura inicial** | 31/08 a 13/09 | Elaborar a modelagem conceitual, lógica e física do banco de dados; preparar migrations e dados iniciais; configurar os ambientes de desenvolvimento; criar a estrutura base do frontend e do backend. |
| **Sprint 4 — Usuários e autenticação** | 14/09 a 27/09 | Implementar cadastro, autenticação e encerramento de sessão; proteger rotas; permitir consulta e atualização do perfil; adicionar validações, tratamento de erros e testes dos principais fluxos. |
| **Sprint 5 — Catálogo de filmes** | 28/09 a 11/10 | Implementar listagem, busca, filtros e paginação; exibir filmes lançados e próximos lançamentos; desenvolver a página de detalhes; integrar a fonte de dados dos filmes e tratar estados de carregamento, erro e ausência de resultados. |
| **Sprint 6 — Avaliações** | 12/10 a 25/10 | Permitir que usuários autenticados criem, alterem e removam suas notas; exibir a avaliação individual e a média de cada filme; aplicar regras de negócio e ampliar a cobertura de testes. |
| **Sprint 7 — Listas de filmes assistidos** | 26/10 a 08/11 | Implementar criação, edição e exclusão de listas; permitir adicionar e remover filmes; apresentar as listas no perfil do usuário; revisar permissões, usabilidade e responsividade. |
| **Sprint 8 — Integração e entrega** | 09/11 a 22/11 | Integrar e revisar todos os módulos; executar testes de unidade, integração e aceitação; corrigir falhas; aprimorar acessibilidade e desempenho; preparar a documentação, a implantação e a apresentação final. |

O período de **23/11 a 30/11** será reservado para ajustes decorrentes da avaliação final, correções emergenciais e consolidação da documentação do projeto.
