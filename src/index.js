import express from 'express';

const app = express();
const PORT = 5001;

app.use(express.json());

app.get('/', (req, res) => {
	res.json({ message: 'Sportz API is running.' });
});

app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${PORT}`);
});
