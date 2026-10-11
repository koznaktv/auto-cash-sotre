export interface Order {
  id: string;
  userId?: string;
  userEmail?: string;
  serviceId: string;
  serviceName: string;
  packageTitle: string;
  amount: number;
  targetAccount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  details?: {
    smsCode?: string;
    virtualNumber?: string;
    accountCredentials?: string;
    cardDetails?: {
      number: string;
      exp: string;
      cvv: string;
    };
  };
}

export interface DepositRecord {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  method: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  date: string;
  txId?: string;
  reviewedAt?: string;
}
