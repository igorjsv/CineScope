# CineScope

Catálogo de filmes com TMDB e integração com Supabase.

## Arquivos
- `index.html`: estrutura da interface.
- `style.css`: estilos.
- `script.js`: catálogo, autenticação, comentários e favoritos.
- `supabase-setup.sql`: estrutura e políticas do banco.

## Configuração do Supabase
1. Abra o projeto no Supabase Dashboard.
2. Entre em SQL Editor.
3. Execute o conteúdo de `supabase-setup.sql`.
4. Confira no `script.js` se `SUPABASE_URL` e `SUPABASE_ANON_KEY` correspondem às credenciais públicas do seu projeto. A chave publishable/anon pode ficar no frontend; nunca use `service_role` no navegador.
5. Em Authentication > URL Configuration, configure os endereços locais e de produção usados pelo site.

## Funcionalidades conectadas
- Cadastro e login pelo Supabase Auth.
- Perfil criado automaticamente por trigger na tabela `perfis`.
- Foto de perfil enviada ao bucket público `avatars` no Supabase Storage.
- Favoritos armazenados na tabela `favoritos`, separados por usuário.
- Comentários armazenados na tabela `comentarios`.

## Executar localmente
Abra a pasta com VS Code e use uma extensão de servidor local, como Live Server. Evite abrir o HTML diretamente por `file://`.

## GitHub
Não envie `.env`, tokens privados ou chaves `service_role`. O arquivo `script.js` contém apenas a chave pública do Supabase.
