-- Inserir usuário Admin 'viktor' (email: viktor@aresta.org ou nome: viktor) com senha 'orlaweb123123#'
INSERT OR REPLACE INTO users (id, name, email, password_hash, role, is_active)
VALUES (
    100,
    'viktor',
    'viktor@aresta.org',
    'orlaweb123123#',
    'ADMIN',
    1
);
