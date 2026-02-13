const categoryService = require('../services/category.service');

const createCategory = async (req, res) => {
    try {
        const categoryData = req.body;

        if (!categoryData || Object.keys(categoryData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Les données de la catégorie sont requises'
            });
        }

        if (!categoryData.code || categoryData.code.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Le code est obligatoire'
            });
        }

        if (!categoryData.label || categoryData.label.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Le label est obligatoire'
            });
        }

        const result = await categoryService.createCategory(categoryData);

        if (result.code === 0) {
            res.status(201).json({
                success: true,
                message: result.message,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        console.error('Error in createCategory controller:', error);
        
        if (error.message === 'Le code et le label sont obligatoires') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'Une catégorie avec ce code existe déjà') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('Erreur de validation')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de la création de la catégorie'
        });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await categoryService.findById(id);
        
        if (result.code === 1) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }
        
        res.status(200).json({
            success: true,
            data: result.category
        });
    } catch (error) {
        console.error('Error in getCategoryById:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de la récupération de la catégorie'
        });
    }
};

const getCategoriesPaginated = async (req, res) => {
    try {
        const { page = 1, limit = 10, code, label, isActive } = req.query;
        
        const result = await categoryService.findAllCategoryPaginated(
            page, 
            limit, 
            code, 
            label, 
            isActive
        );
        
        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error in getCategoriesPaginated:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de la récupération des catégories'
        });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const result = await categoryService.findAllCategories();
        if (result.code === 0) {
            res.status(200).json({
                success: true,
                data: result.allCategories
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message || 'Aucune catégorie trouvée'
            });
        }
    } catch (error) {
        console.error('Error in getAllCategories:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de la récupération de toutes les catégories'
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Les données de mise à jour sont requises'
            });
        }
        
        const updatedCategory = await categoryService.updateCategory(id, updateData);
        
        res.status(200).json({
            success: true,
            message: 'Catégorie mise à jour avec succès',
            data: updatedCategory
        });
    } catch (error) {
        console.error('Error in updateCategory controller:', error);
        
        if (error.message === 'Catégorie non trouvée') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'Impossible de modifier une catégorie supprimée') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'Ce code est déjà utilisé par une autre catégorie') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'ID de catégorie invalide' || error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de catégorie invalide'
            });
        }
        
        if (error.message.includes('Erreur de validation')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de la mise à jour de la catégorie'
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await categoryService.removeCategory(id);
        
        if (result.code === 1) {
            if (result.message === 'Catégorie non trouvée') {
                return res.status(404).json({
                    success: false,
                    message: result.message
                });
            }
            if (result.message === 'Cette catégorie est déjà supprimée') {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        }
        
        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        console.error('Error in deleteCategory controller:', error);
        
        if (error.message === 'ID de catégorie invalide' || error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'ID de catégorie invalide'
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de la suppression de la catégorie'
        });
    }
};

module.exports = {
    createCategory,
    getCategoryById,
    getCategoriesPaginated,
    getAllCategories,
    updateCategory,
    deleteCategory
};