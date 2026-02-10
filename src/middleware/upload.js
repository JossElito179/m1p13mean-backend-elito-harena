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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

const uploadWithFields = () => {
    return upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'name', maxCount: 1 },
        { name: 'description', maxCount: 1 },
        { name: 'location[floor]', maxCount: 1 },
        { name: 'location[zone]', maxCount: 1 },
        { name: 'categories', maxCount: 10 }
    ]);
};

module.exports = {
    upload,
    uploadSingle: upload.single('image'),
    uploadWithFields
};