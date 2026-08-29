export const COMMISSION_ESCROW_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_artisan", "type": "address"},
      {"internalType": "uint256", "name": "_deadline", "type": "uint256"},
      {"internalType": "address", "name": "_arbiter", "type": "address"}
    ],
    "name": "createCommission",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_commissionId", "type": "uint256"}],
    "name": "confirmDelivery",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_commissionId", "type": "uint256"}],
    "name": "releaseFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_commissionId", "type": "uint256"}],
    "name": "refund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_commissionId", "type": "uint256"}],
    "name": "dispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_commissionId", "type": "uint256"},
      {"internalType": "bool", "name": "_artisanWins", "type": "bool"}
    ],
    "name": "resolveDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_commissionId", "type": "uint256"}],
    "name": "getCommission",
    "outputs": [
      {"internalType": "address", "name": "collector", "type": "address"},
      {"internalType": "address", "name": "artisan", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "address", "name": "arbiter", "type": "address"},
      {"internalType": "bool", "name": "deliveryConfirmed", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "commissions",
    "outputs": [
      {"internalType": "address", "name": "collector", "type": "address"},
      {"internalType": "address", "name": "artisan", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "address", "name": "arbiter", "type": "address"},
      {"internalType": "bool", "name": "deliveryConfirmed", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "commissionCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export const COMMISSION_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'