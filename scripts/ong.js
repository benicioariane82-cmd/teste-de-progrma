let ong = null;
let estoque = [];

// Tenta carregar informações salvas no LocalStorage ao carregar a página
try {
    ong = JSON.parse(localStorage.getItem('conecta_ong')) || null;
    estoque = JSON.parse(localStorage.getItem('conecta_estoque')) || [];
} catch(e) {
    ong = null;
    estoque = [];
}

// Preenche os campos do formulário se a ONG já estiver cadastrada
if (ong) {
    document.getElementById('nome-ong').value = ong.nome || "";
    document.getElementById('end-ong').value = ong.endereco || "";
    document.getElementById('agenda-ong').value = ong.agenda || "";
}

// Lógica de envio do formulário de perfil da ONG
document.getElementById('form-ong').addEventListener('submit', (e) => {
    e.preventDefault();
    
    ong = {
        nome: document.getElementById('nome-ong').value,
        endereco: document.getElementById('end-ong').value,
        agenda: document.getElementById('agenda-ong').value
    };
    
    localStorage.setItem('conecta_ong', JSON.stringify(ong));
    alert('Perfil da ONG salvo com sucesso!');
});

// Lógica de publicação de novos mantimentos no estoque local unificado
document.getElementById('form-doacao').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Fallbacks dinâmicos de segurança se o usuário não preencher a ONG primeiro
    let nomeONG = ong ? ong.nome : "ONG Geral";
    let endONG = ong ? ong.endereco : "Endereço não informado";
    let agendaONG = ong ? ong.agenda : "Horário comercial";

    const novoItem = {
        id: 'item_' + Date.now(),
        ongNome: nomeONG,
        ongEndereco: endONG,
        ongAgenda: agendaONG,
        categoria: document.getElementById('tipo-item').value,
        descricao: document.getElementById('desc-item').value,
        quantidade: parseInt(document.getElementById('qtd-item').value)
    };

    estoque.push(novoItem);
    localStorage.setItem('conecta_estoque', JSON.stringify(estoque));
    
    alert('Item adicionado ao estoque geral do município!');
    document.getElementById('form-doacao').reset();
});
