(() => {
    const app = window.ConectaApp;
    const { $, $$, data, digits, id, photos, toast, createSession, currentAccount, session } = app;

    function formatForm(type, mode) {
        const register = mode === 'register';
        const form = type === 'ong' ? $('#ong-form') : $('#benef-form');
        if (!form) return;

        if (type === 'ong') {
            form.innerHTML = register
                ? `<div class="field"><label for="auth-name">Nome da instituição</label><input id="auth-name" name="name" required></div>
                   <div class="form-grid"><div class="field"><label for="auth-cnpj">CNPJ</label><input id="auth-cnpj" name="cnpj" inputmode="numeric" maxlength="14" required></div><div class="field"><label for="auth-city">Cidade / Bairro</label><input id="auth-city" name="city" required></div></div>
                   <div class="field"><label for="auth-pickup-location">Endereço/local de retirada</label><input id="auth-pickup-location" name="pickupLocation" required maxlength="180" placeholder="Rua, número, bairro e cidade"></div>
                   <div class="field"><label for="auth-description">Descrição da instituição</label><textarea id="auth-description" name="description" required maxlength="500" placeholder="Conte sobre o trabalho da ONG e quem ela atende"></textarea></div>
                   <div class="field"><label for="auth-email">E-mail</label><input id="auth-email" name="email" type="email" required></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" minlength="6" required></div><button class="form-submit">Cadastrar instituição</button>`
                : `<div class="field"><label for="auth-email">E-mail da instituição</label><input id="auth-email" name="email" type="email" required></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" required></div><button class="form-submit">Entrar no painel</button>`;
        } else {
            $('#benef-auth-title').textContent = register ? 'Crie sua conta' : 'Entre na sua conta';
            form.innerHTML = register
                ? `<div class="field"><label for="auth-name">Nome completo</label><input id="auth-name" name="name" required></div><div class="form-grid"><div class="field"><label for="auth-cpf">CPF</label><input id="auth-cpf" name="cpf" inputmode="numeric" maxlength="11" required></div><div class="field"><label for="auth-phone">Telefone / WhatsApp</label><input id="auth-phone" name="phone" type="tel" required></div></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" minlength="6" required></div><button class="form-submit">Criar cadastro</button>`
                : `<div class="field"><label for="auth-cpf">CPF</label><input id="auth-cpf" name="cpf" inputmode="numeric" maxlength="11" required placeholder="Somente números"></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" required></div><button class="form-submit">Entrar como beneficiário</button>`;
        }

        form.onsubmit = event => submitForm(event, type, register);
    }

    function submitForm(event, type, register) {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const password = String(values.get('password') || '');
        const email = String(values.get('email') || '').trim().toLowerCase();
        if (register && password.length < 6) return toast('A senha precisa ter pelo menos 6 caracteres.');

        if (register && type === 'ong') {
            const cnpj = digits(values.get('cnpj'));
            if (cnpj.length !== 14) return toast('Informe um CNPJ com 14 números.');
            if (data.organizations.some(item => item.email.toLowerCase() === email || digits(item.cnpj) === cnpj)) {
                return toast('Este e-mail ou CNPJ já está cadastrado.');
            }
            const account = {
                id: id('ong'),
                name: String(values.get('name')).trim(),
                cnpj,
                city: String(values.get('city')).trim(),
                pickupLocation: String(values.get('pickupLocation')).trim(),
                email,
                password,
                description: String(values.get('description')).trim(),
                image: photos.community
            };
            data.organizations.push(account);
            return createSession(type, account);
        }

        if (register) {
            const cpf = digits(values.get('cpf'));
            if (cpf.length !== 11) return toast('Informe um CPF com 11 números.');
            if (data.beneficiaries.some(item => item.cpf === cpf)) {
                return toast('Este CPF já possui cadastro. Entre na sua conta.');
            }
            const account = {
                id: id('benef'),
                name: String(values.get('name')).trim(),
                cpf,
                phone: String(values.get('phone')).trim(),
                password
            };
            data.beneficiaries.push(account);
            return createSession(type, account);
        }

        const account = type === 'ong'
            ? data.organizations.find(item => item.email.toLowerCase() === email && item.password === password)
            : data.beneficiaries.find(item => item.cpf === digits(values.get('cpf')) && item.password === password);
        if (!account) return toast('Dados não encontrados. Confira as informações e tente novamente.');
        createSession(type, account);
    }

    function init(type) {
        let mode = 'login';
        const form = type === 'ong' ? $('#ong-form') : $('#benef-form');
        $$('[data-auth-mode]').forEach(button => button.addEventListener('click', () => {
            mode = button.dataset.authMode;
            $$('[data-auth-mode]').forEach(item => item.classList.toggle('active', item === button));
            formatForm(type, mode);
        }));
        formatForm(type, mode);

        if (type === 'ong' && session?.type === 'ong' && currentAccount()) {
            $('#ong-auth').classList.add('hidden');
            $('#ong-dashboard').classList.remove('hidden');
            if (new URLSearchParams(location.search).get('tab') === 'validation') {
                $('#ong-content').dataset.active = 'validate';
            }
            window.ConectaPages.ong.render();
        }
        if (type === 'beneficiary' && session?.type === 'beneficiary' && currentAccount()) {
            location.href = new URLSearchParams(location.search).get('next') || 'catalogo.html';
        }
        form?.querySelector('input')?.focus();
    }

    window.ConectaAuth = { init };
})();
