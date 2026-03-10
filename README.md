# 🛸 Conviction Clash

**AI-Powered On-Chain Space Battles built on Avalanche**  



> Where your **economic conviction powers your ship**.  


## 🚀 Project Overview



**Conviction Clash** is a Web3 PvP space battle game that merges **AI**, **DeFi mechanics**, and **on-chain data**.  

Players stake AVAX into economic theses, and our **Conviction Engine** analyzes live Avalanche ecosystem data to dynamically boost ship stats in battles. Battle outcomes are recorded on-chain, creating transparent leaderboards and competitive gameplay driven by real-world conviction.



---



## 🎯 Features



### 🟢 Wallet Integration

- Connect via **MetaMask** or **Core Wallet**  
- Supports **Avalanche Fuji testnet**  

- Displays connected wallet address



### 🔴 Thesis Selection \& Staking

- Choose an economic thesis:  

&nbsp; - **AVAX Ecosystem Growth**  

&nbsp; - **DeFi Expansion**  

&nbsp; - **Gaming Subnet Surge**  

- Stake AVAX to power your thesis  

- Generates **Conviction Score** via AI engine



### ⚡ Conviction Engine

- AI analyzes live Avalanche data (staking, TVL, token momentum)  

- Outputs **dynamic stat modifiers**:  

&nbsp; - Attack Boost  

&nbsp; - Shield Boost  

&nbsp; - Speed / Cooldown adjustments  



### 🛸 PvP Space Battle

- 2D real-time battle simulation using \*\*Phaser.js\*\*  

- Ships reflect AI-powered stat boosts  

- Visual effects for attack, shield, and special abilities  

- Winner highlighted and battle result submitted on-chain



### 📊 Conviction Dashboard

\- Displays AI Conviction Score  

\- Shows applied stat boosts in real-time  

\- Optional leaderboard of top “Most Convicted Captains”



### 🔗 On-Chain Interactions

\- Thesis staking → triggers smart contract  

\- Battle result logging → recorded on-chain  

\- Leaderboard updates → viewable for transparency



---



## 🏗 Architecture Overview



```text

Frontend (React/Next.js)

&nbsp;  └── Wallet Connect

&nbsp;  └── Thesis Selection / Staking

&nbsp;  └── Conviction Dashboard

&nbsp;       ↓

Backend (Node.js Conviction Engine)

&nbsp;  └── Pulls Avalanche data / optional Chainlink feeds

&nbsp;  └── Calculates Conviction Score

&nbsp;       ↓

Game Canvas (Phaser.js)

&nbsp;  └── Apply stat modifiers → simulate battle

&nbsp;       ↓

Smart Contract (Avalanche Fuji)

&nbsp;  └── Log battle result

&nbsp;  └── Update leaderboard

