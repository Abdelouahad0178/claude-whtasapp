// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDvOD-SHU4n6hqzoqHlZVegXmQa6n2UmMM",
    authDomain: "claudewhats.firebaseapp.com",
    databaseURL: "https://claudewhats-default-rtdb.firebaseio.com",
    projectId: "claudewhats",
    storageBucket: "claudewhats.appspot.com",
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
let typingTimeout = null;
let isTyping = false;

// Fonctions utilitaires
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
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
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

function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60 * 1000) return "À l'instant";
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `Il y a ${minutes} min`;
    }
    
    if (date.getDate() === now.getDate() && 
        date.getMonth() === now.getMonth() && 
        date.getFullYear() === now.getFullYear()) {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && 
        date.getMonth() === yesterday.getMonth() && 
        date.getFullYear() === yesterday.getFullYear()) {
        return 'Hier';
    }
    
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return days[date.getDay()];
    }
    
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Gestion de l'authentification
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        authTitle.textContent = 'Connexion';
        authSubmit.textContent = 'Connexion';
        authToggleLink.textContent = 'Créer un compte';
        nameGroup.style.display = 'none';
    } else {
        authTitle.textContent = 'Inscription';
        authSubmit.textContent = "S'inscrire";
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
        signInWithPhone(phone, password);
    } else {
        signUpWithPhone(phone, password, name);
    }
}

function signInWithPhone(phone, password) {
    const email = `${phone.replace(/[^0-9]/g, '')}@messenger.app`;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            hideLoading();
        })
        .catch(error => {
            hideLoading();
            console.error('Erreur de connexion:', error);
            showToast('Erreur de connexion: ' + getFirebaseErrorMessage(error), 'error');
        });
}

function signUpWithPhone(phone, password, name) {
    const email = `${phone.replace(/[^0-9]/g, '')}@messenger.app`;
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                return db.collection('users').doc(userCredential.user.uid).set({
                    phone: phone,
                    name: name,
                    status: "Hey, j'utilise MessengerApp!",
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
            console.error("Erreur d'inscription:", error);
            showToast("Erreur d'inscription: " + getFirebaseErrorMessage(error), 'error');
        });
}

function getFirebaseErrorMessage(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'Ce numéro est déjà enregistré',
        'auth/invalid-email': 'Numéro de téléphone invalide',
        'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
        'auth/user-not-found': 'Aucun compte trouvé avec ce numéro',
        'auth/wrong-password': 'Mot de passe incorrect',
        'storage/unauthorized': 'Accès non autorisé au stockage',
        'auth/invalid-api-key': 'Clé API invalide'
    };
    
    return errorMessages[error.code] || error.message;
}

function handleSignOut() {
    showLoading();
    updateUserStatus(false);
    auth.signOut()
        .then(() => {
            currentUser = null;
            currentChat = null;
            conversationsCache = {};
            contactsList.innerHTML = '';
            chatMessages.innerHTML = '';
            chatContent.style.display = 'none';
            emptyChat.style.display = 'flex';
            showAuthScreen();
            hideLoading();
            showToast('Déconnexion réussie', 'success');
        })
        .catch(error => {
            console.error('Erreur de déconnexion:', error);
            hideLoading();
            showToast('Erreur lors de la déconnexion', 'error');
        });
}

// Gestion de l'état utilisateur
function onUserLoggedIn() {
    db.collection('users').doc(currentUser.uid).update({
        online: true,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            db.collection('users').doc(currentUser.uid).update({
                online: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });
    
    authScreen.style.display = 'none';
    mainScreen.style.display = 'flex';
    
    loadConversations();
    listenForIncomingCalls();
    setupStatusListener();
}

function showAuthScreen() {
    currentUser = null;
    authScreen.style.display = 'flex';
    mainScreen.style.display = 'none';
    
    authPhone.value = '';
    authPassword.value = '';
    authName.value = '';
}

function updateUserStatus(status) {
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).update({
            online: status,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
            console.error('Erreur lors de la mise à jour du statut:', error);
        });
    }
}

function setupStatusListener() {
    db.collection('users').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'modified') {
                const userData = change.doc.data();
                const userId = change.doc.id;
                
                document.querySelectorAll('.contact').forEach(contact => {
                    const contactName = contact.querySelector('.contact-name');
                    if (contactName && contactName.textContent === userData.name) {
                        const avatar = contact.querySelector('.contact-avatar');
                        const indicator = avatar.querySelector('.online-indicator');
                        if (userData.online) {
                            if (!indicator) {
                                const onlineIndicator = document.createElement('div');
                                onlineIndicator.className = 'online-indicator';
                                avatar.appendChild(onlineIndicator);
                            }
                        } else if (indicator) {
                            indicator.remove();
                        }
                    }
                });
                
                if (currentChat && currentChat.userId === userId) {
                    headerStatus.textContent = userData.online ? 'En ligne' : userData.lastSeen ? 
                        `Vu à ${formatDate(userData.lastSeen)}` : 'Hors ligne';
                }
            }
        });
    });
}

// Gestion des conversations
function loadConversations() {
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
                
                conversationsCache[conversation.id] = conversation;
                
                const otherParticipantId = conversation.participants.find(id => id !== currentUser.uid);
                
                db.collection('users').doc(otherParticipantId).get()
                    .then(userDoc => {
                        if (!userDoc.exists) return;
                        
                        const userData = userDoc.data();
                        
                        const contactElement = createContactElement(conversation, userData, otherParticipantId);
                        contactsList.appendChild(contactElement);
                        
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
    
    emptyChat.style.display = 'none';
    chatContent.style.display = 'flex';
    
    updateChatHeader(userData, userId);
    loadMessages(conversation.id);
    
    if (conversation.unreadCount && conversation.lastMessageSenderId !== currentUser.uid) {
        db.collection('conversations').doc(conversation.id).update({
            unreadCount: 0
        });
    }
    
    listenForTyping(conversation.id);
}

function updateChatHeader(userData, userId) {
    const initials = userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
    
    headerAvatar.textContent = initials;
    headerName.textContent = userData.name || userData.phone;
    headerStatus.textContent = userData.online ? 'En ligne' : userData.lastSeen ? 
        `Vu à ${formatDate(userData.lastSeen)}` : 'Hors ligne';
}

function createNewConversation() {
    const phone = newContactPhone.value.trim();
    const name = newContactName.value.trim();
    
    if (!phone) {
        showToast('Veuillez entrer un numéro de téléphone', 'error');
        return;
    }
    
    showLoading();
    
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
                        openConversation(existingConversation, otherUser, otherUserId);
                        newConversationModal.style.display = 'none';
                        hideLoading();
                        return;
                    }
                    
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

// Gestion des messages
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
                    message.id = change.doc.id; // Store message ID for deletion
                    addMessageToChat(message);
                    newMessages = true;
                    
                    if (message.senderId !== currentUser.uid && !message.delivered) {
                        change.doc.ref.update({ delivered: true });
                    }
                } else if (change.type === 'removed') {
                    // Remove message from DOM
                    const messageElement = document.querySelector(`.message[data-message-id="${change.doc.id}"]`);
                    if (messageElement) {
                        messageElement.remove();
                    }
                }
            });
            
            if (newMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
}

function addMessageToChat(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    messageDiv.setAttribute('data-message-id', message.id); // Add message ID for reference
    
    let messageContent = '';
    
    switch (message.type) {
        case 'text':
            messageContent = `<div>${escapeHtml(message.content)}</div>`;
            break;
        case 'image':
            messageContent = `
                <div class="message-image">
                    <img src="${message.content}" alt="Image" loading="lazy" 
                         style="display: none;" onload="this.style.display='inline-block'"
                         onerror="this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='; this.alt='Image non disponible'"
                         onclick="openImageViewer('${message.content}')">
                    <div class="image-loading" style="display: inline-block">
                        <div class="spinner" style="width: 24px; height: 24px; border-width: 3px;"></div>
                    </div>
                </div>
            `;
            break;
        case 'audio':
            messageContent = `
                <div class="audio-message">
                    <audio src="${message.content}" controls preload="metadata"></audio>
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
            ${message.senderId === currentUser.uid ? 
                `<button class="delete-message-btn" onclick="deleteMessage('${message.id}')"><i class="fas fa-trash"></i></button>` : ''}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
}

function deleteMessage(messageId) {
    if (!currentChat || !currentUser) return;

    // Show confirmation prompt
    if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return;

    showLoading();

    const messageRef = db.collection('conversations').doc(currentChat.id).collection('messages').doc(messageId);

    // Check if the message is the last one in the conversation
    db.collection('conversations').doc(currentChat.id).get()
        .then(doc => {
            const conversation = doc.data();
            if (conversation.lastMessageSenderId === currentUser.uid) {
                // Get the second-to-last message to update conversation
                return db.collection('conversations')
                    .doc(currentChat.id)
                    .collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(2)
                    .get()
                    .then(snapshot => {
                        let updateData = {};
                        if (snapshot.docs.length > 1) {
                            // There is a previous message
                            const previousMessage = snapshot.docs[1].data();
                            updateData = {
                                lastMessage: previousMessage.type === 'text' ? previousMessage.content : 
                                            previousMessage.type === 'image' ? '📷 Image' : '🎤 Message vocal',
                                lastMessageType: previousMessage.type,
                                lastMessageTime: previousMessage.timestamp,
                                lastMessageSenderId: previousMessage.senderId
                            };
                        } else {
                            // No previous messages
                            updateData = {
                                lastMessage: null,
                                lastMessageType: null,
                                lastMessageTime: null,
                                lastMessageSenderId: null
                            };
                        }
                        return { messageRef, updateData };
                    });
            } else {
                return { messageRef, updateData: null };
            }
        })
        .then(({ messageRef, updateData }) => {
            // Delete the message
            return messageRef.delete()
                .then(() => {
                    if (updateData) {
                        // Update conversation if needed
                        return db.collection('conversations').doc(currentChat.id).update(updateData);
                    }
                });
        })
        .then(() => {
            hideLoading();
            showToast('Message supprimé', 'success');
        })
        .catch(error => {
            console.error('Erreur lors de la suppression du message:', error);
            hideLoading();
            showToast('Erreur lors de la suppression du message', 'error');
        });
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
    
    db.collection('conversations')
        .doc(currentChat.id)
        .collection('messages')
        .add(messageData)
        .then(() => {
            return db.collection('conversations').doc(currentChat.id).update({
                lastMessage: content,
                lastMessageType: 'text',
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSenderId: currentUser.uid,
                unreadCount: firebase.firestore.FieldValue.increment(1),
                [`typing.${currentUser.uid}`]: false
            });
        })
        .catch(error => {
            console.error("Erreur lors de l'envoi du message:", error);
            showToast("Erreur lors de l'envoi du message", 'error');
        });
}

function handleTyping() {
    if (!currentChat) return;
    
    if (!isTyping) {
        isTyping = true;
        db.collection('conversations').doc(currentChat.id).update({
            [`typing.${currentUser.uid}`]: true
        });
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        db.collection('conversations').doc(currentChat.id).update({
            [`typing.${currentUser.uid}`]: false
        });
    }, 3000);
}

function listenForTyping(conversationId) {
    db.collection('conversations').doc(conversationId)
        .onSnapshot(doc => {
            if (!doc.exists) return;
            
            const data = doc.data();
            const typing = data.typing || {};
            
            Object.entries(typing).forEach(([userId, isTyping]) => {
                if (userId !== currentUser.uid && isTyping) {
                    headerStatus.textContent = "En train d'écrire...";
                    headerStatus.classList.add('typing');
                } else if (userId !== currentUser.uid) {
                    const userData = currentChat.userData;
                    headerStatus.textContent = userData.online ? 'En ligne' : userData.lastSeen ? 
                        `Vu à ${formatDate(userData.lastSeen)}` : 'Hors ligne';
                    headerStatus.classList.remove('typing');
                }
            });
        });
}

// Gestion des fichiers
function handleFileUpload() {
    if (!currentChat || !fileInput.files.length) return;
    
    const file = fileInput.files[0];
    const fileType = file.type.split('/')[0];
    
    if (!currentUser) {
        showToast('Vous devez être connecté pour envoyer des fichiers', 'error');
        return;
    }
    
    const maxSize = fileType === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast(`Fichier trop volumineux. Taille maximum: ${maxSize / (1024 * 1024)}MB`, 'error');
        return;
    }
    
    if (!['image', 'audio'].includes(fileType)) {
        showToast('Type de fichier non supporté', 'error');
        return;
    }
    
    showLoading();
    
    const timestamp = Date.now();
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${cleanFilename}`;
    
    const storageRef = storage.ref(`conversations/${currentChat.id}/${filename}`);
    
    const metadata = {
        contentType: file.type,
        customMetadata: {
            sender: currentUser.uid,
            messageType: fileType,
            originalName: file.name
        }
    };
    
    uploadAndSendFile(storageRef, file, metadata, fileType);
}

function uploadAndSendFile(storageRef, file, metadata, fileType) {
    const uploadTask = storageRef.put(file, metadata);
    
    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload: ${progress}% terminé`);
        }, 
        (error) => {
            console.error('Erreur de téléchargement:', error);
            showToast('Erreur lors du téléchargement du fichier', 'error');
            hideLoading();
            fileInput.value = '';
        }, 
        () => {
            uploadTask.snapshot.ref.getDownloadURL()
                .then(downloadURL => {
                    if (fileType === 'image') {
                        return sendImageMessage(downloadURL);
                    } else if (fileType === 'audio') {
                        return sendAudioMessage(downloadURL, file);
                    }
                })
                .then(() => {
                    hideLoading();
                    showToast('Fichier envoyé avec succès', 'success');
                    fileInput.value = '';
                })
                .catch(error => {
                    console.error("Erreur d'envoi du message:", error);
                    showToast("Erreur lors de l'envoi du message", 'error');
                    hideLoading();
                    fileInput.value = '';
                });
        }
    );
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
    
    return db.collection('conversations')
        .doc(currentChat.id)
        .collection('messages')
        .add(messageData)
        .then(() => {
            return db.collection('conversations').doc(currentChat.id).update({
                lastMessage: '📷 Image',
                lastMessageType: 'image',
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSenderId: currentUser.uid,
                unreadCount: firebase.firestore.FieldValue.increment(1)
            });
        })
        .catch(error => {
            console.error("Erreur lors de l'envoi de l'image:", error);
            showToast("Erreur lors de l'envoi de l'image", 'error');
            throw error;
        });
}

function sendAudioMessage(audioUrl = null, audioFile = null) {
    if (!currentChat) return;
    
    showLoading();
    
    if (audioUrl) {
        const tempAudio = new Audio();
        tempAudio.src = audioUrl;
        
        tempAudio.onloadedmetadata = () => {
            const duration = Math.ceil(tempAudio.duration);
            const formattedDuration = formatDuration(duration);
            
            const messageData = {
                type: 'audio',
                content: audioUrl,
                duration: formattedDuration,
                senderId: currentUser.uid,
                senderName: currentUser.displayName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                delivered: false,
                read: false
            };
            
            sendAudioToFirestore(messageData);
        };
        
        tempAudio.onerror = () => {
            console.error('Erreur lors du chargement des métadonnées audio');
            const messageData = {
                type: 'audio',
                content: audioUrl,
                duration: '00:00',
                senderId: currentUser.uid,
                senderName: currentUser.displayName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                delivered: false,
                read: false
            };
            
            sendAudioToFirestore(messageData);
        };
    } else if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const timestamp = Date.now();
        const storageRef = storage.ref(`conversations/${currentChat.id}/audio_${timestamp}.webm`);
        
        const metadata = {
            contentType: 'audio/webm'
        };
        
        storageRef.put(audioBlob, metadata)
            .then(snapshot => snapshot.ref.getDownloadURL())
            .then(downloadURL => {
                const tempAudio = new Audio();
                tempAudio.src = downloadURL;
                
                return new Promise(resolve => {
                    tempAudio.onloadedmetadata = () => {
                        const duration = Math.ceil(tempAudio.duration);
                        resolve(formatDuration(duration));
                    };
                    tempAudio.onerror = () => {
                        resolve('00:00');
                    };
                }).then(formattedDuration => {
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
                    
                    return sendAudioToFirestore(messageData);
                });
            })
            .then(() => {
                audioPreview.style.display = 'none';
                audioPlayer.src = '';
                audioChunks = [];
                hideLoading();
                showToast('Message audio envoyé', 'success');
            })
            .catch(error => {
                console.error("Erreur d'envoi d'audio:", error);
                showToast("Erreur lors de l'envoi du message audio", 'error');
                hideLoading();
            });
    } else {
        showToast('Aucun enregistrement audio disponible', 'error');
        hideLoading();
    }
}

function sendAudioToFirestore(messageData) {
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
            hideLoading();
            showToast('Message audio envoyé', 'success');
        })
        .catch(error => {
            console.error("Erreur d'envoi d'audio:", error);
            showToast("Erreur lors de l'envoi du message audio", 'error');
            hideLoading();
            throw error;
        });
}

function toggleAudioRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    if (!navigator.mediaDevices) {
        showToast("L'enregistrement audio n'est pas pris en charge par votre navigateur", 'error');
        return;
    }
    
    audioChunks = [];
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            
            mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            });
            
            mediaRecorder.addEventListener('stop', () => {
                if (audioChunks.length > 0) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    audioPlayer.src = audioUrl;
                    audioPreview.style.display = 'block';
                }
                voiceButton.classList.remove('recording');
                
                if (mediaRecorder.stream) {
                    mediaRecorder.stream.getTracks().forEach(track => track.stop());
                }
            });
            
            mediaRecorder.start(100);
            voiceButton.classList.add('recording');
            showToast('Enregistrement en cours...', 'info');
        })
        .catch(error => {
            console.error("Erreur d'enregistrement audio:", error);
            showToast("Impossible d'accéder au microphone", 'error');
        });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        voiceButton.classList.remove('recording');
    }
}

function cancelAudioRecording() {
    audioPreview.style.display = 'none';
    audioPlayer.src = '';
    audioChunks = [];
}

// Gestion des appels
function initiateCall(type) {
    if (!currentChat) return;
    
    showLoading();
    
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
            showCallScreen(type);
            
            callContactName.textContent = currentChat.userData.name || currentChat.userData.phone;
            callStatus.textContent = 'Appel en cours...';
            const initials = currentChat.userData.name ? 
                currentChat.userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
            callAvatar.textContent = initials;
            
            peerConnection.createOffer()
                .then(offer => peerConnection.setLocalDescription(offer))
                .then(() => {
                    const offerData = {
                        type: peerConnection.localDescription.type,
                        sdp: peerConnection.localDescription.sdp
                    };
                    
                    const callData = {
                        callerId: currentUser.uid,
                        callerName: currentUser.displayName,
                        calleeId: currentChat.userId,
                        type: type,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'pending',
                        offer: offerData
                    };
                    
                    return db.collection('calls').add(callData);
                })
                .then(docRef => {
                    const callId = docRef.id;
                    currentCall = { id: callId, callerId: currentUser.uid };
                    
                    db.collection('calls').doc(callId)
                        .onSnapshot(doc => {
                            if (!doc.exists) return;
                            
                            const data = doc.data();
                            
                            if (data.status === 'accepted') {
                                callStatus.textContent = 'Appel en cours';
                                callTimer = setInterval(updateCallDuration, 1000);
                                
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
                    
                    db.collection('calls').doc(callId)
                        .collection('calleeCandidates')
                        .onSnapshot(snapshot => {
                            snapshot.docChanges().forEach(change => {
                                if (change.type === 'added') {
                                    const candidate = new RTCIceCandidate(change.doc.data());
                                    peerConnection.addIceCandidate(candidate)
                                        .catch(error => {
                                            console.error("Erreur lors de l'ajout du candidat ICE:", error);
                                        });
                                }
                            });
                        });
                    
                    setTimeout(() => {
                        db.collection('calls').doc(callId).get()
                            .then(doc => {
                                if (doc.exists && doc.data().status === 'pending') {
                                    endCall('non_answered');
                                }
                            });
                    }, 30000);
                    
                    hideLoading();
                })
                .catch(error => {
                    console.error("Erreur lors de l'initiation de l'appel:", error);
                    endCall();
                    hideLoading();
                });
        })
        .catch(error => {
            console.error("Erreur d'accès aux médias:", error);
            showToast("Impossible d'accéder à la caméra ou au microphone", 'error');
            hideLoading();
        });
}

function setupPeerConnection() {
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };
    
    peerConnection = new RTCPeerConnection(configuration);
    
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }
    
    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };
    
    peerConnection.onicecandidate = event => {
        if (event.candidate && currentCall) {
            db.collection('calls').doc(currentCall.id)
                .collection(currentUser.uid === currentCall.callerId ? 'callerCandidates' : 'calleeCandidates')
                .add(event.candidate.toJSON());
        }
    };
    
    peerConnection.onicecandidateerror = event => {
        console.error('Erreur de candidat ICE:', event);
    };
    
    peerConnection.oniceconnectionstatechange = () => {
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
    if (currentCall && currentCall.id) {
        db.collection('calls').doc(currentCall.id).update({
            status: reason,
            endTime: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
            console.error('Erreur lors de la mise à jour de l\'état de l\'appel:', error);
        });
    }
    
    // Stop local stream
    if (localStream) {
        localStream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
        });
        localStream = null;
        localVideo.srcObject = null;
    }
    
    // Stop remote stream
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
        });
        remoteStream = null;
        remoteVideo.srcObject = null;
    }
    
    // Close peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Reset call-related variables
    isAudioMuted = false;
    isSpeakerOn = true;
    isVideoEnabled = true;
    
    // Update UI
    hideCallScreen();
    toggleMuteBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    toggleSpeakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    toggleVideoBtn.innerHTML = '<i class="fas fa-video"></i>';
    
    currentCall = null;
    showToast('Appel terminé', 'info');
}

function listenForIncomingCalls() {
    db.collection('calls')
        .where('calleeId', '==', currentUser.uid)
        .where('status', '==', 'pending')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const call = change.doc.data();
                    call.id = change.doc.id;
                    showIncomingCall(call);
                }
            });
        });
}

function showIncomingCall(call) {
    incomingCallData = call;
    
    incomingCallName.textContent = call.callerName || 'Utilisateur';
    incomingCallType.textContent = call.type === 'video' ? 'Appel vidéo' : 'Appel vocal';
    
    incomingCallNotification.style.display = 'block';
    playRingtone();
}

function playRingtone() {
    const ringtone = new Audio();
    ringtone.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    ringtone.loop = true;
    ringtone.play().catch(e => console.log('Erreur de lecture du son:', e));
    
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
            
            incomingCallNotification.style.display = 'none';
            showCallScreen(incomingCallData.type);
            
            callContactName.textContent = incomingCallData.callerName || 'Utilisateur';
            callStatus.textContent = 'Connexion en cours...';
            
            db.collection('calls').doc(incomingCallData.id).update({
                status: 'accepted',
                acceptTime: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            setupPeerConnection();
            
            if (incomingCallData.offer) {
                peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer))
                    .then(() => peerConnection.createAnswer())
                    .then(answer => peerConnection.setLocalDescription(answer))
                    .then(() => {
                        return db.collection('calls').doc(incomingCallData.id).update({
                            answer: {
                                type: peerConnection.localDescription.type,
                                sdp: peerConnection.localDescription.sdp
                            }
                        });
                    })
                    .then(() => {
                        db.collection('calls').doc(incomingCallData.id)
                            .collection('callerCandidates')
                            .onSnapshot(snapshot => {
                                snapshot.docChanges().forEach(change => {
                                    if (change.type === 'added') {
                                        const candidate = new RTCIceCandidate(change.doc.data());
                                        peerConnection.addIceCandidate(candidate)
                                            .catch(error => {
                                                console.error("Erreur lors de l'ajout du candidat ICE:", error);
                                            });
                                    }
                                });
                            });
                        
                        callTimer = setInterval(updateCallDuration, 1000);
                        callStatus.textContent = 'Appel en cours';
                        hideLoading();
                    })
                    .catch(error => {
                        console.error("Erreur lors de l'acceptation de l'appel:", error);
                        endCall();
                        hideLoading();
                    });
            } else {
                showToast("Erreur: Informations d'appel incomplètes", 'error');
                endCall();
                hideLoading();
            }
        })
        .catch(error => {
            console.error("Erreur d'accès aux médias:", error);
            showToast("Impossible d'accéder à la caméra ou au microphone", 'error');
            declineIncomingCall();
            hideLoading();
        });
}

function declineIncomingCall() {
    if (!incomingCallData) return;
    
    stopRingtone();
    
    db.collection('calls').doc(incomingCallData.id).update({
        status: 'declined',
        endTime: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(console.error);
    
    incomingCallNotification.style.display = 'none';
    incomingCallData = null;
}

// Gestion de l'interface
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

function handleScroll() {
    const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 100;
    if (isAtBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function handleNetworkStatus() {
    window.addEventListener('online', () => {
        updateUserStatus(true);
        showToast('Connexion rétablie', 'success');
    });
    
    window.addEventListener('offline', () => {
        updateUserStatus(false);
        showToast('Connexion perdue', 'error');
    });
}

function setupModalClose() {
    newConversationModal.addEventListener('click', (e) => {
        if (e.target === newConversationModal) {
            newConversationModal.style.display = 'none';
        }
    });
}

// Initialisation
function init() {
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('Utilisateur connecté:', user.uid);
            currentUser = user;
            onUserLoggedIn();
        } else {
            console.log('Aucun utilisateur connecté');
            showAuthScreen();
        }
    });

    authToggleLink.addEventListener('click', toggleAuthMode);
    document.querySelector('.auth-form').addEventListener('submit', handleAuth);

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
    
    messageInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    messageInput.addEventListener('input', handleTyping);
    
    sendButton.addEventListener('click', sendMessage);
    attachButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    
    chatMessages.addEventListener('dragover', (e) => {
        e.preventDefault();
        chatMessages.classList.add('drag-over');
    });
    
    chatMessages.addEventListener('dragleave', (e) => {
        e.preventDefault();
        chatMessages.classList.remove('drag-over');
    });
    
    chatMessages.addEventListener('drop', (e) => {
        e.preventDefault();
        chatMessages.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0 && currentChat) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                handleFileUpload();
            } else {
                showToast('Seules les images sont supportées via glisser-déposer', 'error');
            }
        }
    });
    
    voiceButton.addEventListener('click', toggleAudioRecording);
    cancelAudioBtn.addEventListener('click', cancelAudioRecording);
    sendAudioBtn.addEventListener('click', () => sendAudioMessage(null, null));
    
    voiceCallButton.addEventListener('click', () => initiateCall('voice'));
    videoCallButton.addEventListener('click', () => initiateCall('video'));
    toggleMuteBtn.addEventListener('click', toggleMute);
    toggleSpeakerBtn.addEventListener('click', toggleSpeaker);
    toggleVideoBtn.addEventListener('click', toggleVideo);
    endCallBtn.addEventListener('click', () => endCall('ended')); // Ensure endCall is called with 'ended' reason
    
    acceptCallBtn.addEventListener('click', acceptIncomingCall);
    declineCallBtn.addEventListener('click', declineIncomingCall);
    
    chatMessages.addEventListener('scroll', handleScroll);
    setupModalClose();
    handleNetworkStatus();
    
    window.openImageViewer = openImageViewer;
    window.deleteMessage = deleteMessage; // Make deleteMessage globally accessible for onclick
}

window.addEventListener('DOMContentLoaded', init);