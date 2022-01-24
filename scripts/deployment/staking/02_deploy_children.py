


# A sample file to help deployment of contracts

from brownie import (
    StakingChild,
    accounts
)

from .staking_config import (
    MAHA_ADDRESS,
    SCLP_ADDRESS,
    ARTH_ADDRESS,
    USDC_ADDRESS,

    GNOSIS_SAFE,
    STAKING_DURATION,
    save_abi,
    save_output
)

DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
CONFS = 1


def main():
    output_file = {}
    deployer = accounts.at(DEPLOYER)

    stakingMaster = "0x62d0E4A9c675DC9B88f544aAff42F59964e8731C"
    stakingCollector = "0x41Ef0505EBaa70eC10F7b8EE8965E269a50cE3eE"

    rewardTokens = [
        ["MAHA", MAHA_ADDRESS],
        ["SCLP", SCLP_ADDRESS],
        ["ARTH", ARTH_ADDRESS],
        ["USDC", USDC_ADDRESS],
    ]

    for rewardToken in rewardTokens:
        stakingChild = StakingChild.deploy(
            rewardToken[1],
            stakingMaster,
            stakingCollector,
            STAKING_DURATION,
            {"from": deployer, "required_confs": CONFS},
            publish_source=True
        )

        print(rewardToken[0], "staking child at", stakingChild.address)
        save_abi(stakingChild, "StakingChild")

        output_file[rewardToken[0] + "StakingChild"] = {
            "abi": "StakingChild",
            "address": stakingChild.address
        }

    save_output(output_file, "staking_02")
