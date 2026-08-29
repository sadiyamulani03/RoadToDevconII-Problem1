# Commission Escrow - Road to Devcon II

A decentralized escrow smart contract for commissioning artwork, built for the Road to Devcon II challenge.

## Problem: The Advance That Never Shows Up

Kalpana paints Warli scenes on cloth in a village three hours from Nashik. A collector in Berlin wants to commission a large piece, good money, the kind that changes a month for her. But the last two times a foreign buyer sent an "advance," the agent who arranged it kept most of it and Kalpana never saw the rest. The collector has her own worry: wiring money to someone she's never met, for a painting that doesn't exist yet, with no way to get it back if it never arrives.

Neither of them wants to trust a middleman again. They want the money itself to hold the promise: locked the moment the deal is struck, released only when the work is actually delivered, and returned automatically if it never is.

## Solution

This smart contract implements a trustless escrow system for commissioning artwork:

1. **Locked Funds**: Collector's payment is locked in the contract at commission creation
2. **Delivery Confirmation**: Artisan must confirm delivery before funds can be released
3. **State Before Transfer**: Contract state is updated before external transfers (reentrancy protection)
4. **Timeout Refund**: If deadline passes without delivery, collector can reclaim funds
5. **Dispute Resolution**: Independent arbiter resolves disputes (not collector or artisan alone)
6. **No Double Release**: Terminal states prevent double payment or refund

## Contract Features

- **ReentrancyGuard**: Protects against reentrancy attacks
- **AccessControl**: Manages arbiter roles
- **Commission Lifecycle**: Active → Delivered → Paid OR Active → Refunded OR Active/Delivered → Disputed → Resolved

## Test Coverage

All 8 acceptance criteria tests pass:

1. ✅ Escrow holds funds before work begins
2. ✅ Release requires confirmed delivery
3. ✅ State updated before external transfer
4. ✅ Timeout produces explicit refund path
5. ✅ Disputes aren't resolved by either party alone
6. ✅ Commission amount comes from value actually sent
7. ✅ No double release of the same commission
8. ✅ No credentials in tracked files

## Deployment

### Prerequisites

- Foundry (forge, cast, anvil)
- Base Sepolia RPC URL
- Private key with Base Sepolia ETH

### Environment Variables

Create a `.env` file:

```bash
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Deploy

```bash
# Deploy to Base Sepolia
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify -vvvv
```

### Run Tests

```bash
forge test -vv
```

## Frontend

A Next.js frontend with wagmi/viem is included in the `frontend/` directory.

### Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your contract address
npm run dev
```

### Features

- Create new commissions with payment
- Confirm delivery (artisan)
- Release funds (after delivery)
- Request refund (after deadline)
- Dispute resolution
- View commission status

## Contract Address

After deployment, update `NEXT_PUBLIC_CONTRACT_ADDRESS` in frontend environment variables.

## License

MIT