(() => {
    const app = window.ConectaApp;
    const { $, data, esc, photos, productOrg, id, persist, toast, renderUser } = app;
    const session = () => app.session;

    function renderCatalog() {
        const query = ($('#catalog-search')?.value || '').trim().toLocaleLowerCase('pt-BR');
        const products = data.products.filter(item =>
            `${item.name} ${item.category} ${item.description || ''} ${productOrg(item)?.name || ''}`
                .toLocaleLowerCase('pt-BR').includes(query)
        );
        $('#catalog-count').textContent = `${data.products.length} doações cadastradas`;
        $('#catalog-empty').classList.toggle('hidden', products.length > 0);
        $('#product-grid').innerHTML = products.map(item => {
            const out = Number(item.quantity) <= 0;
            const queued = session()?.type === 'beneficiary' && data.waitlist.some(entry =>
                entry.productId === item.id && entry.beneficiaryId === session().id
            );
            const organization = productOrg(item);
            const pickupLocation = organization?.pickupLocation || organization?.city;
            return `<article class="product-card"><div class="product-info"><p class="product-category">${esc(item.category)}</p><h3>${esc(item.name)}</h3>${item.description ? `<p class="product-description">${esc(item.description)}</p>` : ''}<p class="product-org">Por ${esc(organization?.name || 'ONG parceira')}</p><div class="product-organization-details">${organization?.description ? `<p>${esc(organization.description)}</p>` : ''}${pickupLocation ? `<p><strong>Local de retirada:</strong> ${esc(pickupLocation)}</p>` : ''}</div><div class="product-art"><img src="${esc(item.image || photos.community)}" alt="" loading="lazy"><span class="stock-badge ${out ? 'out' : ''}">${out ? 'Estoque esgotado' : `${Number(item.quantity)} disponíveis`}</span></div><div class="product-stock"><span>Disponibilidade</span><strong>${out ? 'Lista de espera' : `${Number(item.quantity)} unidades`}</strong></div><button class="product-action ${out ? 'wait' : ''}" data-request="${esc(item.id)}" ${queued ? 'disabled' : ''}>${queued ? 'Você está na lista de espera' : out ? 'Entrar na Lista de Espera' : 'Solicitar Doação'}</button></div></article>`;
        }).join('');
    }

    function requestProduct(productId) {
        if (!session() || session().type !== 'beneficiary') {
            location.href = `beneficiario.html?next=${encodeURIComponent(app.currentPage)}`;
            return;
        }
        const item = data.products.find(product => product.id === productId);
        if (!item) return;
        if (Number(item.quantity) <= 0) {
            if (data.waitlist.some(entry => entry.productId === item.id && entry.beneficiaryId === session().id)) {
                return toast('Você já está na lista de espera deste item.');
            }
            data.waitlist.push({
                id: id('fila'),
                productId: item.id,
                beneficiaryId: session().id,
                createdAt: new Date().toISOString(),
                status: 'Aguardando vaga'
            });
            persist();
            renderCatalog();
            const position = data.waitlist.filter(entry => entry.productId === item.id).length;
            toast(`Você é ${position}º da fila de espera para ${item.name}.`);
            return;
        }
        item.quantity--;
        data.orders.push({
            id: id('pedido'),
            productId: item.id,
            beneficiaryId: session().id,
            createdAt: new Date().toISOString(),
            status: 'Aguardando aprovação da ONG',
            voucher: ''
        });
        persist();
        renderCatalog();
        toast('Solicitação enviada. Acompanhe o status na tela Meus pedidos.');
    }

    renderUser();
    renderCatalog();
    $('#catalog-search').addEventListener('input', renderCatalog);
    document.addEventListener('click', event => {
        const button = event.target.closest('[data-request]');
        if (button && !button.disabled) requestProduct(button.dataset.request);
    });
})();
