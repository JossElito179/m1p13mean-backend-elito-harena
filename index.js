require('dotenv').config();
const express = require('express');
const cors = require('cors');
const database = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const categoryRoutes =  require('./src/routes/categoryRoutes')

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const dbStatus = database.getStatus();

app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);


app.get('/', (req, res) => {
    res.json({
        message: 'API d\'authentification JWT avec rôles',
        endpoints: {
            auth: '/api/auth'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📁 Environnement: ${process.env.NODE_ENV || 'development'}`);
});