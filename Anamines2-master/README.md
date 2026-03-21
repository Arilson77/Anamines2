# Ficha de Anamnese Psicanalítica

Este projeto é um formulário de anamnese para atendimento psicanalítico, desenvolvido em HTML puro (single file) e pensado para uso em consultórios ou clínicas.

## Funcionalidades
- Formulário completo para coleta de dados do paciente
- Visual moderno e responsivo
- Integração com EmailJS para envio dos dados por e-mail (sem backend)
- Mensagem de sucesso após envio
- Tratamento de erro amigável

## Como usar
1. Hospede o arquivo HTML (ex: GitHub Pages)
2. Crie uma conta no EmailJS (https://www.emailjs.com/)
3. Configure o serviço de e-mail (ex: Gmail) e crie um template
4. Obtenha os dados:
   - Service ID
   - Template ID
   - Public Key
5. Substitua os placeholders no código HTML pelos seus dados reais
6. Pronto! O formulário enviará os dados para o e-mail do terapeuta

## Campos do formulário
- nome, nascimento, idade, genero, profissao, estado_civil, telefone, email
- queixa, tempo_queixa, gatilho, intensidade (radio 1-10)
- familia, infancia, fratria (radio), pais, hist_familia
- terapia_anterior (radio), terapia_detalhes, medicacoes, saude_geral, substancias (radio)
- relacionamentos, vida_sexual, trabalho, social_feel (radio)
- expectativas, livre, como_chegou

## Como contribuir
Pull requests são bem-vindos!

## Licença
Este projeto é livre para uso e modificação.
