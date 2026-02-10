const FileUploadService = require('./fileUpload.service');

class ProductUploadService extends FileUploadService {
    constructor() {
        super('products');
    }
    async uploadMultipleImages(files, productId, shopId) {
        try {
            if (!files || !Array.isArray(files) || files.length === 0) {
                return {
                    success: true,
                    images: [],
                    urls: [],
                    message: 'Aucune image à uploader'
                };
            }

            const uploadPromises = files.map(async (file, index) => {
                const folder = `shop-${shopId}/product-${productId}`;
                return await this.uploadFile(file, folder);
            });

            const results = await Promise.all(uploadPromises);

            const successfulUploads = results.filter(r => r.success);
            const failedUploads = results.filter(r => !r.success);

            const imagePaths = successfulUploads.map(r => r.fileName);
            const imageUrls = successfulUploads.map(r => r.publicUrl);

            return {
                success: failedUploads.length === 0,
                imagePaths,
                imageUrls,
                message: failedUploads.length > 0 
                    ? `${failedUploads.length} image(s) n'ont pas pu être uploadées`
                    : `${files.length} image(s) uploadées avec succès`,
                errors: failedUploads.map(f => f.message)
            };

        } catch (error) {
            console.error('Error in uploadMultipleImages:', error);
            throw error;
        }
    }

    async deleteProductImages(product) {
        try {
            if (!product.imagePaths || product.imagePaths.length === 0) {
                return { success: true, message: 'Aucune image à supprimer' };
            }

            const deletePromises = product.imagePaths.map(async (imagePath) => {
                if (imagePath && !imagePath.includes('default-product.png')) {
                    return await this.deleteFile(imagePath);
                }
                return { success: true };
            });

            const results = await Promise.all(deletePromises);
            const failedDeletes = results.filter(r => !r.success);

            return {
                success: failedDeletes.length === 0,
                message: failedDeletes.length > 0
                    ? `${failedDeletes.length} image(s) n'ont pas pu être supprimées`
                    : 'Images supprimées avec succès'
            };

        } catch (error) {
            console.error('Error in deleteProductImages:', error);
            throw error;
        }
    }

    async updateProductImages(product, newFiles) {
        try {
            await this.deleteProductImages(product);

            return await this.uploadMultipleImages(
                newFiles, 
                product._id, 
                product.shopId
            );

        } catch (error) {
            console.error('Error in updateProductImages:', error);
            throw error;
        }
    }

    async addImagesToProduct(product, additionalFiles) {
        try {
            const uploadResult = await this.uploadMultipleImages(
                additionalFiles,
                product._id,
                product.shopId
            );

            if (uploadResult.success) {
                const updatedImagePaths = [...product.imagePaths, ...uploadResult.imagePaths];
                const updatedImageUrls = [...product.imageUrls, ...uploadResult.imageUrls];

                return {
                    success: true,
                    imagePaths: updatedImagePaths,
                    imageUrls: updatedImageUrls,
                    message: 'Images ajoutées avec succès'
                };
            }

            return uploadResult;

        } catch (error) {
            console.error('Error in addImagesToProduct:', error);
            throw error;
        }
    }

    async deleteSingleImage(product, imageIndex) {
        try {
            if (!product.imagePaths || product.imagePaths.length <= imageIndex) {
                throw new Error('Image non trouvée');
            }

            const imagePath = product.imagePaths[imageIndex];
            
            if (imagePath && !imagePath.includes('default-product.png')) {
                await this.deleteFile(imagePath);
            }

            const updatedImagePaths = product.imagePaths.filter((_, index) => index !== imageIndex);
            const updatedImageUrls = product.imageUrls.filter((_, index) => index !== imageIndex);

            return {
                success: true,
                imagePaths: updatedImagePaths,
                imageUrls: updatedImageUrls,
                message: 'Image supprimée avec succès'
            };

        } catch (error) {
            console.error('Error in deleteSingleImage:', error);
            throw error;
        }
    }
}

module.exports = ProductUploadService;