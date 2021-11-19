# Testnet deployment script

import json

from brownie import (
    VotingEscrow,
    accounts,
    Contract
)


DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
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

    escrow_with_proxy = Contract.from_abi('stakeable_escrow_without_proxy', '0x5A3edC7a55aF767938BA6c6E2Aa4466A5081f918', VotingEscrow.abi)
    addrs = ['0x073502E1d77e98bc4f6c526182bb637B46bf53DF'] + [ZERO_ADDRESS] * 99
    start_times = [1637310377] * 100
    end_times = [1637317584] * 100
    amounts = [190 * 1e18] * 100

    repeat(escrow_with_proxy.checkpoint, addrs, start_times, end_times, amounts, {"from": deployer, "required_confs": CONFS})
