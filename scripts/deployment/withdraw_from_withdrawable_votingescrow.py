# Testnet deployment script

import json

from brownie import (
    accounts,
    Contract,
    WithdrawableVotingEscrow
)


DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
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

    escrow_with_proxy = Contract.from_abi('WithdrawableVotingEscrow', '0x346ed83277744682123CA72bFe54A32C2C75FB9b', WithdrawableVotingEscrow.abi)

    repeat(
        escrow_with_proxy.withdraw_locked,
        {"from": deployer, "required_confs": CONFS},
    )
