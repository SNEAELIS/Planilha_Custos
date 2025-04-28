const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

import ReactGA from 'react-ga';

// Inicialize o Google Analytics com seu ID de acompanhamento
ReactGA.initialize('G-8KNVEWNZMM');

// Rastreie a página atual
ReactGA.pageview(window.location.pathname + window.location.search);


// Configuração do CORS para permitir acesso público
app.use(cors({
  origin: '*',
  methods: ['GET']
}));

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configura o EJS como view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rotas de visualização
app.get('/', (req, res) => {
  res.render('inicial');
});

app.get('/precificacao', (req, res) => {
  res.render('precificacao');
});

// Rota para consulta de CNPJ
app.get('/api/consulta-cnpj/:cnpj', async (req, res) => {
  try {
    const { cnpj } = req.params;
    
    // Validação do CNPJ
    if (!validarCNPJ(cnpj)) {
      return res.status(400).json({ 
        success: false,
        error: 'CNPJ inválido' 
      });
    }

    // Consulta à API da ReceitaWS
    const response = await axios.get(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
      timeout: 5000
    });
    
    if (response.data.status === 'ERROR') {
      return res.status(404).json({ 
        success: false,
        error: response.data.message || 'CNPJ não encontrado' 
      });
    }

    // Retorna os dados da empresa
    res.json({
      success: true,
      nome: response.data.nome,
      fantasia: response.data.fantasia,
      cnpj: formatarCNPJ(response.data.cnpj),
      situacao: response.data.situacao
    });

  } catch (error) {
    console.error('Erro na consulta do CNPJ:', error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        success: false,
        error: 'Limite de consultas excedido. Tente novamente mais tarde.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erro ao consultar CNPJ. Tente novamente ou preencha manualmente.' 
    });
  }
});

// Função para validar CNPJ
function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g,'');
  
  if (cnpj === '' || cnpj.length !== 14) return false;
  
  // Elimina CNPJs inválidos conhecidos
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Valida DVs
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0)) return false;
      
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(1)) return false;
      
  return true;
}

// Função para formatar CNPJ
function formatarCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g,'');
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});