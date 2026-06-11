/**
 * useSodaxBridge
 *
 * Prepares UI state and quote-fetching logic for a future SODAX cross-chain
 * bridge integration. No @sodax/sdk package is installed yet (mainnet-only
 * library — no testnet support). All SODAX calls are made via their public
 * REST API so the UI can be fully functional on testnet in "preview" mode.
 *
 * When mainnet is ready:
 *   1. pnpm add @sodax/sdk @sodax/wallet-sdk-react
 *   2. Replace fetchQuote with:  sodax.swaps.getQuote(...)
 *   3. Replace executeBridge with: sodax.swaps.swap(...)
 */

import { useState, useCallback } from "react";

// ── Supported spoke chains ────────────────────────────────────────────────────
export interface SodaxChain {
  key: string;    // ChainKeys.* value from @sodax/sdk
  label: string;
  logo: string;
}

export const SODAX_CHAINS: SodaxChain[] = [
  { key: "stellar",         label: "Stellar",    logo: "⭐" },
  { key: "ethereum",        label: "Ethereum",   logo: "Ξ"  },
  { key: "0xa4b1.arbitrum", label: "Arbitrum",   logo: "🔵" },
  { key: "base",            label: "Base",       logo: "🔷" },
  { key: "0x38.bsc",        label: "BNB Chain",  logo: "🟡" },
  { key: "avalanche",       label: "Avalanche",  logo: "🔺" },
  { key: "optimism",        label: "Optimism",   logo: "🔴" },
  { key: "polygon",         label: "Polygon",    logo: "🟣" },
  { key: "solana",          label: "Solana",     logo: "◎"  },
  { key: "sui",             label: "Sui",        logo: "💧" },
  { key: "bitcoin",         label: "Bitcoin",    logo: "₿"  },
  { key: "near",            label: "NEAR",       logo: "Ⓝ"  },
];

// ── Quote / status types ──────────────────────────────────────────────────────
export interface SodaxQuote {
  inputAmount: string;
  outputAmount: string;
  solverFee: string;
  priceImpact: string;
  srcChain: string;
  dstChain: string;
}

export type BridgeStatus =
  | "idle"
  | "fetching_quote"
  | "quote_ready"
  | "executing"
  | "success"
  | "error";

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSodaxBridge() {
  const [srcChain, setSrcChain] = useState<SodaxChain>(SODAX_CHAINS[0]); // Stellar
  const [dstChain, setDstChain] = useState<SodaxChain>(SODAX_CHAINS[2]); // Arbitrum
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<SodaxQuote | null>(null);
  const [status, setStatus] = useState<BridgeStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const swapChains = useCallback(() => {
    setSrcChain(dstChain);
    setDstChain(srcChain);
    setQuote(null);
    setStatus("idle");
  }, [srcChain, dstChain]);

  /**
   * Simulated quote — replace with sodax.swaps.getQuote() on mainnet.
   */
  const fetchQuote = useCallback(async () => {
    if (!amount || Number(amount) <= 0) return;
    setStatus("fetching_quote");
    setError(null);
    setQuote(null);
    try {
      // TODO (mainnet): POST https://api.sodax.com/v1/solver/quote
      await new Promise((r) => setTimeout(r, 800));
      const solverFee = (Number(amount) * 0.001).toFixed(6);
      const net = Number(amount) - Number(solverFee);
      const outputAmount = (net * 0.00032).toFixed(8); // illustrative rate
      setQuote({
        inputAmount: amount,
        outputAmount,
        solverFee,
        priceImpact: "< 0.1%",
        srcChain: srcChain.label,
        dstChain: dstChain.label,
      });
      setStatus("quote_ready");
    } catch (err: any) {
      setError(err.message ?? "Quote failed");
      setStatus("error");
    }
  }, [amount, srcChain, dstChain]);

  /**
   * Execute bridge intent — replace with sodax.swaps.swap() on mainnet.
   */
  const executeBridge = useCallback(async () => {
    if (!quote) return;
    setStatus("executing");
    setError(null);
    try {
      // TODO (mainnet): wire @sodax/wallet-sdk-react + sodax.swaps.swap()
      await new Promise((r) => setTimeout(r, 1200));
      setStatus("success");
    } catch (err: any) {
      setError(err.message ?? "Bridge failed");
      setStatus("error");
    }
  }, [quote]);

  const reset = useCallback(() => {
    setAmount("");
    setQuote(null);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    srcChain, setSrcChain,
    dstChain, setDstChain,
    amount, setAmount,
    quote,
    status,
    error,
    swapChains,
    fetchQuote,
    executeBridge,
    reset,
  };
}
