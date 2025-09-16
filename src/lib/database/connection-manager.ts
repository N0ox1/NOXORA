import { prisma } from '@/lib/prisma';

// Manager para controlar conexões do banco
class ConnectionManager {
  private static instance: ConnectionManager;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        await prisma.$connect();
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ Conexão com banco estabelecida');
      } catch (error) {
        this.reconnectAttempts++;
        console.error(`❌ Erro ao conectar (tentativa ${this.reconnectAttempts}):`, error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          // Aguarda antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000 * this.reconnectAttempts));
          return this.ensureConnection();
        } else {
          throw new Error('Falha ao conectar com o banco após múltiplas tentativas');
        }
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await prisma.$disconnect();
        this.isConnected = false;
        console.log('🔌 Conexão com banco encerrada');
      } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
      }
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const connectionManager = ConnectionManager.getInstance();
