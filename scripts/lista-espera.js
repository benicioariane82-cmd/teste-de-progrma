(() => {
    const app = window.ConectaApp;
    const { $, data, esc, productOrg } = app;

    if (!app.guardBeneficiary()) return;

    const entries = data.waitlist
        .filter(entry => entry.beneficiaryId === app.session.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    $('#waitlist-list').innerHTML = entries.length ? entries.map(entry => {
        const item = data.products.find(product => product.id === entry.productId);
        const position = data.waitlist
            .filter(row => row.productId === entry.productId)
            .findIndex(row => row.id === entry.id) + 1;
        return `<article class="workspace-item"><div class="workspace-item-copy"><span class="product-category">${esc(item?.category || 'Doação')}</span><h2>${esc(item?.name || 'Item indisponível')}</h2><p>${esc(productOrg(item)?.name || 'ONG parceira')}</p></div><div class="queue-position"><strong>${position}º</strong><span>na fila</span><small>${esc(entry.status)}</small></div></article>`;
    }).join('') : '<div class="empty-state">Você ainda não entrou em uma lista de espera. <a href="catalogo.html">Ver doações esgotadas.</a></div>';
})();
