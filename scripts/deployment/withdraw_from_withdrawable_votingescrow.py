# Testnet deployment script

import json

from brownie import (
    accounts,
    Contract,
    WithdrawableVotingEscrow
)


USE_STRATEGIES = False  # Needed for the ganache-cli tester which doesn't like middlewares
POA = True

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
ARAGON_AGENT = accounts.load('2')
print('Admin is ', ARAGON_AGENT)
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


def main():
    deployer = accounts.at(DEPLOYER)
    admin = accounts.at(ARAGON_AGENT)

    escrow_with_proxy = Contract.from_abi('WithdrawableVotingEscrow', '0x346ed83277744682123CA72bFe54A32C2C75FB9b', WithdrawableVotingEscrow.abi)

    repeat(
        escrow_with_proxy.withdraw_locked,
        {"from": admin, "required_confs": CONFS},
    )
