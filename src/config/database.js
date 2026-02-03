const mongoose = require('mongoose');

class Database {
  constructor() {
    this._connect();
  }

  async _connect() {
    try {
      console.log('🔄 Tentative de connexion à MongoDB...');
      console.log(`🔗 URI: ${process.env.MONGODB_URI}`);
      
      // Connexion simplifiée pour Mongoose 7+
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      
      this._logSuccess(conn);
      this._setupEventListeners();
      this._performHealthCheck();
      
      return conn;
      
    } catch (error) {
      this._handleConnectionError(error);
      process.exit(1);
    }
  }

  _logSuccess(conn) {
    console.log('\n✅ MongoDB connecté avec succès!');
    console.log(`📊 Base de données: ${conn.connection.name}`);
    console.log(`🏠 Hôte: ${conn.connection.host}`);
    console.log(`🎯 Port: ${conn.connection.port}`);
  }

  _setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('📡 Événement: Mongoose connecté');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur Mongoose:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Événement: Mongoose déconnecté');
    });
  }

  async _performHealthCheck() {
    try {
      // Attendre que la connexion soit établie
      await mongoose.connection.db.admin().ping();
      console.log('🏓 Health Check: MongoDB répond au ping');
      
      // Lister les collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📂 Collections (${collections.length}):`);
      
      if (collections.length === 0) {
        console.log('   (aucune collection - elles seront créées automatiquement)');
      } else {
        collections.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col.name}`);
        });
      }
      
      // Vérifier l'état de la connexion
      this._logConnectionStatus();
      
    } catch (error) {
      console.warn('⚠️  Health Check partiellement échoué:', error.message);
    }
  }

  _logConnectionStatus() {
    const state = mongoose.connection.readyState;
    const states = {
      0: '❌ déconnecté',
      1: '✅ connecté',
      2: '🔄 connexion en cours',
      3: '🔌 déconnexion en cours'
    };
    
    console.log(`📊 Statut de connexion: ${states[state] || 'inconnu'}`);
  }

  _handleConnectionError(error) {
    console.error('\n❌ ERREUR CRITIQUE: Impossible de se connecter à MongoDB');
    console.error(`📌 Détail: ${error.message}`);
    
    console.log('\n🔧 DIAGNOSTIC & SOLUTIONS:');
    console.log('='.repeat(50));
    
    console.log('\n📌 1. VÉRIFIEZ SI MONGODB EST DÉMARRÉ:');
    console.log('   Sur Windows:');
    console.log('   - Ouvrez le Gestionnaire des tâches → Services');
    console.log('   - Cherchez "MongoDB Server"');
    console.log('   - Clic droit → Démarrer');
    console.log('');
    console.log('   Ou en ligne de commande (admin):');
    console.log('   > net start MongoDB');
    console.log('   > mongod  (pour démarrer manuellement)');
    
    console.log('\n📌 2. TESTEZ LA CONNEXION MANUELLEMENT:');
    console.log('   > mongo');
    console.log('   > show dbs');
    console.log('');
    console.log('   Si "mongo" n\'est pas reconnu:');
    console.log('   - Ajoutez MongoDB au PATH');
    console.log('   - Ou utilisez le chemin complet:');
    console.log('     C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongo.exe');
    
    console.log('\n📌 3. VÉRIFIEZ AVEC MONGODB COMPASS:');
    console.log('   - Ouvrez MongoDB Compass');
    console.log('   - Connectez-vous à: mongodb://localhost:27017');
    console.log('   - Si ça marche, le problème est dans le code');
    
    console.log('\n📌 4. VÉRIFIEZ VOTRE FICHIER .env:');
    console.log(`   MONGODB_URI=${process.env.MONGODB_URI || 'NON DÉFINI'}`);
    console.log('   Doit être: mongodb://localhost:27017/mean_project');
    
    console.log('\n📌 5. VÉRIFIEZ LE PORT 27017:');
    console.log('   > netstat -ano | findstr :27017');
    console.log('   - Si rien n\'écoute: MongoDB n\'est pas démarré');
    console.log('   - Si "LISTENING": MongoDB tourne');
    
    console.log('\n='.repeat(50));
    console.log('\n💡 Après correction, redémarrez le serveur.');
  }

  // Méthode pour obtenir l'état actuel
  getStatus() {
    const state = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    return {
      state: states[state] || 'unknown',
      readyState: state,
      host: mongoose.connection?.host,
      port: mongoose.connection?.port,
      name: mongoose.connection?.name
    };
  }

  // Méthode pour fermer proprement
  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('👋 Connexion MongoDB fermée proprement');
    } catch (error) {
      console.error('Erreur lors de la fermeture:', error.message);
    }
  }
}

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
  const db = new Database();
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  const db = new Database();
  await db.disconnect();
  process.exit(0);
});

// Export en singleton
const database = new Database();
module.exports = database;