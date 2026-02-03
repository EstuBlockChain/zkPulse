# zkPulse ⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Syscoin](https://img.shields.io/badge/Syscoin-0082C6?logo=bitcoin&logoColor=white)](https://syscoin.org/)

> **A gamified network health monitor for the Syscoin ecosystem**

**zkPulse** transforms blockchain reliability metrics into an interactive gaming experience. Process packets in real-time, compete on leaderboards, and publish your achievements on-chain!

---

## ✨ Highlights

🎮 **Gamified Experience** - Turn network monitoring into an engaging game  
🏆 **Dual Leaderboards** - Compete for top scores and highest reliability  
🌐 **Multi-Network** - Switch seamlessly between Testnet and Mainnet  
⛓️ **On-Chain Publishing** - Save your achievements to the blockchain  
🐦 **Social Integration** - Share your stats on X (Twitter)

---

## 🎮 Features

### Core Functionality
- **Real-Time Packet Processing:** Visualize network activity as you "process" blockchain packets
- **Performance Tracking:** Monitor your reliability score and network health metrics
- **Leaderboard System:** 
  - **Top Scores:** Highest packet processing achievements
  - **Reliability Rankings:** Most consistent network performance
- **Network Switching:** Toggle between Syscoin Tanenbaum (Testnet) and Mainnet
- **Blockchain Integration:** Permanent on-chain record of high scores
- **Social Sharing:** One-click sharing to X with your reliability rating

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend Framework** | [SvelteKit](https://kit.svelte.dev/) |
| **Styling** | [TailwindCSS](https://tailwindcss.com/) |
| **Blockchain** | [Wagmi](https://wagmi.sh/) / [Viem](https://viem.sh/) |
| **Wallet Connection** | [Reown AppKit](https://reown.com/) |
| **Network** | [Syscoin NEVM](https://syscoin.org/) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- A Syscoin-compatible wallet (MetaMask, etc.)

### Installation

1. **Clone the repository**  
   ```bash
   git clone https://github.com/EstuBlockChain/zkPulse.git
   cd zkPulse
   ```

2. **Navigate to frontend directory**  
   ```bash
   cd FrontEnd
   ```

3. **Install dependencies**  
   ```bash
   npm install
   ```

4. **Configure environment variables** (if needed)  
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development server**  
   ```bash
   npm run dev
   ```

6. **Open your browser**  
   ```
   Navigate to http://localhost:5173
   ```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📦 Project Structure

```
zkPulse/
├── FrontEnd/
│   ├── src/
│   │   ├── lib/          # Reusable components
│   │   ├── routes/       # SvelteKit pages
│   │   └── app.css       # Global styles
│   ├── static/           # Static assets
│   └── package.json
└── README.md
```

---

## 🎯 Usage

1. **Connect Wallet:** Click "Connect Wallet" and select your Syscoin-compatible wallet
2. **Select Network:** Choose between Tanenbaum (Testnet) or Mainnet
3. **Start Processing:** Begin processing packets to test network reliability
4. **Track Progress:** Watch your score and reliability rating increase
5. **Compete:** Check the leaderboards to see where you rank
6. **Publish Score:** Save your best achievements on-chain
7. **Share:** Post your results to social media

---

## 🌐 Networks Supported

- **Syscoin Tanenbaum (Testnet)** - Chain ID: 5700
- **Syscoin Mainnet** - Chain ID: 57

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Write clear commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? [Open an issue](https://github.com/EstuBlockChain/zkPulse/issues)!

---

## 📜 License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MIT License**

Copyright (c) 2026 zkPulse Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 👥 Team

**EstuBlockChain** - Building the future of blockchain gaming and monitoring

---

## 🔗 Links

- [Syscoin Website](https://syscoin.org/)
- [Syscoin Documentation](https://docs.syscoin.org/)
- [Report Issues](https://github.com/EstuBlockChain/zkPulse/issues)

---

<div align="center">
  
### ⚡ Built with passion for the Syscoin ecosystem ⚡

**[⭐ Star this repo](https://github.com/EstuBlockChain/zkPulse)** if you find it useful!

</div>