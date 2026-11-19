document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('access-form');
    const company = form.dataset.type === 'empresa';
    const name = document.getElementById('nome');
    const documentInput = document.getElementById('documento');
    const email = document.getElementById('email');
    const password = document.getElementById('senha');
    const registerOnly = document.getElementById('register-only');
    const title = document.getElementById('form-title');
    const subtitle = document.getElementById('form-subtitle');
    const submit = document.getElementById('submit-button');
    const toggleText = document.getElementById('toggle-text');
    const toggle = document.getElementById('toggle-mode');
    const message = document.getElementById('message');
    const storageKey = company ? 'conecta_contas_empresas' : 'conecta_contas_usuarios';
    let registerMode = company;

    const accounts = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
    const onlyDigits = value => value.replace(/\D/g, '');
    const showMessage = (text, success = false) => {
        message.textContent = text;
        message.classList.toggle('success', success);
    };
    const formatCpf = value => onlyDigits(value).slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    const formatCnpj = value => onlyDigits(value).slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');

    const render = () => {
        registerOnly.classList.toggle('hidden', !registerMode);
        name.required = registerMode;
        title.textContent = registerMode ? (company ? 'Crie sua conta' : 'Faça seu cadastro') : 'Que bom ter você de volta';
        subtitle.textContent = registerMode
            ? (company ? 'Cadastre sua empresa para começar a fazer a diferença.' : 'Cadastre-se com CPF para reservar as doações disponíveis.')
            : 'Informe seus dados para continuar.';
        submit.textContent = registerMode ? (company ? 'Cadastrar empresa' : 'Criar minha conta') : 'Entrar';
        toggleText.firstChild.textContent = registerMode ? 'Já possui cadastro? ' : 'Ainda não possui cadastro? ';
        toggle.textContent = registerMode ? 'Entrar' : 'Fazer cadastro';
        showMessage('');
    };

    toggle.addEventListener('click', () => {
        registerMode = !registerMode;
        render();
    });

    if (documentInput) documentInput.addEventListener('input', event => {
        event.target.value = company ? formatCnpj(event.target.value) : formatCpf(event.target.value);
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        const userEmail = email.value.trim().toLowerCase();
        const documentNumber = documentInput ? onlyDigits(documentInput.value) : '';
        const requiredDocumentLength = company ? 14 : 11;

        if (!userEmail || password.value.length < 6 || documentNumber.length !== requiredDocumentLength || (registerMode && !name.value.trim())) {
            showMessage(company ? 'Preencha os dados e informe um CNPJ com 14 números.' : 'Preencha os dados e informe um CPF com 11 números. A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        const saved = accounts();
        const found = saved.find(account => account.email === userEmail || account.document === documentNumber);

        if (registerMode) {
            if (found) {
                showMessage('Este e-mail ou documento já possui cadastro. Entre para continuar.');
                return;
            }
            saved.push({ name: name.value.trim(), document: documentNumber, email: userEmail, password: password.value });
            localStorage.setItem(storageKey, JSON.stringify(saved));
        } else if (!saved.find(account => account.email === userEmail && account.password === password.value && account.document === documentNumber)) {
            showMessage('Dados não encontrados. Confira as informações ou faça seu cadastro.');
            return;
        }

        localStorage.setItem(company ? 'conecta_empresa_logada' : 'conecta_usuario_logado', userEmail);
        if (!company) localStorage.setItem('conecta_usuario_cpf', documentNumber);
        showMessage(registerMode ? 'Cadastro realizado! Redirecionando...' : 'Acesso autorizado! Redirecionando...', true);

        setTimeout(() => {
            window.location.href = company ? 'ong.html' : 'catalogo.html';
        }, 700);
    });

    render();
});
