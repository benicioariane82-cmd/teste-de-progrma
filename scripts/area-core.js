(() => {
    const key = 'conecta_demo_v1';
    const sessionKey = 'conecta_demo_session';
    const photos = {
        food: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=700&q=80',
        people: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80',
        community: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80'
    };
    const seed = {
        organizations: [],
        beneficiaries: [],
        products: [],
        orders: [],
        waitlist: [],
        contributions: []
    };
    let data;
    try {
        data = JSON.parse(localStorage.getItem(key));
        if (!data || !Array.isArray(data.products)) throw new Error('Invalid store');
        data.orders ||= [];
        data.waitlist ||= [];
        data.organizations ||= [];
        data.beneficiaries ||= [];
    } catch (error) {
        data = seed;
        localStorage.setItem(key, JSON.stringify(data));
    }
    data.contributions ||= [];

    let session = null;
    try {
        session = JSON.parse(localStorage.getItem(sessionKey));
    } catch (error) {
        session = null;
    }

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
    const digits = value => String(value || '').replace(/\D/g, '');
    const id = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const getAccount = (type, accountId) => (type === 'ong' ? data.organizations : data.beneficiaries)
        .find(account => account.id === accountId);
    const currentAccount = () => session && getAccount(session.type, session.id);
    const productOrg = product => data.organizations.find(organization => organization.id === product?.organizationId);
    const currentPage = location.pathname.split('/').pop();

    function persist() {
        localStorage.setItem(key, JSON.stringify(data));
    }

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
        localStorage.removeItem(sessionKey);
        location.href = '../index.html';
    }

    function createSession(type, account) {
        session = { type, id: account.id };
        localStorage.setItem(sessionKey, JSON.stringify(session));
        persist();
        if (type === 'ong') {
            $('#ong-auth')?.classList.add('hidden');
            $('#ong-dashboard')?.classList.remove('hidden');
            if (new URLSearchParams(location.search).get('tab') === 'validation') {
                $('#ong-content').dataset.active = 'validate';
            }
            renderUser();
            window.ConectaPages.ong.render();
        } else {
            const next = new URLSearchParams(location.search).get('next') || 'catalogo.html';
            location.href = next;
        }
        toast('Acesso realizado com sucesso.');
    }

    function guardBeneficiary() {
        if (!session || session.type !== 'beneficiary' || !currentAccount()) {
            location.href = `beneficiario.html?next=${encodeURIComponent(currentPage)}`;
            return false;
        }
        renderUser();
        return true;
    }

    document.addEventListener('click', event => {
        if (event.target.closest('#logout-button')) endSession();
    });

    window.ConectaPages = window.ConectaPages || {};
    window.ConectaApp = {
        get data() { return data; },
        get session() { return session; },
        get photos() { return photos; },
        get $() { return $; },
        get $$() { return $$; },
        get esc() { return esc; },
        get digits() { return digits; },
        get id() { return id; },
        get currentAccount() { return currentAccount; },
        get productOrg() { return productOrg; },
        get currentPage() { return currentPage; },
        persist,
        toast,
        renderUser,
        createSession,
        guardBeneficiary
    };
})();
