import { ethers, network } from "hardhat";
import { deployOrLoadAndVerify, getOutputAddress, saveABI } from "../../utils";

async function main() {
  console.log(`Deploying LP gauge to ${network.name}`);

  const tokenAddr = "0xdf34bad1d3b16c8f28c9cf95f15001949243a038";
  const tokenA = "ARTH";
  const tokenB = "USDC";

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const registry = await getOutputAddress("Registry");

  const implementation = await deployOrLoadAndVerify(
    `GaugeLP-Impl`,
    "GaugeLP",
    []
  );

  const gaugeProxyAdmin = await getOutputAddress("MAHATimelockController-14d");

  const GaugeLP = await ethers.getContractFactory("GaugeLP");
  const initData = GaugeLP.interface.encodeFunctionData("initialize", [
    registry,
    tokenAddr,
  ]);

  const proxy = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-GaugeLPProxy`,
    "TransparentUpgradeableProxy",
    [implementation.address, gaugeProxyAdmin, initData]
  );

  const bribe = await deployOrLoadAndVerify(
    `${tokenA}${tokenB}-Bribe`,
    "BaseV2Bribes",
    [registry]
  );

  console.log("implementation", implementation.address);
  console.log("proxy", proxy.address);
  console.log("bribe", bribe.address);

  await saveABI(`${tokenA}${tokenB}-LPToken`, "IERC20", tokenAddr);
  await saveABI(`${tokenA}${tokenB}-GaugeLP`, "GaugeLP", proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
