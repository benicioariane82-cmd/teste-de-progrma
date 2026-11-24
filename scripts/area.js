(() => {
    const KEY = 'conecta_demo_v1';
    const SESSION = 'conecta_demo_session';
    const photos = {
        food: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=700&q=80',
        people: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80',
        community: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80'
    };
    const seed = {
        organizations: [
            { id: 'ong-teko', name: 'Instituto Teko Porã', cnpj: '12345678000190', city: 'Vila Mariana · São Paulo, SP', email: 'contato@tekopora.org', password: 'Teko2026!', description: 'Acolhimento e segurança alimentar para famílias da comunidade.', image: photos.people },
            { id: 'ong-acolhe', name: 'Rede Acolhe', cnpj: '98765432000110', city: 'Santo Amaro · São Paulo, SP', email: 'acolhe@rede.org', password: 'Acolhe2026!', description: 'Apoio comunitário, cuidado e oportunidades para recomeçar.', image: photos.community }
        ],
        beneficiaries: [{ id: 'benef-demo', name: 'Mariana Oliveira', cpf: '12345678909', phone: '(11) 99999-1234', password: 'Demo2026!' }],
        products: [
            { id: 'prod-cesta', organizationId: 'ong-teko', name: 'Cesta Básica Completa', category: 'Alimentos', quantity: 12, image: photos.food },
            { id: 'prod-higiene', organizationId: 'ong-acolhe', name: 'Kit Higiene Pessoal', category: 'Higiene', quantity: 8, image: photos.community },
            { id: 'prod-leite', organizationId: 'ong-teko', name: 'Leite em Pó Integral', category: 'Alimentos', quantity: 0, image: photos.food },
            { id: 'prod-agasalho', organizationId: 'ong-acolhe', name: 'Agasalhos Infantis', category: 'Vestuário', quantity: 5, image: photos.community }
        ],
        orders: [], waitlist: []
    };
    let data;
    try {
        data = JSON.parse(localStorage.getItem(KEY));
        if (!data || !Array.isArray(data.products)) throw new Error('Invalid store');
        data.orders ||= [];
        data.waitlist ||= [];
        data.organizations ||= [];
        data.beneficiaries ||= [];
    } catch (error) {
        data = seed;
        localStorage.setItem(KEY, JSON.stringify(data));
    }
    let session = null;
    try { session = JSON.parse(localStorage.getItem(SESSION)); } catch (error) { session = null; }
    const page = document.body.dataset.area;
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const digits = value => String(value || '').replace(/\D/g, '');
    const id = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const getAccount = (type, accountId) => (type === 'ong' ? data.organizations : data.beneficiaries).find(account => account.id === accountId);
    const currentAccount = () => session && getAccount(session.type, session.id);
    const productOrg = product => data.organizations.find(organization => organization.id === product?.organizationId);
    const currentPage = location.pathname.split('/').pop();

    function persist() { localStorage.setItem(KEY, JSON.stringify(data)); }
    function toast(message) {
        const region = $('#toast-region');
        if (!region) return;
        const item = document.createElement('div');
        item.className = 'toast';
        item.innerHTML = `<span class="toast-mark">✓</span><span>${esc(message)}</span>`;
        region.append(item);
        setTimeout(() => item.remove(), 3600);
    }
    function renderUser() {
        const label = $('#account-name');
        const logout = $('#logout-button');
        const account = currentAccount();
        if (label) label.textContent = account ? `Olá, ${account.name.split(' ')[0]}` : '';
        if (logout) logout.classList.toggle('hidden', !account);
    }
    function endSession() {
        session = null;
        localStorage.removeItem(SESSION);
        location.href = '../index.html';
    }
    function createSession(type, account, token) {
    const accounts = type === 'ong'
        ? data.organizations
        : data.beneficiaries;

    const existingIndex = accounts.findIndex(item => item.id === account.id);

    if (existingIndex >= 0) {
        accounts[existingIndex] = { ...accounts[existingIndex], ...account };
    } else {
        accounts.push({ ...account });
    }

    session = { type, id: account.id };

    localStorage.setItem(SESSION, JSON.stringify(session));

    if (token) {
        localStorage.setItem('conecta_api_token', token);
    }

    persist();

    if (type === 'ong') {
        $('#ong-auth')?.classList.add('hidden');
        $('#ong-dashboard')?.classList.remove('hidden');

        if (new URLSearchParams(location.search).get('tab') === 'validation') {
            $('#ong-content').dataset.active = 'validate';
        }

        renderUser();
        renderOng();
    } else {
        const next = new URLSearchParams(location.search).get('next') || 'catalogo.html';
        location.href = next;
    }

    toast('Acesso realizado com sucesso.');
}
    function redirectToBeneficiary() {
        location.href = `beneficiario.html?next=${encodeURIComponent(currentPage)}`;
    }
    function guardBeneficiary() {
        if (!session || session.type !== 'beneficiary' || !currentAccount()) {
            location.href = `beneficiario.html?next=${encodeURIComponent(currentPage)}`;
            return false;
        }
        renderUser();
        return true;
    }

    function formatAuthForm(type, mode) {
        const form = type === 'ong' ? $('#ong-form') : $('#benef-form');
        const register = mode === 'register';
        if (!form) return;
        if (type === 'ong') {
            form.innerHTML = register
                ? `<div class="field"><label for="auth-name">Nome da instituição</label><input id="auth-name" name="name" required></div>
                   <div class="form-grid"><div class="field"><label for="auth-cnpj">CNPJ</label><input id="auth-cnpj" name="cnpj" inputmode="numeric" maxlength="14" required></div><div class="field"><label for="auth-city">Cidade / Bairro</label><input id="auth-city" name="city" required></div></div>
                   <div class="field"><label for="auth-email">E-mail</label><input id="auth-email" name="email" type="email" required></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" minlength="6" required></div><button class="form-submit">Cadastrar instituição</button>`
                : `<div class="field"><label for="auth-email">E-mail da instituição</label><input id="auth-email" name="email" type="email" required></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" required></div><button class="form-submit">Entrar no painel</button>`;
        } else {
            $('#benef-auth-title').textContent = register ? 'Crie sua conta' : 'Entre na sua conta';
            form.innerHTML = register
                ? `<div class="field"><label for="auth-name">Nome completo</label><input id="auth-name" name="name" required></div><div class="form-grid"><div class="field"><label for="auth-cpf">CPF</label><input id="auth-cpf" name="cpf" inputmode="numeric" maxlength="11" required></div><div class="field"><label for="auth-phone">Telefone / WhatsApp</label><input id="auth-phone" name="phone" type="tel" required></div></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" minlength="6" required></div><button class="form-submit">Criar cadastro</button>`
                : `<div class="field"><label for="auth-cpf">CPF</label><input id="auth-cpf" name="cpf" inputmode="numeric" maxlength="11" required placeholder="Somente números"></div><div class="field"><label for="auth-password">Senha</label><input id="auth-password" name="password" type="password" required></div><button class="form-submit">Entrar como beneficiário</button>`;
        }
        form.onsubmit = event => submitAuth(event, type, register);
    }


async function submitAuth(event, type, register) {
    event.preventDefault();

    const values = new FormData(event.currentTarget);
    const password = String(values.get('password') || '');

    const payload = {
        type,
        password
    };

    if (type === 'beneficiary') {
        payload.cpf = digits(values.get('cpf'));

        if (register) {
            payload.name = String(values.get('name') || '').trim();
            payload.phone = String(values.get('phone') || '').trim();
        }
    } else {
        payload.email = String(values.get('email') || '').trim().toLowerCase();
    }

    if (register && password.length < 6) {
        return toast('A senha precisa ter pelo menos 6 caracteres.');
    }

    if (register && type === 'beneficiary' && payload.cpf.length !== 11) {
        return toast('Informe um CPF com 11 números.');
    }

    const endpoint = register && type === 'beneficiary'
        ? 'register/beneficiary'
        : 'login';

    try {
        const response = await fetch(
            `http://127.0.0.1:5000/api/auth/${endpoint}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            return toast(result.message || result.error || 'Não foi possível realizar o acesso.');
        }

        localStorage.setItem('conecta_api_token', result.token);

        toast(register ? 'Cadastro realizado com sucesso!' : 'Login realizado com sucesso!');

        if (type === 'beneficiary') {
            const next = new URLSearchParams(location.search).get('next') || 'catalogo.html';
            location.href = next;
        }
    } catch (error) {
        toast('Não foi possível conectar ao servidor Flask.');
        console.error(error);
    }
}

    function initAuth(type) {
        let mode = 'login';
        const form = type === 'ong' ? $('#ong-form') : $('#benef-form');
        $$('[data-auth-mode]').forEach(button => button.addEventListener('click', () => {
            mode = button.dataset.authMode;
            $$('[data-auth-mode]').forEach(item => item.classList.toggle('active', item === button));
            formatAuthForm(type, mode);
        }));
        formatAuthForm(type, mode);
        if (type === 'ong' && session?.type === 'ong' && currentAccount()) {
            $('#ong-auth').classList.add('hidden');
            $('#ong-dashboard').classList.remove('hidden');
            if (new URLSearchParams(location.search).get('tab') === 'validation') $('#ong-content').dataset.active = 'validate';
            renderOng();
        }
        if (type === 'beneficiary' && session?.type === 'beneficiary' && currentAccount()) {
            location.href = new URLSearchParams(location.search).get('next') || 'catalogo.html';
        }
        form?.querySelector('input')?.focus();
    }

    function renderCatalog() {
        const query = ($('#catalog-search')?.value || '').trim().toLocaleLowerCase('pt-BR');
        const products = data.products.filter(item => `${item.name} ${item.category} ${productOrg(item)?.name || ''}`.toLocaleLowerCase('pt-BR').includes(query));
        $('#catalog-count').textContent = `${data.products.length} doações cadastradas`;
        $('#catalog-empty').classList.toggle('hidden', products.length > 0);
        $('#product-grid').innerHTML = products.map(item => {
            const out = Number(item.quantity) <= 0;
            const queued = session?.type === 'beneficiary' && data.waitlist.some(entry => entry.productId === item.id && entry.beneficiaryId === session.id);
            return `<article class="product-card"><div class="product-art"><img src="${esc(item.image || photos.community)}" alt="" loading="lazy"><span class="stock-badge ${out ? 'out' : ''}">${out ? 'Estoque esgotado' : `${Number(item.quantity)} disponíveis`}</span></div><div class="product-info"><p class="product-category">${esc(item.category)}</p><h3>${esc(item.name)}</h3><p class="product-org">Por ${esc(productOrg(item)?.name || 'ONG parceira')}</p><div class="product-stock"><span>Disponibilidade</span><strong>${out ? 'Lista de espera' : `${Number(item.quantity)} unidades`}</strong></div><button class="product-action ${out ? 'wait' : ''}" data-request="${esc(item.id)}" ${queued ? 'disabled' : ''}>${queued ? 'Você está na lista de espera' : out ? 'Entrar na Lista de Espera' : 'Solicitar Doação'}</button></div></article>`;
        }).join('');
    }
    function requestProduct(productId) {
        if (!session || session.type !== 'beneficiary') return redirectToBeneficiary();
        const item = data.products.find(product => product.id === productId);
        if (!item) return;
        if (Number(item.quantity) <= 0) {
            if (data.waitlist.some(entry => entry.productId === item.id && entry.beneficiaryId === session.id)) return toast('Você já está na lista de espera deste item.');
            data.waitlist.push({ id: id('fila'), productId: item.id, beneficiaryId: session.id, createdAt: new Date().toISOString(), status: 'Aguardando vaga' });
            persist(); renderCatalog();
            const position = data.waitlist.filter(entry => entry.productId === item.id).length;
            toast(`Você é ${position}º da fila de espera para ${item.name}.`);
            return;
        }
        item.quantity--;
        data.orders.push({ id: id('pedido'), productId: item.id, beneficiaryId: session.id, createdAt: new Date().toISOString(), status: 'Aguardando aprovação da ONG', voucher: '' });
        persist(); renderCatalog();
        toast('Solicitação enviada. Acompanhe o status na tela Meus pedidos.');
    }
    function renderOrders() {
        const orders = data.orders.filter(order => order.beneficiaryId === session.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        $('#orders-list').innerHTML = orders.length ? orders.map(order => {
            const item = data.products.find(product => product.id === order.productId);
            const organization = productOrg(item);
            const approved = order.status === 'Aprovado - Voucher Enviado';
            return `<article class="workspace-item"><div class="workspace-item-copy"><span class="product-category">${esc(item?.category || 'Doação')}</span><h2>${esc(item?.name || 'Item indisponível')}</h2><p>${esc(organization?.name || 'ONG parceira')} · ${new Date(order.createdAt).toLocaleDateString('pt-BR')}</p><span class="status-pill ${approved ? '' : order.status === 'Entregue / Concluído' ? 'done' : 'pending'}">${esc(order.status)}</span></div>${approved ? `<div class="voucher-digital"><strong>Voucher de retirada</strong><code>${esc(order.voucher)}</code><p>Apresente este código em ${esc(organization?.name || 'sua ONG')}.</p></div>` : ''}</article>`;
        }).join('') : '<div class="empty-state">Você ainda não fez solicitações. <a href="catalogo.html">Explore o catálogo.</a></div>';
    }
    function renderBeneficiaryWaitlist() {
        const entries = data.waitlist.filter(entry => entry.beneficiaryId === session.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        $('#waitlist-list').innerHTML = entries.length ? entries.map(entry => {
            const item = data.products.find(product => product.id === entry.productId);
            const position = data.waitlist.filter(row => row.productId === entry.productId).findIndex(row => row.id === entry.id) + 1;
            return `<article class="workspace-item"><div class="workspace-item-copy"><span class="product-category">${esc(item?.category || 'Doação')}</span><h2>${esc(item?.name || 'Item indisponível')}</h2><p>${esc(productOrg(item)?.name || 'ONG parceira')}</p></div><div class="queue-position"><strong>${position}º</strong><span>na fila</span><small>${esc(entry.status)}</small></div></article>`;
        }).join('') : '<div class="empty-state">Você ainda não entrou em uma lista de espera. <a href="catalogo.html">Ver doações esgotadas.</a></div>';
    }

    function renderOng() {
        if (!currentAccount()) return;
        $('#ong-title').textContent = currentAccount().name;
        $('#ong-location').textContent = currentAccount().city || 'Instituição parceira';
        const active = $('#ong-content').dataset.active || 'orders';
        $('#ong-content').dataset.active = active;
        $$('[data-ong-tab]').forEach(button => button.classList.toggle('active', button.dataset.ongTab === active));
        if (active === 'stock') renderOngStock();
        else if (active === 'waitlist') renderOngWaitlist();
        else if (active === 'validate') renderValidation();
        else renderOngOrders();
    }
    function renderOngOrders() {
        const orders = data.orders.filter(order => order.status === 'Aguardando aprovação da ONG' && data.products.find(item => item.id === order.productId)?.organizationId === session.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        $('#ong-content').innerHTML = `<div class="workspace-section-title"><h3>Pedidos para analisar</h3><span>${orders.length} pendentes</span></div>${orders.length ? `<div class="workspace-list">${orders.map(order => { const item = data.products.find(product => product.id === order.productId), person = data.beneficiaries.find(user => user.id === order.beneficiaryId); return `<article class="workspace-item"><div class="workspace-item-copy"><h2>${esc(person?.name || 'Beneficiário')}</h2><p>CPF ${esc(person?.cpf || '')} · ${esc(item?.name || '')} · ${new Date(order.createdAt).toLocaleString('pt-BR')}</p></div><div class="item-actions"><button class="small-action primary" data-approve="${esc(order.id)}">Aceitar e enviar voucher</button><button class="small-action danger" data-reject="${esc(order.id)}">Recusar pedido</button></div></article>`; }).join('')}</div>` : '<div class="empty-state">Nenhum pedido pendente para sua instituição.</div>'}`;
    }
    function renderOngStock() {
        const items = data.products.filter(item => item.organizationId === session.id);
        $('#ong-content').innerHTML = `<div class="workspace-section-title"><h3>Estoque da instituição</h3><span>${items.length} itens</span></div><form id="new-product-form" class="workspace-form workspace-product-form"><div class="field"><label>Nome do item</label><input name="name" required placeholder="Ex.: Cesta básica"></div><div class="field"><label>Categoria</label><select name="category"><option>Alimentos</option><option>Higiene</option><option>Vestuário</option><option>Infantil</option><option>Outros</option></select></div><div class="field"><label>Quantidade</label><input name="quantity" type="number" min="0" value="1" required></div><button class="form-submit">Publicar doação</button></form><div class="workspace-list">${items.length ? items.map(item => `<article class="workspace-item"><div class="workspace-item-copy"><h2>${esc(item.name)}</h2><p>${esc(item.category)} · ${Number(item.quantity)} unidades disponíveis</p></div><button class="small-action" data-restock="${esc(item.id)}">+ Repor 1</button></article>`).join('') : '<div class="empty-state">Cadastre a primeira doação.</div>'}</div>`;
        $('#new-product-form').onsubmit = event => {
            event.preventDefault(); const values = new FormData(event.currentTarget);
            data.products.push({ id: id('prod'), organizationId: session.id, name: String(values.get('name')).trim(), category: String(values.get('category')), quantity: Math.max(0, Number(values.get('quantity')) || 0), image: photos.community });
            persist(); renderOng(); toast('Doação publicada no catálogo.');
        };
    }
    function renderOngWaitlist() {
        const entries = data.waitlist.filter(entry => data.products.find(item => item.id === entry.productId)?.organizationId === session.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        $('#ong-content').innerHTML = `<div class="workspace-section-title"><h3>Fila de oportunidade</h3><span>${entries.length} aguardando</span></div><p class="form-hint">A ordem de chegada é preservada. Reponha o item antes de liberar uma vaga.</p>${entries.length ? `<div class="workspace-list">${entries.map((entry, index) => { const item = data.products.find(product => product.id === entry.productId), person = data.beneficiaries.find(user => user.id === entry.beneficiaryId); return `<article class="workspace-item"><div class="workspace-item-copy"><h2>${index + 1}º · ${esc(person?.name || 'Beneficiário')}</h2><p>CPF ${esc(person?.cpf || '')} · ${esc(item?.name || '')}</p></div><button class="small-action primary" data-release="${esc(entry.id)}" ${Number(item?.quantity) > 0 ? '' : 'disabled'}>Liberar vaga / notificar</button></article>`; }).join('')}</div>` : '<div class="empty-state">Nenhuma pessoa na fila neste momento.</div>'}`;
    }
    function renderValidation() {
        $('#ong-content').innerHTML = `<div class="workspace-section-title"><h3>Validar voucher de retirada</h3></div><p class="form-hint">Digite o código apresentado pelo beneficiário. O voucher precisa pertencer à sua instituição.</p><form id="validate-form" class="workspace-form validation-form"><div class="field"><label for="voucher-code">Código do voucher</label><input id="voucher-code" name="code" required placeholder="VCH-2026-849"></div><button class="form-submit">Confirmar retirada</button></form><div id="validation-result"></div>`;
        $('#validate-form').onsubmit = event => {
            event.preventDefault(); const code = String(new FormData(event.currentTarget).get('code')).trim().toUpperCase();
            const order = data.orders.find(item => item.voucher === code && item.status === 'Aprovado - Voucher Enviado' && data.products.find(product => product.id === item.productId)?.organizationId === session.id);
            if (!order) { $('#validation-result').innerHTML = '<div class="notice error">Código inválido, já usado ou vinculado a outra instituição.</div>'; return toast('Voucher não validado.'); }
            order.status = 'Entregue / Concluído'; order.deliveredAt = new Date().toISOString(); persist();
            $('#validation-result').innerHTML = '<div class="notice">Retirada confirmada. Pedido concluído.</div>'; toast('Voucher validado com sucesso.');
        };
    }
    function approve(orderId) {
        const order = data.orders.find(item => item.id === orderId);
        if (!order || order.status !== 'Aguardando aprovação da ONG') return;
        let code;
        do { code = `VCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`; } while (data.orders.some(item => item.voucher === code));
        order.status = 'Aprovado - Voucher Enviado'; order.voucher = code; order.approvedAt = new Date().toISOString();
        persist(); renderOng(); toast(`Pedido aprovado. Voucher ${code} gerado.`);
    }
    function reject(orderId) {
        const order = data.orders.find(item => item.id === orderId); if (!order) return;
        const item = data.products.find(product => product.id === order.productId); if (item) item.quantity++;
        order.status = 'Pedido recusado'; persist(); renderOng(); toast('Pedido recusado e unidade devolvida ao estoque.');
    }
    function release(entryId) {
        const index = data.waitlist.findIndex(entry => entry.id === entryId); if (index < 0) return;
        const entry = data.waitlist[index], item = data.products.find(product => product.id === entry.productId);
        if (!item || Number(item.quantity) < 1) return toast('Reponha o estoque antes de liberar a vaga.');
        item.quantity--;
        data.orders.push({ id: id('pedido'), productId: item.id, beneficiaryId: entry.beneficiaryId, createdAt: new Date().toISOString(), status: 'Aguardando aprovação da ONG', voucher: '', fromWaitlist: true });
        data.waitlist.splice(index, 1); persist(); renderOng(); toast('Vaga liberada. O pedido seguirá para aprovação.');
    }
    function initPage() {
        renderUser();
        if (page === 'ong') return initAuth('ong');
        if (page === 'beneficiary-auth') return initAuth('beneficiary');
        if (page === 'catalog') {
            renderCatalog(); $('#catalog-search').addEventListener('input', renderCatalog);
            if (session?.type === 'beneficiary') renderUser();
            return;
        }
        if (!guardBeneficiary()) return;
        if (page === 'orders') renderOrders();
        if (page === 'waitlist') renderBeneficiaryWaitlist();
    }
    document.addEventListener('click', event => {
        const mode = event.target.closest('[data-auth-mode]');
        if (mode) { $$('[data-auth-mode]').forEach(button => button.classList.toggle('active', button === mode)); return; }
        const tab = event.target.closest('[data-ong-tab]');
        if (tab) { $('#ong-content').dataset.active = tab.dataset.ongTab; renderOng(); return; }
        const request = event.target.closest('[data-request]'); if (request && !request.disabled) return requestProduct(request.dataset.request);
        const accept = event.target.closest('[data-approve]'); if (accept) return approve(accept.dataset.approve);
        const decline = event.target.closest('[data-reject]'); if (decline) return reject(decline.dataset.reject);
        const restock = event.target.closest('[data-restock]');
        if (restock) { const item = data.products.find(product => product.id === restock.dataset.restock); if (item) { item.quantity++; persist(); renderOng(); toast(`Estoque de ${item.name} reposto.`); } return; }
        const releaseButton = event.target.closest('[data-release]'); if (releaseButton) release(releaseButton.dataset.release);
        if (event.target.closest('#logout-button')) endSession();
    });
    initPage();
})();
