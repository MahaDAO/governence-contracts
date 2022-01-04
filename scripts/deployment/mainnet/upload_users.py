from math import ceil
from brownie import (
    accounts,
    VotingEscrowV1,
    accounts,
    Contract
)

from .staking_config import (
    DEPLOYED_VOTING_ESCROW,
    repeat
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
CONFS = 1



def main():
    deployer = accounts.at(DEPLOYER)
    voting_escrow = Contract.from_abi("VotingEscrowV1", DEPLOYED_VOTING_ESCROW, VotingEscrowV1.abi)

    f = open("output/snapshot.csv")
    file_content = f.read().splitlines()

    parsed_files = [l.split(',') for l in file_content]

    addrs = [l[0] for l in parsed_files]
    amounts = [l[1] for l in parsed_files]
    end_times = [int(l[2]) for l in parsed_files]

    end_times_final = []
    tomorrow = 1640649600

    for l in end_times:
        if (l < tomorrow): end_times_final += [tomorrow]
        else: end_times_final += [l]

    batch_size = 30

    loops = ceil(len(addrs) / batch_size)
    for i in range(loops):
        start_i = i * batch_size
        end_i = (i + 1) * batch_size

        batch_end_times = [str(t) for t in end_times_final[start_i : end_i]]
        batch_amounts = amounts[start_i : end_i]
        batch_addrs = addrs[start_i : end_i]

        print(voting_escrow.staking_contract())
        # print(batch_addrs, batch_end_times, batch_amounts)
        repeat(
            voting_escrow.manual_add_users,
            batch_addrs, batch_end_times, batch_amounts,
            {"from": deployer, "required_confs": CONFS, "gas_limit": 20000000, "allow_revert": True},
            # gas_limit=20000000, gas_price=0, allow_revert=True
        )
        exit(-1)