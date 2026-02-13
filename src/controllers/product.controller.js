const productService = require('../services/product.service');
const Shop = require('../models/shop.model')

const createProduct = async (req, res) => {
    try {
        const productData = req.body;
        const files = req.files || [];
        const userId = req.user._id;

        const result = await productService.createProduct(productData, files, userId);

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in createProduct controller:', error);
        
        const errorMap = {
            'Nom, prix et boutique sont obligatoires': 400,
            'Boutique non trouvée ou accès non autorisé': 403,
            'Erreur lors de l\'upload des images': 500
        };

        const statusCode = errorMap[error.message] || 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id || null;

        const result = await productService.findProductById(id, userId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }

        res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Error in getProductById controller:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getProductsPaginated = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            shopId,
            status,
            category,
            minPrice,
            maxPrice,
            inStock,
            search,
            sortBy
        } = req.query;

        const filters = {
            shopId,
            status,
            category,
            minPrice,
            maxPrice,
            inStock,
            search,
            sortBy
        };

        Object.keys(filters).forEach(key => 
            (filters[key] === undefined || filters[key] === null) && delete filters[key]
        );

        // if (req.user && req.user.role === 'ADMIN' && shopId) {
        //     const shop = await Shop.findOne({ _id: shopId, userId: req.user.id });
        //     if (!shop) {
        //         return res.status(403).json({
        //             success: false,
        //             message: 'Vous n\'êtes pas autorisé à voir les produits de cette boutique'
        //         });
        //     }
        // }

        const result = await productService.findProductsPaginated(filters, page, limit);

        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('Error in getProductsPaginated controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de la récupération des produits'
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user._id;
        const files = req.files || [];

        const result = await productService.updateProduct(id, updateData, userId, files);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in updateProduct controller:', error);
        
        const errorMap = {
            'Produit non trouvé': 404,
            'Vous n\'êtes pas autorisé à modifier ce produit': 403,
            'Erreur lors de l\'upload des images': 500
        };

        const statusCode = errorMap[error.message] || 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const result = await productService.deleteProduct(id, userId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in deleteProduct controller:', error);
        
        if (error.message === 'Vous n\'êtes pas autorisé à supprimer ce produit') {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const addImages = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files || [];
        const userId = req.user._id;

        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucune image fournie'
            });
        }

        const result = await productService.addImagesToProduct(id, files, userId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in addImages controller:', error);
        
        const errorMap = {
            'Produit non trouvé': 404,
            'Accès non autorisé': 403
        };

        const statusCode = errorMap[error.message] || 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { id, imageIndex } = req.params;
        const userId = req.user._id;

        const index = parseInt(imageIndex);
        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                success: false,
                message: 'Index d\'image invalide'
            });
        }

        const result = await productService.deleteProductImage(id, index, userId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in deleteImage controller:', error);
        
        const errorMap = {
            'Produit non trouvé': 404,
            'Accès non autorisé': 403,
            'Image non trouvée': 404
        };

        const statusCode = errorMap[error.message] || 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

const getStats = async (req, res) => {
    try {
        const { shopId } = req.query;
        const userId = req.user._id;

        const result = await productService.getProductStats(shopId, userId);

        res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Error in getStats controller:', error);
        
        if (error.message === 'Accès non autorisé') {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createProduct,
    getProductById,
    getProductsPaginated,
    updateProduct,
    deleteProduct,
    addImages,
    deleteImage,
    getStats
};