from brownie import (
    accounts,
    VotingEscrowWithdrawableV0,
    accounts
)

from .staking_config import (
    repeat
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1

def main():
    deployer = accounts.at(DEPLOYER)

    pool_token = repeat(
        VotingEscrowWithdrawableV0.deploy,
        {"from": deployer, "required_confs": CONFS}
    )

    print("deployed at ", pool_token.address)