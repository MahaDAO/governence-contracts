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

    escrow_with_proxy = Contract.from_abi('stakeable_escrow_without_proxy', '0x47E6033aA878f00b8e946e5Ea7c40dea2507B7B0', VotingEscrow.abi)
    addrs = ['0xF152dA370FA509f08685Fa37a09BA997E41Fb65b', '0x073502E1d77e98bc4f6c526182bb637B46bf53DF', '0x4165e9DF3244628ED81530F5Ff7f9ae0dDC5A647', '0x53080D8B6a198aF3bb2C74f21A509Af41374e6B1'] + [ZERO_ADDRESS] * 96
    start_times = [1637325632] * 100
    end_times = [1763404200, 1645295400, 1653935400, 1706207400] + [1706207400] * 96
    amounts = [100 * 1e18, 100 * 1e18, 70 * 1e18, 89.333 * 1e18] + [89.333 * 1e18] * 96

    repeat(escrow_with_proxy.update_locked_state, addrs, start_times, end_times, amounts, {"from": deployer, "required_confs": CONFS})
