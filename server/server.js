import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const db = await mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'filmesdb',
});


const imagesDir = path.resolve(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });


app.use(express.static(path.resolve(__dirname, '..', 'public')));


app.post('/api/filmes-series', upload.single('imagem'), async (req, res) => {
  try {
    const { titulo, genero, descricao, tipo } = req.body;

    if (!titulo || !genero || !descricao || !tipo) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    const imagemPath = req.file
      ? '/images/' + req.file.filename
      : tipo === 'filme'
      ? '/images/default-filme.jpg'
      : '/images/default-serie.jpg';

    const [result] = await db.execute(
      'INSERT INTO filmes_series (titulo, genero, descricao, tipo, imagem) VALUES (?, ?, ?, ?, ?)',
      [titulo, genero, descricao, tipo, imagemPath]
    );

    const novoItem = {
      id: result.insertId,
      titulo,
      genero,
      descricao,
      tipo,
      imagem: imagemPath,
      votos_positivos: 0,
      votos_negativos: 0,
    };

    res.status(201).json({ message: 'Cadastro realizado!', item: novoItem });
  } catch (error) {
    console.error('Erro ao salvar no banco:', error);
    res.status(500).json({ error: 'Erro ao salvar no banco de dados' });
  }
});


app.get('/api/filmes-series', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM filmes_series ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar no banco:', error);
    res.status(500).json({ error: 'Erro ao buscar no banco de dados' });
  }
});


app.post('/api/filmes-series/:id/voto/positivo', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute('UPDATE filmes_series SET votos_positivos = votos_positivos + 1 WHERE id = ?', [id]);
    const [rows] = await db.query('SELECT votos_positivos, votos_negativos FROM filmes_series WHERE id = ?', [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Item não encontrado' });

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao registrar voto positivo:', error);
    res.status(500).json({ error: 'Erro ao atualizar voto positivo' });
  }
});


app.post('/api/filmes-series/:id/voto/negativo', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.execute('UPDATE filmes_series SET votos_negativos = votos_negativos + 1 WHERE id = ?', [id]);
    const [rows] = await db.query('SELECT votos_positivos, votos_negativos FROM filmes_series WHERE id = ?', [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Item não encontrado' });

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao registrar voto negativo:', error);
    res.status(500).json({ error: 'Erro ao atualizar voto negativo' });
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
