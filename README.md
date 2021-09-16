<h1 align="center"> governence-contracts </h1>

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
( This file is main deployment script )

2. deploy_votingescrow.py
path :- scripts/deployment/deploy_votingescrow.py
( This file deploy an seperate instance of voting escrow )

3. update_proxy.py
path :- scripts/deployment/update_proxy.py
( This file updates the proxy contracts )

4. update_fallback.py
path :- scripts/deployment/update_fallback.py
( This file triggers the fallback boolean function )
```

# Commands To Deploy/Run Script
```
1. brownie run ${path} --network ${network_id}
Example :- brownie run scripts/deployment/deploy_testnet.py --network mumbaiMatic 
```
