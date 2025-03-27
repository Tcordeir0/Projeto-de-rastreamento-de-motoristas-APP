# Aplicativo de Rastreamento de Motoristas

Um aplicativo moderno para gerenciar motoristas e administradores, com autenticação segura e fluxos de registro e login diferenciados.

## 🚀 Visão Geral

O projeto é um aplicativo de rastreamento de motoristas que permite:
- **Registro de usuários** (ADMIN e MOTORISTAS) com base no domínio do email.
- **Login seguro** com autenticação via Supabase.
- **Gerenciamento de dados** específicos para cada tipo de usuário.
- **Interface intuitiva** construída com React Native e Expo.

## 🛠️ Configuração

### Pré-requisitos
- Node.js (v18 ou superior)
- Expo CLI (`npm install -g expo-cli`)
- Conta no Supabase (para autenticação e banco de dados)

### Passos para configurar
1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/projeto-rastreamento.git
   cd projeto-rastreamento
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o Supabase:
   - Crie um projeto no Supabase.
   - Configure as tabelas `admins` e `drivers` conforme o esquema abaixo.
   - Adicione as variáveis de ambiente no arquivo `.env`:
     ```env
     SUPABASE_URL=seu-url-supabase
     SUPABASE_KEY=seu-key-supabase
     ```

4. Execute o projeto:
   ```bash
   expo start
   ```

## 🗂️ Estrutura do Projeto

```
project/
├── app/
│   ├── (auth)/              # Telas de autenticação
│   │   ├── login.tsx        # Tela de login
│   │   ├── register.tsx     # Tela de registro inicial
│   │   ├── employee-register.tsx  # Registro de ADMIN
│   │   └── driver-register.tsx    # Registro de MOTORISTAS
│   ├── (app)/               # Telas principais
│   │   ├── admin/           # Telas para ADMIN
│   │   └── driver/          # Telas para MOTORISTAS
│   └── _layout.tsx          # Layout principal
├── utils/
│   └── supabase.ts          # Configuração do Supabase
└── README.md                # Este arquivo
```

## 📋 Funcionalidades

### Registro
- **ADMIN**: Usuários com email `@borgnotransportes.com.br` são redirecionados para o fluxo de registro de administradores.
- **MOTORISTAS**: Outros emails são redirecionados para o fluxo de registro de motoristas.

### Login
- Autenticação segura com Supabase.
- Redirecionamento para a tela correta com base no tipo de usuário.

### Gerenciamento de Dados
- **ADMIN**: Acessam informações específicas da tabela `admins`.
- **MOTORISTAS**: Acessam informações específicas da tabela `drivers`.

## 🧰 Tecnologias Utilizadas

- **React Native**: Framework para desenvolvimento de aplicativos móveis.
- **Expo**: Plataforma para desenvolvimento e build de aplicativos.
- **Supabase**: Autenticação e banco de dados em tempo real.
- **TypeScript**: Adiciona tipagem estática ao JavaScript.

## 📄 Esquema do Banco de Dados

### Tabela `admins`
```sql
CREATE TABLE admins (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  phone TEXT,
  name TEXT,
  branch TEXT,
  PRIMARY KEY (id)
);
```

### Tabela `drivers`
```sql
CREATE TABLE drivers (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  phone TEXT,
  name TEXT,
  vehicle_type TEXT,
  license_number TEXT,
  PRIMARY KEY (id)
);
```

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos abaixo:
1. Faça um fork do projeto.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`).
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`).
4. Faça push para a branch (`git push origin feature/nova-feature`).
5. Abra um Pull Request.

## 📜 Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com ❤️ por [Seu Nome](https://github.com/seu-usuario).
