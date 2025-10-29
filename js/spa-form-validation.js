

/*  Router SPA simples  */
const SPA = (() => {
  const mainSelector = 'main';

  
  function isInternalLink(a) {
    const href = a.getAttribute('href');
    if (!href) return false;
   
    return !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#');
  }

  async function loadPage(url, replaceHistory = false) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao carregar: ' + res.status);
      const html = await res.text();

      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newMain = doc.querySelector(mainSelector);
      if (!newMain) throw new Error('Página sem <main> para inserir.');

      const currentMain = document.querySelector(mainSelector);
      currentMain.replaceWith(newMain);

      
      initPage();

      if (replaceHistory) {
        history.replaceState({ url }, '', url);
      } else {
        history.pushState({ url }, '', url);
      }

    } catch (err) {
      console.error(err);
      showGlobalAlert('Erro ao carregar a página.', 'error');
    }
  }

  function attachNavHandlers() {
    
    document.body.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      if (isInternalLink(a)) {
        e.preventDefault();
        const href = a.getAttribute('href');
        loadPage(href);
      }
    });

    
    window.addEventListener('popstate', (e) => {
      const state = e.state;
      if (state && state.url) {
        loadPage(state.url, true);
      }
    });
  }

  function init() {
    attachNavHandlers();
    
    initPage();
  }

  return { init, loadPage };
})();

/*  Sistema de templates simples  */
function renderTemplate(templateString, data = {}) {
 
  return templateString.replace(/{{\s*([a-zA-Z0-9_\.]+)\s*}}/g, (match, key) => {
    const keys = key.split('.');
    let val = data;
    for (const k of keys) {
      if (val && k in val) val = val[k];
      else return '';
    }
    return String(val);
  });
}


function showFieldError(field, message) {
  clearFieldError(field);
  field.classList.add('input-error');
  const small = document.createElement('small');
  small.className = 'field-error-message';
  small.textContent = message;
  field.insertAdjacentElement('afterend', small);
}

function clearFieldError(field) {
  field.classList.remove('input-error');
  const next = field.nextElementSibling;
  if (next && next.classList.contains('field-error-message')) next.remove();
}

function showGlobalAlert(message, type = 'info') {
  
  const existing = document.querySelector('.spa-global-alert');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = `spa-global-alert spa-alert-${type}`;
  div.textContent = message;
  document.body.prepend(div);
  setTimeout(() => div.classList.add('visible'), 50);
  setTimeout(() => div.classList.remove('visible'), 5000);
  setTimeout(() => div.remove(), 5500);
}



function validateRequired(field) {
  if (!field) return true;
  if (field.type === 'checkbox' || field.type === 'radio') {
  
    return field.checked;
  }
  return field.value.trim() !== '';
}

function validateEmail(value) {
  
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value);
}

function validatePhone(value) {
  
  const re = /^\(\d{2}\) \d{4,5}-\d{4}$/;
  return re.test(value);
}

function validateCEP(value) {
  const re = /^\d{5}-\d{3}$/;
  return re.test(value);
}

function validateCPF(cpf) {
  
  cpf = (cpf || '').replace(/[\D]/g, '');
  if (cpf.length !== 11) return false;
  
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (t) => {
    let sum = 0;
    for (let i = 0; i < t - 1; i++) {
      sum += parseInt(cpf.charAt(i)) * (t - i);
    }
    let r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const v1 = calc(10);
  const v2 = calc(11);
  return v1 === parseInt(cpf.charAt(9)) && v2 === parseInt(cpf.charAt(10));
}


function initPage() {
 
  document.querySelectorAll('form').forEach((form) => {
    if (!form.id) form.id = 'form-' + Math.random().toString(36).substring(2, 9);
    setupFormValidation(form);
  });

  
  document.querySelectorAll('.button-enviar').forEach((btn) => {
    const form = btn.closest('form');
    if (!form) return;
    btn.addEventListener('click', () => form.requestSubmit());
  });
}

function setupFormValidation(form) {
 
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearFormErrors(form);
    const isValid = validateForm(form);
    if (isValid) {
      
      showGlobalAlert('Formulário enviado com sucesso!', 'success');
      form.reset();
    } else {
      showGlobalAlert('Existem erros no formulário. Verifique os campos em destaque.', 'error');
    }
  });

  
  const selectors = ['input[required]', 'input[type="email"]', 'input[name="telefone"]', 'input[name="cpf"]', 'input[name="cep"]'];
  selectors.forEach((sel) => {
    form.querySelectorAll(sel).forEach((field) => {
      field.addEventListener('blur', () => {
        validateField(field);
      });
      
      field.addEventListener('input', () => clearFieldError(field));
    });
  });
}

function clearFormErrors(form) {
  form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
  form.querySelectorAll('.field-error-message').forEach((el) => el.remove());
}

function validateForm(form) {
  let ok = true;
  const requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach((field) => {
    if (!validateRequired(field)) {
      showFieldError(field, 'Campo obrigatório');
      ok = false;
    }
  });

  
  const email = form.querySelector('input[type="email"]');
  if (email && email.value.trim() !== '' && !validateEmail(email.value.trim())) {
    showFieldError(email, 'Email inválido');
    ok = false;
  }

  const telefone = form.querySelector('input[name="telefone"]');
  if (telefone && telefone.value.trim() !== '' && !validatePhone(telefone.value.trim())) {
    showFieldError(telefone, 'Telefone no formato (00) 00000-0000');
    ok = false;
  }

 
  const cep = form.querySelector('input[name="cep"]');
  if (cep && cep.value.trim() !== '' && !validateCEP(cep.value.trim())) {
    showFieldError(cep, 'CEP no formato 00000-000');
    ok = false;
  }

  
  const cpf = form.querySelector('input[name="cpf"]');
  if (cpf && cpf.value.trim() !== '' && !validateCPF(cpf.value.trim())) {
    showFieldError(cpf, 'CPF inválido');
    ok = false;
  }

  return ok;
}

function validateField(field) {
  clearFieldError(field);
  const name = field.getAttribute('name') || field.id || '';
  const val = field.value.trim();

  if (field.hasAttribute('required') && !validateRequired(field)) {
    showFieldError(field, 'Campo obrigatório');
    return false;
  }

  if (field.type === 'email' && val !== '' && !validateEmail(val)) {
    showFieldError(field, 'Email inválido');
    return false;
  }

  if (name === 'telefone' && val !== '' && !validatePhone(val)) {
    showFieldError(field, 'Telefone no formato (00) 00000-0000');
    return false;
  }

  if (name === 'cep' && val !== '' && !validateCEP(val)) {
    showFieldError(field, 'CEP no formato 00000-000');
    return false;
  }

  if (name === 'cpf' && val !== '' && !validateCPF(val)) {
    showFieldError(field, 'CPF inválido');
    return false;
  }

  
  return true;
}


(function injectStyles() {
  const css = `
  .input-error { outline: 2px solid rgba(220,50,50,0.25); }
  .field-error-message { color: #b22222; font-size: 0.9rem; margin-top: 4px; display:block; }
  .spa-global-alert { position: fixed; left: 50%; transform: translateX(-50%) translateY(-20px); top: 10px; padding: 12px 18px; border-radius: 8px; z-index: 9999; opacity: 0; transition: all 300ms ease; box-shadow: 0 6px 18px rgba(0,0,0,0.12); }
  .spa-global-alert.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
  .spa-alert-info { background: #f0f4ff; color: #0b3a8c; }
  .spa-alert-success { background: #ecf9f0; color: #116633; }
  .spa-alert-error { background: #fff2f2; color: #8b0000; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();


document.addEventListener("DOMContentLoaded", () => {
  SPA.init();

  const modeBtn = document.getElementById("mode-toggle");
  const modes = ["normal", "modo-escuro", "alto-contraste"];
  let current = 0;

  modeBtn.addEventListener("click", () => {
    // Remove todas as classes de estilo
    document.body.classList.remove("dark-mode", "high-contrast");

    // Avança para o próximo modo
    current = (current + 1) % modes.length;

    // Aplica a classe correspondente
    if (modes[current] === "modo-escuro") {
      document.body.classList.add("dark-mode");
    } else if (modes[current] === "alto-contraste") {
      document.body.classList.add("high-contrast");
    }

    // Atualiza o texto do botão
    let texto = "";
    if (modes[current] === "normal") texto = "Normal";
    if (modes[current] === "modo-escuro") texto = "Modo Escuro";
    if (modes[current] === "alto-contraste") texto = "Alto Contraste";

    modeBtn.textContent = `Modo: ${texto}`;
  });
});





window.SPA = SPA;
window.renderTemplate = renderTemplate;
window.validateCPF = validateCPF; 
