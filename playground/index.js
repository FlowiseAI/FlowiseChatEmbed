import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // initailze a express application
app.use(express.static('../dist')); // make the public folder as static

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html')); // serve the static html
});

app.listen(3001, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(`Server is listening at: ${3001}`);
});
