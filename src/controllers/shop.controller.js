const shopService = require('../services/shop.service');
const Shop = require('../models/shop.model');

const createShop = async (req, res) => {
    try {
        const shopData = req.body;
        const imageFile = req.file;

        const result = await shopService.createShop(shopData, imageFile);

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in createShop controller:', error);

        const errorMap = {
            'Le nom et le propriétaire sont obligatoires': 400,
            'Cet utilisateur possède déjà une boutique': 409,
            'Cette zone est déjà occupée': 409,
            'Échec de l\'upload de l\'image': 500,
            'Erreur de validation': 400
        };

        const statusCode = errorMap[error.message] || 500;

        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

const updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        console.log(req.body)

        const userId = updateData.ownerId;
        const imageFile = req.file;

        const result = await shopService.updateShop(id, updateData, userId, imageFile);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in updateShop controller:', error);

        const errorMap = {
            'Boutique non trouvée': 404,
            'Vous n\'êtes pas autorisé à modifier cette boutique': 403,
            'Cette zone est déjà occupée': 409,
            'Échec de la mise à jour de l\'image': 500,
            'Erreur de validation': 400
        };

        const statusCode = errorMap[error.message] || 500;

        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

const updateShopImage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({
                success: false,
                message: 'Image requise'
            });
        }

        const shop = await Shop.findOne({
            _id: id,
            deletedAt: null
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Boutique non trouvée'
            });
        }

        if (shop.ownerId.toString() !== userId && !userId.endsWith('admin')) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé'
            });
        }

        const result = await shopService.updateShop(
            id,
            {},
            userId,
            imageFile
        );

        res.status(200).json({
            success: true,
            message: 'Image mise à jour avec succès',
            data: result.data
        });

    } catch (error) {
        console.error('Error in updateShopImage controller:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getShopById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await shopService.findShopById(id);

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
        console.error('Error in getShopById controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur'
        });
    }
};

const getShopsPaginated = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            isOpen,
            floor,
            zone,
            category,
            search,
            ownerId
        } = req.query;

        const filters = {
            isOpen: isOpen === 'true' ? true : isOpen === 'false' ? false : undefined,
            floor: floor ? parseInt(floor) : undefined,
            zone,
            category,
            search,
            ownerId
        };

        const result = await shopService.findAllShopsPaginated(filters, page, limit);

        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('Error in getShopsPaginated controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur'
        });
    }
};


const getAllShops = async (req, res) => {
    try {
        const filters = req.query;
        const result = await shopService.findAllShops(filters);

        res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Error in getAllShops controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur'
        });
    }
};

const deleteShop = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const result = await shopService.deleteShop(id, userId);

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
        console.error('Error in deleteShop controller:', error);

        if (error.message === 'Vous n\'êtes pas autorisé à supprimer cette boutique') {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur'
        });
    }
};

const getStats = async (req, res) => {
    try {
        const result = await shopService.getShopStats();

        res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Error in getStats controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur'
        });
    }
};

const searchShops = async (req, res) => {
    try {
        const { q, floor, category, isOpen } = req.query;

        const filters = {};

        if (q) {
            filters.$text = { $search: q };
        }

        if (floor) {
            filters['location.floor'] = parseInt(floor);
        }

        if (category) {
            filters.categories = category.toUpperCase();
        }

        if (isOpen !== undefined) {
            filters.isOpen = isOpen === 'true';
        }

        const shops = await Shop.find({
            ...filters,
            deletedAt: null
        })
            .populate('owner', 'name email')
            .limit(20)
            .select('-__v');

        res.status(200).json({
            success: true,
            data: shops
        });

    } catch (error) {
        console.error('Error in searchShops controller:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche'
        });
    }
};

module.exports = {
    createShop,
    getShopById,
    getShopsPaginated,
    getAllShops,
    updateShop,
    updateShopImage,
    deleteShop,
    getStats,
    searchShops
};