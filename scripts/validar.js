function formatarCpf(cpf) {
    if (!cpf) return 'Não informado';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

document.getElementById('btn-validar').addEventListener('click', () => {
    const tokenDigitado = document.getElementById('token-input').value.trim().toUpperCase();
    const msgBox = document.getElementById('msg-validacao');

    let vouchers = [];
    try {
        vouchers = JSON.parse(localStorage.getItem('conecta_vouchers')) || [];
    } catch(e) {
        vouchers = [];
    }

    msgBox.style.display = 'block';
    const index = vouchers.findIndex(v => v.token === tokenDigitado);

    if (index !== -1) {
        const voucher = vouchers[index];
        msgBox.style.backgroundColor = '#dceee2';
        msgBox.style.color = '#1f604c';
        msgBox.innerHTML = `
            <strong>Token válido e autorizado!</strong><br>
            <p style="margin-top:8px; font-weight:normal; font-size:0.95rem; text-align:left; line-height:1.4;">
                <b>Item liberado:</b> ${voucher.descricao}<br>
                <b>CPF do beneficiário:</b> ${formatarCpf(voucher.cpf)}<br>
                <b>Origem:</b> ${voucher.ongNome}
            </p>
        `;

        vouchers.splice(index, 1);
        localStorage.setItem('conecta_vouchers', JSON.stringify(vouchers));
        document.getElementById('token-input').value = '';
    } else {
        msgBox.style.backgroundColor = '#fee2e2';
        msgBox.style.color = '#991b1b';
        msgBox.innerHTML = '<strong>Token inválido!</strong><br><span style="font-weight:normal; font-size:0.9rem;">Código expirado, incorreto ou já processado anteriormente.</span>';
    }
});
