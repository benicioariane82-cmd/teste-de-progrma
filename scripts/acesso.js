
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('access-form');

    if (!form) return;

    const company = form.dataset.type === 'empresa';

    const name = document.getElementById('nome');
    const documentInput = document.getElementById('documento');
    const email = document.getElementById('email');
    const password = document.getElementById('senha');
    const city = document.getElementById('cidade');

    const registerOnly = document.getElementById('register-only');
    const title = document.getElementById('form-title');
    const subtitle = document.getElementById('form-subtitle');
    const submit = document.getElementById('submit-button');
    const toggleText = document.getElementById('toggle-text');
    const toggle = document.getElementById('toggle-mode');
    const message = document.getElementById('message');

    const API = 'http://127.0.0.1:5000/api';

    let registerMode = company;

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

        if (city) {
            city.required = company && registerMode;
        }

        if (email) {
            email.required = company;
        }

        title.textContent = registerMode
            ? (company ? 'Crie sua conta' : 'Faça seu cadastro')
            : 'Que bom ter você de volta';

        subtitle.textContent = registerMode
            ? (company
                ? 'Cadastre sua empresa para começar a fazer a diferença.'
                : 'Cadastre-se com CPF para reservar as doações disponíveis.')
            : 'Informe seus dados para continuar.';

        submit.textContent = registerMode
            ? (company ? 'Cadastrar empresa' : 'Criar minha conta')
            : 'Entrar';

        toggleText.firstChild.textContent = registerMode
            ? 'Já possui cadastro? '
            : 'Ainda não possui cadastro? ';

        toggle.textContent = registerMode ? 'Entrar' : 'Fazer cadastro';

        showMessage('');
    };

    toggle.addEventListener('click', () => {
        registerMode = !registerMode;
        render();
    });

    if (documentInput) {
        documentInput.addEventListener('input', event => {
            event.target.value = company
                ? formatCnpj(event.target.value)
                : formatCpf(event.target.value);
        });
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const documentNumber = onlyDigits(documentInput.value);
        const userEmail = email ? email.value.trim().toLowerCase() : '';
        const userPassword = password.value;

        const requiredLength = company ? 14 : 11;

        if (
            documentNumber.length !== requiredLength ||
            userPassword.length < 6 ||
            (registerMode && !name.value.trim()) ||
            (company && registerMode && (!city || !city.value.trim())) ||
            (company && !userEmail)
        ) {
            showMessage('Confira os dados preenchidos e tente novamente.');
            return;
        }

        const data = {
            password: userPassword
        };

        let endpoint;

        if (registerMode) {
            if (company) {
                endpoint = '/auth/register/ong';

                data.name = name.value.trim();
                data.cnpj = documentNumber;
                data.city = city.value.trim();
                data.email = userEmail;
            } else {
                endpoint = '/auth/register/beneficiary';

                data.name = name.value.trim();
                data.cpf = documentNumber;
            }
        } else {
            endpoint = '/auth/login';

            data.type = company ? 'ong' : 'beneficiary';

            if (company) {
                data.email = userEmail;
            } else {
                data.cpf = documentNumber;
            }
        }

        submit.disabled = true;
        submit.textContent = 'Aguarde...';

        try {
            const response = await fetch(API + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Não foi possível realizar a operação.');
            }

            sessionStorage.setItem('conecta_token', result.token);
            sessionStorage.setItem('conecta_account', JSON.stringify(result.account));
            sessionStorage.setItem('conecta_type', result.type);

            if (company) {
                localStorage.setItem('conecta_empresa_logada', result.account.email);

                localStorage.setItem('conecta_ong', JSON.stringify({
                    nome: result.account.name,
                    endereco: result.account.city,
                    agenda: ''
                }));
            } else {
                localStorage.setItem('conecta_usuario_logado', result.account.cpf);
                localStorage.setItem('conecta_usuario_cpf', result.account.cpf);
            }

            showMessage(
                registerMode
                    ? 'Cadastro realizado com sucesso! Redirecionando...'
                    : 'Acesso autorizado! Redirecionando...',
                true
            );

            submit.textContent = 'Sucesso!';

            setTimeout(() => {
                window.location.href = company ? 'ong.html' : 'catalogo.html';
            }, 700);

        } catch (error) {
            showMessage(error.message);
            submit.disabled = false;
            render();
        }
    });

    render();
});
