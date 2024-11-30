const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const tf = require('@tensorflow/tfjs-node'); // Utilise la version Node.js de TensorFlow
const tflite = require('@tensorflow/tfjs-tflite');
const stream = require('stream');

// Initialise Firebase Admin SDK
admin.initializeApp();

// Créer une instance de Google Cloud Storage
const storage = new Storage();

// Fonction pour charger le modèle TensorFlow Lite depuis Firebase Storage
async function loadModelFromStorage(bucketName, modelPath) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(modelPath);

    // Télécharge le fichier du modèle dans un buffer
    const [modelBuffer] = await file.download();
    
    // Charger le modèle TFLite
    const model = await tflite.loadTFLiteModel(modelBuffer);
    return model;
}

// Fonction de traitement du flux vidéo
exports.processVideoStream = functions.https.onRequest(async (req, res) => {
    try {
        // Paramètres Firebase Storage pour accéder au modèle
        const bucketName = 'gs://route-scanner-eb325.appspot.com'; // Remplace par ton bucket Firebase
        const modelPath = 'best_float32.tflite'; // Chemin vers le modèle dans Storage

        // Charger le modèle TensorFlow Lite
        const model = await loadModelFromStorage(bucketName, modelPath);
        console.log('Modèle chargé avec succès.');

        // Créer un flux de sortie pour envoyer la vidéo traitée
        const outputStream = new stream.PassThrough();

        // Ici, tu dois recevoir le flux vidéo via req (par exemple via un POST multipart)
        const videoStream = req; // Supposons que req est un flux de vidéo

        // Traiter le flux vidéo (frame par frame)
        videoStream.on('data', async (chunk) => {
            // Décoder chaque image (chunk)
            const imageTensor = tf.node.decodeImage(chunk);

            // Exécuter l'inférence sur l'image
            const predictions = await model.predict(imageTensor.expandDims(0));

            // Ici, tu peux manipuler l'image (ajouter des annotations, etc.)
            const processedFrame = imageTensor; // Pour simplifier, on garde l'image inchangée

            // Encoder l'image traitée et envoyer à la sortie
            const encodedImage = await tf.node.encodeJpeg(processedFrame);
            outputStream.write(encodedImage);
        });

        // Lorsque le flux d'entrée se termine
        videoStream.on('end', () => {
            outputStream.end();
        });

        res.setHeader('Content-Type', 'video/mp4'); // Tu peux adapter en fonction du format de sortie
        outputStream.pipe(res);
    } catch (error) {
        console.error('Erreur lors du traitement de la vidéo :', error);
        res.status(500).send('Erreur lors du traitement de la vidéo.');
    }
});
