# Contexto do Projeto — Ficha de Anamnese Psicanalítica

## O que é o projeto
Um formulário de anamnese para atendimento psicanalítico em HTML puro (single file).
O arquivo foi criado no Claude.ai e está sendo editado no VS Code.

## Situação atual
O formulário está visualmente pronto e funcional, mas o botão **"Enviar ficha"** 
apenas simula o envio (mostra uma mensagem de sucesso) sem realmente enviar os dados para nenhum e-mail.

## O que precisa ser feito
Integrar o envio do formulário com **EmailJS** para que, ao clicar em "Enviar ficha",
os dados sejam enviados para um e-mail real.

## Por que EmailJS
- O arquivo é HTML puro (sem backend/servidor)
- Está hospedado (ou será hospedado) no GitHub Pages
- EmailJS funciona client-side, sem precisar de Node.js ou servidor

## O que falta para completar
O usuário ainda vai criar a conta no EmailJS e obter:
- `Service ID`     → ex: service_abc123
- `Template ID`    → ex: template_xyz456
- `Public Key`     → ex: user_XXXXXXXXXXXXXX

## Como o envio deve funcionar
1. Usuário preenche o formulário e clica em "Enviar ficha"
2. O JavaScript coleta todos os campos do formulário
3. Envia via EmailJS para o e-mail do terapeuta
4. Exibe a mensagem de sucesso já existente (`#success-msg`)
5. Em caso de erro, exibe uma mensagem de erro amigável

## Trecho atual do submit (a ser substituído)
```javascript
form.addEventListener('submit', function(e) {
  e.preventDefault();
  form.style.display = 'none';
  document.getElementById('success-msg').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
```

## O que o Copilot deve fazer
1. Adicionar o script do EmailJS no `<head>`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
   ```
2. Inicializar o EmailJS com a Public Key
3. Substituir o listener de submit para usar `emailjs.sendForm()`
4. Manter o visual de sucesso já existente
5. Adicionar tratamento de erro visível ao usuário

## Campos do formulário (names)
nome, nascimento, idade, genero, profissao, estado_civil, telefone, email,
queixa, tempo_queixa, gatilho, intensidade (radio 1-10),
familia, infancia, fratria (radio), pais, hist_familia,
terapia_anterior (radio), terapia_detalhes, medicacoes, saude_geral, substancias (radio),
relacionamentos, vida_sexual, trabalho, social_feel (radio),
expectativas, livre, como_chegou
