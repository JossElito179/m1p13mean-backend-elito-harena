const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

router.get('/users', auth, authorize('ADMIN'), authController.getAllUsers);
router.put('/users/:userId/role', auth, authorize('ADMIN'), authController.updateUserRole);

router.get('/admin-only', auth, authorize('ADMIN'), (req, res) => {
  res.json({ message: 'Bienvenue Admin!' });
});

router.get('/shop-only', auth, authorize('SHOP'), (req, res) => {
  res.json({ message: 'Bienvenue Boutique!' });
});

router.get('/user-only', auth, authorize('USER'), (req, res) => {
  res.json({ message: 'Bienvenue Utilisateur!' });
});

router.get('/admin-or-shop', auth, authorize('ADMIN', 'SHOP'), (req, res) => {
  res.json({ message: 'Bienvenue Admin ou Boutique!' });
});

module.exports = router;