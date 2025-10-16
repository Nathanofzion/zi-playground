// Client-side service with NO Stellar SDK imports

class StellarService {
  private baseUrl = '/api';

  async fundAccount(publicKey: string, amount?: number) {
    const response = await fetch(`${this.baseUrl}/fund-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey, amount })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Account funding failed');
    }

    return response.json();
  }

  async requestAirdrop(address: string, action: number = 1) {
    const response = await fetch(`${this.baseUrl}/airdrop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, action })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Airdrop failed');
    }

    return response.json();
  }

  async sendTransaction(xdr: string) {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xdr })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Transaction failed');
    }

    return response.json();
  }

  isValidPublicKey(publicKey: string): boolean {
    return /^G[A-Z2-7]{55}$/.test(publicKey);
  }

  formatAddress(address: string): string {
    if (!address || address.length < 8) return address;
    return `${address.substring(0, 6)}...${address.substring(-4)}`;
  }
}

export const stellarService = new StellarService();