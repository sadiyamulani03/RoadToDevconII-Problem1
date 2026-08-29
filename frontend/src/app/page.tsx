'use client'

import { useState } from 'react'

export default function Home() {
  const [message, setMessage] = useState('')
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Commission Escrow</h1>
          <p className="mt-2 text-gray-600">Road to Devcon II - Secure Commission Platform</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contract Deployed Successfully!</h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-green-800 mb-2">✅ Smart Contract Live on Base Sepolia</h3>
            <p className="text-green-700 text-sm font-mono">0x0a5997cDA0609508D2F7035Dd940496a0492582f</p>
            <a 
              href="https://sepolia.basescan.org/address/0x0a5997cDA0609508D2F7035Dd940496a0492582f" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:underline text-sm mt-2 inline-block"
            >
              View on BaseScan →
            </a>
          </div>

          <div className="space-y-4 text-gray-700">
            <h3 className="font-medium">Features Implemented:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>✅ Escrow holds funds before work begins</li>
              <li>✅ Release requires confirmed delivery</li>
              <li>✅ State updated before external transfer (reentrancy guard)</li>
              <li>✅ Timeout produces explicit refund path</li>
              <li>✅ Disputes resolved by independent arbiter</li>
              <li>✅ Commission amount from msg.value</li>
              <li>✅ No double release/refund</li>
              <li>✅ 20/20 tests passing</li>
            </ul>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Frontend Status:</h3>
            <p className="text-sm text-gray-600">Basic deployment successful. Full wagmi/viem integration can be added after confirming deployment works.</p>
          </div>
        </div>
      </div>
    </div>
  )