const userService = require('../services/user.service')

const getShopUsers = async (req, res) => {
    try {
        const {
            search,
            status,
            sortBy = 'createdAt:desc'
        } = req.query;

        const filters = {
            search,
            status,
            sortBy
        };

        Object.keys(filters).forEach(key => 
            (filters[key] === undefined || filters[key] === null) && delete filters[key]
        );

        const users = await userService.findShopUsers(filters);

        res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });

    } catch (error) {
        console.error('Error in getShopUsers controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur lors de la récupération des utilisateurs avec boutique'
        });
    }
};

module.exports = {
    getShopUsers,
};