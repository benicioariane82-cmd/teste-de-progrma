(() => {
    const key = 'conecta_demo_v1';
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
        orders: [],
        waitlist: []
    };
    let data;
    try {
        data = JSON.parse(localStorage.getItem(key));
        if (!data || !Array.isArray(data.products)) throw new Error('Invalid store');
    } catch (error) {
        data = seed;
        localStorage.setItem(key, JSON.stringify(data));
    }
    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const grid = document.getElementById('partner-grid');
    if (grid) grid.innerHTML = data.organizations.slice(0, 3).map(organization => `
        <article class="partner-card">
            <img class="partner-image" src="${escapeHTML(organization.image || photos.community)}" alt="Ação comunitária da ${escapeHTML(organization.name)}" loading="lazy">
            <div class="partner-info"><div class="partner-name-row"><h3>${escapeHTML(organization.name)}</h3><span class="verified">✓ ONG Verificada</span></div>
            <div class="partner-location">⌖ ${escapeHTML(organization.city)}</div><p>${escapeHTML(organization.description)}</p></div>
        </article>`).join('');
    const menuButton = document.getElementById('mobile-menu-button');
    const nav = document.getElementById('main-nav');
    menuButton?.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        menuButton.textContent = open ? '×' : '☰';
    });
    nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuButton?.setAttribute('aria-expanded', 'false');
        if (menuButton) menuButton.textContent = '☰';
    }));
})();
