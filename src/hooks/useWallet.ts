import { useState, useCallback } from 'react';
import { calculateConviction, submitBattleResult as submitBattleResultApi } from '@/lib/conviction-api';

// Avalanche Fuji Testnet chain config
const FUJI_CHAIN_ID = '0xa869'; // 43113
const FUJI_PARAMS = {
  chainId: FUJI_CHAIN_ID,
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('Please install MetaMask or Core Wallet');
      return;
    }
    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      try {
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: FUJI_CHAIN_ID }] });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({ method: 'wallet_addEthereumChain', params: [FUJI_PARAMS] });
        }
      }
      setAddress(accounts[0]);
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  // Stake thesis — calls backend Conviction Engine
  const stakeThesis = useCallback(async (thesis: string, amount: string) => {
    if (!address) return null;
    setTxStatus('pending');
    try {
      // TODO: Replace with actual on-chain staking via ethers.js
      // const provider = new ethers.BrowserProvider(window.ethereum);
      // const signer = await provider.getSigner();
      // const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      // const tx = await contract.stakeThesis(thesisId, { value: ethers.parseEther(amount) });
      // const receipt = await tx.wait();
      // const txHash = receipt.hash;

      // Simulate on-chain tx delay for MVP
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Call backend Conviction Engine
      const result = await calculateConviction(address, thesis, parseFloat(amount));

      setTxStatus('success');
      setTimeout(() => setTxStatus('idle'), 3000);
      return result;
    } catch (err) {
      console.error('Stake failed:', err);
      setTxStatus('error');
      setTimeout(() => setTxStatus('idle'), 3000);
      return null;
    }
  }, [address]);

  // Submit battle result via backend
  const submitBattleResult = useCallback(async (winnerId: string, loserId: string) => {
    if (!address) return;
    setTxStatus('pending');
    try {
      const winnerAddr = winnerId === 'player' ? address : '0xOPPONENT';
      const loserAddr = winnerId === 'player' ? '0xOPPONENT' : address;
      await submitBattleResultApi(address, '0xOPPONENT', winnerAddr);
      setTxStatus('success');
      setTimeout(() => setTxStatus('idle'), 3000);
    } catch (err) {
      console.error('Battle result submission failed:', err);
      setTxStatus('error');
      setTimeout(() => setTxStatus('idle'), 3000);
    }
  }, [address]);

  return { address, isConnecting, txStatus, connect, disconnect, stakeThesis, submitBattleResult };
}
