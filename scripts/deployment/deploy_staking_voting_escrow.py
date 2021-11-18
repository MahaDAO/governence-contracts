# Testnet deployment script

import json

from brownie import (
    accounts,
    ERC20,
    VotingEscrow,
    accounts,
    BasicStaking,
    AdminUpgradeabilityProxy,
    Contract,
    PoolToken
)


DEPLOYER = accounts.load('0')
print('Deployer is ', DEPLOYER)
ARAGON_AGENT = "0x330f46D965469a3D1D419b426df0f45b06c625ad"
print("Aragon agent is ", ARAGON_AGENT)
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


def save_abi(contract, name):
    with open("./output/abi/%s.json" % name, "w") as f:
        json.dump(contract.abi, f, indent=4)


def save_output(deployment, name):
    with open("./output/%s.json" % name, "w") as f:
        json.dump(deployment, f, indent=4)


def main():
    output_file = {}
    deployer = accounts.at(DEPLOYER)

    token = Contract.from_abi('mahadao_token', '0x81C99a428D64C34EaeEb5E26a55eB5dee32c14b7', ERC20.abi)

    stakeable_escrow_without_proxy = repeat(
        VotingEscrow.deploy,
        {"from": deployer, "required_confs": CONFS}
    )

    proxy = repeat(
        AdminUpgradeabilityProxy.deploy,
        stakeable_escrow_without_proxy,
        ARAGON_AGENT,
        bytes(),
        {"from": deployer, "required_confs": CONFS}
    )
    escrow_with_proxy = Contract.from_abi('stakeable_escrow_without_proxy', proxy, stakeable_escrow_without_proxy.abi)
    
    print('Fetching values from Proxy for VotingEscrow before initializing')
    print('- WEEK = ', escrow_with_proxy.WEEK())
    print('- INCREASE_LOCK_AMOUNT = ', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print()

    save_abi(escrow_with_proxy, "VotingEscrow")
    output_file["VotingEscrow"] = {
        "abi": "VotingEscrow",
        "address": escrow_with_proxy.address
    }

    repeat(
        escrow_with_proxy.initialize,
        token,
        "Vote-escrowed MAHA",
        "MAHAX",
        "maha_0.99",
        {"from": deployer, "required_confs": CONFS}
    )
    repeat(
        escrow_with_proxy.changeController, 
        ARAGON_AGENT, 
        {"from": deployer, "required_confs": CONFS}
    )

    print('Fetching values from Proxy for VotingEscrow before initializing')
    print('- WEEK = ', escrow_with_proxy.WEEK())
    print('- INCREASE_LOCK_AMOUNT = ', escrow_with_proxy.INCREASE_LOCK_AMOUNT())
    print()

    arth = repeat(
        ERC20.deploy, 
        "ARTHStablecoin", 
        "ARTH", 
        18, 
        1303030303,
        {"from": deployer, "required_confs": CONFS}
    )

    usdc = repeat(
        ERC20.deploy, 
        "USDC Coin", 
        "USDC", 
        6, 
        1303030303,
        {"from": deployer, "required_confs": CONFS}
    )

    sclp = repeat(
        ERC20.deploy, 
        "ScallopX", 
        "SCLP", 
        18, 
        1303030303,
        {"from": deployer, "required_confs": CONFS}
    )

    pool_token = repeat(
        PoolToken.deploy,
        "PoolToken",
        "PLTKN",
        [token, arth, usdc, sclp],
        deployer,
        deployer,
        {"from": deployer, "required_confs": CONFS}
    )
    output_file["ARTH"] = {
        "abi": "IERC20",
        "address": arth.address
    }
    output_file["USDC"] = {
        "abi": "IERC20",
        "address": usdc.address
    }
    output_file["SCLP"] = {
        "abi": "IERC20",
        "address": sclp.address
    }
    output_file["PoolToken"] = {
        "abi": "IERC20",
        "address": pool_token.address
    }

    repeat(token.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    repeat(arth.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    repeat(sclp.transfer, pool_token, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    repeat(usdc.transfer, pool_token, 10000 * 1e6, {"from": deployer, "required_confs": CONFS})

    basic_staking = repeat(
        BasicStaking.deploy,
        deployer,
        pool_token,
        escrow_with_proxy,
        24 * 60 * 60,  # 1 Day.
        {"from": deployer, "required_confs": CONFS}
    )

    repeat(pool_token.transfer, basic_staking, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    repeat(basic_staking.notifyRewardAmount, 10000 * 1e18, {"from": deployer, "required_confs": CONFS})
    
    repeat(escrow_with_proxy.set_staking_contract, basic_staking, {"from": deployer, "required_confs": CONFS})
    
    repeat(
        basic_staking.initializeDefault,
        {"from": deployer, "required_confs": CONFS}
    )

    save_abi(basic_staking, "BasicStaking")
    output_file["MAHAXBasicStaking"] = {
        "abi": "BasicStaking",
        "address": basic_staking.address
    }

    save_output(output_file, 'maticMumbai')
