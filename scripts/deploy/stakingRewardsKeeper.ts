import { BigNumber } from "ethers";
import { getOutputAddress, deployOrLoadAndVerify } from "../utils";

async function main() {
  const e18 = BigNumber.from(10).pow(18);

  // Get all the deployed smart contracts.
  const mahaFee = getOutputAddress("MAHAFeeDistributor");
  const sclpFee = getOutputAddress("SCLPFeeDistributor");
  const maha = getOutputAddress("MAHA");
  const sclp = getOutputAddress("SCLP");

  const instance = await deployOrLoadAndVerify(
    "StakingRewardsKeeper",
    "StakingRewardsKeeper",
    [
      [mahaFee, sclpFee], // IFeeDistributor[] memory _distributors,
      [maha, sclp], // IERC20[] memory _tokens,
      [e18.mul(1000), e18.mul(9615)], // uint256[] memory _tokenRates,
      maha, // IERC20 _maha,
      e18.mul(10), // uint256 _mahaRewardPerEpoch
    ]
  );

  console.log(await instance.estimateGas.performUpkeep("0x"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
