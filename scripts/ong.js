(() => {
    const app = window.ConectaApp;
    const { $, $$, data, esc, photos, id, toast, persist, currentAccount, productOrg } = app;
    const session = () => app.session;

    function renderOrders() {
        const orders = data.orders
            .filter(order => order.status === 'Aguardando aprovação da ONG'
                && data.products.find(item => item.id === order.productId)?.organizationId === session().id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        $('#ong-content').innerHTML = `<div class="workspace-section-title"><h3>Pedidos para analisar</h3><span>${orders.length} pendentes</span></div>${orders.length ? `<div class="workspace-list">${orders.map(order => {
            const item = data.products.find(product => product.id === order.productId);
            const person = data.beneficiaries.find(user => user.id === order.beneficiaryId);
            return `<article class="workspace-item"><div class="workspace-item-copy"><h2>${esc(person?.name || 'Beneficiário')}</h2><p>CPF ${esc(person?.cpf || '')} · ${esc(item?.name || '')} · ${new Date(order.createdAt).toLocaleString('pt-BR')}</p></div><div class="item-actions"><button class="small-action primary" data-approve="${esc(order.id)}">Aceitar e enviar voucher</button><button class="small-action danger" data-reject="${esc(order.id)}">Recusar pedido</button></div></article>`;
        }).join('')}</div>` : '<div class="empty-state">Nenhum pedido pendente para sua instituição.</div>'}`;
    }

    function renderStock() {
        const items = data.products.filter(item => item.organizationId === session().id);
        $('#ong-content').innerHTML = `<div class="workspace-section-title"><h3>Estoque da instituição</h3><span>${items.length} itens</span></div><form id="new-product-form" class="workspace-form workspace-product-form"><div class="field"><label>Nome do item</label><input name="name" required placeholder="Ex.: Cesta básica"></div><div class="field"><label>Categoria</label><select name="category"><option>Alimentos</option><option>Higiene</option><option>Vestuário</option><option>Infantil</option><option>Outros</option></select></div><div class="field"><label>Quantidade</label><input name="quantity" type="number" min="0" value="1" required></div><div class="field workspace-product-description"><label for="product-description">Descrição do produto</label><textarea id="product-description" name="description" maxlength="300" required placeholder="Descreva o item, validade ou outras informações importantes"></textarea></div><button class="form-submit">Publicar doação</button></form><div class="workspace-list">${items.length ? items.map(item => `<article class="workspace-item"><div class="workspace-item-copy"><h2>${esc(item.name)}</h2><p>${esc(item.category)} · ${Number(item.quantity)} unidades disponíveis</p>${item.description ? `<p>${esc(item.description)}</p>` : ''}</div><div class="item-actions"><button class="small-action" data-restock="${esc(item.id)}">+ Repor 1</button><button class="small-action danger" data-delete-product="${esc(item.id)}">Excluir doação</button></div></article>`).join('') : '<div class="empty-state">Cadastre a primeira doação.</div>'}</div>`;
        $('#new-product-form').onsubmit = event => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            data.products.push({
                id: id('prod'),
                organizationId: session().id,
                name: String(values.get('name')).trim(),
                category: String(values.get('category')),
                description: String(values.get('description')).trim(),
                quantity: Math.max(0, Number(values.get('quantity')) || 0),
                image: photos.community
            });
            persist();
            render();
            toast('Doação publicada no catálogo.');
        };
    }

    function renderWaitlist() {
        const entries = data.waitlist
            .filter(entry => data.products.find(item => item.id === entry.productId)?.organizationId === session().id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        $('#ong-content').innerHTML = `<div class="workspace-section-title"><h3>Fila de oportunidade</h3><span>${entries.length} aguardando</span></div><p class="form-hint">A ordem de chegada é preservada. Reponha o item antes de liberar uma vaga.</p>${entries.length ? `<div class="workspace-list">${entries.map((entry, index) => {
            const item = data.products.find(product => product.id === entry.productId);
            const person = data.beneficiaries.find(user => user.id === entry.beneficiaryId);
            return `<article class="workspace-item"><div class="workspace-item-copy"><h2>${index + 1}º · ${esc(person?.name || 'Beneficiário')}</h2><p>CPF ${esc(person?.cpf || '')} · ${esc(item?.name || '')}</p></div><button class="small-action primary" data-release="${esc(entry.id)}" ${Number(item?.quantity) > 0 ? '' : 'disabled'}>Liberar vaga / notificar</button></article>`;
        }).join('')}</div>` : '<div class="empty-state">Nenhuma pessoa na fila neste momento.</div>'}`;
    }

    function renderContributions() {
        const contributions = data.contributions
            .filter(contribution => contribution.organizationId === session().id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        $('#ong-content').innerHTML = `<div class="workspace-section-title"><h3>Doações de alimentos</h3><span>${contributions.length} contribuições</span></div>${contributions.length ? `<div class="workspace-list">${contributions.map(contribution => {
            const donor = data.beneficiaries.find(person => person.id === contribution.beneficiaryId);
            const received = contribution.status === 'Recebida';
            return `<article class="workspace-item"><div class="workspace-item-copy"><span class="product-category">Alimento</span><h2>${esc(contribution.foodName)} · ${esc(contribution.quantity)} ${esc(contribution.unit)}</h2><p>De ${esc(donor?.name || 'Beneficiário')} · ${new Date(contribution.createdAt).toLocaleString('pt-BR')}</p>${contribution.note ? `<p>${esc(contribution.note)}</p>` : ''}<span class="status-pill ${received ? 'done' : 'pending'}">${received ? 'Recebida' : 'Aguardando recebimento'}</span></div>${received ? '' : `<button class="small-action primary" data-confirm-contribution="${esc(contribution.id)}">Confirmar recebimento</button>`}</article>`;
        }).join('')}</div>` : '<div class="empty-state">Ainda não há contribuições de alimentos para sua instituição.</div>'}`;
    }

    function renderValidation() {
        $('#ong-content').innerHTML = `<div class="workspace-section-title"><h3>Validar voucher de retirada</h3></div><p class="form-hint">Digite o código apresentado pelo beneficiário. O voucher precisa pertencer à sua instituição.</p><form id="validate-form" class="workspace-form validation-form"><div class="field"><label for="voucher-code">Código do voucher</label><input id="voucher-code" name="code" required placeholder="VCH-2026-849"></div><button class="form-submit">Confirmar retirada</button></form><div id="validation-result"></div>`;
        $('#validate-form').onsubmit = event => {
            event.preventDefault();
            const code = String(new FormData(event.currentTarget).get('code')).trim().toUpperCase();
            const order = data.orders.find(item => item.voucher === code
                && item.status === 'Aprovado - Voucher Enviado'
                && data.products.find(product => product.id === item.productId)?.organizationId === session().id);
            if (!order) {
                $('#validation-result').innerHTML = '<div class="notice error">Código inválido, já usado ou vinculado a outra instituição.</div>';
                return toast('Voucher não validado.');
            }
            order.status = 'Entregue / Concluído';
            order.deliveredAt = new Date().toISOString();
            persist();
            $('#validation-result').innerHTML = '<div class="notice">Retirada confirmada. Pedido concluído.</div>';
            toast('Voucher validado com sucesso.');
        };
    }

    function render() {
        if (!currentAccount()) return;
        $('#ong-title').textContent = currentAccount().name;
        $('#ong-location').textContent = currentAccount().city || 'Instituição parceira';
        const active = $('#ong-content').dataset.active || 'orders';
        $('#ong-content').dataset.active = active;
        $$('[data-ong-tab]').forEach(button => button.classList.toggle('active', button.dataset.ongTab === active));
        if (active === 'stock') renderStock();
        else if (active === 'waitlist') renderWaitlist();
        else if (active === 'contributions') renderContributions();
        else if (active === 'validate') renderValidation();
        else renderOrders();
    }

    function approve(orderId) {
        const order = data.orders.find(item => item.id === orderId);
        if (!order || order.status !== 'Aguardando aprovação da ONG') return;
        let code;
        do {
            code = `VCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
        } while (data.orders.some(item => item.voucher === code));
        order.status = 'Aprovado - Voucher Enviado';
        order.voucher = code;
        order.approvedAt = new Date().toISOString();
        persist();
        render();
        toast(`Pedido aprovado. Voucher ${code} gerado.`);
    }

    function reject(orderId) {
        const order = data.orders.find(item => item.id === orderId);
        if (!order) return;
        const item = data.products.find(product => product.id === order.productId);
        if (item) item.quantity++;
        order.status = 'Pedido recusado';
        persist();
        render();
        toast('Pedido recusado e unidade devolvida ao estoque.');
    }

    function deleteProduct(productId) {
        const product = data.products.find(item => item.id === productId
            && item.organizationId === session().id);
        if (!product || !confirm(`Excluir a doação "${product.name}"? Os pedidos e a lista de espera deste item também serão removidos.`)) return;
        data.products = data.products.filter(item => item.id !== product.id);
        data.orders = data.orders.filter(order => order.productId !== product.id);
        data.waitlist = data.waitlist.filter(entry => entry.productId !== product.id);
        persist();
        render();
        toast('Doação excluída.');
    }

    function deleteOrganization() {
        const organization = currentAccount();
        if (!organization || !confirm(`Excluir o cadastro da ONG "${organization.name}"? As doações, pedidos, listas de espera e contribuições vinculadas também serão removidos.`)) return;
        const productIds = data.products
            .filter(product => product.organizationId === organization.id)
            .map(product => product.id);
        data.organizations = data.organizations.filter(item => item.id !== organization.id);
        data.products = data.products.filter(product => product.organizationId !== organization.id);
        data.orders = data.orders.filter(order => !productIds.includes(order.productId));
        data.waitlist = data.waitlist.filter(entry => !productIds.includes(entry.productId));
        data.contributions = data.contributions.filter(item => item.organizationId !== organization.id);
        persist();
        localStorage.removeItem('conecta_demo_session');
        location.href = 'ong.html';
    }

    function release(entryId) {
        const index = data.waitlist.findIndex(entry => entry.id === entryId);
        if (index < 0) return;
        const entry = data.waitlist[index];
        const item = data.products.find(product => product.id === entry.productId);
        if (!item || Number(item.quantity) < 1) return toast('Reponha o estoque antes de liberar a vaga.');
        item.quantity--;
        data.orders.push({
            id: id('pedido'),
            productId: item.id,
            beneficiaryId: entry.beneficiaryId,
            createdAt: new Date().toISOString(),
            status: 'Aguardando aprovação da ONG',
            voucher: '',
            fromWaitlist: true
        });
        data.waitlist.splice(index, 1);
        persist();
        render();
        toast('Vaga liberada. O pedido seguirá para aprovação.');
    }

    function handleClick(event) {
        const tab = event.target.closest('[data-ong-tab]');
        if (tab) {
            $('#ong-content').dataset.active = tab.dataset.ongTab;
            render();
            return;
        }
        const accepted = event.target.closest('[data-approve]');
        if (accepted) return approve(accepted.dataset.approve);
        const rejected = event.target.closest('[data-reject]');
        if (rejected) return reject(rejected.dataset.reject);
        const restock = event.target.closest('[data-restock]');
        if (restock) {
            const item = data.products.find(product => product.id === restock.dataset.restock);
            if (item) {
                item.quantity++;
                persist();
                render();
                toast(`Estoque de ${item.name} reposto.`);
            }
            return;
        }
        const deleteProductButton = event.target.closest('[data-delete-product]');
        if (deleteProductButton) return deleteProduct(deleteProductButton.dataset.deleteProduct);
        if (event.target.closest('#delete-organization')) return deleteOrganization();
        const releaseButton = event.target.closest('[data-release]');
        if (releaseButton) release(releaseButton.dataset.release);
        const confirmContribution = event.target.closest('[data-confirm-contribution]');
        if (confirmContribution) {
            const contribution = data.contributions.find(item =>
                item.id === confirmContribution.dataset.confirmContribution
                && item.organizationId === session().id
            );
            if (!contribution || contribution.status === 'Recebida') return;
            contribution.status = 'Recebida';
            contribution.receivedAt = new Date().toISOString();
            persist();
            render();
            toast('Recebimento da contribuição confirmado.');
        }
    }

    window.ConectaPages.ong = { render };
    app.renderUser();
    window.ConectaAuth.init('ong');
    document.addEventListener('click', handleClick);
})();
