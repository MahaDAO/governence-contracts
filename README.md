MahaDAO Governance Contracts
============================

This repo contains the code for the MahaDAO Governance. This includes

- MAHAX Staking 
- Voting Contracts
- Any Proxies being used
- Boosted Staking Contracts

# Setup Downloads
```
1. pip3 install virtualenv
2. source venv/bin/activate
3. pip install eth-brownie
4. brownie compile  # To download the required solidity/vyper compiler.
```
# Brownie Setup
```
1. brownie accounts new <id>
   https://eth-brownie.readthedocs.io/en/stable/account-management.html

2. (Setting up network) 
   - brownie networks
   https://eth-brownie.readthedocs.io/en/stable/network-management.html
```
# Scripts Info
```
1. deploy_tesnet.py
path :- scripts/deployment/deploy_testnet.py
( This file is testnet deployment script )

2. deploy_mainnet_matic.py
path :- scripts/deployment/deploy_mainnet_matic.py
( This file is mainnet deployment script )

3. deploy_votingescrow.py
path :- scripts/deployment/deploy_votingescrow.py
( This file deploy an seperate instance of voting escrow )

4. update_proxy.py
path :- scripts/deployment/update_proxy.py
( This file updates the proxy contracts )

5. update_fallback.py
path :- scripts/deployment/update_fallback.py
( This file triggers the fallback boolean function )
```

# Commands To Deploy/Run Script
```
1. brownie run ${path} --network ${network_id}
Example :- brownie run scripts/deployment/deploy_testnet.py --network mumbaiMatic 

Note :- the mainnet script needs an review and variables to be set 
path - scripts/deployment/deploy_mainnet_matic.py

DEPLOYER :- This address is admin of votingescrow contract
PROXY_ADMIN :- This address is the admin of proxy implementation
```