import express from 'express';
import path from 'path';
import fs from 'fs/promises';

const app = express();
app.use(express.json());

const DATA_PATH = path.resolve(__dirname, './data/sample.json');

app.get('/api/photos/data', async (_req, res) => {
  try {
    const text = await fs.readFile(DATA_PATH, 'utf8');
    res.type('json').send(text);
  } catch (err) {
    res.status(500).send({ error: 'failed to read data' });
  }
});

app.post('/api/photos/data', async (req, res) => {
  try {
    const newData = req.body;
    if (!Array.isArray(newData)) return res.status(400).send({ error: 'expected array' });
    const tmp = DATA_PATH + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(newData, null, 2), 'utf8');
    await fs.rename(tmp, DATA_PATH);
    res.send({ ok: true });
  } catch (err) {
    res.status(500).send({ error: 'failed to write data' });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`backend listening on http://localhost:${port}`);
});

export default app;
