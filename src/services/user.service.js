const User =  require('../models/user.model')
const Shop =  require('../models/shop.model')


const findShopUsers = async (filters = {}) => {
    try {
        const filter = { role: 'SHOP' };

        if (filters.status) {
            filter.status = filters.status;
        }

        if (filters.search) {
            filter.$or = [
                { firstName: { $regex: filters.search, $options: 'i' } },
                { lastName: { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } },
                { phone: { $regex: filters.search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        if (filters.sortBy) {
            const [field, order] = filters.sortBy.split(':');
            const validSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'status'];
            
            if (validSortFields.includes(field)) {
                sortOptions[field] = order === 'desc' ? -1 : 1;
            } else {
                sortOptions.createdAt = -1;
            }
        } else {
            sortOptions.createdAt = -1;
        }

        const users = await User.find(filter)
            .sort(sortOptions)
            .select('-password -__v -resetPasswordToken -resetPasswordExpire')
            .lean(); 

        const enrichedUsers = await Promise.all(
            users.map(async (user) => {
                const shops = await Shop.find({ userId: user._id, deletedAt: null })
                    .select('name location status logo productsCount')
                    .lean();

                return {
                    ...user,
                    shops: shops,
                    totalShops: shops.length,
                    totalProducts: shops.reduce((acc, shop) => acc + (shop.productsCount || 0), 0),
                    mainShop: shops.length > 0 ? shops[0] : null
                };
            })
        );

        return enrichedUsers;

    } catch (error) {
        console.error('Error in findShopUsers service:', error);
        throw new Error('Erreur lors de la récupération des utilisateurs avec boutique');
    }
};

module.exports = {
    findShopUsers,
};