module.exports = {
    // Spécifiez les fichiers à analyser
    files: ['**/*.js'],
    // Spécifiez les règles
    rules: {
      semi: 'off', // Désactive l'exigence des points-virgules
      quotes: 'off', // Désactive l'exigence d'utiliser des guillemets simples
      'no-unused-vars': 'off', // Désactive les avertissements pour les variables inutilisées
      'indent': 'off', // Désactive les règles d'indentation
      // Ajoutez d'autres règles que vous souhaitez ignorer ici
    },
  };
  