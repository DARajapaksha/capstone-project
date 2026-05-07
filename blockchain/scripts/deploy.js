const hre = require("hardhat");

async function main() {
  console.log("Deploying IdentityVerification contract...");

  const IdentityVerification = await hre.ethers.getContractFactory("IdentityVerification");
  const identityVerification = await IdentityVerification.deploy();

  await identityVerification.waitForDeployment();

  const contractAddress = await identityVerification.getAddress();
  console.log(`IdentityVerification deployed to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});