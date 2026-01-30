# ZI Playground Documentation

## Quick Navigation

### 🚀 Getting Started
- [Installation Guide](./setup/installation.md)
- [Environment Setup](./setup/environment.md)

### 🔧 Development
- [**PasskeyKit Major Update - Jan 23, 2026**](./development/PASSKEY_WALLET_MAJOR_UPDATE_JAN_23_2026.md) ← **CRITICAL DISCOVERY**
- [Latest Issues Status](./development/LATEST_ISSUES_STATUS.md) ← **Current status tracking**
- [Issues Resolved](./development/issues-resolved.md) 
- [Troubleshooting Guide](./development/troubleshooting.md)

### 📚 API Reference
- [Edge Functions](./api/edge-functions.md)
- [Database Schema](./api/database-schema.md)

### 🚢 Deployment
- [Production Guide](./deployment/production.md)
- [Testing Strategy](./deployment/testing.md)

---

## ⚡ Recent Major Discovery (Jan 23, 2026)

### 🔍 PasskeyKit Shared Pool Architecture

**CRITICAL FINDING:** All PasskeyKit wallets share the same underlying Stellar G-address:
`GC2C7AWLS2FMFTQAHW3IBUB4ZXVP4E37XNLEF2IK7IVXBB6CMEPCSXFO`

**Why This Matters:**
- ✅ **Prevents Airdrop Fraud:** Users cannot generate new addresses by deleting/recreating wallets
- ✅ **Simplifies Fund Management:** One account to fund, multiple wallet interfaces
- ✅ **Maintains Security:** TouchID/FaceID still required for each wallet access

### 🛠️ Recent Fixes Completed
- ✅ **Wallet Naming Issues:** Fixed parameter order in wallet creation
- ✅ **TouchID Authentication:** Restored biometric verification for wallet reconnection  
- ✅ **Send Transaction Failures:** Added automatic account creation for non-existent recipients
- ✅ **Loading UX:** Added spinners and feedback during wallet operations

---

## Current Status
- ✅ **Passkey Authentication System** (Major improvements completed)
- ✅ **Account Creation Automation** (New feature)
- ✅ **Shared Architecture Discovery** (Game-changing insight)
- ✅ **Asset Balance Error Handling** 
- ✅ **Database Schema Configuration**
- 🔧 **Balance Display Issues** (Minor fixes needed)
- 🚧 **Rewards System** (In Progress)
- 🚧 **Game Integration** (Next)

**Last Updated:** January 23, 2026  
**Overall Progress:** 85% Complete - Core functionality stable