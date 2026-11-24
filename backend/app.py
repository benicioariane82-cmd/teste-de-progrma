
import os
import secrets
import string
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'sqlite:///conectadoacoes.db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv(
    'SECRET_KEY',
    'dev-only-change-this-secret'
)
app.config['JSON_SORT_KEYS'] = False

CORS(
    app,
    resources={r'/api/*': {'origins': os.getenv('FRONTEND_ORIGIN', '*')}},
    supports_credentials=False
)

db = SQLAlchemy(app)


# MODELOS DO BANCO DE DADOS

class Organization(db.Model):
    __tablename__ = 'organizations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), nullable=False)
    cnpj = db.Column(db.String(14), unique=True, nullable=False)
    city = db.Column(db.String(140), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default='')
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )


class Beneficiary(db.Model):
    __tablename__ = 'beneficiaries'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    phone = db.Column(db.String(30), default='')
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(
        db.Integer,
        db.ForeignKey('organizations.id'),
        nullable=False,
        index=True
    )
    name = db.Column(db.String(140), nullable=False)
    category = db.Column(db.String(60), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    image = db.Column(db.String(500), default='')
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    organization = db.relationship('Organization')


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(
        db.Integer,
        db.ForeignKey('products.id'),
        nullable=False,
        index=True
    )
    beneficiary_id = db.Column(
        db.Integer,
        db.ForeignKey('beneficiaries.id'),
        nullable=False,
        index=True
    )
    status = db.Column(
        db.String(60),
        nullable=False,
        default='Aguardando aprovação da ONG'
    )
    voucher = db.Column(db.String(32), unique=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )
    approved_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)

    product = db.relationship('Product')
    beneficiary = db.relationship('Beneficiary')


class Waitlist(db.Model):
    __tablename__ = 'waitlist'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(
        db.Integer,
        db.ForeignKey('products.id'),
        nullable=False,
        index=True
    )
    beneficiary_id = db.Column(
        db.Integer,
        db.ForeignKey('beneficiaries.id'),
        nullable=False,
        index=True
    )
    status = db.Column(
        db.String(60),
        default='Aguardando vaga',
        nullable=False
    )
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    product = db.relationship('Product')
    beneficiary = db.relationship('Beneficiary')


# FUNÇÕES AUXILIARES

def digits(value):
    return ''.join(ch for ch in str(value or '') if ch.isdigit())


def fail(message, code=400):
    return jsonify({'error': message}), code


def iso(value):
    return value.isoformat() if value else None


def org_json(o):
    return {
        'id': o.id,
        'name': o.name,
        'cnpj': o.cnpj,
        'city': o.city,
        'email': o.email,
        'description': o.description
    }


def benef_json(b):
    return {
        'id': b.id,
        'name': b.name,
        'cpf': b.cpf,
        'phone': b.phone
    }


def product_json(p):
    return {
        'id': p.id,
        'organizationId': p.organization_id,
        'name': p.name,
        'category': p.category,
        'quantity': p.quantity,
        'image': p.image,
        'organization': org_json(p.organization)
    }


def order_json(o):
    return {
        'id': o.id,
        'productId': o.product_id,
        'beneficiaryId': o.beneficiary_id,
        'status': o.status,
        'voucher': o.voucher,
        'createdAt': iso(o.created_at),
        'approvedAt': iso(o.approved_at),
        'deliveredAt': iso(o.delivered_at),
        'product': product_json(o.product),
        'beneficiary': benef_json(o.beneficiary)
    }


def wait_json(w):
    return {
        'id': w.id,
        'productId': w.product_id,
        'beneficiaryId': w.beneficiary_id,
        'status': w.status,
        'createdAt': iso(w.created_at),
        'product': product_json(w.product),
        'beneficiary': benef_json(w.beneficiary)
    }


# AUTENTICAÇÃO

def auth_required(kind=None):
    def decorator(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            header = request.headers.get('Authorization', '')
            token = header[7:] if header.lower().startswith('bearer ') else ''

            try:
                import jwt

                payload = jwt.decode(
                    token,
                    app.config['SECRET_KEY'],
                    algorithms=['HS256']
                )

                if payload.get('exp', 0) < datetime.now(timezone.utc).timestamp():
                    raise ValueError()

                g.user_type = payload['type']
                g.user_id = int(payload['id'])

                if kind and g.user_type != kind:
                    return fail('Você não tem permissão para esta ação.', 403)

                g.account = db.session.get(
                    Organization if g.user_type == 'ong' else Beneficiary,
                    g.user_id
                )

                if not g.account:
                    return fail('Sessão inválida.', 401)

            except Exception:
                return fail('Faça login para continuar.', 401)

            return fn(*args, **kwargs)

        return wrapped
    return decorator


def issue_token(kind, account):
    import jwt

    token = jwt.encode(
        {
            'type': kind,
            'id': account.id,
            'exp': datetime.now(timezone.utc) + timedelta(days=2)
        },
        app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    return token


def session_response(kind, account):
    return jsonify({
        'token': issue_token(kind, account),
        'type': kind,
        'account': org_json(account) if kind == 'ong' else benef_json(account)
    })


# SAÚDE DA API

@app.get('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'service': 'ConectaDoações API'
    })


# CADASTRO DE ONG

@app.post('/api/auth/register/ong')
def register_ong():
    d = request.get_json(silent=True) or {}

    cnpj = digits(d.get('cnpj'))
    email = str(d.get('email', '')).strip().lower()
    password = str(d.get('password', ''))

    if not all([
        d.get('name'),
        len(cnpj) == 14,
        d.get('city'),
        email,
        '@' in email,
        len(password) >= 6
    ]):
        return fail(
            'Informe nome, CNPJ (14 números), cidade, e-mail válido e senha com pelo menos 6 caracteres.'
        )

    if Organization.query.filter(
        (Organization.email == email) |
        (Organization.cnpj == cnpj)
    ).first():
        return fail('E-mail ou CNPJ já cadastrado.', 409)

    o = Organization(
        name=str(d['name']).strip(),
        cnpj=cnpj,
        city=str(d['city']).strip(),
        email=email,
        password_hash=generate_password_hash(password),
        description=str(d.get('description', ''))
    )

    db.session.add(o)
    db.session.commit()

    return session_response('ong', o), 201


# CADASTRO DE BENEFICIÁRIO

@app.post('/api/auth/register/beneficiary')
def register_beneficiary():
    d = request.get_json(silent=True) or {}

    cpf = digits(d.get('cpf'))
    password = str(d.get('password', ''))

    if not all([
        d.get('name'),
        len(cpf) == 11,
        len(password) >= 6
    ]):
        return fail(
            'Informe nome, CPF com 11 números e senha com pelo menos 6 caracteres.'
        )

    if Beneficiary.query.filter_by(cpf=cpf).first():
        return fail('Este CPF já possui cadastro.', 409)

    b = Beneficiary(
        name=str(d['name']).strip(),
        cpf=cpf,
        phone=str(d.get('phone', '')).strip(),
        password_hash=generate_password_hash(password)
    )

    db.session.add(b)
    db.session.commit()

    return session_response('beneficiary', b), 201


# LOGIN

@app.post('/api/auth/login')
def login():
    d = request.get_json(silent=True) or {}

    kind = d.get('type')
    password = str(d.get('password', ''))

    if kind == 'ong':
        account = Organization.query.filter_by(
            email=str(d.get('email', '')).strip().lower()
        ).first()

    elif kind == 'beneficiary':
        account = Beneficiary.query.filter_by(
            cpf=digits(d.get('cpf'))
        ).first()

    else:
        return fail('Tipo de conta inválido.')

    if not account or not check_password_hash(account.password_hash, password):
        return fail('Credenciais inválidas.', 401)

    return session_response(kind, account)


# DADOS DA CONTA LOGADA

@app.get('/api/me')
@auth_required()
def me():
    return jsonify({
        'type': g.user_type,
        'account': org_json(g.account) if g.user_type == 'ong' else benef_json(g.account)
    })


# ORGANIZAÇÕES

@app.get('/api/organizations')
def organizations():
    return jsonify([
        org_json(o)
        for o in Organization.query.order_by(Organization.name).all()
    ])


# PRODUTOS

@app.get('/api/products')
def products():
    query = Product.query.join(Organization)
    q = request.args.get('q', '').strip()

    if q:
        query = query.filter(
            db.or_(
                Product.name.ilike(f'%{q}%'),
                Product.category.ilike(f'%{q}%'),
                Organization.name.ilike(f'%{q}%')
            )
        )

    return jsonify([
        product_json(p)
        for p in query.order_by(Product.created_at.desc()).all()
    ])


@app.post('/api/products')
@auth_required('ong')
def create_product():
    d = request.get_json(silent=True) or {}

    name = str(d.get('name', '')).strip()
    category = str(d.get('category', '')).strip()

    try:
        quantity = int(d.get('quantity', 0))
    except (ValueError, TypeError):
        return fail('Quantidade inválida.')

    if not name or not category or quantity < 0:
        return fail('Informe nome, categoria e quantidade válida.')

    p = Product(
        organization_id=g.account.id,
        name=name,
        category=category,
        quantity=quantity,
        image=str(d.get('image', ''))
    )

    db.session.add(p)
    db.session.commit()

    return jsonify(product_json(p)), 201


@app.patch('/api/products/<int:product_id>/restock')
@auth_required('ong')
def restock(product_id):
    p = db.session.get(Product, product_id)

    if not p:
        return fail('Doação não encontrada.', 404)

    if p.organization_id != g.account.id:
        return fail('Sem permissão.', 403)

    d = request.get_json(silent=True) or {}

    try:
        amount = int(d.get('quantity', 1))
    except (ValueError, TypeError):
        return fail('Quantidade inválida.')

    if amount < 1:
        return fail('A reposição deve ser maior que zero.')

    p.quantity += amount
    db.session.commit()

    return jsonify(product_json(p))


# SOLICITAÇÃO DE PRODUTOS

@app.post('/api/products/<int:product_id>/request')
@auth_required('beneficiary')
def request_product(product_id):
    p = db.session.get(Product, product_id)

    if not p:
        return fail('Doação não encontrada.', 404)

    if p.quantity <= 0:
        existing = Waitlist.query.filter_by(
            product_id=p.id,
            beneficiary_id=g.account.id
        ).first()

        if existing:
            return fail('Você já está na lista de espera deste item.', 409)

        w = Waitlist(
            product_id=p.id,
            beneficiary_id=g.account.id
        )

        db.session.add(w)
        db.session.commit()

        position = Waitlist.query.filter_by(
            product_id=p.id
        ).filter(
            Waitlist.created_at <= w.created_at
        ).count()

        return jsonify({
            'message': 'Você entrou na lista de espera.',
            'position': position,
            'waitlist': wait_json(w)
        }), 201

    p.quantity -= 1

    order = Order(
        product_id=p.id,
        beneficiary_id=g.account.id
    )

    db.session.add(order)
    db.session.commit()

    return jsonify({
        'message': 'Solicitação enviada para aprovação da ONG.',
        'order': order_json(order)
    }), 201


# PEDIDOS DO BENEFICIÁRIO

@app.get('/api/orders/mine')
@auth_required('beneficiary')
def my_orders():
    return jsonify([
        order_json(o)
        for o in Order.query.filter_by(
            beneficiary_id=g.account.id
        ).order_by(Order.created_at.desc()).all()
    ])


# LISTA DE ESPERA DO BENEFICIÁRIO

@app.get('/api/waitlist/mine')
@auth_required('beneficiary')
def my_waitlist():
    entries = Waitlist.query.filter_by(
        beneficiary_id=g.account.id
    ).order_by(Waitlist.created_at).all()

    result = []

    for w in entries:
        row = wait_json(w)

        row['position'] = Waitlist.query.filter_by(
            product_id=w.product_id
        ).filter(
            Waitlist.created_at <= w.created_at
        ).count()

        result.append(row)

    return jsonify(result)


# PEDIDOS DA ONG

@app.get('/api/ong/orders')
@auth_required('ong')
def ong_orders():
    rows = Order.query.join(Product).filter(
        Product.organization_id == g.account.id
    ).order_by(Order.created_at).all()

    return jsonify([order_json(o) for o in rows])


# LISTA DE ESPERA DA ONG

@app.get('/api/ong/waitlist')
@auth_required('ong')
def ong_waitlist():
    rows = Waitlist.query.join(Product).filter(
        Product.organization_id == g.account.id
    ).order_by(Waitlist.created_at).all()

    result = []

    for w in rows:
        row = wait_json(w)

        row['position'] = Waitlist.query.filter_by(
            product_id=w.product_id
        ).filter(
            Waitlist.created_at <= w.created_at
        ).count()

        result.append(row)

    return jsonify(result)


# APROVAR PEDIDO

@app.post('/api/ong/orders/<int:order_id>/approve')
@auth_required('ong')
def approve_order(order_id):
    o = db.session.get(Order, order_id)

    if not o:
        return fail('Pedido não encontrado.', 404)

    if o.product.organization_id != g.account.id:
        return fail('Sem permissão.', 403)

    if o.status != 'Aguardando aprovação da ONG':
        return fail('Este pedido não está pendente.', 409)

    alphabet = string.ascii_uppercase + string.digits

    while True:
        code = (
            'VCH-'
            + datetime.now().strftime('%Y')
            + '-'
            + ''.join(secrets.choice(alphabet) for _ in range(6))
        )

        if not Order.query.filter_by(voucher=code).first():
            break

    o.status = 'Aprovado - Voucher Enviado'
    o.voucher = code
    o.approved_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify(order_json(o))


# RECUSAR PEDIDO

@app.post('/api/ong/orders/<int:order_id>/reject')
@auth_required('ong')
def reject_order(order_id):
    o = db.session.get(Order, order_id)

    if not o:
        return fail('Pedido não encontrado.', 404)

    if o.product.organization_id != g.account.id:
        return fail('Sem permissão.', 403)

    if o.status != 'Aguardando aprovação da ONG':
        return fail('Este pedido não está pendente.', 409)

    o.product.quantity += 1
    o.status = 'Pedido recusado'

    db.session.commit()

    return jsonify(order_json(o))


# LIBERAR VAGA DA LISTA DE ESPERA

@app.post('/api/ong/waitlist/<int:entry_id>/release')
@auth_required('ong')
def release_waitlist(entry_id):
    w = db.session.get(Waitlist, entry_id)

    if not w:
        return fail('Entrada não encontrada.', 404)

    if w.product.organization_id != g.account.id:
        return fail('Sem permissão.', 403)

    if w.product.quantity < 1:
        return fail('Reponha o estoque antes de liberar a vaga.', 409)

    p = w.product
    p.quantity -= 1

    o = Order(
        product_id=p.id,
        beneficiary_id=w.beneficiary_id
    )

    db.session.add(o)
    db.session.delete(w)
    db.session.commit()

    return jsonify({
        'message': 'Vaga liberada e pedido enviado para aprovação.',
        'order': order_json(o)
    })


# VALIDAR VOUCHER

@app.post('/api/ong/vouchers/validate')
@auth_required('ong')
def validate_voucher():
    code = str(
        (request.get_json(silent=True) or {}).get('code', '')
    ).strip().upper()

    o = Order.query.filter_by(
        voucher=code,
        status='Aprovado - Voucher Enviado'
    ).first()

    if not o:
        return fail('Voucher inválido, já utilizado ou inexistente.', 404)

    if o.product.organization_id != g.account.id:
        return fail('Este voucher pertence a outra instituição.', 403)

    o.status = 'Entregue / Concluído'
    o.delivered_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({
        'message': 'Retirada confirmada. Pedido concluído.',
        'order': order_json(o)
    })


# TRATAMENTO DE ERROS

@app.errorhandler(404)
def not_found(_):
    return fail('Rota não encontrada.', 404)


@app.errorhandler(500)
def server_error(_):
    db.session.rollback()
    return fail('Erro interno do servidor.', 500)


# CRIAÇÃO DO BANCO E DADOS DE DEMONSTRAÇÃO

with app.app_context():
    db.create_all()

    if not Organization.query.first():
        demo1 = Organization(
            name='Instituto Teko Porã',
            cnpj='12345678000190',
            city='Vila Mariana · São Paulo, SP',
            email='contato@tekopora.org',
            password_hash=generate_password_hash('Teko2026!'),
            description='Acolhimento e segurança alimentar para famílias da comunidade.'
        )

        demo2 = Organization(
            name='Rede Acolhe',
            cnpj='98765432000110',
            city='Santo Amaro · São Paulo, SP',
            email='acolhe@rede.org',
            password_hash=generate_password_hash('Acolhe2026!'),
            description='Apoio comunitário, cuidado e oportunidades para recomeçar.'
        )

        db.session.add_all([demo1, demo2])
        db.session.flush()

        db.session.add_all([
            Product(
                organization_id=demo1.id,
                name='Cesta Básica Completa',
                category='Alimentos',
                quantity=12
            ),
            Product(
                organization_id=demo2.id,
                name='Kit Higiene Pessoal',
                category='Higiene',
                quantity=8
            ),
            Product(
                organization_id=demo1.id,
                name='Leite em Pó Integral',
                category='Alimentos',
                quantity=0
            ),
            Product(
                organization_id=demo2.id,
                name='Agasalhos Infantis',
                category='Vestuário',
                quantity=5
            )
        ])

    if not Beneficiary.query.first():
        db.session.add(
            Beneficiary(
                name='Mariana Oliveira',
                cpf='12345678909',
                phone='(11) 99999-1234',
                password_hash=generate_password_hash('Demo2026!')
            )
        )

    db.session.commit()


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_DEBUG', '0') == '1'
    )
