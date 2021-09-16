import json

from brownie import (
    accounts,
    VotingEscrow,
    accounts,
    AdminUpgradeabilityProxy,
    Contract
)

CONFS = 1
MAHA_TOKEN_ADDR = ""  # TODO: fill in this address as per the network.
DEPLOYER = accounts.load('0')  # This will be the admin for the state variables of voting escrow.
PROXY_ADMIN = ""  # NOTE:- Please change this address. This will be the admin for proxy contract. This cannot call the fallback/delegate function via proxy.

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
    print('DEPLOYER IS: ', DEPLOYER)

    output_file = {}
    deployer_account = accounts.at(DEPLOYER)

    output_file["MahaToken"] = {
        "abi": "IERC20",
        "address": MAHA_TOKEN_ADDR
    }

    escrow_without_proxy = repeat(
        VotingEscrow.deploy,
        {"from": deployer_account, "required_confs": CONFS}
    )
    
    proxy = repeat(
        AdminUpgradeabilityProxy.deploy,
        escrow_without_proxy,
        PROXY_ADMIN,
        bytes(),
        {"from": deployer_account, "required_confs": CONFS}
    )
    escrow_with_proxy = Contract.from_abi('VotingEscrow', proxy, VotingEscrow.abi)
    
    print('WEEK', escrow_with_proxy.WEEK())
    print('INCREASE_LOCK_AMOUNT', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print('SUPPLY', escrow_with_proxy.supply())

    save_abi(escrow_with_proxy, "VotingEscrow")
    output_file["VotingEscrow"] = {
        "abi": "VotingEscrow",
        "address": escrow_with_proxy.address
    }

    repeat(
        escrow_with_proxy.initialize,
        MAHA_TOKEN_ADDR,
        "Vote-escrowed MAHA",
        "MAHAX",
        "mahax_0.99",
        {"from": deployer_account, "required_confs": CONFS}
    )
    repeat(
        escrow_with_proxy.changeController, 
        PROXY_ADMIN, 
        {"from": deployer_account, "required_confs": CONFS}
    )

    print('WEEK', escrow_with_proxy.WEEK())
    print('INCREASE_LOCK_AMOUNT', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print('SUPPLY', escrow_with_proxy.supply())

    save_output(output_file, 'maticMumbai')