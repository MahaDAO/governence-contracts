# Testnet deployment script

from brownie import (
    accounts,
    AdminUpgradeabilityProxy,
    Contract
)


CONFS = 1
ADMIN_ACC = accounts.load('1')
DEPLOYER_ACC = accounts.load('0')

print('Admin Account', ADMIN_ACC)
print('Deployer Account', DEPLOYER_ACC)

def repeat(f, *args, **kwargs):
    """
    Repeat when geth is not broadcasting (unaccounted error)
    """
    
    while True:
        try:
            return f(*args, **kwargs)
        except KeyError:
            continue


def main():
    ADMIN = accounts.at(ADMIN_ACC)
    DEPLOYER = accounts.at(DEPLOYER_ACC)

    proxy = ""
    token = ""
    new_implementation_addr = ""

    escrow_with_proxy = Contract.from_abi(
        "AdminUpgradeabilityProxy", 
        proxy,
        AdminUpgradeabilityProxy.abi
    )
    repeat(
        escrow_with_proxy.upgradeTo,
        new_implementation_addr,
        {"from": ADMIN, "required_confs": CONFS},
    )
    repeat(
        escrow_with_proxy.initialize,
        token,
        "Vote-escrowed MAHA",
        "MAHAX",
        "MAHAX_0.99",
        {"from": DEPLOYER, "required_confs": CONFS}
    )   