# Testnet deployment script

import json

from brownie import (
    accounts,
    accounts,
    AdminUpgradeabilityProxy,
    WithdrawableVotingEscrow,
    Contract
)


USE_STRATEGIES = False  # Needed for the ganache-cli tester which doesn't like middlewares
POA = True

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
ARAGON_AGENT = "0x330f46D965469a3D1D419b426df0f45b06c625ad"
print('Adming is ', ARAGON_AGENT)
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
CONFS = 1


def repeat(f, *args, **kwargs):
    """
    Repeat when geth is not broadcasting (unaccounted error)
    """
    while True:
        try:
            return f(*args, **kwargs)
        except KeyError:
            continue


def save_abi(contract, name):
    with open("./output/abi/%s.json" % name, "w") as f:
        json.dump(contract.abi, f, indent=4)


def save_output(deployment, name):
    with open("./output/%s.json" % name, "w") as f:
        json.dump(deployment, f, indent=4)


def main():
    output_file = {}

    deployer = accounts.at(DEPLOYER)
    admin = accounts.at(ARAGON_AGENT)

    current_proxy = Contract.from_abi(
        "AdminUpgradeabilityProxy", 
        '0x08abe0414b4adc5a73b02c5bebce8f8bd020d5eb', # Note: change everytime for new deployment.
        AdminUpgradeabilityProxy.abi
    )
    
    escrow_without_proxy = repeat(
        WithdrawableVotingEscrow.deploy,
        {"from": deployer, "required_confs": CONFS}
    )

    repeat(
        current_proxy.upgradeTo,
        escrow_without_proxy,
        {"from": admin, "required_confs": CONFS},
    )

    save_output(output_file, 'maticMumbai')
