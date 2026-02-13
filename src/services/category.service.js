const Category = require('../models/category.model');

const createCategory = async (categoryData) => {
    try {
        if (!categoryData.code || !categoryData.label) {
            throw new Error('Le code et le label sont obligatoires');
        }

        const existingCode = await Category.findOne({
            code: categoryData.code,
            deletedAt: null
        });

        if (existingCode) {
            throw new Error('Une catégorie avec ce code existe déjà');
        }

        const { _id, createdAt, updatedAt, deletedAt, ...cleanData } = categoryData;

        const newCategory = await Category.create({
            ...cleanData,
            isActive: cleanData.isActive !== undefined ? cleanData.isActive : true,
            deletedAt: null
        });

        return {
            code: 0,
            message: 'Catégorie créée avec succès',
            data: newCategory
        };

    } catch (error) {
        console.error('Error in createCategory service:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            throw new Error(`Erreur de validation: ${messages.join(', ')}`);
        }

        if (error.code === 11000) {
            throw new Error('Une catégorie avec ce code existe déjà');
        }

        throw error;
    }
};

const findById = async (_id) => {
    try {
        const category = await Category.findById(_id);
        if (!category) {
            return {
                code: 1,
                message: 'Aucun category avec cet ID'
            }
        }
        return {
            code: 0,
            category
        }
    } catch (error) {
        throw new Error(`Erreur lors de la recherche de la categorie avec l'ID:${_id}`);
    }
}

const findAllCategoryPaginated = async (page = 1, limit = 10, code, label, isActive) => {
    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const filter = { deletedAt: null };

        if (code) {
            filter.code = { $regex: code, $options: 'i' }; 
        }
        
        if (label) {
            filter.label = { $regex: label, $options: 'i' };
        }
        
        if (isActive !== undefined && isActive !== null) {
            filter.isActive = isActive === 'true' || isActive === true;
        }

        const total = await Category.countDocuments(filter);

        const categories = await Category.find(filter)
            .sort({ label: 1 })
            .skip(skip)
            .limit(limitNum)
            .select('-__v');

        const totalPages = Math.ceil(total / limitNum);

        return {
            data: categories,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems: total,
                totalPages: totalPages
            }
        };

    } catch (error) {
        console.error('Error fetching paginated categories:', error);
        throw new Error('Failed to fetch paginated categories');
    }
};

const findAllCategories = async () => {
    try {
        const allCategories = await Category.find({
            deletedAt: null 
        })
            .sort({ label: 1 }) 
            .select('-__v'); 

        return {
            code: 0,
            allCategories
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw new Error('Failed to fetch categories');
    }
}

const updateCategory = async (id, updateData) => {
    try {
        const existingCategory = await Category.findById(id);

        if (!existingCategory) {
            throw new Error('Catégorie non trouvée');
        }

        if (existingCategory.deletedAt) {
            throw new Error('Impossible de modifier une catégorie supprimée');
        }

        const { _id, createdAt, deletedAt, ...safeUpdateData } = updateData;

        if (safeUpdateData.code && safeUpdateData.code !== existingCategory.code) {
            const codeExists = await Category.findOne({
                code: safeUpdateData.code,
                _id: { $ne: id },
                deletedAt: null
            });

            if (codeExists) {
                throw new Error('Ce code est déjà utilisé par une autre catégorie');
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            {
                $set: safeUpdateData,
                $currentDate: { updatedAt: true }
            },
            {
                new: true,
                runValidators: true
            }
        ).select('-__v');

        if (!updatedCategory) {
            throw new Error('Échec de la mise à jour de la catégorie');
        }

        return updatedCategory;

    } catch (error) {
        console.error('Error in updateCategory service:', error);

        if (error.name === 'ValidationError') {
            throw new Error(`Erreur de validation: ${error.message}`);
        }
        if (error.name === 'CastError') {
            throw new Error('ID de catégorie invalide');
        }

        throw error;
    }
};


const removeCategory = async (_id) => {
    try {
        const categoryToDelete = await Category.findById(_id);

        if (!categoryToDelete) {
            return {
                code: 1,
                message: 'Catégorie non trouvée'
            }
        }

        if (categoryToDelete.deletedAt) {
            return {
                code: 1,
                message: 'Cette catégorie est déjà supprimée'
            }
        }

        const deletedCategory = await Category.findByIdAndUpdate(
            _id,
            {
                $set: {
                    deletedAt: new Date(),
                    isActive: false
                }
            },
            {
                new: true,
                runValidators: false
            }
        );

        return {
            code: 0,
            message: 'Catégorie supprimée avec succès',
            data: deletedCategory
        };

    } catch (error) {
        console.error('Error in removeCategory service:', error);
        if (error.name === 'CastError') {
            throw new Error('ID de catégorie invalide');
        }
        throw error;
    }
};

module.exports = {
    createCategory,
    findById,
    findAllCategoryPaginated,
    findAllCategories,
    updateCategory,
    removeCategory
};