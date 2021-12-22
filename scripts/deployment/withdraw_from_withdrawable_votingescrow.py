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

    escrow_with_proxy = Contract.from_abi('WithdrawableVotingEscrow', '0xFc528Ab9677eDEbC9f90c9F83888C7d7Ff5a7C62', WithdrawableVotingEscrow.abi)

    repeat(
        escrow_with_proxy.withdraw_locked,
        {"from": deployer, "required_confs": CONFS},
    )
