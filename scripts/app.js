(() => {
    const key = 'conecta_demo_v1';
    const seed = {
        organizations: [],
        beneficiaries: [],
        products: [],
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
