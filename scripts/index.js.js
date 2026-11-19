
document.addEventListener('DOMContentLoaded', () => {
    console.log("Sistema ConectaDoações iniciado com sucesso.");
    
    if (!localStorage.getItem('conecta_estoque')) {
        localStorage.setItem('conecta_estoque', JSON.stringify([]));
    }
    if (!localStorage.getItem('conecta_vouchers')) {
        localStorage.setItem('conecta_vouchers', JSON.stringify([]));
    }
});
