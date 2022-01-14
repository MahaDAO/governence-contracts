from brownie import (
    accounts,
    MAHAX,
    accounts,
    AdminUpgradeabilityProxy,
    Contract
)

from brownie.network.gas.strategies import GasNowStrategy

from .staking_config import (
    MAHA_ADDRESS,
    PROXY_ADMIN,
    save_abi,
    save_output,
    repeat
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1


def main():
    output_file = {}
    gas_strategy = GasNowStrategy("fast")
    deployer = accounts.at(DEPLOYER)

    output_file["MahaToken"] = {
        "abi": "IERC20",
        "address": MAHA_ADDRESS
    }

    stakeable_escrow_without_proxy = repeat(
        MAHAX.deploy,
        {"from": deployer, "required_confs": CONFS}
    )

    proxy = repeat(
        AdminUpgradeabilityProxy.deploy,
        stakeable_escrow_without_proxy,
        PROXY_ADMIN,
        bytes(),
        {"from": deployer, "required_confs": CONFS}
    )
    escrow_with_proxy = Contract.from_abi(
        'stakeable_escrow_without_proxy', proxy, stakeable_escrow_without_proxy.abi)

    print('Fetching values from Proxy for MAHAX before initializing')
    print('- WEEK = ', escrow_with_proxy.WEEK())
    print('- INCREASE_LOCK_AMOUNT = ', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print()

    save_abi(escrow_with_proxy, "VotingEscrow")
    output_file["MAHAX"] = {
        "abi": "MAHAX",
        "address": escrow_with_proxy.address
    }

    repeat(
        escrow_with_proxy.initialize,
        MAHA_ADDRESS,
        "Locked MAHA",
        "MAHAX",
        "maha_0.99",
        {"from": deployer, "required_confs": CONFS}
    )

    print('Fetching values from Proxy for VotingEscrow after initializing')
    print('- WEEK = ', escrow_with_proxy.WEEK())
    print('- INCREASE_LOCK_AMOUNT = ', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print()

    save_output(output_file, 'StakingVotingEscrow')
