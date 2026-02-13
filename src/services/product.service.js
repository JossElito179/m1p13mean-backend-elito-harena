const Product = require('../models/product.model');
const ProductUploadService = require('./productUpload.service');
const Shop = require('../models/shop.model');

const uploadService = new ProductUploadService();

const createProduct = async (productData, files, userId) => {
    try {
        if (!productData.name || !productData.price || !productData.shopId) {
            throw new Error('Nom, prix et boutique sont obligatoires');
        }

        const shop = await Shop.findOne({
            _id: productData.shopId,
            deletedAt: null
        });

        if (!shop) {
            throw new Error('Boutique non trouvée ou accès non autorisé');
        }

        const product = await Product.create({
            ...productData,
            categories: productData.categories ? productData.categories.map(cat => cat.toUpperCase()) : [],
            imagePaths: [],
            status: productData.status || 'DRAFT'
        });

        if (files && files.length > 0) {
            const uploadResult = await uploadService.uploadMultipleImages(
                files,
                product._id,
                product.shopId
            );

            if (uploadResult.success && uploadResult.imagePaths.length > 0) {
                product.imagePaths = uploadResult.imageUrls;
                await product.save();
            }
        }

        const populatedProduct = await Product.findById(product._id)
            .populate('shop', 'name location')
            .select('-__v');

        return {
            success: true,
            data: populatedProduct,
            message: 'Produit créé avec succès'
        };

    } catch (error) {
        console.error('Error in createProduct service:', error);
        
        if (files && files.length > 0) {
            try {
                const productId = error.productId || 'temp';
                const promises = files.map(async (_, index) => {
                    const tempPath = `shop-${productData.shopId}/product-${productId}/image-${index}`;
                    await uploadService.deleteFile(tempPath);
                });
                await Promise.all(promises);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }
        
        throw error;
    }
};

const findProductById = async (id, userId = null) => {
    try {
        const query = {
            _id: id,
            deletedAt: null
        };

        if (userId) {
            const product = await Product.findOne(query)
                .populate({
                    path: 'shop',
                    match: { ownerId: userId }
                });

            if (!product || !product.shop) {
                return {
                    success: false,
                    message: 'Produit non trouvé ou accès non autorisé'
                };
            }

            return {
                success: true,
                data: product
            };
        }

        const product = await Product.findOne(query)
            .populate('shop', 'name location isOpen')
            .select('-__v');

        if (!product) {
            return {
                success: false,
                message: 'Produit non trouvé'
            };
        }

        return {
            success: true,
            data: product
        };

    } catch (error) {
        console.error('Error in findProductById service:', error);
        throw new Error('Erreur lors de la récupération du produit');
    }
};

const findProductsPaginated = async (filters = {}, page = 1, limit = 10) => {
    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const filter = { deletedAt: null };

        if (filters.shopId) {
            filter.shopId = filters.shopId;
        }

        if (filters.status) {
            filter.status = filters.status;
        }

        if (filters.category) {
            filter.categories = { 
                $in: [new RegExp(filters.category, 'i')] 
            };
        }

        if (filters.minPrice !== undefined) {
            const minPrice = parseFloat(filters.minPrice);
            if (!isNaN(minPrice)) {
                filter.price = { $gte: minPrice };
            }
        }

        if (filters.maxPrice !== undefined) {
            const maxPrice = parseFloat(filters.maxPrice);
            if (!isNaN(maxPrice)) {
                filter.price = { 
                    ...filter.price, 
                    $lte: maxPrice 
                };
            }
        }

        if (filters.inStock !== undefined && filters.inStock !== null) {
            const inStock = filters.inStock === 'true' || filters.inStock === true;
            filter.stock = inStock ? { $gt: 0 } : { $eq: 0 };
        }

        if (filters.search) {
            filter.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
                { categories: { $in: [new RegExp(filters.search, 'i')] } }
            ];
        }

        const sortOptions = {};
        if (filters.sortBy) {
            const [field, order] = filters.sortBy.split(':');
            const validSortFields = ['price', 'name', 'createdAt', 'stock', 'status'];
            if (validSortFields.includes(field)) {
                sortOptions[field] = order === 'desc' ? -1 : 1;
            } else {
                sortOptions.createdAt = -1; 
            }
        } else {
            sortOptions.createdAt = -1; 
        }

        const [total, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter)
                .populate({
                    path: 'shopId',
                    select: 'name location logo status'
                })
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .select('-__v')
        ]);

        const enrichedProducts = products.map(product => {
            const productObj = product.toObject();
            return {
                ...productObj,
                inStock: product.stock > 0,
                totalValue: product.price * product.stock,
                imageCount: product.imagePaths?.length || 0
            };
        });

        const totalPages = Math.ceil(total / limitNum);

        return {
            success: true,
            data: enrichedProducts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems: total,
                totalPages: totalPages
            }
        };

    } catch (error) {
        console.error('Error in findProductsPaginated service:', error);
        throw new Error('Erreur lors de la récupération des produits');
    }
};
const updateProduct = async (id, updateData, userId, files = null) => {
    try {
        const product = await Product.findOne({
            _id: id,
            deletedAt: null
        }).populate('shop');

        if (!product) {
            throw new Error('Produit non trouvé');
        }

        const { _id, shopId, createdAt, deletedAt, imagePaths, imageUrls, ...safeUpdateData } = updateData;

        if (safeUpdateData.categories && Array.isArray(safeUpdateData.categories)) {
            safeUpdateData.categories = safeUpdateData.categories.map(cat => cat.toUpperCase());
        }

        let updatedProduct = product;
        
        if (files && files.length > 0) {
            const uploadResult = await uploadService.updateProductImages(product, files);
            
            if (uploadResult.success) {
                safeUpdateData.imagePaths = uploadResult.imageUrls;
            } else {
                throw new Error('Erreur lors de l\'upload des images');
            }
        }

        updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                $set: safeUpdateData,
                $currentDate: { updatedAt: true }
            },
            {
                new: true,
                runValidators: true
            }
        )
        .populate('shop', 'name location')
        .select('-__v');

        return {
            success: true,
            data: updatedProduct,
            message: 'Produit mis à jour avec succès'
        };

    } catch (error) {
        console.error('Error in updateProduct service:', error);
        throw error;
    }
};

const deleteProduct = async (id, userId) => {
    try {
        const product = await Product.findOne({
            _id: id,
            deletedAt: null
        }).populate('shop');

        if (!product) {
            return {
                success: false,
                message: 'Produit non trouvé'
            };
        }

        await uploadService.deleteProductImages(product);

        const deletedProduct = await Product.findByIdAndUpdate(
            id,
            {
                $set: {
                    deletedAt: new Date(),
                    status: 'INACTIVE'
                }
            },
            {
                new: true
            }
        );

        return {
            success: true,
            data: deletedProduct,
            message: 'Produit supprimé avec succès'
        };

    } catch (error) {
        console.error('Error in deleteProduct service:', error);
        throw error;
    }
};

const addImagesToProduct = async (productId, files, userId) => {
    try {
        const product = await Product.findOne({
            _id: productId,
            deletedAt: null
        }).populate('shop');

        if (!product) {
            throw new Error('Produit non trouvé');
        }

        if (product.shop.ownerId.toString() !== userId.toString()) {
            throw new Error('Accès non autorisé');
        }

        const result = await uploadService.addImagesToProduct(product, files);

        if (result.success) {
            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                {
                    $set: {
                        imagePaths: result.imageUrls,
                    }
                },
                { new: true }
            )
            .populate('shop', 'name location')
            .select('-__v');

            return {
                success: true,
                data: updatedProduct,
                message: result.message
            };
        }

        return {
            success: false,
            message: result.message
        };

    } catch (error) {
        console.error('Error in addImagesToProduct service:', error);
        throw error;
    }
};

const deleteProductImage = async (productId, imageIndex, userId) => {
    try {
        const product = await Product.findOne({
            _id: productId,
            deletedAt: null
        }).populate('shop');

        if (!product) {
            throw new Error('Produit non trouvé');
        }

        if (product.shop.ownerId.toString() !== userId.toString()) {
            throw new Error('Accès non autorisé');
        }

        const result = await uploadService.deleteSingleImage(product, imageIndex);

        if (result.success) {
            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                {
                    $set: {
                        imagePaths: result.imageUrls,
                    }
                },
                { new: true }
            )
            .populate('shop', 'name location')
            .select('-__v');

            return {
                success: true,
                data: updatedProduct,
                message: result.message
            };
        }

        return {
            success: false,
            message: result.message
        };

    } catch (error) {
        console.error('Error in deleteProductImage service:', error);
        throw error;
    }
};

const getProductStats = async (shopId = null, userId = null) => {
    try {
        const matchStage = { deletedAt: null };
        
        if (shopId) {
            matchStage.shopId = shopId;
        }

        if (userId && shopId) {
            const shop = await Shop.findOne({
                _id: shopId,
                ownerId: userId
            });
            
            if (!shop) {
                throw new Error('Accès non autorisé');
            }
        }

        const stats = await Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
                    avgPrice: { $avg: '$price' },
                    totalStock: { $sum: '$stock' }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: '$_id',
                    count: 1,
                    totalValue: 1,
                    avgPrice: { $round: ['$avgPrice', 2] },
                    totalStock: 1
                }
            },
            { $sort: { status: 1 } }
        ]);

        return {
            success: true,
            data: stats
        };

    } catch (error) {
        console.error('Error in getProductStats service:', error);
        throw error;
    }
};

module.exports = {
    createProduct,
    findProductById,
    findProductsPaginated,
    updateProduct,
    deleteProduct,
    addImagesToProduct,
    deleteProductImage,
    getProductStats
};