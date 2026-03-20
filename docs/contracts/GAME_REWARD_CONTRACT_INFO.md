# Game Reward Contract - Deployment Documentation

## Contract Overview

The Game Reward Contract is a smart contract deployed on the Stellar blockchain that manages reward distribution for gaming applications.  
This contract allows administrators to configure different game types with specific reward amounts and automatically distribute tokens to players upon completion of games.

## How the Contract Works

The contract operates through three main functions:

### **Initialize**
Sets up the contract with an administrator account and links it to a specific token (ZITOKEN).  
This can only be done once to ensure security.

### **Add Game Type**
The administrator can define different games (identified by Game ID) and set how many tokens each game rewards.  
For example, Game 1 might reward 5 tokens, while Game 2 rewards 10 tokens.

### **Distribute Reward**
When a player completes a game, the administrator triggers this function to send the predefined reward amount to the player's account.  
The contract automatically transfers the tokens and publishes an event for tracking.

---

## Contract Information

## Deployment Steps

### **Step 1: Deploy the Contract**
The contract was compiled and deployed to the Stellar Testnet using the optimized WASM file.

**Transaction Hash:**  
`24827d1dff98a2706428d6cb80b458e868aea72a5acb9887d2b78f137c39e191`

---

### **Step 2: Initialize the Contract**
The contract was initialized with the administrator account and linked to the ZITOKEN contract.

**Transaction Hash:**  
`e8d2fe611ac7e1b5e28ed64e3f2e81e0bf242c6d8df3eed513a8866aa69b3a80`

---

### **Step 3: Configure Game Types**
Three game types were configured, each with a reward of **5 ZITOKEN**.

---

### **Step 4: Fund the Contract**
The contract was funded with ZITOKEN to enable reward distribution:

**Total Funded:** `100,100 ZITOKEN`

---

### **Step 5: Setup User Accounts**
Before users can receive ZITOKEN rewards, they need to establish a trustline with the token.  
Two accounts were configured.

---

### **Step 6: Distribute Rewards**
Two test rewards were distributed to verify the contract functionality.

---

## Deployment Summary

## Conclusion

The Game Reward Contract has been successfully deployed and tested on the Stellar Testnet.  
The contract is fully functional and ready to distribute rewards to players.  
All transactions have been verified on the blockchain and the contract maintains a sufficient balance to support ongoing reward distributions.
