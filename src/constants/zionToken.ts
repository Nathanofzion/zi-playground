import { activeChainName } from "@/lib/chain";

const zionTokens = [
  {
    "network": "testnet",
    "address": "CBVKFHEWZ5NTNMZD6WLM3CEGGYZJE5FZ7EFLCBL7AGP2UITF6TJQTOIC",
  },
  {
    "network": "mainnet",
    "address": "CDQYFDK5NNBHMOMKKTV26J3XVKEP2O4MIEFDYOBI5XTXFOF2TPRDT6WP",
  }
];

const zionTokenTestnet = {
  name: 'ZIONCOIN',
  code: 'Zi',
  org: 'Zioncoin Foundation',
  domain: 'zioncoin.org.uk',
  icon: 'https://zioncoin.org.uk/wp-content/uploads/2023/12/Zi_Zioncoin_Ticker.png',
  issuer: 'GC7WCSEUVLKJCFP4YWJ4WLSNBIKTBWFHGAIHV2B3CA3ZDI7JRMEXNIVC',
  contract: zionTokens.find(token => token.network == activeChainName)!.address,
  decimals: 7,
}

const zionToken = {
  name: 'ZIONCOIN',
  code: 'Zi',
  org: 'Zioncoin Foundation',
  domain: 'zioncoin.org.uk',
  icon: 'https://zioncoin.org.uk/wp-content/uploads/2023/12/Zi_Zioncoin_Ticker.png',
  issuer: 'GDBNNE67F54PTUZTCTOQYT5CQZFXA2AX6O5DCA5BVR653OP6KCWGG2Z7',
  contract: zionTokens.find(token => token.network == activeChainName)!.address,
  decimals: 7,
}

export default zionToken;
