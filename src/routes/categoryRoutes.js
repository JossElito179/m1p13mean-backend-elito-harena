const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

const validateCategoryUpdate = (req, res, next) => {
    const { code, label } = req.body;
    
    if (code && typeof code !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Le code doit être une chaîne de caractères'
        });
    }
    
    if (label && typeof label !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Le label doit être une chaîne de caractères'
        });
    }
    
    next();
};

const validateIdParam = (req, res, next) => {
    const { id } = req.params;
    
    if (!id || id.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'ID de catégorie requis'
        });
    }
    
    const ObjectId = require('mongoose').Types.ObjectId;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'ID de catégorie invalide'
        });
    }
    
    next();
};

router.get('/', categoryController.getAllCategories);

router.get('/paginated', categoryController.getCategoriesPaginated);

router.get('/:id', validateIdParam, categoryController.getCategoryById);

router.put('/:id', validateIdParam, validateCategoryUpdate, categoryController.updateCategory);

router.delete('/:id', validateIdParam, categoryController.deleteCategory);

router.post('/', categoryController.createCategory);

module.exports = router;