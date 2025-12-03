#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, panic_with_error
};


#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum RewardError {
    AlreadyInitialized = 1,
    NotAdmin = 2,
    GameNotFound = 3,
}


#[contracttype]
pub enum DataKey {
    Admin,
    TokenID, 
    GameReward(u32), 
}

#[contract]
pub struct GameRewardContract;

#[contractimpl]
impl GameRewardContract {
    pub fn initialize(env: Env, admin: Address, token_id: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, RewardError::AlreadyInitialized);
        }
        
        admin.require_auth(); 
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenID, &token_id);
    }

    
    pub fn add_game_type(env: Env, game_id: u32, reward_amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.storage().persistent().set(&DataKey::GameReward(game_id), &reward_amount);
    }

    pub fn distribute_reward(env: Env, to: Address, game_id: u32) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth(); 

        let reward_key = DataKey::GameReward(game_id);
        if !env.storage().persistent().has(&reward_key) {
             panic_with_error!(&env, RewardError::GameNotFound);
        }
        
        let amount: i128 = env.storage().persistent().get(&reward_key).unwrap();

        let token_id: Address = env.storage().instance().get(&DataKey::TokenID).unwrap();
        let token_client = token::Client::new(&env, &token_id);
        let contract_address = env.current_contract_address();

        token_client.transfer(&contract_address, &to, &amount);
        
        env.events().publish(
            (game_id, "reward_distributed"), 
            to
        );
    }

    /// Withdraw tokens from the contract (admin only)
    /// This allows recovery of stuck tokens
    pub fn withdraw(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        let token_id: Address = env.storage().instance().get(&DataKey::TokenID).unwrap();
        let token_client = token::Client::new(&env, &token_id);
        let contract_address = env.current_contract_address();
        
        token_client.transfer(&contract_address, &to, &amount);
        
        env.events().publish(
            ("withdraw",), 
            (to.clone(), amount)
        );
    }

    /// Upgrade the contract to a new WASM hash (admin only)
    pub fn upgrade(env: Env, new_wasm_hash: soroban_sdk::BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }
}