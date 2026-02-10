const Shop = require('../models/shop.model');
const FileUploadService = require('./fileUpload.service');

const fileUploadService = new FileUploadService('shops');

const createShop = async (shopData, imageFile) => {
    try {

        if (!shopData.name || !shopData.ownerId) {
            throw new Error('Le nom et le propriétaire sont obligatoires');
        }

        const existingShop = await Shop.findOne({
            ownerId: shopData.ownerId,
            deletedAt: null
        });

        if (existingShop) {
            throw new Error('Cet utilisateur possède déjà une boutique');
        }

        const existingLocation = await Shop.findOne({
            'location.floor': shopData.location.floor,
            'location.zone': shopData.location.zone,
            deletedAt: null
        });

        if (existingLocation) {
            throw new Error('Cette zone est déjà occupée');
        }

        let imageUrl = null;

        if (imageFile) {
            const uploadResult = await fileUploadService.uploadFile(
                imageFile,
                `shop-${shopData.name}`
            );

            if (uploadResult.success) {
                imagePath = uploadResult.fileName;
                imageUrl = uploadResult.publicUrl;
            } else {
                throw new Error('Échec de l\'upload de l\'image');
            }
        }

        const shop = await Shop.create({
            ...shopData,
            categories: shopData.categories ? shopData.categories.map(cat => cat.toUpperCase()) : [],
            imagePath: imageUrl
        });

        return {
            success: true,
            data: shop,
            message: 'Boutique créée avec succès'
        };

    } catch (error) {
        console.error('Error in createShop service:', error);

        if (imageFile) {
            try {
                await fileUploadService.deleteFile(imagePath);
            } catch (cleanupError) {
                console.error('Erreur lors du nettoyage:', cleanupError);
            }
        }

        throw error;
    }
};

const updateShop = async (id, updateData, userId, imageFile) => {
    try {
        const shop = await Shop.findOne({
            _id: id,
            deletedAt: null
        });

        const { _id, ownerId, createdAt, deletedAt, imagePath: oldImagePath, ...safeUpdateData } = updateData;

        if (safeUpdateData.location) {
            const existingLocation = await Shop.findOne({
                'location.floor': safeUpdateData.location.floor || shop.location.floor,
                'location.zone': safeUpdateData.location.zone || shop.location.zone,
                _id: { $ne: id },
                deletedAt: null
            });

            if (existingLocation) {
                throw new Error('Cette zone est déjà occupée');
            }
        }

        let newImageUrl = shop.imageUrl;

        if (imageFile) {
            const uploadResult = await fileUploadService.updateFile(
                shop.imagePath,
                imageFile
            );

            if (uploadResult.success) {
                newImagePath = uploadResult.fileName;
                newImageUrl = uploadResult.publicUrl;
            } else {
                throw new Error('Échec de la mise à jour de l\'image');
            }
        }

        if (safeUpdateData.categories && Array.isArray(safeUpdateData.categories)) {
            safeUpdateData.categories = safeUpdateData.categories.map(cat => cat.toUpperCase());
        }

        const updatedShop = await Shop.findByIdAndUpdate(
            id,
            {
                $set: {
                    ...safeUpdateData,
                    imagePath: newImageUrl,
                },
                $currentDate: { updatedAt: true }
            },
            {
                new: true,
                runValidators: true
            }
        ).select('-__v');

        return {
            success: true,
            data: updatedShop,
            message: 'Boutique mise à jour avec succès'
        };

    } catch (error) {
        console.error('Error in updateShop service:', error);

        if (error.name === 'ValidationError') {
            throw new Error(`Erreur de validation: ${error.message}`);
        }

        throw error;
    }
};

const deleteShop = async (id, userId) => {
    try {
        const shop = await Shop.findOne({
            _id: id,
            deletedAt: null
        });

        if (!shop) {
            return {
                success: false,
                message: 'Boutique non trouvée'
            };
        }

        if (shop.ownerId.toString() !== userId && !userId.endsWith('admin')) {
            throw new Error('Vous n\'êtes pas autorisé à supprimer cette boutique');
        }

        if (shop.imagePath && shop.imagePath !== 'default-shop.png') {
            try {
                await fileUploadService.deleteFile(shop.imagePath);
            } catch (deleteError) {
                console.error('Erreur lors de la suppression de l\'image:', deleteError);
            }
        }

        const deletedShop = await Shop.findByIdAndUpdate(
            id,
            {
                $set: {
                    deletedAt: new Date(),
                    isOpen: false
                }
            },
            {
                new: true
            }
        );

        return {
            success: true,
            data: deletedShop,
            message: 'Boutique supprimée avec succès'
        };

    } catch (error) {
        console.error('Error in deleteShop service:', error);
        throw new Error('Erreur lors de la suppression de la boutique');
    }
};

const findShopById = async (id) => {
    try {
        const shop = await Shop.findOne({
            _id: id,
            deletedAt: null
        }).populate('owner', 'name email role');

        if (!shop) {
            return {
                success: false,
                message: 'Boutique non trouvée'
            };
        }

        return {
            success: true,
            data: shop
        };

    } catch (error) {
        console.error('Error in findShopById service:', error);
        throw new Error('Erreur lors de la récupération de la boutique');
    }
};

const findAllShopsPaginated = async (filters = {}, page = 1, limit = 10) => {
    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const filter = { deletedAt: null };

        if (filters.isOpen !== undefined) {
            filter.isOpen = filters.isOpen;
        }

        if (filters.ownerId) {
            filter.ownerId = filters.ownerId;
        }

        if (filters.floor) {
            filter['location.floor'] = filters.floor;
        }

        if (filters.zone) {
            filter['location.zone'] = new RegExp(filters.zone, 'i');
        }

        if (filters.category) {
            filter.categories = { $in: [filters.category.toUpperCase()] };
        }

        if (filters.search) {
            filter.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } }
            ];
        }

        const [total, shops] = await Promise.all([
            Shop.countDocuments(filter),
            Shop.find(filter)
                .populate('owner', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('-__v')
        ]);

        const totalPages = Math.ceil(total / limitNum);

        return {
            success: true,
            data: shops,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems: total,
                totalPages: totalPages
            }
        };

    } catch (error) {
        console.error('Error in findAllShopsPaginated service:', error);
        throw new Error('Erreur lors de la récupération des boutiques');
    }
};

const findAllShops = async (filters = {}) => {
    try {
        const filter = { deletedAt: null };

        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                filter[key] = filters[key];
            }
        });

        const shops = await Shop.find(filter)
            .populate('owner', 'name email')
            .sort({ name: 1 })
            .select('-__v');

        return {
            success: true,
            data: shops
        };

    } catch (error) {
        console.error('Error in findAllShops service:', error);
        throw new Error('Erreur lors de la récupération des boutiques');
    }
};


const getShopStats = async () => {
    try {
        const stats = await Shop.aggregate([
            {
                $match: {
                    deletedAt: null
                }
            },
            {
                $group: {
                    _id: null,
                    totalShops: { $sum: 1 },
                    openShops: {
                        $sum: { $cond: [{ $eq: ['$isOpen', true] }, 1, 0] }
                    },
                    closedShops: {
                        $sum: { $cond: [{ $eq: ['$isOpen', false] }, 1, 0] }
                    },
                    byFloor: {
                        $push: {
                            floor: '$location.floor',
                            count: 1
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalShops: 1,
                    openShops: 1,
                    closedShops: 1,
                    floors: {
                        $arrayToObject: {
                            $map: {
                                input: '$byFloor',
                                as: 'item',
                                in: {
                                    k: { $toString: '$$item.floor' },
                                    v: '$$item.count'
                                }
                            }
                        }
                    }
                }
            }
        ]);

        return {
            success: true,
            data: stats[0] || {
                totalShops: 0,
                openShops: 0,
                closedShops: 0,
                floors: {}
            }
        };

    } catch (error) {
        console.error('Error in getShopStats service:', error);
        throw new Error('Erreur lors de la récupération des statistiques');
    }
};

module.exports = {
    createShop,
    findShopById,
    findAllShopsPaginated,
    findAllShops,
    updateShop,
    deleteShop,
    getShopStats
};