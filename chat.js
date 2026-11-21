(() => {
  const API_URL = 'https://pergunte-sobre-a-juliana.onrender.com';

  const toggle = document.getElementById('ask-toggle');
  const panel = document.getElementById('ask-panel');
  const closeBtn = document.getElementById('ask-close');
  const messages = document.getElementById('ask-messages');
  const suggestions = document.getElementById('ask-suggestions');
  const form = document.getElementById('ask-form');
  const input = document.getElementById('ask-input');
  const send = document.getElementById('ask-send');

  let warmedUp = false;

  const ERRORS = {
    429: 'Você atingiu o limite de perguntas por agora. Tente de novo mais tarde.',
    503: 'O limite gratuito da IA foi atingido hoje. Tente de novo mais tarde.',
  };

  function addMessage(text, type, sources = []) {
    const msg = document.createElement('div');
    msg.className = `ask-msg ${type}`;
    msg.textContent = text;
    if (sources.length) {
      const list = document.createElement('div');
      list.className = 'ask-sources';
      sources.forEach((source) => {
        const tag = document.createElement('span');
        tag.className = 'ask-source';
        tag.textContent = source.title;
        list.appendChild(tag);
      });
      msg.appendChild(list);
    }
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    return msg;
  }

  // O servidor gratuito dorme quando ninguém usa: ao abrir o chat, ele já começa a acordar.
  function warmUp() {
    if (warmedUp) return;
    warmedUp = true;
    addMessage('Olá! Pergunte sobre os projetos, a experiência ou a stack da Juliana. A primeira resposta pode levar até 1 minuto enquanto o servidor acorda.', 'info');
    fetch(`${API_URL}/health`).catch(() => {});
  }

  function setOpen(open) {
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      warmUp();
      input.focus();
    }
  }

  async function ask(question) {
    addMessage(question, 'user');
    suggestions.remove();
    send.disabled = true;
    const waiting = addMessage('Pensando…', 'info');

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      waiting.remove();
      if (!response.ok) {
        addMessage(ERRORS[response.status] || 'Não consegui responder agora. Tente novamente.', 'bot');
        return;
      }
      const data = await response.json();
      addMessage(data.answer, 'bot', data.sources);
    } catch {
      waiting.remove();
      addMessage('Não consegui conectar ao assistente. Tente novamente em instantes.', 'bot');
    } finally {
      send.disabled = false;
    }
  }

  toggle.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  closeBtn.addEventListener('click', () => setOpen(false));

  suggestions.querySelectorAll('.ask-suggestion').forEach((button) => {
    button.addEventListener('click', () => ask(button.textContent));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question || send.disabled) return;
    input.value = '';
    ask(question);
  });
})();
