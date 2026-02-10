const { supabaseAdmin, supabase } = require('../config/supabase.config');
const path = require('path');
const fs = require('fs');

class FileUploadService {
    constructor(bucketName = 'shops') {
        this.bucketName = bucketName;
        this.ensureBucketExists();
    }

    async ensureBucketExists() {
        try {
            const { data: buckets } = await supabaseAdmin.storage.listBuckets();
            const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);

            if (!bucketExists) {
                const { error } = await supabaseAdmin.storage.createBucket(this.bucketName, {
                    public: true,
                    fileSizeLimit: 50242880,
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp',  'image/jpg']
                });

                if (error) throw error;
                console.log(`Bucket ${this.bucketName} créé avec succès`);
            }
        } catch (error) {
            console.error('Erreur lors de la création du bucket:', error);
        }
    }

    async uploadFile(file, folder = '') {
        try {
            if (!file || !file.buffer) {
                throw new Error('Fichier invalide');
            }

            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExtension = path.extname(file.originalname) || '.png';
            const fileName = `${timestamp}-${randomString}${fileExtension}`;
            const filePath = folder ? `${folder}/${fileName}` : fileName;

            const { data, error } = await supabaseAdmin.storage
                .from(this.bucketName)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false,
                    cacheControl: '3600'
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);

            return {
                success: true,
                fileName: data.path,
                publicUrl,
                message: 'Fichier uploadé avec succès'
            };

        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            return {
                success: false,
                message: error.message || 'Erreur lors de l\'upload du fichier'
            };
        }
    }

    async deleteFile(filePath) {
        try {
            if (!filePath) {
                throw new Error('Chemin du fichier requis');
            }

            const { data, error } = await supabaseAdmin.storage
                .from(this.bucketName)
                .remove([filePath]);

            if (error) throw error;

            return {
                success: true,
                message: 'Fichier supprimé avec succès'
            };

        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            return {
                success: false,
                message: error.message || 'Erreur lors de la suppression du fichier'
            };
        }
    }

    async updateFile(oldFilePath, newFile) {
        try {
            if (oldFilePath && oldFilePath !== 'default-shop.png') {
                await this.deleteFile(oldFilePath);
            }

            return await this.uploadFile(newFile);
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            throw error;
        }
    }

    async listFiles(folder = '', limit = 100) {
        try {
            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .list(folder, {
                    limit,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' }
                });

            if (error) throw error;

            const filesWithUrls = data.map(file => ({
                ...file,
                publicUrl: this.getPublicUrl(folder ? `${folder}/${file.name}` : file.name)
            }));

            return {
                success: true,
                data: filesWithUrls
            };

        } catch (error) {
            console.error('Erreur lors du listing:', error);
            throw error;
        }
    }

    getPublicUrl(filePath) {
        const { data: { publicUrl } } = supabase.storage
            .from(this.bucketName)
            .getPublicUrl(filePath);

        return publicUrl;
    }
}

module.exports = FileUploadService;