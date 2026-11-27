# My Movies

## Sobre

O **My Movies** é um aplicativo desenvolvido para oferecer aos usuários uma forma simples e organizada de acompanhar filmes já lançados ou com lançamento previsto. A plataforma permitirá consultar informações sobre os títulos, registrar avaliações por meio de notas e criar listas personalizadas de filmes assistidos, facilitando o acompanhamento do histórico e das preferências de cada usuário.

Esta aplicação é uma nova implementação do projeto My Movies, desenvolvida a partir dos aprendizados e das funcionalidades presentes nos projetos anteriores:

- [My Movies — backend em PHP](https://github.com/williancordeiro/mymovies)
- [My Movies — frontend em Angular](https://github.com/williancordeiro/mymovies-angular)

## Tecnologias utilizadas

O aplicativo utiliza as seguintes tecnologias e bibliotecas:

| Tecnologia | Breve descrição |
| --- | --- |
| **React e React Native** | Base para a construção da interface móvel multiplataforma. |
| **TypeScript** | Tipagem estática aplicada ao código do aplicativo. |
| **Expo** | Plataforma e ferramentas para desenvolvimento e execução do aplicativo. |
| **Expo Router** | Roteamento e navegação baseados em arquivos. |
| **React Navigation** | Recursos de navegação utilizados pelo Expo Router. |
| **TanStack Query** | Gerenciamento de consultas, cache e sincronização de dados remotos. |
| **Axios** | Cliente HTTP para comunicação com a API. |
| **React Hook Form e Zod** | Gerenciamento e validação de formulários. |
| **Hookform Resolvers** | Integração entre a validação do Zod e os formulários. |
| **Expo SecureStore** | Armazenamento seguro da sessão em dispositivos nativos. |
| **Expo Image e Expo Image Picker** | Exibição otimizada de imagens e seleção de imagem para o perfil. |
| **Expo Constants, Font, Linking, Splash Screen, Status Bar e Web Browser** | Recursos da plataforma Expo para configuração, fontes, links, tela de abertura, barra de status e navegação web. |
| **FlashList** | Renderização eficiente das listas de filmes. |
| **NativeWind e Tailwind CSS** | Estilização da interface com classes utilitárias. |
| **Zustand** | Gerenciamento de estado da aplicação. |
| **Expo Vector Icons** | Biblioteca de ícones da interface. |
| **React Native Reanimated, Safe Area Context, Screens, Worklets, React Native CSS, React DOM e React Native Web** | Dependências de suporte à interface, animações, áreas seguras, navegação e execução na web. |
| **Babel Preset Expo e tipos do React** | Ferramentas de compilação e suporte à tipagem durante o desenvolvimento. |
| **PostCSS, Tailwind CSS PostCSS, Lightning CSS e Prettier Plugin Tailwind CSS** | Processamento e organização dos estilos utilitários. |
| **ESLint, ESLint Config Expo e React Test Renderer** | Ferramentas de análise estática e suporte à renderização de componentes em testes. |

## Protótipos de telas

Os protótipos apresentam a proposta visual e os principais fluxos de navegação do aplicativo. As telas foram desenvolvidas no [Lunacy](https://www.lunacyapp.com/), ferramenta utilizada para criação e compartilhamento de interfaces.

[Acessar os protótipos de telas](https://www.lunacyapp.com/player/br/2HO0CNs8CEyN6-Mr0PKtOQ/mymovies-app/e820J4ktgUGFtFOcXE3Cbg?layer=3tj_ibVkTkiqTHf96wK-8Q)

## Modelagem do banco de dados

O diagrama representa a estrutura planejada para o banco de dados, incluindo suas entidades, atributos e relacionamentos. A modelagem foi elaborada no [DrawDB](https://www.drawdb.app/), ferramenta voltada à criação e visualização de diagramas de bancos de dados.

[Acessar a modelagem do banco de dados](https://www.drawdb.app/editor/diagrams/f9851988-e019-429f-826a-b34921ad0328)

## Planejamento de sprints

O planejamento considera o período letivo de agosto a novembro de 2026 e divide o desenvolvimento em oito sprints quinzenais. A organização foi definida com base na análise das implementações anteriores, que já contemplam recursos como autenticação, perfis de usuário, catálogo, busca, detalhes e avaliações de filmes. Nesta nova versão, essas experiências servirão como referência para uma implementação revisada, com destaque para a criação e o gerenciamento de listas de filmes assistidos.

## Checkpoints do projeto

Marque cada checkpoint conforme suas entregas forem concluídas e as respectivas issues forem encerradas.

- [x] **Escopo e backlog:** definir o escopo, levantar requisitos e organizar o backlog do MyMovies.
- [x] **Experiência visual e arquitetura:** criar os protótipos e definir a identidade visual, a navegação e a arquitetura.
- [x] **Banco de dados e estrutura:** preparar a modelagem dos dados, o ambiente e a estrutura inicial do projeto.
- [x] **Catálogo e busca de filmes:** disponibilizar catálogo, pesquisa, detalhes dos filmes e tratamento dos estados de consulta.
- [x] **Cadastro, login e perfil:** implementar cadastro, autenticação, sessão e gerenciamento do perfil do usuário.
- [x] **Avaliações e notas:** permitir criar e alterar avaliações de filmes.
- [x] **Favoritos:** permitir adicionar, remover e consultar os filmes favoritos do usuário.
- [x] **Listas de filmes assistidos:** permitir criar e gerenciar listas pessoais, adicionando e removendo filmes.
- [ ] **Integração e entrega final:** integrar os módulos, executar os testes, atualizar a documentação e preparar a entrega.

## Atualizações desde o último checkpoint

- **Estrutura inicial do aplicativo — [PR #10](https://github.com/williancordeiro/mymovies-app/pull/10), incorporado em 04/09/2026**
  - Inicialização do projeto com Expo, React Native e TypeScript.
  - Configuração do Expo Router e das dependências-base.

- **Página inicial — [PR #12](https://github.com/williancordeiro/mymovies-app/pull/12), incorporado em 08/09/2026**
  - Criação da tela inicial e da navegação por abas.
  - Integração com a API para exibir os filmes populares.

- **Detalhes dos filmes — [PR #14](https://github.com/williancordeiro/mymovies-app/pull/14), incorporado em 09/09/2026**
  - Inclusão da página de detalhes do filme.
  - Acesso aos detalhes a partir dos cards da listagem.

- **Busca de filmes e ajustes de navegação — [PR #16](https://github.com/williancordeiro/mymovies-app/pull/16), incorporado em 13/10/2026**
  - Implementação da pesquisa integrada à API, com debounce para reduzir requisições durante a digitação.
  - Tratamento dos estados de carregamento, erro e resultados vazios.
  - Acesso aos detalhes pelos resultados da busca.
  - Ajustes na navegação inferior, no retorno entre telas e nos espaçamentos.

- **Autenticação de usuário — [PR #18](https://github.com/williancordeiro/mymovies-app/pull/18), incorporado em 11/11/2026**
  - Implementação das telas de cadastro e login, com validação de campos e mensagens de erro.
  - Criação e restauração segura da sessão do usuário, incluindo encerramento de sessão.

- **Perfil de usuário — [PR #20](https://github.com/williancordeiro/mymovies-app/pull/20), incorporado em 12/11/2026**
  - Inclusão da tela de perfil com carregamento dos dados do usuário.
  - Adição de configurações para edição do perfil e saída da conta.

- **Avaliação de filmes — [PR #22](https://github.com/williancordeiro/mymovies-app/pull/22), incorporado em 24/11/2026**
  - Implementação do envio e da atualização da avaliação do usuário, com notas de 1 a 5 estrelas.
  - Tratamento dos estados de envio, erros e acesso à autenticação para avaliar filmes.

- **Favoritos — [PR #24](https://github.com/williancordeiro/mymovies-app/pull/24), incorporado em 25/11/2026**
  - Implementação da adição e remoção de filmes favoritos nas telas de catálogo, busca e detalhes.
  - Criação da tela de favoritos com paginação, atualização por gesto e estados de carregamento, erro e lista vazia.

- **Atualização de perfil — [PR #26](https://github.com/williancordeiro/mymovies-app/pull/26), incorporado em 26/11/2026**
  - Criação da área de atualização de perfil, incluindo alteração de nome, identificador e imagem do usuário.
  - Inclusão de fluxos para alterar e-mail e senha mediante confirmação da senha atual.
  - Integração da seleção de imagem com o Expo Image Picker e atualização dos dados pela API.

- **Criação de playlists — [PR #29](https://github.com/williancordeiro/mymovies-app/pull/29), incorporado em 26/11/2026**
  - Implementação de listas personalizadas, com criação e visualização de suas páginas de detalhes.
  - Inclusão de filmes em playlists a partir dos detalhes do filme.

- **Atualizações das playlists — [PR #31](https://github.com/williancordeiro/mymovies-app/pull/31), incorporado em 27/11/2026**
  - Adição de edição e exclusão de playlists, com modais de confirmação para as ações.
  - Possibilidade de remover filmes das playlists e aprimoramento da capa e do tratamento de erros.

O período de **23/11 a 30/11** será reservado para ajustes decorrentes da avaliação final, correções emergenciais e consolidação da documentação do projeto.
