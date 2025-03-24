import supabase from './supabaseConfig';

// Função para inserir um admin
export const insertAdmin = async (nome: string, email: string, senha: string) => {
  const { data, error } = await supabase
    .from('admin')
    .insert([{ nome, email, senha }]);

  if (error) console.error("Erro ao inserir admin:", error.message);
  else console.log("Admin inserido:", data);
};

// Função para inserir um motorista
export const insertMotorista = async (nome: string, cpf: string, veiculo: string, placa: string) => {
  const { data, error } = await supabase
    .from('motoristas')
    .insert([{ nome, cpf, veiculo, placa }]);

  if (error) console.error("Erro ao inserir motorista:", error.message);
  else console.log("Motorista inserido:", data);
};