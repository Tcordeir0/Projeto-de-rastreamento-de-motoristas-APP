require('dotenv').config();
console.log('URL:', process.env.SUPABASE_URL);
console.log('KEY:', process.env.SUPABASE_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function checkUsersTable() {
  const { data, error } = await supabase
    .from('USERS')
    .select('id, email');

  if (error) {
    if (error.code === '42501') {
      console.error('Erro de permissão: O usuário do banco de dados não tem permissão para acessar o schema Rastreamento. Verifique as permissões do usuário.');
    } else {
      console.error('Erro ao verificar a tabela users:', error.message);
      if (error.message.includes('relation "USERS" does not exist')) {
        console.log('A tabela USERS não existe.');
      }
    }
    return;
  } else {
    console.log('A tabela USERS existe.');
  }
}

checkUsersTable();
