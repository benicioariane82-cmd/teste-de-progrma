(() => {
    const app = window.ConectaApp;
    const { $, data, esc, id, persist, toast, productOrg } = app;

    if (!app.guardBeneficiary()) return;

    const organizationSelect = $('#organization');
    const form = $('#contribution-form');

    function renderOrganizations() {
        organizationSelect.innerHTML = '<option value="">Selecione uma ONG</option>' + data.organizations
            .map(organization => `<option value="${esc(organization.id)}">${esc(organization.name)} — ${esc(organization.city || 'Instituição parceira')}</option>`)
            .join('');
        organizationSelect.disabled = data.organizations.length === 0;
        if (data.organizations.length === 0) {
            organizationSelect.innerHTML = '<option value="">Nenhuma ONG cadastrada no momento</option>';
        }
    }

    function renderContributions() {
        const contributions = data.contributions
            .filter(contribution => contribution.beneficiaryId === app.session.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        $('#contribution-list').innerHTML = contributions.length ? contributions.map(contribution => {
            const organization = productOrg({ organizationId: contribution.organizationId });
            return `<article class="workspace-item contribution-item">
                <div class="workspace-item-copy">
                    <span class="product-category">Alimento doado</span>
                    <h3>${esc(contribution.foodName)}</h3>
                    <p>${esc(organization?.name || 'ONG não encontrada')} · ${esc(contribution.quantity)} ${esc(contribution.unit)}</p>
                    ${contribution.note ? `<p>${esc(contribution.note)}</p>` : ''}
                    <span class="status-pill ${contribution.status === 'Recebida' ? 'done' : 'pending'}">${esc(contribution.status)}</span>
                </div>
            </article>`;
        }).join('') : '<div class="empty-state">Suas contribuições aparecerão aqui.</div>';
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        const values = new FormData(form);
        const organization = data.organizations.find(item => item.id === values.get('organizationId'));
        const quantity = Number(values.get('quantity'));
        const foodName = String(values.get('foodName') || '').trim();
        if (!organization) return toast('Selecione uma ONG cadastrada para receber a doação.');
        if (!foodName || !Number.isFinite(quantity) || quantity <= 0) {
            return toast('Informe o alimento e uma quantidade válida.');
        }

        data.contributions.push({
            id: id('doacao'),
            beneficiaryId: app.session.id,
            organizationId: organization.id,
            foodName,
            quantity,
            unit: String(values.get('unit')),
            note: String(values.get('note') || '').trim(),
            createdAt: new Date().toISOString(),
            status: 'Aguardando recebimento'
        });
        persist();
        form.reset();
        renderContributions();
        toast('Contribuição registrada. A ONG poderá confirmar quando receber os alimentos.');
    });

    app.renderUser();
    renderOrganizations();
    renderContributions();
})();
