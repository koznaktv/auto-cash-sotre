export interface Order {
  id: string;
  serviceId: string;
  serviceName: string;
  packageTitle: string;
  amount: number;
  targetAccount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
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

// In-memory persistent order storage for the running node session
export const ordersStore: Order[] = [
  {
    id: 'ORD-98421',
    serviceId: 'chatgpt-plus',
    serviceName: 'ChatGPT Plus / Pro',
    packageTitle: '1 ئايلىق مۇستەقىل ھېسابات (Private)',
    amount: 21.99,
    targetAccount: 'client@example.com',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    details: {
      accountCredentials: 'ھېسابات قوزغىتىلدى: client@example.com (OpenAI Plus ئاكتىپ)',
    },
  },
  {
    id: 'ORD-98422',
    serviceId: 'pubg-mobile',
    serviceName: 'PUBG Mobile UC',
    packageTitle: '660 UC (Royale Pass)',
    amount: 9.50,
    targetAccount: '581294819',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'ORD-98423',
    serviceId: 'telegram-sms',
    serviceName: 'تېلېگرام مەۋھۇم نومۇر',
    packageTitle: 'ئامېرىكا (+1) مەۋھۇم نومۇر',
    amount: 1.20,
    targetAccount: 'United States (+1)',
    status: 'processing',
    createdAt: new Date(Date.now() - 120000).toISOString(),
    details: {
      virtualNumber: '+1 (202) 555-0194',
      smsCode: 'كود كۈتۈلمەكتە...',
    },
  },
];
