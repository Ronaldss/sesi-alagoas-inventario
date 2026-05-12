# Inventario SESI Alagoas

MVP de sistema de inventario web responsivo para supervisao escolar, com foco em cadastro de equipamentos, conferencia rapida e instalacao no celular como PWA.

## O que esta pronto

- Login demonstrativo com perfis `Supervisor` e `Colaborador`
- Cadastro de itens com nome, categoria, localizacao, estado e data de aquisicao
- Upload de imagem com suporte a camera/galeria no mobile
- Busca e filtros para auditoria
- Manifest e service worker basicos para PWA
- Esquema SQL inicial para Supabase com RLS

## Rodando localmente

```bash
npm install
npm run dev
```

## Credenciais demo

- `supervisora@sesi-al.demo` / `sesi123`
- `colaborador@sesi-al.demo` / `sesi123`

## Integracao sugerida

1. Crie um projeto no Supabase.
2. Execute o SQL em `supabase/schema.sql`.
3. Configure `.env` a partir de `.env.example`.
4. Crie usuarios no Supabase Auth informando os metadados `full_name` e `role`.
5. Com as variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o app passa a usar autenticacao, banco e storage reais automaticamente.

## Modo atual

- Sem `.env`: o app roda em modo demonstracao com armazenamento local.
- Com `.env` do Supabase: o app usa login real, lista itens do banco e envia imagens para o bucket `inventory-images`.

## Exemplo de usuario no Supabase Auth

Ao criar um usuario, use metadados semelhantes a estes:

```json
{
  "full_name": "Nome (teste)",
  "role": "Supervisor"
}
```

O trigger em `supabase/schema.sql` cria ou atualiza automaticamente o registro em `profiles`.

## Publicacao

Opcao recomendada agora:

1. Suba o projeto para um repositorio GitHub.
2. Importe o repositorio na Vercel.
3. Configure as variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Publique com:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`

O arquivo `vercel.json` ja foi incluido para garantir o funcionamento correto da SPA na Vercel.
