The Stellar Testnet Protocol 23 upgrade, which went live on July 17, 2025, introduces significant enhancements to the Stellar network, focusing on smart contract capabilities, performance improvements, and developer experience. Below are the key updates in Protocol 23 and the associated changes to Stellar SDKs, based on available information.Key Updates in Stellar Testnet Protocol 23Protocol 23 introduces eight Core Advancement Proposals (CAPs) to enhance the Stellar network’s functionality, particularly for smart contracts via Soroban, scalability, and developer tools. Here’s a summary of the key updates:Unified Asset Events (CAP-0067):Enables Stellar Core to emit events for all asset movements in the Soroban Token Interface (SEP-0041) format, unifying event streams between classic Stellar operations and Soroban smart contracts.
Removes admin topics from mint, clawback, and set_authorized events, adds fee events, and updates Stellar Asset Contract (SAC) to emit mint/burn events instead of transfer events when the issuer is involved.
Supports multiplexed accounts (M-accounts) for exchange crypto-deposits and prohibits transaction memos for Soroban transfers.
Infrastructure providers (e.g., indexers) may need to reingest historical data to support full event backfilling from the genesis ledger.

Soroban Live State Prioritization (CAP-0062):Separates live and archived state into two databases: “Live State” BucketList (containing all live ledger entries) and “Hot Archive” BucketList (for archived Soroban entries).
Improves performance by prioritizing live state, reducing disk access, and setting the stage for full state archival (CAP-0057, in draft).

Parallel Transaction Execution (CAP-0063):Introduces a new transaction set structure for parallel execution of Soroban smart contract transactions, leveraging multiple CPU cores to improve speed and efficiency.
Adjusts TTL extension and fee refund logic for better resource management.

Reusable Wasm Module Cache (CAP-0065):Implements a persistent cache for WebAssembly (Wasm) modules, keeping them parsed, validated, and translated in memory across ledgers.
Reduces costs for cross-contract calls by eliminating repetitive parsing/validation/translation, with fees tied to contract upload or restore actions.

In-Memory Soroban State (CAP-0066):Moves all live Soroban state to validator memory, eliminating disk reads during contract execution, which boosts throughput and reduces fees.
Introduces automatic restoration of archived entries via InvokeHostFunctionOp, removing the need for manual restoration.
Adds a new resource type for in-memory vs. disk reads, with no read byte limits or fees for live Soroban state (though entry limits apply).

New Soroban Host Functions:CAP-0068: Adds a host function to retrieve the executable (Wasm or built-in) associated with a contract address, enabling use cases like distinguishing SAC instances, enforcing authorization policies, and pinning contract dependencies.

CAP-0069: Introduces host functions for converting between strings and bytes (bytes_to_string, string_to_bytes), simplifying contract development and reducing complexity.

Configurable SCP Timing Parameters (CAP-0070):Adds ledger configuration settings to dynamically adjust Stellar Consensus Protocol (SCP) timings, such as ledger close times and nomination/ballot timeouts.
Enables incremental improvements to block time performance, enhancing scalability and resilience without major protocol upgrades.

Transaction Meta Structure Update:Introduces TransactionMetaV4, replacing TransactionMetaV3, with a new postTxApplyFeeProcessing field to represent fee processing after transaction application.
Affects applications reading raw transaction metadata from Stellar Core, Horizon, Stellar RPC, or Galexie (e.g., dapps, indexers, exchanges, wallets).

Testnet Reset and Breaking Changes:A Testnet reset occurred on August 14, 2025, clearing all ledger entries (accounts, assets, contracts), requiring developers to recreate data.
Older versions of Stellar Core, Horizon, RPC, and SDKs are incompatible post-reset, necessitating upgrades to stable releases.
Stellar RPC rebranded from Soroban RPC, with soroban-rpc packages discontinued.

Key Updates in Stellar SDKs for Protocol 23The Protocol 23 upgrade requires updates to Stellar SDKs to ensure compatibility with the new features and breaking changes. Below are the key SDK updates and considerations:General SDK Upgrade Requirement:All Stellar SDKs (Rust, JavaScript, Go, Java, Python, iOS, PHP, C# .NET, Flutter, Elixir) must be updated to their latest versions by August 14, 2025, for Testnet compatibility and by September 3, 2025, for Mainnet.
Check release notes for specific instructions, as SDKs must support the new TransactionMetaV4 structure and updated APIs.

Specific SDK Versions for Testnet (Protocol 23):Rust SDK: Version 23.0.0-rc.2.2 (soroban-sdk:23.0.0-rc.2.1).
JavaScript Base: Version 14.0.0-rc.2 (NPM: 14.0.0-rc.2).
JavaScript SDK: Version 14.0.0-rc.3 (NPM: 14.0.0-rc.3).
Other SDKs (e.g., Java, Python, Go) have Protocol 23-compatible releases, with links provided in the Protocol 23 Upgrade Guide.

Breaking Changes in SDKs:horizonclient: Removed fields from the Horizon API, including errorResultXdr, num_archived_contracts, and archived_contracts_amount from the /assets response, requiring SDK updates to handle these changes.

js-stellar-sdk: Now requires Node.js version 20 or higher for compatibility.

SDKs must handle the new TransactionMetaV4 structure and updated event formats from CAP-0067, impacting how applications parse transaction metadata.

Stellar CLI Updates:The Soroban CLI has been renamed to Stellar CLI (version 23.0.0).
Key changes include:Support for contract ID alias names during deployment/invocation.
New cache subcommands and transaction data logging.
Updated TypeScript bindings to stellar-sdk 12rc2.
Removal of deprecated commands (lab token, lab xdr, config).
Enhanced ledger signing and container log tailing.

Developer Considerations:Developers must upgrade SDKs to handle breaking changes in Stellar RPC (e.g., removal of getLedgerEntry endpoint, deprecated inSuccessfulContractCall field in getEvents).
Applications interacting with transaction metadata (e.g., dapps, wallets, exchanges) need to adapt to TransactionMetaV4 and unified event formats.
SDK updates ensure compatibility with in-memory state (CAP-0066), parallel execution (CAP-0063), and new host functions (CAP-0068, CAP-0069).

Additional NotesTestnet Reset Impact: The August 14, 2025, reset cleared all Testnet data, requiring developers to recreate accounts, assets, and contracts. SDKs must be updated to work with the new Stellar Core release post-reset.

Mainnet Upgrade: The Mainnet vote for Protocol 23 is scheduled for September 3, 2025, at 1700 UTC. Developers should ensure all SDKs and infrastructure are updated by this date to avoid compatibility issues.

Resources for Developers:Check the Protocol 23 Upgrade Guide for detailed instructions and release links.

Join the Stellar Developer Discord for real-time updates and coordination.

Refer to GitHub for CAP details and XDR changes (e.g., Stellar XDR).

These updates position Stellar as a more robust platform for decentralized applications, with significant implications for projects like Pi Network that rely on Stellar Core. Developers should prioritize upgrading SDKs and testing integrations to leverage Protocol 23’s enhanced capabilities.

