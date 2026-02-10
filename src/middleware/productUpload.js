const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Seules les images sont autorisées'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10
    },
    fileFilter: fileFilter
});

const parseProductFormData = (req, res, next) => {
    upload.fields([
        { name: 'images', maxCount: 10 },
        { name: 'name', maxCount: 1 },
        { name: 'description', maxCount: 1 },
        { name: 'shopId', maxCount: 1 },
        { name: 'price', maxCount: 1 },
        { name: 'currency', maxCount: 1 },
        { name: 'stock', maxCount: 1 },
        { name: 'status', maxCount: 1 },
        { name: 'categories', maxCount: 10 } 
    ])(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: `Erreur lors du traitement des données: ${err.message}`
            });
        }

        console.log('=== DEBUG PARSED DATA ===');
        console.log('Body:', req.body);
        console.log('Files:', req.files);
        console.log('=========================');

        const processedBody = {};
        
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (req.body[key] !== undefined && req.body[key] !== '') {
                    processedBody[key] = req.body[key];
                }
            });
        }

        if (processedBody.categories) {
            if (typeof processedBody.categories === 'string') {
                processedBody.categories = processedBody.categories.includes(',')
                    ? processedBody.categories.split(',').map(cat => cat.trim().toUpperCase())
                    : [processedBody.categories.toUpperCase()];
            } else if (Array.isArray(processedBody.categories)) {
                processedBody.categories = processedBody.categories.map(cat => 
                    typeof cat === 'string' ? cat.toUpperCase() : cat
                );
            }
        }

        if (processedBody.price) {
            processedBody.price = parseFloat(processedBody.price);
        }
        
        if (processedBody.stock) {
            processedBody.stock = parseInt(processedBody.stock);
        }

        let files = [];
        if (req.files && req.files.images) {
            files = req.files.images;
        }

        req.body = processedBody;
        req.files = files;

        next();
    });
};

const uploadMultipleImages = (fieldName = 'images', maxCount = 10) => {
    return (req, res, next) => {
        upload.array(fieldName, maxCount)(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    };
};

module.exports = {
    upload,
    parseProductFormData,
    uploadMultipleImages
};