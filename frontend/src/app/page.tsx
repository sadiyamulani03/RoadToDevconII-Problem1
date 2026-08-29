'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther, formatUnits } from 'viem'
import { COMMISSION_ESCROW_ABI, COMMISSION_ESCROW_ADDRESS } from '@/lib/contract'

export const CommissionStatus = {
  0: 'Active',
  1: 'Delivered',
  2: 'Paid',
  3: 'Refunded',
  4: 'Disputed'
} as const

export default function Home() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
  
  const [formData, setFormData] = useState({
    artisan: '',
    arbiter: '',
    deadlineDays: '1',
    amount: '0.01',
    commissionId: ''
  })
  
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const { data: commissionCount } = useReadContract({
    address: COMMISSION_ESCROW_ADDRESS as `0x${string}`,
    abi: COMMISSION_ESCROW_ABI,
    functionName: 'commissionCount',
  })

  const handleCreateCommission = () => {
    if (!formData.artisan || !formData.arbiter || !formData.amount) {
      setMessage({ type: 'error', text: 'Please fill all fields' })
      return
    }
    
    const deadline = BigInt(Math.floor(Date.now() / 1000) + parseInt(formData.deadlineDays) * 86400)
    const value = parseEther(formData.amount)
    
    writeContract({
      address: COMMISSION_ESCROW_ADDRESS as `0x${string}`,
      abi: COMMISSION_ESCROW_ABI,
      functionName: 'createCommission',
      args: [formData.artisan as `0x${string}`, deadline, formData.arbiter as `0x${string}`],
      value,
    })
    
    setMessage({ type: 'success', text: 'Transaction submitted!' })
  }

  const handleConfirmDelivery = (commissionId: string) => {
    writeContract({
      address: COMMISSION_ESCROW_ADDRESS as `0x${string}`,
      abi: COMMISSION_ESCROW_ABI,
      functionName: 'confirmDelivery',
      args: [BigInt(commissionId)],
    })
    setMessage({ type: 'success', text: 'Delivery confirmation submitted!' })
  }

  const handleReleaseFunds = (commissionId: string) => {
    writeContract({
      address: COMMISSION_ESCROW_ADDRESS as `0x${string}`,
      abi: COMMISSION_ESCROW_ABI,
      functionName: 'releaseFunds',
      args: [BigInt(commissionId)],
    })
    setMessage({ type: 'success', text: 'Funds release submitted!' })
  }

  const handleRefund = (commissionId: string) => {
    writeContract({
      address: COMMISSION_ESCROW_ADDRESS as `0x${string}`,
      abi: COMMISSION_ESCROW_ABI,
      functionName: 'refund',
      args: [BigInt(commissionId)],
    })
    setMessage({ type: 'success', text: 'Refund submitted!' })
  }

  const handleDispute = (commissionId: string) => {
    writeContract({
      address: COMMISSION_ESCROW_ADDRESS as `0x${string}`,
      abi: COMMISSION_ESCROW_ABI,
      functionName: 'dispute',
      args: [BigInt(commissionId)],
    })
    setMessage({ type: 'success', text: 'Dispute submitted!' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Commission Escrow</h1>
          <p className="mt-2 text-gray-600">Road to Devcon II - Secure Commission Platform</p>
        </div>

        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800">Please connect your wallet to use the platform</p>
          </div>
        )}

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'create' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Create Commission
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'manage' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Manage Commissions
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'create' && (
              <CreateCommissionForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateCommission}
                isPending={isPending || isConfirming}
                isConnected={isConnected}
                address={address}
              />
            )}
            
            {activeTab === 'manage' && (
              <ManageCommissionsTab
                commissionCount={commissionCount ? Number(commissionCount) : 0}
                address={address}
                onConfirmDelivery={handleConfirmDelivery}
                onReleaseFunds={handleReleaseFunds}
                onRefund={handleRefund}
                onDispute={handleDispute}
                isPending={isPending || isConfirming}
              />
            )}
          </div>
        </div>

        {(isPending || isConfirming) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-700">{isConfirming ? 'Confirming transaction...' : 'Submitting transaction...'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateCommissionForm({
  formData,
  setFormData,
  onSubmit,
  isPending,
  isConnected,
  address
}: {
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  onSubmit: () => void
  isPending: boolean
  isConnected: boolean
  address: `0x${string}` | undefined
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Artisan Address</label>
          <input
            type="text"
            value={formData.artisan}
            onChange={(e) => setFormData({ ...formData, artisan: e.target.value })}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arbiter Address</label>
          <input
            type="text"
            value={formData.arbiter}
            onChange={(e) => setFormData({ ...formData, arbiter: e.target.value })}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (days)</label>
          <input
            type="number"
            value={formData.deadlineDays}
            onChange={(e) => setFormData({ ...formData, deadlineDays: e.target.value })}
            min="1"
            max="365"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ETH)</label>
          <input
            type="number"
            step="0.001"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            min="0.001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">How it works</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Collector creates commission with payment locked in contract</li>
          <li>• Artisan confirms delivery when work is complete</li>
          <li>• Collector or anyone can release funds after delivery confirmed</li>
          <li>• If deadline passes without delivery, collector can refund</li>
          <li>• Disputes resolved by independent arbiter</li>
        </ul>
      </div>

      <button
        onClick={onSubmit}
        disabled={isPending || !isConnected}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Processing...' : 'Create Commission'}
      </button>

      {!isConnected && (
        <p className="text-center text-sm text-gray-500">Connect wallet to create commission</p>
      )}
    </div>
  )
}

function ManageCommissionsTab({
  commissionCount,
  address,
  onConfirmDelivery,
  onReleaseFunds,
  onRefund,
  onDispute,
  isPending
}: {
  commissionCount: number
  address: `0x${string}` | undefined
  onConfirmDelivery: (id: string) => void
  onReleaseFunds: (id: string) => void
  onRefund: (id: string) => void
  onDispute: (id: string) => void
  isPending: boolean
}) {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCommissions = async () => {
    if (commissionCount === 0) return
    setLoading(true)
    const fetched = []
    for (let i = 0; i < commissionCount; i++) {
      try {
        const data = await fetch(`/api/commission/${i}`)
        if (data.ok) {
          const commission = await data.json()
          fetched.push({ id: i, ...commission })
        }
      } catch (e) {
        console.error('Failed to fetch commission', i, e)
      }
    }
    setCommissions(fetched)
    setLoading(false)
  }

  // In a real app, we'd use wagmi's useReadContract for each commission
  // For now, we'll use a simple fetch to an API route
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Commissions</h2>
        <button
          onClick={fetchCommissions}
          disabled={loading}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {commissionCount === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No commissions found. Create your first commission!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {commissions.map((commission) => (
            <CommissionCard
              key={commission.id}
              commission={{ ...commission, id: commission.id }}
              address={address}
              onConfirmDelivery={onConfirmDelivery}
              onReleaseFunds={onReleaseFunds}
              onRefund={onRefund}
              onDispute={onDispute}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CommissionCard({
  commission,
  address,
  onConfirmDelivery,
  onReleaseFunds,
  onRefund,
  onDispute,
  isPending
}: {
  commission: any
  address: `0x${string}` | undefined
  onConfirmDelivery: (id: string) => void
  onReleaseFunds: (id: string) => void
  onRefund: (id: string) => void
  onDispute: (id: string) => void
  isPending: boolean
}) {
  const status = CommissionStatus[commission.status as keyof typeof CommissionStatus] || 'Unknown'
  const isCollector = address?.toLowerCase() === commission.collector?.toLowerCase()
  const isArtisan = address?.toLowerCase() === commission.artisan?.toLowerCase()
  const isArbiter = address?.toLowerCase() === commission.arbiter?.toLowerCase()

  const canConfirmDelivery = isArtisan && commission.status === 0
  const canReleaseFunds = commission.status === 1
  const canRefund = isCollector && commission.status === 0 && Date.now() / 1000 > Number(commission.deadline)
  const canDispute = (isCollector || isArtisan) && (commission.status === 0 || commission.status === 1)
  const canResolve = isArbiter && commission.status === 4

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Commission #{commission.id}</h3>
          <p className="text-sm text-gray-500">Amount: {formatEther(commission.amount)} ETH</p>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
          commission.status === 0 ? 'bg-blue-100 text-blue-800' :
          commission.status === 1 ? 'bg-yellow-100 text-yellow-800' :
          commission.status === 2 ? 'bg-green-100 text-green-800' :
          commission.status === 3 ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-500">Collector</p>
          <p className="font-mono">{commission.collector?.slice(0, 6)}...{commission.collector?.slice(-4)}</p>
        </div>
        <div>
          <p className="text-gray-500">Artisan</p>
          <p className="font-mono">{commission.artisan?.slice(0, 6)}...{commission.artisan?.slice(-4)}</p>
        </div>
        <div>
          <p className="text-gray-500">Arbiter</p>
          <p className="font-mono">{commission.arbiter?.slice(0, 6)}...{commission.arbiter?.slice(-4)}</p>
        </div>
        <div>
          <p className="text-gray-500">Deadline</p>
          <p>{new Date(Number(commission.deadline) * 1000).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {canConfirmDelivery && (
          <button
            onClick={() => onConfirmDelivery(commission.id.toString())}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Confirm Delivery
          </button>
        )}
        {canReleaseFunds && (
          <button
            onClick={() => onReleaseFunds(commission.id.toString())}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Release Funds
          </button>
        )}
        {canRefund && (
          <button
            onClick={() => onRefund(commission.id.toString())}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Refund
          </button>
        )}
        {canDispute && (
          <button
            onClick={() => onDispute(commission.id.toString())}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Dispute
          </button>
        )}
        {canResolve && (
          <div className="flex gap-2">
            <button
              onClick={() => console.log('Resolve for artisan', commission.id)}
              disabled={isPending}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Resolve: Artisan
            </button>
            <button
              onClick={() => console.log('Resolve for collector', commission.id)}
              disabled={isPending}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Resolve: Collector
            </button>
          </div>
        )}
      </div>
    </div>
  )
}