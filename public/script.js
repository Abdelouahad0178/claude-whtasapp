// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDvOD-SHU4n6hqzoqHlZVegXmQa6n2UmMM",
    authDomain: "claudewhats.firebaseapp.com",
    databaseURL: "https://claudewhats-default-rtdb.firebaseio.com",
    projectId: "claudewhats",
    storageBucket: "claudewhats.firebasestorage.app",
    messagingSenderId: "433324766581",
    appId: "1:433324766581:web:2ea9e5a1dd65ac471d4f3c",
    measurementId: "G-JPBD3LWL19"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Références aux éléments DOM
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const authTitle = document.getElementById('auth-title');
const authPhone = document.getElementById('auth-phone');
const authPassword = document.getElementById('auth-password');
const authName = document.getElementById('auth-name');
const authSubmit = document.getElementById('auth-submit');
const authToggleLink = document.getElementById('auth-toggle-link');
const passwordGroup = document.getElementById('password-group');
const nameGroup = document.getElementById('name-group');
const contactsList = document.getElementById('contacts-list');
const chatPanel = document.getElementById('chat-panel');
const chatContent = document.getElementById('chat-content');
const emptyChat = document.getElementById('empty-chat');
const chatHeader = document.getElementById('chat-header');
const headerAvatar = document.getElementById('header-avatar');
const headerName = document.getElementById('header-name');
const headerStatus = document.getElementById('header-status');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const newConversationBtn = document.getElementById('new-conversation');
const newConversationModal = document.getElementById('new-conversation-modal');
const newContactPhone = document.getElementById('new-contact-phone');
const newContactName = document.getElementById('new-contact-name');
const createConversationBtn = document.getElementById('create-conversation');
const closeModalBtns = document.querySelectorAll('.close-modal');
const searchContactsInput = document.getElementById('search-contacts');
const attachButton = document.getElementById('attach-button');
const fileInput = document.getElementById('file-input');
const voiceButton = document.getElementById('voice-button');
const audioPreview = document.getElementById('audio-preview');
const audioPlayer = document.getElementById('audio-player');
const cancelAudioBtn = document.getElementById('cancel-audio');
const sendAudioBtn = document.getElementById('send-audio');
const loadingScreen = document.getElementById('loading');
const voiceCallButton = document.getElementById('voice-call-button');
const videoCallButton = document.getElementById('video-call-button');
const callScreen = document.getElementById('call-screen');
const callContactName = document.getElementById('call-contact-name');
const callStatus = document.getElementById('call-status');
const callDuration = document.getElementById('call-duration');
const callAvatar = document.getElementById('call-avatar');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const localVideoContainer = document.getElementById('local-video-container');
const remoteVideoContainer = document.getElementById('remote-video-container');
const toggleMuteBtn = document.getElementById('toggle-mute');
const toggleSpeakerBtn = document.getElementById('toggle-speaker');
const toggleVideoBtn = document.getElementById('toggle-video');
const endCallBtn = document.getElementById('end-call');
const incomingCallNotification = document.getElementById('incoming-call');
const incomingCallName = document.getElementById('incoming-call-name');
const incomingCallType = document.getElementById('incoming-call-type');
const incomingCallAvatar = document.getElementById('incoming-call-avatar');
const acceptCallBtn = document.getElementById('accept-call');
const declineCallBtn = document.getElementById('decline-call');

// Variables globales
let isLoginMode = true;
let currentUser = null;
let currentChat = null;
let mediaRecorder = null;
let audioChunks = [];
let incomingCallData = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let callTimer = null;
let callDurationSeconds = 0;
let isAudioMuted = false;
let isSpeakerOn = true;
let isVideoEnabled = true;
let conversationsCache = {};
let currentCall = null;

// Fonction d'initialisation
function init() {
    // Vérifier si l'utilisateur est déjà connecté
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            onUserLoggedIn();
        } else {
            showAuthScreen();
        }
    });

    // Événements d'authentification
    authToggleLink.addEventListener('click', toggleAuthMode);
    // Utiliser submitEvent au lieu de click pour le formulaire
    document.querySelector('.auth-form').addEventListener('submit', handleAuth);

    // Événements de conversation
    newConversationBtn.addEventListener('click', () => {
        newConversationModal.style.display = 'flex';
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            newConversationModal.style.display = 'none';
        });
    });

    createConversationBtn.addEventListener('click', createNewConversation);
    searchContactsInput.addEventListener('input', filterContacts);
    
    // Événements de message
    messageInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    sendButton.addEventListener('click', sendMessage);
    attachButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    
    // Événements d'enregistrement audio
    voiceButton.addEventListener('click', toggleAudioRecording);
    cancelAudioBtn.addEventListener('click', cancelAudioRecording);
    sendAudioBtn.addEventListener('click', sendAudioMessage);
    
    // Événements d'appel
    voiceCallButton.addEventListener('click', () => initiateCall('voice'));
    videoCallButton.addEventListener('click', () => initiateCall('video'));
    toggleMuteBtn.addEventListener('click', toggleMute);
    toggleSpeakerBtn.addEventListener('click', toggleSpeaker);
    toggleVideoBtn.addEventListener('click', toggleVideo);
    endCallBtn.addEventListener('click', endCall);
    acceptCallBtn.addEventListener('click', acceptIncomingCall);
    declineCallBtn.addEventListener('click', declineIncomingCall);
    
    // Exposer les fonctions nécessaires globalement pour l'interactivité
    window.openImageViewer = openImageViewer;
}

// Fonctions d'authentification
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        authTitle.textContent = 'Connexion';
        authSubmit.textContent = 'Connexion';
        authToggleLink.textContent = 'Créer un compte';
        nameGroup.style.display = 'none';
    } else {
        authTitle.textContent = 'Inscription';
        authSubmit.textContent = 'S\'inscrire';
        authToggleLink.textContent = 'Déjà un compte? Connexion';
        nameGroup.style.display = 'block';
    }
}

function handleAuth(e) {
    e.preventDefault();
    
    const phone = authPhone.value.trim();
    const password = authPassword.value;
    const name = isLoginMode ? '' : authName.value.trim();
    
    if (!phone || !password || (!isLoginMode && !name)) {
        showToast('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    showLoading();
    
    if (isLoginMode) {
        // Connexion
        signInWithPhone(phone, password);
    } else {
        // Inscription
        signUpWithPhone(phone, password, name);
    }
}

function signInWithPhone(phone, password) {
    // Pour simplifier, nous utilisons l'email comme username + @domain.com
    const email = `${phone.replace(/[^0-9]/g, '')}@example.com`;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            hideLoading();
        })
        .catch(error => {
            hideLoading();
            showToast('Erreur de connexion: ' + error.message, 'error');
        });
}

function signUpWithPhone(phone, password, name) {
    // Pour simplifier, nous utilisons l'email comme username + @domain.com
    const email = `${phone.replace(/[^0-9]/g, '')}@example.com`;
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Mettre à jour le profil avec le nom
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                // Créer un document utilisateur dans Firestore
                return db.collection('users').doc(userCredential.user.uid).set({
                    phone: phone,
                    name: name,
                    status: 'Hey, j\'utilise MessengerApp!',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    online: true
                });
            });
        })
        .then(() => {
            hideLoading();
        })
        .catch(error => {
            hideLoading();
            showToast('Erreur d\'inscription: ' + error.message, 'error');
        });
}

function onUserLoggedIn() {
    // Mettre à jour le statut en ligne
    db.collection('users').doc(currentUser.uid).update({
        online: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Configurer la déconnexion automatique
    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            db.collection('users').doc(currentUser.uid).update({
                online: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });
    
    // Afficher l'écran principal
    authScreen.style.display = 'none';
    mainScreen.style.display = 'flex';
    
    // Charger les conversations
    loadConversations();
    
    // Écouter les appels entrants
    listenForIncomingCalls();
}

function showAuthScreen() {
    currentUser = null;
    authScreen.style.display = 'flex';
    mainScreen.style.display = 'none';
    
    // Réinitialiser les champs
    authPhone.value = '';
    authPassword.value = '';
    authName.value = '';
}

// Gestion des conversations
function loadConversations() {
    // Récupérer les conversations de l'utilisateur actuel
    db.collection('conversations')
        .where('participants', 'array-contains', currentUser.uid)
        .orderBy('lastMessageTime', 'desc')
        .onSnapshot(snapshot => {
            contactsList.innerHTML = '';
            
            if (snapshot.empty) {
                contactsList.innerHTML = '<div class="empty-contacts">Aucune conversation</div>';
                return;
            }
            
            snapshot.forEach(doc => {
                const conversation = doc.data();
                conversation.id = doc.id;
                
                // Trouver l'autre participant
                const otherParticipantId = conversation.participants.find(id => id !== currentUser.uid);
                
                // Stocker dans le cache
                conversationsCache[conversation.id] = conversation;
                
                // Récupérer les informations de l'autre utilisateur
                db.collection('users').doc(otherParticipantId).get()
                    .then(userDoc => {
                        if (!userDoc.exists) return;
                        
                        const userData = userDoc.data();
                        
                        // Créer l'élément de contact
                        const contactElement = createContactElement(conversation, userData, otherParticipantId);
                        contactsList.appendChild(contactElement);
                        
                        // Si c'est la conversation actuellement sélectionnée, mettre à jour l'en-tête
                        if (currentChat && currentChat.id === conversation.id) {
                            updateChatHeader(userData, otherParticipantId);
                        }
                    });
            });
        });
}

function createContactElement(conversation, userData, userId) {
    const contact = document.createElement('div');
    contact.className = 'contact';
    if (currentChat && currentChat.id === conversation.id) {
        contact.classList.add('active');
    }
    
    const initials = userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
    
    let lastMessageText = conversation.lastMessage || 'Démarrer une conversation...';
    if (conversation.lastMessageType === 'image') {
        lastMessageText = '📷 Image';
    } else if (conversation.lastMessageType === 'audio') {
        lastMessageText = '🎤 Message vocal';
    }
    
    contact.innerHTML = `
        <div class="contact-avatar">
            ${initials}
            ${userData.online ? '<div class="online-indicator"></div>' : ''}
        </div>
        <div class="contact-info">
            <div class="contact-name">${userData.name || userData.phone}</div>
            <div class="contact-last-message">${lastMessageText}</div>
        </div>
        <div class="contact-meta">
            <div class="contact-time">${formatDate(conversation.lastMessageTime)}</div>
            ${conversation.unreadCount && conversation.lastMessageSenderId !== currentUser.uid ? 
                `<div class="unread-badge">${conversation.unreadCount}</div>` : ''}
        </div>
    `;
    
    contact.addEventListener('click', () => {
        document.querySelectorAll('.contact').forEach(el => el.classList.remove('active'));
        contact.classList.add('active');
        openConversation(conversation, userData, userId);
    });
    
    return contact;
}

function openConversation(conversation, userData, userId) {
    currentChat = {
        id: conversation.id,
        userId: userId,
        userData: userData
    };
    
    // Mettre à jour l'interface
    emptyChat.style.display = 'none';
    chatContent.style.display = 'flex';
    
    // Mettre à jour l'en-tête de chat
    updateChatHeader(userData, userId);
    
    // Charger les messages
    loadMessages(conversation.id);
    
    // Marquer comme lu si nécessaire
    if (conversation.unreadCount && conversation.lastMessageSenderId !== currentUser.uid) {
        db.collection('conversations').doc(conversation.id).update({
            unreadCount: 0
        });
    }
}

function updateChatHeader(userData, userId) {
    const initials = userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
    
    headerAvatar.textContent = initials;
    headerName.textContent = userData.name || userData.phone;
    headerStatus.textContent = userData.online ? 'En ligne' : userData.lastSeen ? 
        `Vu à ${formatDate(userData.lastSeen)}` : 'Hors ligne';
}

function loadMessages(conversationId) {
    chatMessages.innerHTML = '';
    
    db.collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            let newMessages = false;
            
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    addMessageToChat(message);
                    newMessages = true;
                }
            });
            
            // Scroll to bottom seulement si de nouveaux messages sont ajoutés
            if (newMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
}

function addMessageToChat(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    let messageContent = '';
    
    switch (message.type) {
        case 'text':
            messageContent = `<div>${escapeHtml(message.content)}</div>`;
            break;
        case 'image':
            messageContent = `<div><img src="${message.content}" alt="Image" onclick="openImageViewer('${message.content}')"></div>`;
            break;
        case 'audio':
            messageContent = `
                <div class="audio-message">
                    <audio src="${message.content}" controls></audio>
                    <div class="audio-duration">${message.duration || '00:00'}</div>
                </div>
            `;
            break;
    }
    
    messageDiv.innerHTML = `
        ${messageContent}
        <div class="message-time">
            ${formatTime(message.timestamp)}
            ${message.senderId === currentUser.uid ? 
                `<span class="message-status">${message.delivered ? '✓✓' : '✓'}</span>` : ''}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
}

// Échapper les caractères HTML pour prévenir les attaques XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sendMessage() {
    if (!currentChat) return;
    
    const content = messageInput.value.trim();
    if (!content) return;
    
    sendTextMessage(content);
    messageInput.value = '';
}

function sendTextMessage(content) {
    const messageData = {
        type: 'text',
        content: content,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        delivered: false,
        read: false
    };
    
    // Ajouter le message à la conversation
    db.collection('conversations')
        .doc(currentChat.id)
        .collection('messages')
        .add(messageData)
        .then(() => {
            // Mettre à jour la conversation
            return db.collection('conversations').doc(currentChat.id).update({
                lastMessage: content,
                lastMessageType: 'text',
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSenderId: currentUser.uid,
                unreadCount: firebase.firestore.FieldValue.increment(1)
            });
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi du message:', error);
            showToast('Erreur lors de l\'envoi du message', 'error');
        });
}

function handleFileUpload() {
    if (!currentChat || !fileInput.files.length) return;
    
    const file = fileInput.files[0];
    const fileType = file.type.split('/')[0]; // image, audio, video, etc.
    
    if (!['image', 'audio', 'video'].includes(fileType)) {
        showToast('Type de fichier non supporté', 'error');
        return;
    }
    
    showLoading();
    
    // Créer un nom de fichier unique avec timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = storage.ref(`conversations/${currentChat.id}/${filename}`);
    
    // Définir les métadonnées correctement
    const metadata = {
        contentType: file.type
    };
    
    storageRef.put(file, metadata)
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(downloadURL => {
            switch (fileType) {
                case 'image':
                    return sendImageMessage(downloadURL);
                case 'audio':
                    return sendAudioMessage(downloadURL);
                case 'video':
                    // Gérer les vidéos si nécessaire
                    showToast('Les vidéos ne sont pas encore supportées', 'info');
                    break;
            }
            
            hideLoading();
            showToast('Fichier envoyé avec succès', 'success');
        })
        .catch(error => {
            console.error('Erreur de téléchargement:', error);
            showToast('Erreur lors du téléchargement du fichier', 'error');
            hideLoading();
        });
    
    // Réinitialiser l'input
    fileInput.value = '';
}

function sendImageMessage(imageUrl) {
    const messageData = {
        type: 'image',
        content: imageUrl,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        delivered: false,
        read: false
    };
    
    // Ajouter le message à la conversation
    return db.collection('conversations')
        .doc(currentChat.id)
        .collection('messages')
        .add(messageData)
        .then(() => {
            // Mettre à jour la conversation
            return db.collection('conversations').doc(currentChat.id).update({
                lastMessage: '📷 Image',
                lastMessageType: 'image',
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSenderId: currentUser.uid,
                unreadCount: firebase.firestore.FieldValue.increment(1)
            });
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi de l\'image:', error);
            showToast('Erreur lors de l\'envoi de l\'image', 'error');
            throw error; // Propager l'erreur
        });
}

// Fonctions d'enregistrement audio
function toggleAudioRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    if (!navigator.mediaDevices) {
        showToast('L\'enregistrement audio n\'est pas pris en charge par votre navigateur', 'error');
        return;
    }
    
    audioChunks = [];
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Utiliser le type MIME approprié pour une meilleure compatibilité
            mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/webm'});
            
            mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            });
            
            mediaRecorder.addEventListener('stop', () => {
                // S'assurer que nous avons des données avant de créer le blob
                if (audioChunks.length > 0) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    audioPlayer.src = audioUrl;
                    // S'assurer que l'aperçu audio est visible
                    audioPreview.style.display = 'block';
                }
                voiceButton.classList.remove('recording');
            });
            
            // Démarrer l'enregistrement avec un intervalle de temps raisonnable
            mediaRecorder.start(100); // Collecter des données toutes les 100ms
            voiceButton.classList.add('recording');
            showToast('Enregistrement en cours...', 'info');
        })
        .catch(error => {
            console.error('Erreur d\'enregistrement audio:', error);
            showToast('Impossible d\'accéder au microphone', 'error');
        });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        // Assurez-vous d'arrêter toutes les pistes du stream
        if (mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }
}

function cancelAudioRecording() {
    audioPreview.style.display = 'none';
    audioPlayer.src = '';
    audioChunks = [];
}

function sendAudioMessage(audioUrl = null) {
    if (!currentChat) return;
    
    if (!audioUrl && audioChunks.length === 0) {
        showToast('Aucun enregistrement audio disponible', 'error');
        return;
    }
    
    if (!audioUrl) {
        // Utiliser l'enregistrement actuel
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        showLoading();
        
        // Créer un nom de fichier unique
        const timestamp = Date.now();
        const storageRef = storage.ref(`conversations/${currentChat.id}/audio_${timestamp}.webm`);
        
        // Définir les métadonnées appropriées
        const metadata = {
            contentType: 'audio/webm'
        };
        
        storageRef.put(audioBlob, metadata)
            .then(snapshot => snapshot.ref.getDownloadURL())
            .then(downloadURL => {
                // Calculer la durée - gérer le cas où l'audio player n'a pas correctement chargé
                let audioDuration = 0;
                try {
                    audioDuration = Math.ceil(audioPlayer.duration) || 0;
                } catch (e) {
                    console.warn('Impossible d\'obtenir la durée audio', e);
                    audioDuration = 0;
                }
                
                const minutes = Math.floor(audioDuration / 60);
                const seconds = audioDuration % 60;
                const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                const messageData = {
                    type: 'audio',
                    content: downloadURL,
                    duration: formattedDuration,
                    senderId: currentUser.uid,
                    senderName: currentUser.displayName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    delivered: false,
                    read: false
                };
                
                return db.collection('conversations')
                    .doc(currentChat.id)
                    .collection('messages')
                    .add(messageData)
                    .then(() => {
                        // Mettre à jour la conversation
                        return db.collection('conversations').doc(currentChat.id).update({
                            lastMessage: '🎤 Message vocal',
                            lastMessageType: 'audio',
                            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                            lastMessageSenderId: currentUser.uid,
                            unreadCount: firebase.firestore.FieldValue.increment(1)
                        });
                    });
            })
            .then(() => {
                // Réinitialiser l'UI d'enregistrement audio
                audioPreview.style.display = 'none';
                audioPlayer.src = '';
                audioChunks = [];
                hideLoading();
                showToast('Message audio envoyé', 'success');
            })
            .catch(error => {
                console.error('Erreur d\'envoi d\'audio:', error);
                showToast('Erreur lors de l\'envoi du message audio', 'error');
                hideLoading();
            });
    } else {
        // Utiliser une URL fournie (pour les fichiers téléchargés)
        const messageData = {
            type: 'audio',
            content: audioUrl,
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            delivered: false,
            read: false
        };
        
        return db.collection('conversations')
            .doc(currentChat.id)
            .collection('messages')
            .add(messageData)
            .then(() => {
                return db.collection('conversations').doc(currentChat.id).update({
                    lastMessage: '🎤 Message vocal',
                    lastMessageType: 'audio',
                    lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                    lastMessageSenderId: currentUser.uid,
                    unreadCount: firebase.firestore.FieldValue.increment(1)
                });
            })
            .then(() => {
                showToast('Message audio envoyé', 'success');
            })
            .catch(error => {
                console.error('Erreur d\'envoi d\'audio:', error);
                showToast('Erreur lors de l\'envoi du message audio', 'error');
                throw error; // Propager l'erreur
            });
    }
}

// Fonctions pour créer une nouvelle conversation
function createNewConversation() {
    const phone = newContactPhone.value.trim();
    const name = newContactName.value.trim();
    
    if (!phone) {
        showToast('Veuillez entrer un numéro de téléphone', 'error');
        return;
    }
    
    showLoading();
    
    // Chercher l'utilisateur par numéro de téléphone
    db.collection('users')
        .where('phone', '==', phone)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                showToast('Aucun utilisateur trouvé avec ce numéro', 'error');
                hideLoading();
                return;
            }
            
            const otherUser = snapshot.docs[0].data();
            const otherUserId = snapshot.docs[0].id;
            
            // Vérifier si une conversation existe déjà
            return db.collection('conversations')
                .where('participants', 'array-contains', currentUser.uid)
                .get()
                .then(convSnapshot => {
                    let existingConversation = null;
                    
                    convSnapshot.forEach(doc => {
                        
                            const conv = doc.data();
                        if (conv.participants.includes(otherUserId)) {
                            existingConversation = {
                                id: doc.id,
                                ...conv
                            };
                        }
                    });
                    
                    if (existingConversation) {
                        // Utiliser la conversation existante
                        openConversation(existingConversation, otherUser, otherUserId);
                        newConversationModal.style.display = 'none';
                        hideLoading();
                        return;
                    }
                    
                    // Créer une nouvelle conversation
                    const conversationData = {
                        participants: [currentUser.uid, otherUserId],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                        unreadCount: 0
                    };
                    
                    return db.collection('conversations')
                        .add(conversationData)
                        .then(docRef => {
                            const conversationId = docRef.id;
                            
                            // Ajouter un contact si un nom est fourni
                            if (name) {
                                db.collection('contacts')
                                    .doc(currentUser.uid)
                                    .collection('userContacts')
                                    .doc(otherUserId)
                                    .set({
                                        name: name,
                                        phone: phone,
                                        conversationId: conversationId
                                    });
                            }
                            
                            // Ouvrir la nouvelle conversation
                            openConversation({
                                id: conversationId,
                                ...conversationData
                            }, otherUser, otherUserId);
                            
                            newConversationModal.style.display = 'none';
                            newContactPhone.value = '';
                            newContactName.value = '';
                            hideLoading();
                        });
                });
        })
        .catch(error => {
            console.error('Erreur de création de conversation:', error);
            showToast('Erreur lors de la création de la conversation', 'error');
            hideLoading();
        });
}

function filterContacts() {
    const query = searchContactsInput.value.toLowerCase().trim();
    
    if (!query) {
        document.querySelectorAll('.contact').forEach(contact => {
            contact.style.display = 'flex';
        });
        return;
    }
    
    document.querySelectorAll('.contact').forEach(contact => {
        const name = contact.querySelector('.contact-name').textContent.toLowerCase();
        const lastMessage = contact.querySelector('.contact-last-message').textContent.toLowerCase();
        
        if (name.includes(query) || lastMessage.includes(query)) {
            contact.style.display = 'flex';
        } else {
            contact.style.display = 'none';
        }
    });
}

// Fonctions d'appel
function initiateCall(type) {
    if (!currentChat) return;
    
    showLoading();
    
    // Accéder aux médias
    const constraints = {
        audio: true,
        video: type === 'video'
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            localStream = stream;
            
            if (type === 'video') {
                localVideo.srcObject = stream;
                localVideoContainer.style.display = 'block';
                remoteVideoContainer.style.display = 'block';
            }
            
            setupPeerConnection();
            
            // Afficher l'écran d'appel
            showCallScreen(type);
            
            // Mettre à jour l'UI de l'appel
            callContactName.textContent = currentChat.userData.name || currentChat.userData.phone;
            callStatus.textContent = 'Appel en cours...';
            const initials = currentChat.userData.name ? 
                currentChat.userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
            callAvatar.textContent = initials;
            
            // Créer une offre WebRTC
            peerConnection.createOffer()
                .then(offer => peerConnection.setLocalDescription(offer))
                .then(() => {
                    const offerData = {
                        type: peerConnection.localDescription.type,
                        sdp: peerConnection.localDescription.sdp
                    };
                    
                    // Envoyer une demande d'appel
                    const callData = {
                        callerId: currentUser.uid,
                        callerName: currentUser.displayName,
                        calleeId: currentChat.userId,
                        type: type,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'pending',
                        offer: offerData
                    };
                    
                    // Stocker l'appel dans Firestore
                    return db.collection('calls').add(callData);
                })
                .then(docRef => {
                    const callId = docRef.id;
                    currentCall = { id: callId };
                    
                    // Écouter les réponses
                    db.collection('calls').doc(callId)
                        .onSnapshot(doc => {
                            if (!doc.exists) return;
                            
                            const data = doc.data();
                            
                            if (data.status === 'accepted') {
                                callStatus.textContent = 'Appel en cours';
                                
                                // Démarrer le timer d'appel
                                callTimer = setInterval(updateCallDuration, 1000);
                                
                                // Traiter la réponse SDP
                                if (data.answer) {
                                    const answerDescription = new RTCSessionDescription(data.answer);
                                    peerConnection.setRemoteDescription(answerDescription)
                                        .catch(error => {
                                            console.error('Erreur lors de la configuration de la description distante:', error);
                                        });
                                }
                            } else if (data.status === 'declined' || data.status === 'ended' || data.status === 'non_answered') {
                                endCall();
                            }
                        });
                    
                    // Écouter les candidats ICE
                    db.collection('calls').doc(callId)
                        .collection('calleeCandidates')
                        .onSnapshot(snapshot => {
                            snapshot.docChanges().forEach(change => {
                                if (change.type === 'added') {
                                    const candidate = new RTCIceCandidate(change.doc.data());
                                    peerConnection.addIceCandidate(candidate)
                                        .catch(error => {
                                            console.error('Erreur lors de l\'ajout du candidat ICE:', error);
                                        });
                                }
                            });
                        });
                    
                    // Vérifier la réponse après un délai
                    setTimeout(() => {
                        db.collection('calls').doc(callId).get()
                            .then(doc => {
                                if (doc.exists && doc.data().status === 'pending') {
                                    endCall('non_answered');
                                }
                            });
                    }, 30000); // 30 secondes pour répondre
                    
                    hideLoading();
                })
                .catch(error => {
                    console.error('Erreur lors de l\'initiation de l\'appel:', error);
                    endCall();
                    hideLoading();
                });
        })
        .catch(error => {
            console.error('Erreur d\'accès aux médias:', error);
            showToast('Impossible d\'accéder à la caméra ou au microphone', 'error');
            hideLoading();
        });
}

function setupPeerConnection() {
    // Configuration STUN/TURN pour traverser les NAT
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };
    
    peerConnection = new RTCPeerConnection(configuration);
    
    // Ajouter les pistes locales
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }
    
    // Gérer les pistes distantes
    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };
    
    // Gérer les candidats ICE
    peerConnection.onicecandidate = event => {
        if (event.candidate && currentCall) {
            // Envoyer le candidat ICE à l'autre participant
            db.collection('calls').doc(currentCall.id)
                .collection(currentUser.uid === currentCall.callerId ? 'callerCandidates' : 'calleeCandidates')
                .add(event.candidate.toJSON());
        }
    };
    
    // Gérer les erreurs de connexion
    peerConnection.onicecandidateerror = event => {
        console.error('Erreur de candidat ICE:', event);
    };
    
    // Gérer les changements d'état de la connexion
    peerConnection.oniceconnectionstatechange = () => {
        console.log('État de la connexion ICE:', peerConnection.iceConnectionState);
        
        if (peerConnection.iceConnectionState === 'disconnected' || 
            peerConnection.iceConnectionState === 'failed' || 
            peerConnection.iceConnectionState === 'closed') {
            endCall();
        }
    };
}

function showCallScreen(type) {
    callScreen.style.display = 'flex';
    
    if (type === 'video') {
        remoteVideoContainer.style.display = 'block';
        localVideoContainer.style.display = 'block';
        toggleVideoBtn.style.display = 'flex';
    } else {
        remoteVideoContainer.style.display = 'none';
        localVideoContainer.style.display = 'none';
        toggleVideoBtn.style.display = 'none';
    }
}

function hideCallScreen() {
    callScreen.style.display = 'none';
    remoteVideoContainer.style.display = 'none';
    localVideoContainer.style.display = 'none';
    callDurationSeconds = 0;
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
}

function updateCallDuration() {
    callDurationSeconds++;
    const minutes = Math.floor(callDurationSeconds / 60);
    const seconds = callDurationSeconds % 60;
    callDuration.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleMute() {
    if (!localStream) return;
    
    isAudioMuted = !isAudioMuted;
    
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioMuted;
    });
    
    toggleMuteBtn.innerHTML = isAudioMuted ? 
        '<i class="fas fa-microphone-slash"></i>' : 
        '<i class="fas fa-microphone"></i>';
}

function toggleSpeaker() {
    isSpeakerOn = !isSpeakerOn;
    
    // Cette fonctionnalité nécessite WebAudio API pour être pleinement implémentée
    // Exemple d'implémentation basique:
    if (remoteVideo) {
        remoteVideo.volume = isSpeakerOn ? 1.0 : 0.0;
    }
    
    toggleSpeakerBtn.innerHTML = isSpeakerOn ? 
        '<i class="fas fa-volume-up"></i>' : 
        '<i class="fas fa-volume-mute"></i>';
}

function toggleVideo() {
    if (!localStream) return;
    
    isVideoEnabled = !isVideoEnabled;
    
    localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
    });
    
    toggleVideoBtn.innerHTML = isVideoEnabled ? 
        '<i class="fas fa-video"></i>' : 
        '<i class="fas fa-video-slash"></i>';
}

function endCall(reason = 'ended') {
    if (currentCall) {
        // Mettre à jour le statut de l'appel
        db.collection('calls').doc(currentCall.id).update({
            status: reason,
            endTime: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(console.error);
    }
    
    // Arrêter les médias
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Nettoyer la connexion peer
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Réinitialiser l'UI
    hideCallScreen();
    currentCall = null;
}

function listenForIncomingCalls() {
    // Écouter les appels où l'utilisateur est le destinataire et le statut est en attente
    db.collection('calls')
        .where('calleeId', '==', currentUser.uid)
        .where('status', '==', 'pending')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const call = change.doc.data();
                    call.id = change.doc.id;
                    
                    // Afficher la notification d'appel entrant
                    showIncomingCall(call);
                }
            });
        });
}

function showIncomingCall(call) {
    incomingCallData = call;
    
    // Mettre à jour l'UI de la notification
    incomingCallName.textContent = call.callerName || 'Utilisateur';
    incomingCallType.textContent = call.type === 'video' ? 'Appel vidéo' : 'Appel vocal';
    
    // Afficher la notification
    incomingCallNotification.style.display = 'block';
    
    // Jouer une sonnerie 
    playRingtone();
}

// Fonction simple pour jouer une sonnerie
function playRingtone() {
    // Créer un élément audio temporaire
    const ringtone = new Audio();
    ringtone.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'; // Son de base64 (vous pouvez remplacer par un vrai fichier son)
    ringtone.loop = true;
    ringtone.play().catch(e => console.log('Erreur de lecture du son:', e));
    
    // Stocker la référence pour l'arrêter plus tard
    window.currentRingtone = ringtone;
}

function stopRingtone() {
    if (window.currentRingtone) {
        window.currentRingtone.pause();
        window.currentRingtone = null;
    }
}

function acceptIncomingCall() {
    if (!incomingCallData) return;
    
    stopRingtone();
    
    currentCall = incomingCallData;
    showLoading();
    
    // Accéder aux médias
    const constraints = {
        audio: true,
        video: incomingCallData.type === 'video'
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            localStream = stream;
            
            if (incomingCallData.type === 'video') {
                localVideo.srcObject = stream;
                localVideoContainer.style.display = 'block';
                remoteVideoContainer.style.display = 'block';
            }
            
            // Cacher la notification
            incomingCallNotification.style.display = 'none';
            
            // Afficher l'écran d'appel
            showCallScreen(incomingCallData.type);
            
            // Mettre à jour l'UI de l'appel
            callContactName.textContent = incomingCallData.callerName || 'Utilisateur';
            callStatus.textContent = 'Connexion en cours...';
            
            // Mettre à jour le statut de l'appel
            db.collection('calls').doc(incomingCallData.id).update({
                status: 'accepted',
                acceptTime: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Configurer la connexion peer
            setupPeerConnection();
            
            // Récupérer l'offre
            if (incomingCallData.offer) {
                peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer))
                    .then(() => {
                        // Créer une réponse
                        return peerConnection.createAnswer();
                    })
                    .then(answer => {
                        return peerConnection.setLocalDescription(answer);
                    })
                    .then(() => {
                        // Stocker la réponse dans Firestore
                        return db.collection('calls').doc(incomingCallData.id).update({
                            answer: {
                                type: peerConnection.localDescription.type,
                                sdp: peerConnection.localDescription.sdp
                            }
                        });
                    })
                    .then(() => {
                        // Écouter les candidats ICE de l'appelant
                        db.collection('calls').doc(incomingCallData.id)
                            .collection('callerCandidates')
                            .onSnapshot(snapshot => {
                                snapshot.docChanges().forEach(change => {
                                    if (change.type === 'added') {
                                        const candidate = new RTCIceCandidate(change.doc.data());
                                        peerConnection.addIceCandidate(candidate)
                                            .catch(error => {
                                                console.error('Erreur lors de l\'ajout du candidat ICE:', error);
                                            });
                                    }
                                });
                            });
                        
                        // Démarrer le timer d'appel
                        callTimer = setInterval(updateCallDuration, 1000);
                        callStatus.textContent = 'Appel en cours';
                        
                        hideLoading();
                    })
                    .catch(error => {
                        console.error('Erreur lors de l\'acceptation de l\'appel:', error);
                        endCall();
                        hideLoading();
                    });
            } else {
                showToast('Erreur: Informations d\'appel incomplètes', 'error');
                endCall();
                hideLoading();
            }
        })
        .catch(error => {
            console.error('Erreur d\'accès aux médias:', error);
            showToast('Impossible d\'accéder à la caméra ou au microphone', 'error');
            declineIncomingCall();
            hideLoading();
        });
}

function declineIncomingCall() {
    if (!incomingCallData) return;
    
    stopRingtone();
    
    // Mettre à jour le statut de l'appel
    db.collection('calls').doc(incomingCallData.id).update({
        status: 'declined',
        endTime: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(console.error);
    
    // Cacher la notification
    incomingCallNotification.style.display = 'none';
    incomingCallData = null;
}

// Fonctions utilitaires
function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Moins d'une minute
    if (diff < 60 * 1000) {
        return 'À l\'instant';
    }
    
    // Moins d'une heure
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `Il y a ${minutes} min`;
    }
    
    // Aujourd'hui
    if (date.getDate() === now.getDate() && 
        date.getMonth() === now.getMonth() && 
        date.getFullYear() === now.getFullYear()) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Hier
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && 
        date.getMonth() === yesterday.getMonth() && 
        date.getFullYear() === yesterday.getFullYear()) {
        return 'Hier';
    }
    
    // Cette semaine
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return days[date.getDay()];
    }
    
    // Plus ancien
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function showLoading() {
    loadingScreen.style.display = 'flex';
}

function hideLoading() {
    loadingScreen.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Animation de sortie
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Fonction pour afficher une image en plein écran
function openImageViewer(imageUrl) {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    
    viewer.innerHTML = `
        <div class="image-viewer-content">
            <img src="${imageUrl}" alt="Image">
            <div class="close-viewer">×</div>
        </div>
    `;
    
    document.body.appendChild(viewer);
    
    viewer.querySelector('.close-viewer').addEventListener('click', () => {
        if (document.body.contains(viewer)) {
            document.body.removeChild(viewer);
        }
    });
    
    viewer.addEventListener('click', e => {
        if (e.target === viewer) {
            if (document.body.contains(viewer)) {
                document.body.removeChild(viewer);
            }
        }
    });
}

// Initialiser l'application
window.addEventListener('DOMContentLoaded', init);