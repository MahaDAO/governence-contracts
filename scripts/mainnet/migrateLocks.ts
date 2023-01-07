import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { getOutputAddress } from "../utils";

const root = require("./a.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const { provider } = ethers;
  const estimateGasPrice = await provider.getGasPrice();
  console.log(
    `Gas Price: ${ethers.utils.formatUnits(estimateGasPrice, `gwei`)} gwei`
  );

  // Get all the deployed smart contracts.
  const migrator = await ethers.getContractAt(
    "LockMigrator",
    getOutputAddress("LockMigrator", "ethereum")
  );

  const ids = [
    10, 13, 24, 31, 40, 47, 50, 56, 65, 66, 71, 79, 80, 85, 88, 91, 92, 93, 98,
    100, 102, 114, 115, 118, 126, 130, 136, 143, 148, 150, 156, 165, 168, 169,
    171, 175, 176, 178, 184, 188, 190, 191, 197, 199, 202, 203, 204, 205, 206,
    208, 211, 215, 216, 217, 219, 226, 229, 233, 236, 237, 243, 252, 264, 268,
    270, 273, 276, 279, 280, 282, 284, 288, 290, 292, 293, 295, 298, 299, 302,
    304, 306, 308, 310, 311, 312, 313, 314, 318, 320, 321, 322, 325, 326, 327,
    333, 334, 336, 338, 340, 341, 342, 344, 347, 349, 350, 351, 355, 356, 360,
    362, 366, 369, 370, 371, 372, 374, 375, 376, 379, 382, 383, 385, 387, 389,
    391, 392, 393, 395, 396, 398, 400, 401, 402, 403, 404, 405, 407, 409, 411,
    412, 414, 416, 418, 419, 421, 422, 424, 425, 427, 428, 430, 432, 433, 434,
    439, 440, 441, 442, 444, 445, 447, 448, 449, 454, 455, 456, 458, 459, 462,
    463, 464, 465, 466, 467, 469, 471, 472, 474, 475, 476, 477, 479, 481, 482,
    483, 484, 485, 486, 488, 490, 491, 493, 496, 498, 499, 500, 502, 504, 505,
    508, 509, 511, 512, 514, 515, 516, 517, 518, 521, 523, 524, 526, 527, 529,
    531, 532, 534, 536, 537, 538, 539, 542, 544, 548, 551, 557, 558, 560, 561,
    565, 567, 568, 574, 575, 576, 579, 581,
  ];

  const validMahax = [
    // 10, 13, 24, 31, 47, 65, 66, 71, 79, 80, 91, 92, 93, 98, 100, 102, 114, 115,
    // 118, 126, 130, 136, 143, 150, 156, 165, 168, 169, 171, 175, 176, 178, 184,
    // 188, 191, 197, 199, 202, 203, 206, 208, 211, 215, 226, 229, 233, 236, 237,
    // 243, 252, 264, 273, 276, 279, 280, 282, 284, 288, 290, 292, 293, 295, 298,
    // 299, 302, 304, 306, 308, 310, 311, 312, 313, 314, 318, 320, 321, 322, 325,
    // 326, 327, 333, 334, 336, 338, 340, 341, 342, 344, 347, 349, 350, 351, 355,
    // 356, 360, 362, 366, 369, 370, 371, 372, 374, 375, 376, 379, 382, 383, 385,
    // 387, 389, 391, 392, 393, 395, 396, 398, 400, 401, 402, 403, 404, 405, 407,
    // 409, 411, 412, 414, 416, 418, 419, 421, 422, 424, 425, 427, 428, 430, 432,
    // 433, 434, 439, 441, 442, 444, 447, 448, 449, 454, 455, 456, 458, 459, 462,
    // 463, 464, 465, 466, 467, 469, 471, 472, 474, 475, 476, 477, 479, 481, 482,
    // 483, 484, 485, 486, 488, 490, 491, 493, 496, 498, 499, 500, 502, 504, 505,
    // 508, 509, 511, 512, 514, 515, 516, 517, 518, 521, 523, 524, 526, 527, 529,
    // 531, 532, 536, 537, 538, 539, 542, 544, 548, 551, 575, 579, 581,
  ];

  const refundedIds = [
    1, 103, 110, 111, 113, 120, 121, 123, 139, 146, 149, 155, 160, 161, 170,
    172, 173, 174, 179, 18, 192, 193, 196, 2, 209, 212, 218, 222, 223, 224, 225,
    228, 232, 235, 238, 239, 246, 247, 250, 251, 253, 254, 255, 258, 259, 26,
    260, 275, 289, 3, 317, 32, 335, 352, 358, 361, 363, 38, 380, 390, 399, 406,
    408, 415, 423, 429, 43, 453, 478, 494, 510, 52, 525, 530, 533, 552, 555,
    556, 576, 67,
  ];

  const e18 = BigNumber.from(10).pow(18);
  const gwei = BigNumber.from(10).pow(9);

  const ids2 = [
    0, 1, 2, 3, 18, 26, 32, 38, 43, 45, 48, 50, 52, 53, 56, 62, 63, 67, 99, 103,
    110, 111, 113, 120, 121, 123, 124, 135, 139, 146, 147, 148, 149, 151, 155,
    160, 161, 170, 172, 173, 174, 179, 192, 193, 196, 204, 209, 212, 213, 218,
    222, 223, 224, 225, 228, 231, 232, 235, 238, 239, 246, 247, 249, 250, 251,
    253, 254, 255, 258, 259, 260, 268, 270, 271, 272, 275, 289, 317, 335, 343,
    348, 352, 358, 361, 363, 380, 390, 399, 406, 408, 415, 423, 429, 445, 453,
    478, 494,
  ];

  for (let index = 0; index < ids2.length; index++) {
    const id = ids2[index];
    const element = root.leaves.find((l: any) => Number(l.data.id) === id);

    if (element) {
      const amt = BigNumber.from(element.data.amount).div(e18).toNumber();
      const date = new Date(element.data.endDate * 1000);
      const ytd = element.data.endDate * 1000 - Date.now();
      const mahax = amt * (ytd / (365 * 4 * 86400 * 1000));

      // console.log(id, element);
      console.log(id, amt, mahax, date, ytd / 86400000);
    }
  }

  console.log("validMahax", JSON.stringify(ids2));

  // for (let index = 0; index < ids.length; index++) {
  //   const id = ids[index];
  //   const element = root.leaves.find((l: any) => Number(l.data.id) === id);

  //   const amt = BigNumber.from(element.data.amount).div(e18).toNumber();
  //   const date = new Date(element.data.endDate * 1000);
  //   const ytd = element.data.endDate * 1000 - Date.now();
  //   const mahax = amt * (ytd / (365 * 4 * 86400 * 1000));

  //   if (!(await migrator.isTokenIdMigrated(element.data.id))) {
  //     if (mahax > 100) {
  //       console.log(id, amt, mahax, date, ytd / 86400000);
  //       validMahax.push(id);
  //     }
  //   }
  // }
  // console.log("validMahax", JSON.stringify(validMahax));

  // const data = [];

  // for (let index = 0; index < validMahax.length; index++) {
  //   const id = validMahax[index];
  //   const element = root.leaves.find((l: any) => Number(l.data.id) === id);

  //   data.push([
  //     element.data.amount, // uint256 _value,
  //     element.data.endDate, // uint256 _endDate,
  //     element.data.id, // uint256 _tokenId,
  //     element.data.owner, // address _who,
  //     element.data.mahaReward, // uint256 _mahaReward,
  //     element.data.sclpReward, // uint256 _scallopReward,
  //     element.proof, // bytes32[] memory proof
  //   ]);

  //   // console.log(
  //   //   element.data.id,
  //   //   await migrator.estimateGas.migrateLock(
  //   //     element.data.amount, // uint256 _value,
  //   //     element.data.endDate, // uint256 _endDate,
  //   //     element.data.id, // uint256 _tokenId,
  //   //     element.data.owner, // address _who,
  //   //     element.data.mahaReward, // uint256 _mahaReward,
  //   //     element.data.sclpReward, // uint256 _scallopReward,
  //   //     element.proof // bytes32[] memory proof
  //   //   )
  //   // );
  // }

  // const size = 50;
  // let mahaReward = BigNumber.from(0);
  // let sclpReward = BigNumber.from(0);
  // let gasUsed = BigNumber.from(0);

  // const gasPrice = gwei.mul(15);

  // // eslint-disable-next-line no-unreachable-loop
  // for (let i = 4; i < data.length / size; i++) {
  //   const batch = [];

  //   for (let j = size * i; j < size * (i + 1); j++) {
  //     if (j >= data.length) break;
  //     batch.push(data[j]);
  //     // console.log(data[j][2], await migrator.isTokenIdMigrated(data[j][2]));
  //     // batch.push(j);
  //   }

  //   const _value = batch.map((b) => b[0]); //     element.data.amount, // uint256 _value,
  //   const _endDate = batch.map((b) => b[1]); //     element.data.endDate, // uint256 _endDate,
  //   const _tokenId = batch.map((b) => b[2]); //     element.data.id, // uint256 _tokenId,
  //   const _who = batch.map((b) => b[3]); //     element.data.owner, // address _who,
  //   const _mahaReward = batch.map((b) => b[4]); //     element.data.mahaReward, // uint256 _mahaReward,
  //   const _scallopReward = batch.map((b) => b[5]); //     element.data.sclpReward, // uint256 _scallopReward,
  //   const proof = batch.map((b) => b[6]); //     element.proof // bytes32[] memory proof

  //   console.log(`processing batch ${i + 1} with ${batch.length} items`);

  //   mahaReward = mahaReward.add(
  //     _mahaReward.map((d) => BigNumber.from(d)).reduce((p, c) => p.add(c))
  //   );

  //   sclpReward = sclpReward.add(
  //     _scallopReward.map((d) => BigNumber.from(d)).reduce((p, c) => p.add(c))
  //   );

  //   const gasCost = await migrator.estimateGas.migrateLocks(
  //     _value,
  //     _endDate,
  //     _tokenId,
  //     _who,
  //     _mahaReward,
  //     _scallopReward,
  //     proof
  //   );

  //   gasUsed = gasUsed.add(gasCost);

  //   if (gasCost.gt(30000000)) throw new Error("exceeded gas block limit");
  //   console.log("gasLimit", gasCost);

  //   console.log(
  //     "gasCost",
  //     gasCost.mul(gasPrice).mul(100).div(e18).toNumber() / 100,
  //     "eth"
  //   );

  //   const tx = await migrator.migrateLocks(
  //     _value,
  //     _endDate,
  //     _tokenId,
  //     _who,
  //     _mahaReward,
  //     _scallopReward,
  //     proof,
  //     { gasPrice }
  //   );
  //   console.log("tx done", tx.hash);
  //   throw new Error("im done");
  // }

  // console.log("maha", mahaReward.div(e18));
  // console.log("sclp", sclpReward.div(e18));
  // console.log("gasUsed", gasUsed);
  // console.log(
  //   "gasCost",
  //   gasUsed.mul(gwei.mul(15)).mul(100).div(e18).toNumber() / 100,
  //   "eth"
  // );

  // console.log(batches, data.length);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
