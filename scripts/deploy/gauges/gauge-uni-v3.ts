import { ethers, network } from "hardhat";
import { saveABI, deployOrLoadAndVerify, getOutputAddress } from "../../utils";

async function main() {
  console.log(`Deploying governance to ${network.name}`);

  const uniPositionManager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const tokenA = "ARTH";
  const tokenB = "WETH";
  const fee = 10000;
  const registry = await getOutputAddress("Registry");
  const feeSplitter = "0x9032f1bd0cc645fde1b41941990da85f265a7623";

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  // Get all the deployed smart contracts.
  const tokens = await Promise.all([
    getOutputAddress(tokenA),
    getOutputAddress(tokenB),
  ]);

  const gaugeProxyAdmin = "0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC"; // await getOutputAddress("MAHATimelockController-14d");

  const BaseGaugeV3UniV3 = await ethers.getContractFactory("GaugeUniswapV3");
  const initData = BaseGaugeV3UniV3.interface.encodeFunctionData("initialize", [
    registry,
    tokens[0], // address token0,
    tokens[1], // address token1,
    fee, // uint24 fee,
    uniPositionManager, // INonfungiblePositionManager _nonfungiblePositionManager,
    feeSplitter, // treasury
    "0x77cd66d59ac48a0E7CE54fF16D9235a5fffF335E", // migrator
  ]);

  const implementation = await deployOrLoadAndVerify(
    `GaugeUniswapV3-Impl`,
    "GaugeUniswapV3",
    []
  );

  const proxy = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-UniV3GaugeProxy`,
    "TransparentUpgradeableProxy",
    [implementation.address, gaugeProxyAdmin, initData]
  );

  const instance = await ethers.getContractAt("GaugeUniswapV3", proxy.address);

  const bribesInstance = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-Bribe`,
    "BaseV2Bribes",
    [registry]
  );

  console.log("univ3GaugeContractImpl", implementation.address);
  console.log("univ3GaugeContractProxy", proxy.address);
  console.log("bribesInstance", bribesInstance.address);

  await saveABI(
    `${tokenA}${tokenB}-UniV3-Pool`,
    "IUniswapV3Pool",
    await instance.pool()
  );

  await saveABI(
    `${tokenA}${tokenB}-GaugeUniswapV3`,
    "GaugeUniswapV3",
    proxy.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
