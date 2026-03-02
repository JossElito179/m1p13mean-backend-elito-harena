require('dotenv').config();
const express = require('express');
const cors = require('cors');
const database = require('./src/config/database');
const userRoutes = require('./src/routes/user.routes');
const authRoutes = require('./src/routes/auth.routes');
const shopRoutes = require('./src/routes/shop.routes');
const categoryRoutes =  require('./src/routes/category.routes');
const productRoutes = require('./src/routes/product.routes');
const cartRoutes = require('./src/routes/carts.routes')
const orderRoutes = require('./src/routes/order.routes')
const dashboardRoutes = require('./src/routes/dashboard.routes')

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const dbStatus = database.getStatus();

app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/users', userRoutes);
app.use('/api/v2/category', categoryRoutes);
app.use('/api/v2/shops', shopRoutes);
app.use('/api/v2/product', productRoutes);
app.use('/api/v2/cart', cartRoutes);
app.use('/api/v2/orders', orderRoutes);
app.use('/api/v2/dashboard', dashboardRoutes);



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