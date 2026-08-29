import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbi } from 'viem'
import { baseSepolia } from 'viem/chains'

const COMMISSION_ESCROW_ABI = parseAbi([
  'function getCommission(uint256) view returns (address collector, address artisan, uint256 amount, uint256 deadline, uint8 status, address arbiter, bool deliveryConfirmed)',
  'function commissionCount() view returns (uint256)'
])

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const commissionId = BigInt(id)
    
    const commission = await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: COMMISSION_ESCROW_ABI,
      functionName: 'getCommission',
      args: [commissionId],
    })
    
    const [collector, artisan, amount, deadline, status, arbiter, deliveryConfirmed] = commission
    
    return NextResponse.json({
      collector,
      artisan,
      amount: amount.toString(),
      deadline: deadline.toString(),
      status: Number(status),
      arbiter,
      deliveryConfirmed,
    })
  } catch (error) {
    console.error('Error fetching commission:', error)
    return NextResponse.json({ error: 'Failed to fetch commission' }, { status: 500 })
  }
}