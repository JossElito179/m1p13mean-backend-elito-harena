const { body, param, validationResult } = require('express-validator');

const validateShop = [
    body('name')
        .trim()
        .notEmpty().withMessage('Le nom est obligatoire')
        .isLength({ max: 100 }).withMessage('Le nom ne doit pas dépasser 100 caractères'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La description ne doit pas dépasser 500 caractères'),
    
    body('location.floor')
        .isInt({ min: 0, max: 10 }).withMessage('L\'étage doit être entre 0 et 10'),
    
    body('location.zone')
        .matches(/^[A-Z]\d{1,3}$/).withMessage('La zone doit être au format A12'),
    
    body('categories')
        .optional()
        .isArray().withMessage('Les catégories doivent être un tableau'),
    
    body('categories.*')
        .optional()
        .isString().withMessage('Chaque catégorie doit être une chaîne')
        .isLength({ max: 50 }).withMessage('Catégorie trop longue'),
    
    body('isOpen')
        .optional()
        .isBoolean().withMessage('isOpen doit être un booléen'),
    
    body('imagePath')
        .optional()
        .isString().withMessage('imagePath doit être une chaîne'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

const validateId = [
    param('id')
        .isMongoId().withMessage('ID invalide'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateShop,
    validateId
};