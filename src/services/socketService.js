// src/services/socketService.js
// Servizio WebSocket per messaggi real-time (Frontend)
// ✅ VERSIONE CORRETTA con gestione robusta della connessione

import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL del server WebSocket (stesso del backend, senza /api)
const SOCKET_URL = 'https://bevi-backend.onrender.com';
const TOKEN_KEY = '@bevi_auth_token';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentGroupId = null;
    this.listeners = new Map(); // event -> [callbacks]
    this.connectionPromise = null; // Per evitare connessioni multiple simultanee
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Connetti al server WebSocket
   * ✅ FIX: Gestisce correttamente riconnessioni senza perdere listener
   */
  async connect() {
    // Se già connesso, ritorna subito
    if (this.socket?.connected) {
      console.log('🔌 Socket già connesso:', this.socket.id);
      return true;
    }

    // Se c'è già una connessione in corso, aspetta quella
    if (this.connectionPromise) {
      console.log('🔌 Connessione già in corso, aspetto...');
      return this.connectionPromise;
    }

    // Se il socket esiste ma è disconnesso, prova a riconnetterlo
    // NON creare un nuovo socket (perderemmo i listener!)
    if (this.socket && !this.socket.connected) {
      console.log('🔌 Socket esiste ma disconnesso, tento riconnessione...');
      
      // Forza tentativo di riconnessione
      this.socket.connect();
      
      // Aspetta la connessione con timeout
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⚠️ Timeout riconnessione, creo nuovo socket');
          this.forceNewConnection().then(resolve);
        }, 5000);

        const onConnect = () => {
          clearTimeout(timeout);
          this.socket.off('connect', onConnect);
          console.log('🔌 Riconnesso!');
          resolve(true);
        };

        this.socket.once('connect', onConnect);
      });
    }

    // Crea nuova connessione
    this.connectionPromise = this.forceNewConnection();
    return this.connectionPromise;
  }

  /**
   * Forza la creazione di una nuova connessione
   * ✅ Ri-registra tutti i listener pendenti
   */
  async forceNewConnection() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        console.log('❌ Nessun token, impossibile connettersi');
        this.connectionPromise = null;
        return false;
      }

      // Pulisci socket precedente se esiste
      if (this.socket) {
        console.log('🧹 Pulizia socket precedente...');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      console.log('🔌 Creazione nuovo socket...');

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // Fallback a polling se websocket fallisce
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
      });

      // Promessa che si risolve quando connesso
      const connectPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 20000);

        this.socket.once('connect', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      // Setup event handlers PRIMA di aspettare la connessione
      this.setupSocketEvents();

      // Ri-registra tutti i listener salvati
      this.reattachListeners();

      // Aspetta la connessione
      await connectPromise;
      
      console.log('🔌 Socket connesso:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionPromise = null;
      
      return true;
    } catch (error) {
      console.log('❌ Errore connessione socket:', error.message);
      this.isConnected = false;
      this.connectionPromise = null;
      return false;
    }
  }

  /**
   * Setup degli event handler del socket
   */
  setupSocketEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Socket connesso:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // ✅ FIX CRITICO: Ri-entra nel gruppo dopo riconnessione!
      if (this.currentGroupId) {
        console.log('🔄 Ri-entro nel gruppo dopo riconnessione:', this.currentGroupId);
        this.socket.emit('join_group', this.currentGroupId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnesso:', reason);
      this.isConnected = false;
      
      // Se disconnesso dal server, prova a riconnetterti
      if (reason === 'io server disconnect') {
        console.log('🔄 Disconnesso dal server, riconnessione manuale...');
        this.socket.connect();
      }
      // Per altri motivi, socket.io gestisce la riconnessione automaticamente
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Tentativo riconnessione #${attempt}`);
      this.reconnectAttempts = attempt;
    });

    this.socket.on('reconnect', (attempt) => {
      console.log(`🔌 Riconnesso dopo ${attempt} tentativi`);
      this.isConnected = true;
      
      // ✅ FIX: Ri-entra nel gruppo dopo riconnessione
      if (this.currentGroupId) {
        console.log('🔄 Ri-entro nel gruppo dopo reconnect:', this.currentGroupId);
        this.socket.emit('join_group', this.currentGroupId);
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.log('❌ Riconnessione fallita dopo tutti i tentativi');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.log('❌ Errore connessione socket:', error.message);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.log('❌ Errore socket:', error);
    });
  }

  /**
   * Ri-attacca tutti i listener salvati al socket
   * ✅ Chiamato dopo riconnessione per non perdere i listener
   */
  reattachListeners() {
    if (!this.socket) return;

    const listenerCount = Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0);
    
    if (listenerCount > 0) {
      console.log(`🔄 Ri-attacco ${listenerCount} listener salvati...`);
      
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.on(event, callback);
        });
      });
    }
  }

  /**
   * Disconnetti dal server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnessione manuale...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentGroupId = null;
      this.connectionPromise = null;
      // NON pulire this.listeners - potrebbero servire per riconnessione
      console.log('🔌 Socket disconnesso');
    }
  }

  /**
   * Entra in un gruppo (room)
   * ✅ FIX: Ora è asincrono e aspetta che il socket sia connesso
   */
  async joinGroup(groupId) {
    if (!groupId) {
      console.log('⚠️ joinGroup: GroupId mancante');
      return false;
    }

    // Assicurati che il socket sia connesso
    if (!this.socket?.connected) {
      console.log('⚠️ Socket non connesso, connetto prima di joinare...');
      const connected = await this.connect();
      if (!connected) {
        console.log('❌ Impossibile connettersi, join fallito');
        return false;
      }
    }

    // Esci dal gruppo precedente se diverso
    if (this.currentGroupId && this.currentGroupId !== groupId) {
      console.log(`👋 Esco dal gruppo precedente: ${this.currentGroupId}`);
      this.socket.emit('leave_group', this.currentGroupId);
    }

    // Entra nel nuovo gruppo
    this.socket.emit('join_group', groupId);
    this.currentGroupId = groupId;
    console.log(`👥 Join gruppo richiesto: ${groupId}`);
    return true;
  }

  /**
   * Esci da un gruppo (room)
   */
  leaveGroup(groupId) {
    const targetGroupId = groupId || this.currentGroupId;
    
    if (!targetGroupId) {
      console.log('⚠️ leaveGroup: Nessun gruppo da cui uscire');
      return;
    }

    if (this.socket?.connected) {
      this.socket.emit('leave_group', targetGroupId);
      console.log(`👋 Leave gruppo: ${targetGroupId}`);
    }
    
    if (targetGroupId === this.currentGroupId) {
      this.currentGroupId = null;
    }
  }

  /**
   * Invia evento "sta scrivendo"
   */
  sendTyping(groupId, isTyping) {
    if (!this.socket?.connected) {
      console.log('⚠️ sendTyping: Socket non connesso');
      return;
    }
    this.socket.emit('typing', { groupId, isTyping });
  }

  /**
   * Ascolta un evento
   * ✅ FIX: Salva SEMPRE il listener, anche se socket non è pronto
   */
  on(event, callback) {
    if (!event || !callback) {
      console.log('⚠️ on: event o callback mancante');
      return;
    }

    // Salva SEMPRE il listener nella mappa (per riconnessioni)
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const callbacks = this.listeners.get(event);
    
    // Evita duplicati
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }

    // Se il socket è pronto, registra subito
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.log(`⏳ Socket non pronto, listener '${event}' salvato per dopo`);
    }
  }

  /**
   * Rimuovi un listener specifico
   */
  off(event, callback) {
    if (!event || !callback) return;

    // Rimuovi dalla mappa
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
      // Rimuovi la chiave se non ci sono più listener
      if (eventListeners.length === 0) {
        this.listeners.delete(event);
      }
    }

    // Rimuovi dal socket se esiste
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Rimuovi tutti i listener di un evento
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.removeAllListeners(event);
      }
    } else {
      // Rimuovi tutti tranne gli handler interni
      this.listeners.clear();
      if (this.socket) {
        const internalEvents = ['connect', 'disconnect', 'connect_error', 'error', 'reconnect', 'reconnect_attempt', 'reconnect_failed'];
        this.socket.eventNames().forEach(eventName => {
          if (!internalEvents.includes(eventName)) {
            this.socket.removeAllListeners(eventName);
          }
        });
      }
    }
  }

  /**
   * Verifica se è connesso
   */
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Ottieni l'ID del socket
   */
  getSocketId() {
    return this.socket?.id || null;
  }

  /**
   * Ottieni lo stato corrente (utile per debug)
   */
  getStatus() {
    return {
      connected: this.isSocketConnected(),
      socketId: this.getSocketId(),
      currentGroupId: this.currentGroupId,
      reconnectAttempts: this.reconnectAttempts,
      listenersCount: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
      listeners: Array.from(this.listeners.keys()),
    };
  }
}

// Singleton - una sola istanza in tutta l'app
const socketService = new SocketService();
export default socketService;