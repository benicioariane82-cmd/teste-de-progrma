(() => {
    const app = window.ConectaApp;
    const { $, data, esc, productOrg } = app;

    if (!app.guardBeneficiary()) return;

    const orders = data.orders
        .filter(order => order.beneficiaryId === app.session.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    $('#orders-list').innerHTML = orders.length ? orders.map(order => {
        const item = data.products.find(product => product.id === order.productId);
        const organization = productOrg(item);
        const approved = order.status === 'Aprovado - Voucher Enviado';
        const statusClass = approved ? '' : order.status === 'Entregue / Concluído' ? 'done' : 'pending';
        return `<article class="workspace-item"><div class="workspace-item-copy"><span class="product-category">${esc(item?.category || 'Doação')}</span><h2>${esc(item?.name || 'Item indisponível')}</h2><p>${esc(organization?.name || 'ONG parceira')} · ${new Date(order.createdAt).toLocaleDateString('pt-BR')}</p><span class="status-pill ${statusClass}">${esc(order.status)}</span></div>${approved ? `<div class="voucher-digital"><strong>Voucher de retirada</strong><code>${esc(order.voucher)}</code><p>Apresente este código em ${esc(organization?.name || 'sua ONG')}.</p></div>` : ''}</article>`;
    }).join('') : '<div class="empty-state">Você ainda não fez solicitações. <a href="catalogo.html">Explore o catálogo.</a></div>';
})();
