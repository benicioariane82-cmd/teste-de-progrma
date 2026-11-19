function obterUsuarioLogado() {
    return {
        email: localStorage.getItem('conecta_usuario_logado') || '',
        cpf: localStorage.getItem('conecta_usuario_cpf') || ''
    };
}

function formatarCpf(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function renderCatalogo() {
    const container = document.getElementById('lista-catalogo');
    container.innerHTML = '';

    let estoque = [];
    try {
        estoque = JSON.parse(localStorage.getItem('conecta_estoque')) || [];
    } catch(e) {
        estoque = [];
    }

    const itensAtivos = estoque.filter(item => item.quantidade > 0);

    if (itensAtivos.length === 0) {
        container.innerHTML = '<div class="card-vazio">Nenhuma doação disponível no momento.</div>';
        return;
    }

    itensAtivos.forEach(item => {
        const div = document.createElement('div');
        div.className = 'catalog-item';
        div.innerHTML = `
            <div>
                <span class="category">${item.categoria}</span>
                <h4>${item.descricao}</h4>
            </div>
            <p>Instituição: <strong>${item.ongNome}</strong></p>
            <p class="item-meta">Retirada: ${item.ongEndereco}<br>Horário: ${item.ongAgenda}</p>
            <div class="item-footer">
                <span>Estoque: <strong>${item.quantidade} un</strong></span>
                <button class="btn-reserva" onclick="reservarVoucher('${item.id}')">Reservar doação</button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.reservarVoucher = function(itemId) {
    const usuario = obterUsuarioLogado();

    if (!usuario.email || !usuario.cpf) {
        alert('Para reservar uma doação, faça seu cadastro com CPF primeiro.');
        window.location.href = 'acesso-usuario.html';
        return;
    }

    let estoque = [];
    let vouchers = [];
    try {
        estoque = JSON.parse(localStorage.getItem('conecta_estoque')) || [];
        vouchers = JSON.parse(localStorage.getItem('conecta_vouchers')) || [];
    } catch(e) {
        estoque = [];
        vouchers = [];
    }

    const itemIndex = estoque.findIndex(i => i.id === itemId);
    if (itemIndex !== -1 && estoque[itemIndex].quantidade > 0) {
        estoque[itemIndex].quantidade -= 1;

        const tokenGerado = Math.random().toString(36).substring(2, 8).toUpperCase();
        const novoVoucher = {
            token: tokenGerado,
            cpf: usuario.cpf,
            email: usuario.email,
            descricao: estoque[itemIndex].descricao,
            ongNome: estoque[itemIndex].ongNome,
            ongEndereco: estoque[itemIndex].ongEndereco,
            ongAgenda: estoque[itemIndex].ongAgenda
        };

        vouchers.push(novoVoucher);
        localStorage.setItem('conecta_estoque', JSON.stringify(estoque));
        localStorage.setItem('conecta_vouchers', JSON.stringify(vouchers));

        renderCatalogo();
        renderVouchers();
        alert(`Voucher garantido com sucesso!\nSeu código é: ${tokenGerado}`);
    }
};

function renderVouchers() {
    const container = document.getElementById('lista-vouchers');
    container.innerHTML = '';

    const usuario = obterUsuarioLogado();
    if (!usuario.email || !usuario.cpf) {
        container.innerHTML = '<div class="card-vazio">Entre com seu CPF para reservar doações e ver seus vouchers.</div>';
        return;
    }

    let vouchers = [];
    try {
        vouchers = JSON.parse(localStorage.getItem('conecta_vouchers')) || [];
    } catch(e) {
        vouchers = [];
    }

    const meusVouchers = vouchers.filter(v => v.cpf === usuario.cpf);

    if (meusVouchers.length === 0) {
        container.innerHTML = '<div class="card-vazio">Você ainda não gerou vouchers.</div>';
        return;
    }

    meusVouchers.forEach(v => {
        const div = document.createElement('div');
        div.className = 'voucher-box';
        div.innerHTML = `
            <h4>${v.descricao}</h4>
            <p>Retirar em: <strong>${v.ongNome}</strong></p>
            <div class="token-code">${v.token}</div>
        `;
        container.appendChild(div);
    });
}

const usuarioAtual = obterUsuarioLogado();
if (usuarioAtual.email && usuarioAtual.cpf) {
    document.getElementById('status-autenticacao').classList.remove('hidden');
    document.getElementById('cpf-display').textContent = formatarCpf(usuarioAtual.cpf);
    document.getElementById('link-status').textContent = 'Trocar usuário';
}

renderCatalogo();
renderVouchers();
