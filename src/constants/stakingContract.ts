import { activeChainName } from "@/lib/chain";

/**
 * Zi LP Staking contract addresses by network.
 *
 * To get the address after deployment, run:
 *   ./docs/contracts/code/zi_lp_staking/deploy.sh
 * and paste the printed CONTRACT_ID below.
 */
const stakingContracts: Record<string, string> = {
  // ⚠️ Replace with deployed contract address after running deploy.sh
  testnet: process.env.NEXT_PUBLIC_STAKING_CONTRACT_TESTNET ?? "",
  mainnet: process.env.NEXT_PUBLIC_STAKING_CONTRACT_MAINNET ?? "",
};

/**
 * Soroswap Zi/XLM LP token contract addresses by network.
 * Obtain from: https://app.soroswap.finance or the Soroswap API.
 */
const lpTokenContracts: Record<string, string> = {
  testnet: process.env.NEXT_PUBLIC_ZI_XLM_LP_TESTNET ?? "",
  mainnet: process.env.NEXT_PUBLIC_ZI_XLM_LP_MAINNET ?? "",
};

const stakingContract = {
  /** The deployed staking contract address for the active network */
  address: stakingContracts[activeChainName] ?? "",
  /** The Zi/XLM LP token contract address for the active network */
  lpToken: lpTokenContracts[activeChainName] ?? "",
  /** APR in percent (informational — enforced by reward pool funding) */
  aprPercent: 10,
  /**
   * Lock period label.
   * On testnet the contract is compiled with `testnet-time` feature (12 hours).
   * On mainnet it is a full year.
   */
  lockLabel:
    activeChainName === "mainnet" ? "1 year" : "12 hours (testnet demo)",
  lockSeconds: activeChainName === "mainnet" ? 365 * 24 * 3600 : 12 * 3600,
};

export default stakingContract;
