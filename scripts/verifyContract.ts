import { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function verifyContract(
  hre: HardhatRuntimeEnvironment,
  address: string,
  constructorArguments: any[]
) {
  await hre.run("verify:verify", {
    address,
    constructorArguments,
  });
}
