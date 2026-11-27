# Backend ConectaDoações

API REST em Python + Flask + SQLAlchemy. Usa SQLite por padrão para rodar facilmente; também aceita MySQL pela variável `DATABASE_URL`.

## Executar localmente

Na pasta raiz do projeto:

```bash
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Copie `.env.example` para `.env`, altere `SECRET_KEY` para uma chave aleatória e execute:

```bash
python backend/app.py
```

A API ficará em `http://localhost:5000`. Na primeira execução, cria as tabelas e insere dados de demonstração. O banco SQLite é criado em `instance/conectadoacoes.db`.

## Contas de demonstração

- ONG: `contato@tekopora.org` / `Teko2026!`
- ONG: `acolhe@rede.org` / `Acolhe2026!`
- Beneficiário: CPF `12345678909` / senha `Demo2026!`

## Rotas

Todas as respostas são JSON. Rotas autenticadas exigem `Authorization: Bearer TOKEN` (token retornado no login/cadastro).

| Método | Rota | Acesso | Finalidade |
|---|---|---|---|
| GET | `/api/health` | público | Verificar se a API está ativa |
| POST | `/api/auth/register/ong` | público | Cadastrar ONG (`name, cnpj, city, email, password`) |
| POST | `/api/auth/register/beneficiary` | público | Cadastrar beneficiário (`name, cpf, phone, password`) |
| POST | `/api/auth/login` | público | Login (`type: ong/beneficiary`, `email` ou `cpf`, `password`) |
| GET | `/api/me` | autenticado | Consultar usuário logado |
| GET | `/api/organizations` | público | Listar ONGs |
| GET | `/api/products?q=` | público | Listar/pesquisar doações |
| POST | `/api/products` | ONG | Publicar doação (`name, category, quantity`) |
| PATCH | `/api/products/{id}/restock` | ONG | Repor estoque (`quantity`, padrão 1) |
| POST | `/api/products/{id}/request` | beneficiário | Solicitar doação ou entrar na fila |
| GET | `/api/orders/mine` | beneficiário | Consultar pedidos e vouchers |
| GET | `/api/waitlist/mine` | beneficiário | Consultar lista de espera |
| GET | `/api/ong/orders` | ONG | Consultar pedidos da instituição |
| GET | `/api/ong/waitlist` | ONG | Consultar fila da instituição |
| POST | `/api/ong/orders/{id}/approve` | ONG | Aprovar pedido e gerar voucher único |
| POST | `/api/ong/orders/{id}/reject` | ONG | Recusar pedido e devolver unidade ao estoque |
| POST | `/api/ong/waitlist/{id}/release` | ONG | Liberar vaga para pessoa da fila |
| POST | `/api/ong/vouchers/validate` | ONG | Validar voucher e concluir retirada (`code`) |

## Exemplo de login com cURL

```bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"type":"ong","email":"contato@tekopora.org","password":"Teko2026!"}'
```

## Observações importantes

- Senhas são armazenadas com hash; nunca em texto puro.
- A API verifica o tipo de usuário e a propriedade da ONG antes de permitir ações administrativas.
- A baixa de estoque, aprovação/recusa e validação de voucher são executadas no servidor.
- O projeto frontend original ainda contém scripts antigos baseados em `localStorage`. Esta entrega adiciona a API pronta; a próxima etapa é substituir essas chamadas antigas por `fetch` para que as páginas passem a usar o banco centralizado.
- Os dados de demonstração são fictícios e servem somente para desenvolvimento.
