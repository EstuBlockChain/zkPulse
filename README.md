## 🎮 Gameplay Instructions: zkPulse ⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Blockchain](https://img.shields.io/badge/Blockchain-Syscoin-blue?logo=blockchain-dot-com&logoColor=white)](https://syscoin.org/)
[![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=white)](https://render.com/)

**Objective:** Capture as many "Spikes" (network packets) as possible during a **60 Second diagnostic** to maximize your score and measure network reliability.

### 🕹️ How to Play

1.  **Start Diagnostic:** Press the start button to initiate real-time network traffic simulation.
2.  **Capture Spikes:** Click or tap the colored circles that appear randomly across the screen.
3.  **Score Points:** Each color represents a different network latency state:

| Packet | Points | Network State |
| :--- | :--- | :--- |
| 🟢 **Green** | **1 PT** | Normal Latency |
| 🟡 **Yellow** | **3 PTS** | Minor Congestion |
| 🔴 **Red** | **5 PTS** | Network Risk |

---
<img width="1919" height="auto" alt="Image" src="https://github.com/user-attachments/assets/d84e7db9-7fd9-49b1-900e-c371f33a1511" />

### ⛓️ On-Chain Publishing

Once the 60 Second diagnostic is complete, you can:

* **View Your Score:** Review your final diagnostic points and reliability rating.
* **Sign on Blockchain:** Permanently save your record on the **zkSYS** network using your wallet.
* **Compete:** Compare your ranking on the global Leaderboard against other nodes.

---

<div align="center">
  <a href="https://zkpulse.onrender.com" target="_blank">
    <button style="background-color:#4f46e5; color:white; padding:12px 24px; border-radius:8px; font-size:18px; border:none; cursor:pointer;">
      ▶️ Jugar zkPulse
    </button>
  </a>
</div>

> **A gamified network health monitor for the Syscoin ecosystem**

**zkPulse** transforms blockchain reliability metrics into an interactive gaming experience where users process packets in real-time, compete on leaderboards, and publish achievements on-chain.

---

## 🎮 Features

- **Gamified Monitoring:** Visualize network packet processing in real-time
- **Dual Leaderboard:** Compete for **Top Scores** and **Highest Reliability**
- **Multi-Network Support:** Switch between Syscoin Testnet (Tanenbaum) and Mainnet
- **On-Chain Publishing:** Save your high scores directly to the blockchain
- **Social Sharing:** Share your reliability rating on X (Twitter)

## 🛠️ Technology Stack

- **Framework:** SvelteKit
- **Styling:** TailwindCSS
- **Blockchain:** Wagmi / Viem
- **Wallet:** Reown AppKit
- **Network:** Syscoin NEVM (Testnet: 5700 | Mainnet: 57)

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/EstuBlockChain/zkPulse.git

# Install dependencies
cd FrontEnd
npm install

# Run development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## 🎯 Usage

1. **Connect Wallet** - Connect your Syscoin-compatible wallet
2. **Select Network** - Choose Testnet or Mainnet
3. **Start Processing** - Begin processing packets
4. **Compete** - Check leaderboards and track your ranking
5. **Publish** - Save your best scores on-chain
6. **Share** - Post your achievements on social media

## 🤝 Contributing

Contributions are welcome! Fork the repo, create a feature branch, and open a Pull Request.

## 📜 License

MIT License - Copyright (c) 2026 zkPulse Team

---

<div align="center">

**⚡ Built for the Syscoin ecosystem ⚡**

[⭐ Star this repo](https://github.com/EstuBlockChain/zkPulse) • [Report Issues](https://github.com/EstuBlockChain/zkPulse/issues)

</div>
