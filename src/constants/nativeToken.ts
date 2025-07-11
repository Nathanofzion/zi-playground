import { activeChainName } from "@/lib/chain";

const nativeTokens = [
  {
    "network": "standalone",
    "address": "CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4",
  },
  {
    "network": "futurenet",
    "address": "CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT",
  },
  {
    "network": "testnet",
    "address": "CAMXFBBFDQVXZA5X3OM2RITCSPXGTU7S2OGFBQUNT6N62CYBEQY5PL5S",
  },
  {
    "network": "mainnet",
    "address": "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
  }
];

const nativeToken = {
  name: 'Lumens',
  code: 'XLM',
  org: 'Stellar',
  domain: 'stellar.org',
  icon: 'https://static.lobstr.co/media/XLM-None.png',
  issuer: 'GDMTVHLWJTHSUDMZVVMXXH6VJHA2ZV3HNG5LYNAZ6RTWB7GISM6PGTUV',
  contract: nativeTokens.find(token => token.network == activeChainName)!.address,
  decimals: 7,
}

export default nativeToken;
