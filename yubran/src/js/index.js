'use strict';

document.addEventListener('DOMContentLoaded', () => {
  AppCore.initializeData();
  AppCore.setupModalClosers();
  AppCore.renderIcons(document);

  const existingSession = AppCore.getSession();
  if (existingSession) {
    window.location.replace(AppCore.getHomePage(existingSession.role));
    return;
  }

  const form = document.getElementById('login-form');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const message = document.getElementById('login-message');
  const submitButton = document.getElementById('login-button');
  const passwordToggle = document.getElementById('password-toggle');
  const mobilePreviewButton = document.getElementById('login-mobile-preview-toggle');

  const setMessage = (text, type = 'error') => {
    message.textContent = text;
    message.className = `form-message ${type}`;
  };

  const clearValidation = () => {
    [email, password].forEach(input => input.classList.remove('invalid'));
    setMessage('', '');
  };

  const togglePhonePreview = () => {
    const enabled = document.body.classList.toggle('login-phone-mode');
    mobilePreviewButton?.setAttribute('aria-pressed', String(enabled));
    if (mobilePreviewButton) {
      mobilePreviewButton.innerHTML = `${AppCore.icon(enabled ? 'dashboard' : 'smartphone')}<span class="preview-toggle-label">${enabled ? 'Vista escritorio' : 'Vista móvil'}</span>`;
    }
    AppCore.playSound('click');
  };

  mobilePreviewButton?.addEventListener('click', togglePhonePreview);

  document.getElementById('login-sound-test')?.addEventListener('click', () => {
    const settings = AppCore.getSettings();
    settings.sound = true;
    AppCore.write(AppCore.KEYS.settings, settings);
    AppCore.playSound('success');
  });

  document.querySelectorAll('[data-demo-email]').forEach(button => {
    button.addEventListener('click', () => {
      email.value = button.dataset.demoEmail;
      password.value = button.dataset.demoPassword;
      clearValidation();
      email.focus();
      AppCore.playSound('click');
    });
  });

  passwordToggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    passwordToggle.innerHTML = AppCore.icon(show ? 'eyeOff' : 'eye');
    passwordToggle.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    AppCore.playSound('click');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearValidation();

    if (!email.value.trim() || !email.validity.valid) {
      email.classList.add('invalid');
      setMessage('Ingrese un correo electrónico válido.');
      email.focus();
      AppCore.playSound('error');
      return;
    }
    if (!password.value) {
      password.classList.add('invalid');
      setMessage('Ingrese la contraseña.');
      password.focus();
      AppCore.playSound('error');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Validando credenciales…';
    const result = await AppCore.login(email.value, password.value);

    if (!result.ok) {
      email.classList.add('invalid');
      password.classList.add('invalid');
      setMessage(result.message);
      submitButton.disabled = false;
      submitButton.innerHTML = `${AppCore.icon('arrowRight')} Ingresar al sistema`;
      AppCore.playSound('error');
      return;
    }

    setMessage(`Acceso concedido. Bienvenido, ${result.user.name}.`, 'success');
    AppCore.playSound('success');
    setTimeout(() => window.location.replace(AppCore.getHomePage(result.user.role)), 550);
  });

  document.getElementById('open-client-register')?.addEventListener('click', () => {
    const registerForm = document.getElementById('client-register-form');
    registerForm?.reset();
    setInlineMessage('client-register-message', '', '');
    AppCore.openModal('client-register-modal');
    AppCore.playSound('click');
  });

  document.getElementById('open-supplier-application')?.addEventListener('click', () => {
    const supplierForm = document.getElementById('supplier-application-form');
    supplierForm?.reset();
    setInlineMessage('supplier-application-message', '', '');
    AppCore.openModal('supplier-application-modal');
    AppCore.playSound('click');
  });

  document.getElementById('client-register-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const passwordValue = document.getElementById('register-password').value;
    const confirmValue = document.getElementById('register-password-confirm').value;
    if (passwordValue !== confirmValue) {
      setInlineMessage('client-register-message', 'Las contraseñas no coinciden.', 'error');
      AppCore.playSound('error');
      return;
    }

    const result = await AppCore.registerClient({
      name: document.getElementById('register-name').value,
      identification: document.getElementById('register-identification').value,
      phone: document.getElementById('register-phone').value,
      email: document.getElementById('register-email').value,
      password: passwordValue
    });

    if (!result.ok) {
      setInlineMessage('client-register-message', result.message, 'error');
      AppCore.playSound('error');
      return;
    }

    email.value = result.user.email;
    password.value = '';
    setInlineMessage('client-register-message', 'Cuenta creada correctamente. Ya puede iniciar sesión.', 'success');
    AppCore.playSound('success');
    setTimeout(() => {
      AppCore.closeModal('client-register-modal');
      setMessage('Cuenta creada. Ingrese la contraseña que registró para iniciar sesión.', 'success');
      email.focus();
    }, 850);
  });

  document.getElementById('supplier-application-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const passwordValue = document.getElementById('supplier-password').value;
    const confirmValue = document.getElementById('supplier-password-confirm').value;
    if (passwordValue !== confirmValue) {
      setInlineMessage('supplier-application-message', 'Las contraseñas no coinciden.', 'error');
      AppCore.playSound('error');
      return;
    }

    const result = await AppCore.submitSupplierApplication({
      company: document.getElementById('supplier-company').value,
      legalId: document.getElementById('supplier-legal-id').value,
      contact: document.getElementById('supplier-contact').value,
      email: document.getElementById('supplier-email').value,
      phone: document.getElementById('supplier-phone').value,
      category: document.getElementById('supplier-category').value,
      province: document.getElementById('supplier-province').value,
      password: passwordValue,
      notes: document.getElementById('supplier-notes').value
    });

    if (!result.ok) {
      setInlineMessage('supplier-application-message', result.message, 'error');
      AppCore.playSound('error');
      return;
    }

    setInlineMessage('supplier-application-message', 'Solicitud enviada. Un administrador deberá aprobarla antes de que pueda iniciar sesión.', 'success');
    AppCore.playSound('success');
    event.currentTarget.reset();
  });
});

function setInlineMessage(id, text, type) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = text;
  element.className = `form-message full ${type || ''}`;
}
