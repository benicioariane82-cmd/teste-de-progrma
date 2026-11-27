
(() => {
    const API = 'http://127.0.0.1:5000/api';
    const TOKEN_KEY = 'conecta_api_token';

    let token = localStorage.getItem(TOKEN_KEY);
    let account = null;
    let accountType = null;

    const photos = {
        food: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=700&q=80',
        people: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80',
        community: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80'
    };

    const page = document.body.dataset.area;

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));

    const digits = value => String(value || '').replace(/\D/g, '');

    function toast(message) {
        const region = $('#toast-region');
        if (!region) {
            alert(message);
            return;
        }

        const item = document.createElement('div');
        item.className = 'toast';
        item.textContent = message;
        region.append(item);

        setTimeout(() => item.remove(), 3600);
    }

    async function api(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API}${path}`, {
            ...options,
            headers
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.error ||
                result.message ||
                `Erro na solicitação (${response.status}).`
            );
        }

        return result;
    }

    function renderUser() {
        const label = $('#account-name');
        const logout = $('#logout-button');

        if (label) {
            label.textContent = account
                ? `Olá, ${account.name.split(' ')[0]}`
                : '';
        }

        if (logout) {
            logout.classList.toggle('hidden', !account);
        }
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        token = null;
        account = null;
        accountType = null;

        location.href = '../index.html';
    }

    async function restoreSession() {
        if (!token) return false;

        try {
            const result = await api('/me');

            account = result.account;
            accountType = result.type;

            renderUser();
            return true;
        } catch (error) {
            localStorage.removeItem(TOKEN_KEY);
            token = null;
            return false;
        }
    }

    function redirectToBeneficiary() {
        const currentPage = location.pathname.split('/').pop();

        location.href =
            `beneficiario.html?next=${encodeURIComponent(currentPage)}`;
    }

    function requireBeneficiary() {
        if (!account || accountType !== 'beneficiary') {
            redirectToBeneficiary();
            return false;
        }

        return true;
    }

    // AUTENTICAÇÃO

    function formatAuthForm(type, mode) {
        const form = type === 'ong'
            ? $('#ong-form')
            : $('#benef-form');

        if (!form) return;

        const register = mode === 'register';

        if (type === 'ong') {
            form.innerHTML = register
                ? `
                    <div class="field">
                        <label for="auth-name">Nome da instituição</label>
                        <input id="auth-name" name="name" required>
                    </div>

                    <div class="form-grid">
                        <div class="field">
                            <label for="auth-cnpj">CNPJ</label>
                            <input id="auth-cnpj" name="cnpj"
                                inputmode="numeric" maxlength="14" required>
                        </div>

                        <div class="field">
                            <label for="auth-city">Cidade / Bairro</label>
                            <input id="auth-city" name="city" required>
                        </div>
                    </div>

                    <div class="field">
                        <label for="auth-email">E-mail</label>
                        <input id="auth-email" name="email"
                            type="email" required>
                    </div>

                    <div class="field">
                        <label for="auth-password">Senha</label>
                        <input id="auth-password" name="password"
                            type="password" minlength="6" required>
                    </div>

                    <button class="form-submit">Cadastrar instituição</button>
                `
                : `
                    <div class="field">
                        <label for="auth-email">E-mail da instituição</label>
                        <input id="auth-email" name="email"
                            type="email" required>
                    </div>

                    <div class="field">
                        <label for="auth-password">Senha</label>
                        <input id="auth-password" name="password"
                            type="password" required>
                    </div>

                    <button class="form-submit">Entrar no painel</button>
                `;
        } else {
            $('#benef-auth-title').textContent = register
                ? 'Crie sua conta'
                : 'Entre na sua conta';

            form.innerHTML = register
                ? `
                    <div class="field">
                        <label for="auth-name">Nome completo</label>
                        <input id="auth-name" name="name" required>
                    </div>

                    <div class="form-grid">
                        <div class="field">
                            <label for="auth-cpf">CPF</label>
                            <input id="auth-cpf" name="cpf"
                                inputmode="numeric" maxlength="11" required>
                        </div>

                        <div class="field">
                            <label for="auth-phone">Telefone / WhatsApp</label>
                            <input id="auth-phone" name="phone" type="tel">
                        </div>
                    </div>

                    <div class="field">
                        <label for="auth-password">Senha</label>
                        <input id="auth-password" name="password"
                            type="password" minlength="6" required>
                    </div>

                    <button class="form-submit">Criar cadastro</button>
                `
                : `
                    <div class="field">
                        <label for="auth-cpf">CPF</label>
                        <input id="auth-cpf" name="cpf"
                            inputmode="numeric" maxlength="11"
                            placeholder="Somente números" required>
                    </div>

                    <div class="field">
                        <label for="auth-password">Senha</label>
                        <input id="auth-password" name="password"
                            type="password" required>
                    </div>

                    <button class="form-submit">Entrar como beneficiário</button>
                `;
        }

        form.onsubmit = event => submitAuth(event, type, register);
    }

    async function submitAuth(event, type, register) {
        event.preventDefault();

        const form = event.currentTarget;
        const values = new FormData(form);
        const password = String(values.get('password') || '');

        const payload = { password };

        let endpoint = '/auth/login';

        if (type === 'ong') {
            payload.type = 'ong';

            if (register) {
                payload.name = String(values.get('name') || '').trim();
                payload.cnpj = digits(values.get('cnpj'));
                payload.city = String(values.get('city') || '').trim();
            }

            payload.email = String(values.get('email') || '')
                .trim()
                .toLowerCase();

            if (register && payload.cnpj.length !== 14) {
                return toast('Informe um CNPJ com 14 números.');
            }

            if (register) {
                endpoint = '/auth/register/ong';
            }
        } else {
            payload.type = 'beneficiary';
            payload.cpf = digits(values.get('cpf'));

            if (register) {
                payload.name = String(values.get('name') || '').trim();
                payload.phone = String(values.get('phone') || '').trim();

                if (payload.cpf.length !== 11) {
                    return toast('Informe um CPF com 11 números.');
                }

                endpoint = '/auth/register/beneficiary';
            }
        }

        if (register && password.length < 6) {
            return toast('A senha precisa ter pelo menos 6 caracteres.');
        }

        const button = form.querySelector('button[type="submit"], button.form-submit');

        if (button) button.disabled = true;

        try {
            const result = await api(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            token = result.token;
            account = result.account;
            accountType = result.type;

            localStorage.setItem(TOKEN_KEY, token);

            renderUser();

            toast(register
                ? 'Cadastro realizado com sucesso!'
                : 'Login realizado com sucesso!'
            );

            if (type === 'ong') {
                $('#ong-auth')?.classList.add('hidden');
                $('#ong-dashboard')?.classList.remove('hidden');

                const requestedTab =
                    new URLSearchParams(location.search).get('tab');

                if (requestedTab === 'validation') {
                    $('#ong-content').dataset.active = 'validate';
                }

                await renderOng();
            } else {
                const next =
                    new URLSearchParams(location.search).get('next')
                    || 'catalogo.html';

                location.href = next;
            }
        } catch (error) {
            toast(error.message);
        } finally {
            if (button) button.disabled = false;
        }
    }

    function initAuth(type) {
        let mode = 'login';

        $$('[data-auth-mode]').forEach(button => {
            button.addEventListener('click', () => {
                mode = button.dataset.authMode;

                $$('[data-auth-mode]').forEach(item => {
                    item.classList.toggle('active', item === button);
                });

                formatAuthForm(type, mode);
            });
        });

        formatAuthForm(type, mode);
    }

    // CATÁLOGO

    async function renderCatalog() {
        const query = ($('#catalog-search')?.value || '').trim();

        try {
            const products = await api(
                `/products?q=${encodeURIComponent(query)}`
            );

            $('#catalog-count').textContent =
                `${products.length} doações cadastradas`;

            $('#catalog-empty').classList.toggle(
                'hidden',
                products.length > 0
            );

            $('#product-grid').innerHTML = products.map(item => {
                const out = Number(item.quantity) <= 0;

                return `
                    <article class="product-card">
                        <div class="product-art">
                            <img
                                src="${esc(item.image || photos.community)}"
                                alt=""
                                loading="lazy"
                            >

                            <span class="stock-badge ${out ? 'out' : ''}">
                                ${out
                                    ? 'Estoque esgotado'
                                    : `${Number(item.quantity)} disponíveis`
                                }
                            </span>
                        </div>

                        <div class="product-info">
                            <p class="product-category">
                                ${esc(item.category)}
                            </p>

                            <h3>${esc(item.name)}</h3>

                            <p class="product-org">
                                Por ${esc(item.organization?.name || 'ONG parceira')}
                            </p>

                            <div class="product-stock">
                                <span>Disponibilidade</span>
                                <strong>
                                    ${out
                                        ? 'Lista de espera'
                                        : `${Number(item.quantity)} unidades`
                                    }
                                </strong>
                            </div>

                            <button
                                class="product-action ${out ? 'wait' : ''}"
                                data-request="${item.id}"
                            >
                                ${out
                                    ? 'Entrar na Lista de Espera'
                                    : 'Solicitar Doação'
                                }
                            </button>
                        </div>
                    </article>
                `;
            }).join('');
        } catch (error) {
            toast(error.message);
        }
    }

    async function requestProduct(productId) {
        if (!requireBeneficiary()) return;

        try {
            const result = await api(
                `/products/${productId}/request`,
                { method: 'POST' }
            );

            toast(result.message || 'Solicitação realizada com sucesso.');

            await renderCatalog();
        } catch (error) {
            toast(error.message);
        }
    }

    // PEDIDOS DO BENEFICIÁRIO

    async function renderOrders() {
        try {
            const orders = await api('/orders/mine');

            $('#orders-list').innerHTML = orders.length
                ? orders.map(order => {
                    const item = order.product;
                    const organization = item?.organization;

                    const approved =
                        order.status === 'Aprovado - Voucher Enviado';

                    const completed =
                        order.status === 'Entregue / Concluído';

                    return `
                        <article class="workspace-item">
                            <div class="workspace-item-copy">
                                <span class="product-category">
                                    ${esc(item?.category || 'Doação')}
                                </span>

                                <h2>${esc(item?.name || 'Item indisponível')}</h2>

                                <p>
                                    ${esc(organization?.name || 'ONG parceira')}
                                    ·
                                    ${order.createdAt
                                        ? new Date(order.createdAt).toLocaleDateString('pt-BR')
                                        : ''
                                    }
                                </p>

                                <span class="status-pill ${
                                    completed ? 'done' : approved ? '' : 'pending'
                                }">
                                    ${esc(order.status)}
                                </span>
                            </div>

                            ${approved ? `
                                <div class="voucher-digital">
                                    <strong>Voucher de retirada</strong>
                                    <code>${esc(order.voucher)}</code>
                                    <p>
                                        Apresente este código em
                                        ${esc(organization?.name || 'sua ONG')}.
                                    </p>
                                </div>
                            ` : ''}
                        </article>
                    `;
                }).join('')
                : `
                    <div class="empty-state">
                        Você ainda não fez solicitações.
                        <a href="catalogo.html">Explore o catálogo.</a>
                    </div>
                `;
        } catch (error) {
            toast(error.message);
        }
    }

    // LISTA DE ESPERA DO BENEFICIÁRIO

    async function renderBeneficiaryWaitlist() {
        try {
            const entries = await api('/waitlist/mine');

            $('#waitlist-list').innerHTML = entries.length
                ? entries.map(entry => {
                    const item = entry.product;

                    return `
                        <article class="workspace-item">
                            <div class="workspace-item-copy">
                                <span class="product-category">
                                    ${esc(item?.category || 'Doação')}
                                </span>

                                <h2>${esc(item?.name || 'Item indisponível')}</h2>

                                <p>
                                    ${esc(item?.organization?.name || 'ONG parceira')}
                                </p>
                            </div>

                            <div class="queue-position">
                                <strong>${entry.position || 1}º</strong>
                                <span>na fila</span>
                                <small>${esc(entry.status)}</small>
                            </div>
                        </article>
                    `;
                }).join('')
                : `
                    <div class="empty-state">
                        Você ainda não entrou em uma lista de espera.
                        <a href="catalogo.html">Ver doações esgotadas.</a>
                    </div>
                `;
        } catch (error) {
            toast(error.message);
        }
    }

    // PAINEL DA ONG

    async function renderOng() {
        if (!account || accountType !== 'ong') return;

        $('#ong-title').textContent = account.name;
        $('#ong-location').textContent = account.city || 'Instituição parceira';

        const active = $('#ong-content').dataset.active || 'orders';

        $('#ong-content').dataset.active = active;

        $$('[data-ong-tab]').forEach(button => {
            button.classList.toggle(
                'active',
                button.dataset.ongTab === active
            );
        });

        if (active === 'stock') {
            await renderOngStock();
        } else if (active === 'waitlist') {
            await renderOngWaitlist();
        } else if (active === 'validate') {
            renderValidation();
        } else {
            await renderOngOrders();
        }
    }

    async function renderOngOrders() {
        try {
            const orders = await api('/ong/orders');

            const pending = orders.filter(order =>
                order.status === 'Aguardando aprovação da ONG'
            );

            $('#ong-content').innerHTML = `
                <div class="workspace-section-title">
                    <h3>Pedidos para analisar</h3>
                    <span>${pending.length} pendentes</span>
                </div>

                ${pending.length
                    ? `
                        <div class="workspace-list">
                            ${pending.map(order => `
                                <article class="workspace-item">
                                    <div class="workspace-item-copy">
                                        <h2>
                                            ${esc(order.beneficiary?.name || 'Beneficiário')}
                                        </h2>

                                        <p>
                                            CPF ${esc(order.beneficiary?.cpf || '')}
                                            ·
                                            ${esc(order.product?.name || '')}
                                            ·
                                            ${order.createdAt
                                                ? new Date(order.createdAt).toLocaleString('pt-BR')
                                                : ''
                                            }
                                        </p>
                                    </div>

                                    <div class="item-actions">
                                        <button
                                            class="small-action primary"
                                            data-approve="${order.id}"
                                        >
                                            Aceitar e enviar voucher
                                        </button>

                                        <button
                                            class="small-action danger"
                                            data-reject="${order.id}"
                                        >
                                            Recusar pedido
                                        </button>
                                    </div>
                                </article>
                            `).join('')}
                        </div>
                    `
                    : `
                        <div class="empty-state">
                            Nenhum pedido pendente para sua instituição.
                        </div>
                    `
                }
            `;
        } catch (error) {
            toast(error.message);
        }
    }

    async function renderOngStock() {
        try {
            const products = await api('/products');

            const items = products.filter(item =>
                Number(item.organizationId) === Number(account.id)
            );

            $('#ong-content').innerHTML = `
                <div class="workspace-section-title">
                    <h3>Estoque da instituição</h3>
                    <span>${items.length} itens</span>
                </div>

                <form id="new-product-form" class="workspace-form workspace-product-form">
                    <div class="field">
                        <label>Nome do item</label>
                        <input name="name" required placeholder="Ex.: Cesta básica">
                    </div>

                    <div class="field">
                        <label>Categoria</label>
                        <select name="category">
                            <option>Alimentos</option>
                            <option>Higiene</option>
                            <option>Vestuário</option>
                            <option>Infantil</option>
                            <option>Outros</option>
                        </select>
                    </div>

                    <div class="field">
                        <label>Quantidade</label>
                        <input name="quantity" type="number" min="0" value="1" required>
                    </div>

                    <button class="form-submit">Publicar doação</button>
                </form>

                <div class="workspace-list">
                    ${items.length
                        ? items.map(item => `
                            <article class="workspace-item">
                                <div class="workspace-item-copy">
                                    <h2>${esc(item.name)}</h2>
                                    <p>
                                        ${esc(item.category)}
                                        ·
                                        ${Number(item.quantity)} unidades disponíveis
                                    </p>
                                </div>

                                <button
                                    class="small-action"
                                    data-restock="${item.id}"
                                >
                                    + Repor 1
                                </button>
                            </article>
                        `).join('')
                        : `
                            <div class="empty-state">
                                Cadastre a primeira doação.
                            </div>
                        `
                    }
                </div>
            `;

            $('#new-product-form').onsubmit = async event => {
                event.preventDefault();

                const values = new FormData(event.currentTarget);

                const payload = {
                    name: String(values.get('name')).trim(),
                    category: String(values.get('category')),
                    quantity: Number(values.get('quantity')),
                    image: photos.community
                };

                try {
                    await api('/products', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });

                    toast('Doação publicada no catálogo.');
                    await renderOngStock();
                } catch (error) {
                    toast(error.message);
                }
            };
        } catch (error) {
            toast(error.message);
        }
    }

    async function renderOngWaitlist() {
        try {
            const entries = await api('/ong/waitlist');

            $('#ong-content').innerHTML = `
                <div class="workspace-section-title">
                    <h3>Fila de oportunidade</h3>
                    <span>${entries.length} aguardando</span>
                </div>

                <p class="form-hint">
                    A ordem de chegada é preservada.
                    Reponha o item antes de liberar uma vaga.
                </p>

                ${entries.length
                    ? `
                        <div class="workspace-list">
                            ${entries.map(entry => `
                                <article class="workspace-item">
                                    <div class="workspace-item-copy">
                                        <h2>
                                            ${entry.position || 1}º ·
                                            ${esc(entry.beneficiary?.name || 'Beneficiário')}
                                        </h2>

                                        <p>
                                            CPF ${esc(entry.beneficiary?.cpf || '')}
                                            ·
                                            ${esc(entry.product?.name || '')}
                                        </p>
                                    </div>

                                    <button
                                        class="small-action primary"
                                        data-release="${entry.id}"
                                        ${Number(entry.product?.quantity) > 0 ? '' : 'disabled'}
                                    >
                                        Liberar vaga / notificar
                                    </button>
                                </article>
                            `).join('')}
                        </div>
                    `
                    : `
                        <div class="empty-state">
                            Nenhuma pessoa na fila neste momento.
                        </div>
                    `
                }
            `;
        } catch (error) {
            toast(error.message);
        }
    }

    function renderValidation() {
        $('#ong-content').innerHTML = `
            <div class="workspace-section-title">
                <h3>Validar voucher de retirada</h3>
            </div>

            <p class="form-hint">
                Digite o código apresentado pelo beneficiário.
                O voucher precisa pertencer à sua instituição.
            </p>

            <form id="validate-form" class="workspace-form validation-form">
                <div class="field">
                    <label for="voucher-code">Código do voucher</label>
                    <input
                        id="voucher-code"
                        name="code"
                        required
                        placeholder="VCH-2026-ABC123"
                    >
                </div>

                <button class="form-submit">Confirmar retirada</button>
            </form>

            <div id="validation-result"></div>
        `;

        $('#validate-form').onsubmit = async event => {
            event.preventDefault();

            const code = String(
                new FormData(event.currentTarget).get('code')
            ).trim().toUpperCase();

            try {
                const result = await api('/ong/vouchers/validate', {
                    method: 'POST',
                    body: JSON.stringify({ code })
                });

                $('#validation-result').innerHTML = `
                    <div class="notice">
                        ${esc(result.message || 'Retirada confirmada. Pedido concluído.')}
                    </div>
                `;

                toast('Voucher validado com sucesso.');
            } catch (error) {
                $('#validation-result').innerHTML = `
                    <div class="notice error">${esc(error.message)}</div>
                `;

                toast(error.message);
            }
        };
    }

    // AÇÕES DA ONG

    async function approve(orderId) {
        try {
            const result = await api(
                `/ong/orders/${orderId}/approve`,
                { method: 'POST' }
            );

            toast(`Pedido aprovado. Voucher ${result.voucher} gerado.`);
            await renderOngOrders();
        } catch (error) {
            toast(error.message);
        }
    }

    async function reject(orderId) {
        try {
            await api(
                `/ong/orders/${orderId}/reject`,
                { method: 'POST' }
            );

            toast('Pedido recusado e unidade devolvida ao estoque.');
            await renderOngOrders();
        } catch (error) {
            toast(error.message);
        }
    }

    async function restock(productId) {
        try {
            await api(
                `/products/${productId}/restock`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ quantity: 1 })
                }
            );

            toast('Estoque reposto com sucesso.');
            await renderOngStock();
        } catch (error) {
            toast(error.message);
        }
    }

    async function release(entryId) {
        try {
            const result = await api(
                `/ong/waitlist/${entryId}/release`,
                { method: 'POST' }
            );

            toast(result.message || 'Vaga liberada com sucesso.');
            await renderOngWaitlist();
        } catch (error) {
            toast(error.message);
        }
    }

    // EVENTOS GERAIS

    document.addEventListener('click', event => {
        const tab = event.target.closest('[data-ong-tab]');

        if (tab) {
            $('#ong-content').dataset.active = tab.dataset.ongTab;
            renderOng();
            return;
        }

        const request = event.target.closest('[data-request]');
        if (request) {
            requestProduct(request.dataset.request);
            return;
        }

        const accept = event.target.closest('[data-approve]');
        if (accept) {
            approve(accept.dataset.approve);
            return;
        }

        const decline = event.target.closest('[data-reject]');
        if (decline) {
            reject(decline.dataset.reject);
            return;
        }

        const restockButton = event.target.closest('[data-restock]');
        if (restockButton) {
            restock(restockButton.dataset.restock);
            return;
        }

        const releaseButton = event.target.closest('[data-release]');
        if (releaseButton) {
            release(releaseButton.dataset.release);
            return;
        }

        if (event.target.closest('#logout-button')) {
            logout();
        }
    });

    // INICIALIZAÇÃO

    async function initPage() {
        await restoreSession();

        renderUser();

        if (page === 'ong') {
            if (accountType === 'ong') {
                $('#ong-auth')?.classList.add('hidden');
                $('#ong-dashboard')?.classList.remove('hidden');

                const requestedTab =
                    new URLSearchParams(location.search).get('tab');

                if (requestedTab === 'validation') {
                    $('#ong-content').dataset.active = 'validate';
                }

                await renderOng();
            } else {
                initAuth('ong');
            }

            return;
        }

        if (page === 'beneficiary-auth') {
            if (accountType === 'beneficiary') {
                const next =
                    new URLSearchParams(location.search).get('next')
                    || 'catalogo.html';

                location.href = next;
                return;
            }

            initAuth('beneficiary');
            return;
        }

        if (page === 'catalog') {
            await renderCatalog();

            $('#catalog-search')?.addEventListener('input', renderCatalog);
            return;
        }

        if (!requireBeneficiary()) return;

        if (page === 'orders') {
            await renderOrders();
        } else if (page === 'waitlist') {
            await renderBeneficiaryWaitlist();
        }
    }

    initPage();
})();
