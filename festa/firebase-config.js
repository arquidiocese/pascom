// Firebase Configuration - Arraiá da Basílica 2025
const firebaseConfig = {
    apiKey: "AIzaSyBs7zNRlW8i5sJaLypb3WXAuRsdSfD0AVo",
    authDomain: "arraiabasilica.firebaseapp.com",
    databaseURL: "https://arraiabasilica-default-rtdb.firebaseio.com",
    projectId: "arraiabasilica",
    storageBucket: "arraiabasilica.firebasestorage.app",
    messagingSenderId: "989762035527",
    appId: "1:989762035527:web:613a5d2fba39badbbff662",
    measurementId: "G-K9PJSTKW42"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const dbRef = db.ref('financeiro');

// ===== FUNÇÕES DE SINCRONIZAÇÃO =====

// Salvar dados no Firebase
function salvarFirebase(dados) {
    dbRef.set(dados).catch(err => console.error('Erro ao salvar:', err));
}

// Carregar dados do Firebase (retorna Promise)
function carregarFirebase() {
    return dbRef.once('value').then(snapshot => snapshot.val());
}

// Escutar mudanças em tempo real
function escutarMudancas(callback) {
    dbRef.on('value', snapshot => {
        const dados = snapshot.val();
        if (dados) callback(dados);
    });
}
