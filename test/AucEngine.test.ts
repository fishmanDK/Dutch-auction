import { ethers, expect, loadFixture } from "./setup";

describe("AucEngine", function () {
  async function deploy() {
    const [owner, seller, buyer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AucEngine", owner);
    const payments = await Factory.deploy();
    await payments.waitForDeployment();

    return { owner, seller, buyer, payments };
  }

  it("sets owner", async function () {
    const { owner, seller, buyer, payments } = await loadFixture(deploy);
    expect(await payments.owner()).to.eq(owner.address);
  });

  async function getTimeStamp(bn: number) {
    const block = await ethers.provider.getBlock(bn);
    return block?.timestamp;
  }

  describe("createAuction", function () {
    it("creates auction correctly", async function () {
      const { owner, seller, buyer, payments } = await loadFixture(deploy);
      const startingPrice = ethers.parseEther("0.0001");
      const discountRate = 1;
      const item = "macbook 2013";
      const duration = 60;

      const tx = await payments.createAuction(
        startingPrice,
        discountRate,
        item,
        duration
      );
      const cAuction = await payments.auctions(0);
      expect(cAuction.item).to.eq(item);

      const currentBlock = await ethers.provider.getBlock(
        await ethers.provider.getBlockNumber()
      );

      const ts = <number>currentBlock?.timestamp;
      expect(cAuction.endsAt).to.eq(ts + duration);
    });
  });

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  describe("buy", function () {
    it("allows to buy", async function () {
      const { owner, seller, buyer, payments } = await loadFixture(deploy);
      const startingPrice = ethers.parseEther("0.0001");
      const discountRate = 1;
      const item = "macbook 2013";
      const duration = 60;

      const tx = await payments
        .connect(seller)
        .createAuction(startingPrice, discountRate, item, duration);

      const seconds = 5;
      this.timeout(seconds * 1000);
      delay(1000);

      const buyTx = await payments
        .connect(buyer)
        .buy(0, { value: ethers.parseEther("0.0001") });
      const cAuction = await payments.auctions(0);
      const finalPrice = cAuction.finalPrice;
      const sellerPrice =
        Number(finalPrice) - Math.floor((Number(finalPrice) * 10) / 100);
      await expect(() => buyTx).to.changeEtherBalance(seller, sellerPrice);
      await expect(
        describe("buy", function () {
          it("allows to buy", async function () {
            const { owner, seller, buyer, payments } = await loadFixture(
              deploy
            );
            const startingPrice = ethers.parseEther("0.0001");
            const discountRate = 1;
            const item = "macbook 2013";
            const duration = 60;

            const tx = await payments
              .connect(seller)
              .createAuction(startingPrice, discountRate, item, duration);

            const seconds = 5;
            this.timeout(seconds * 1000);
            delay(1000);

            const buyTx = await payments
              .connect(buyer)
              .buy(0, { value: ethers.parseEther("0.0001") });
            const cAuction = await payments.auctions(0);
            const finalPrice = cAuction.finalPrice;
            const sellerPrice =
              Number(finalPrice) - Math.floor((Number(finalPrice) * 10) / 100);
            await expect(() => buyTx).to.changeEtherBalance(
              seller,
              sellerPrice
            );

            await expect(
              payments
                .connect(buyer)
                .buy(0, { value: ethers.parseEther("0.0001") })
            ).to.be.revertedWith("stopped!");
          });
        })
      );
    });
  });
});
