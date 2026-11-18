
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const networkRoutes = require('./routes/networkRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/network-plans', networkRoutes);

app.get('/', (req, res) => {
    res.send('IP Address & Subnet Network Planner Backend is Running');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
