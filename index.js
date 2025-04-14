const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Configura o EJS como view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Arquivos estáticos (JS, CSS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Página principal
app.get('/', (req, res) => {
  res.render('inicial');
});

app.get('/precificacao', (req, res) => {
    res.render('precificacao');
  });

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
});
