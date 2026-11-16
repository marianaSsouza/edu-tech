# Spec Delta

## Purpose

Controlar acesso individual aos dados escolares, preservando a autoria pedagógica e restringindo cada operação ao papel e ao vínculo vigente.

## ADDED Requirements

### Requirement: Contas individuais e papéis
O sistema SHALL oferecer contas individuais de professor e coordenação, sem cadastro público. A coordenação inicial SHALL ser preparada na instalação; coordenação cria e desativa contas docentes, sem apagar autoria. Professores MUST NOT elevar o próprio perfil. Rastreabilidade: RN11, RNF-02; requisitos seção 5.

#### Scenario: Desativação de professora
- **WHEN** a coordenação desativa uma conta docente
- **THEN** novos acessos dessa conta são negados e os registros anteriores conservam sua autora.

#### Scenario: Elevação indevida
- **WHEN** uma professora tenta assumir perfil de coordenação por acesso direto
- **THEN** a operação é negada.

### Requirement: Consulta contextual autorizada
O sistema SHALL permitir à professora consultar turmas vinculadas e o histórico completo dos alunos atualmente vinculados. A coordenação SHALL consultar todos os alunos, turmas e anos da escola, inclusive registros sem matrícula atual. Toda leitura e alteração SHALL verificar autorização, inclusive por identificador direto. Rastreabilidade: RN06, RN11, RF-11, RNF-02, CR-21.

#### Scenario: Histórico de aluno atual
- **WHEN** uma professora vinculada abre aluno atual com registros de outras professoras
- **THEN** o histórico anterior fica disponível com autoria preservada.

#### Scenario: Ex-aluno sem vínculo
- **WHEN** uma professora tenta abrir diretamente um aluno sem vínculo atual
- **THEN** a leitura é negada, mesmo que ela seja autora de registros anteriores.

### Requirement: Edição pedagógica por autoria
Registros bimestrais SHALL exigir vínculo atual e período aberto; correções SHALL exigir também autoria. Outra professora SHALL preencher respostas ausentes ou acrescentar observações próprias. Ações atuais de atenção manual SHALL seguir seu ciclo independente de fechamento. A coordenação MUST NOT editar conteúdo pedagógico. Rastreabilidade: RF-11, RF-13, RNF-01/02; decisão de autoria.

#### Scenario: Titular e substituta simultâneas
- **WHEN** a substituta encontra uma habilidade já avaliada pela titular no bimestre
- **THEN** não pode substituí-la; pode preencher outra habilidade ausente e registrar observação própria.

#### Scenario: Correção antiga pela autora
- **WHEN** a autora possui vínculo atual com o aluno e o período antigo está aberto
- **THEN** pode corrigir seu registro com revisão preservada, mesmo que a turma original seja outra.

#### Scenario: Coordenação tenta editar
- **WHEN** a coordenação envia alteração pedagógica diretamente
- **THEN** a operação é negada, além de a interface não oferecer botões de edição pedagógica.

### Requirement: Gestão restrita e sessão identificada
O sistema SHALL restringir cadastros, matrículas, vínculos e fechamento à coordenação. A interface SHALL identificar perfil e contexto, apresentar acesso negado e sessão encerrada sem expor dados não autorizados. Rastreabilidade: RF-12, CA-12.4, PRO-01, RNF-02.

#### Scenario: Professor tenta administrar matrícula
- **WHEN** um professor tenta matricular ou transferir um aluno
- **THEN** a operação é negada sem alteração da matrícula.

### Requirement: Proteção de credenciais na demonstração hospedada
A demonstração hospedada SHALL usar conexão protegida, credenciais individuais e recuperação por mecanismo de autenticação confiável. Senhas MUST NOT ser armazenadas em texto simples. Rastreabilidade: RNF-02; requisitos seção 9.

#### Scenario: Acesso hospedado
- **WHEN** a demonstração é disponibilizada na rede
- **THEN** o acesso autenticado utiliza conexão protegida e a verificação de armazenamento não encontra senhas em texto simples.
