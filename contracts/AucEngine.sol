// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract AucEngine {
    address public owner;
    uint constant DURATION = 2 days;
    uint constant FEE = 10;

    struct Auction {
        address payable seller;
        uint startingPrice;
        uint finalPrice;
        uint startAt;
        uint endsAt;
        uint discountRate;
        string item;
        bool stopped;
    }

    event AuctionCreated(uint id, string itemName, uint startingPrice, uint duration);
    event AuctionEnded(uint id, uint finalPrice, address winner);

    Auction[] public auctions;
    constructor() {
        owner = msg.sender;
    }

    function createAuction(uint _startingPrice, uint _discountRate, string calldata _item, uint _duration) external {
        uint duration = _duration == 0 ? DURATION : _duration;

        require(_startingPrice >= _discountRate * duration, "incorrect starting price");

        Auction memory newAuction = Auction({
            seller: payable(msg.sender),
            startingPrice: _startingPrice,
            finalPrice: _startingPrice,
            discountRate: _discountRate,
            item: _item,
            startAt: block.timestamp,
            endsAt: block.timestamp + duration,
            stopped: false
        });

        auctions.push(newAuction);

        emit AuctionCreated(auctions.length - 1, _item, _startingPrice, duration);
    }

    function getPrice(uint index) public view returns(uint){
        Auction storage cAuction = auctions[index];
        require(!cAuction.stopped, "stopped!");

        uint elapsed = block.timestamp - auctions[index].startAt;
        uint discount = cAuction.startingPrice - (cAuction.discountRate * elapsed);
        return discount;
    }

    function buy(uint index) public payable {
        Auction storage cAuction = auctions[index];
        require(!cAuction.stopped, "stopped!");
        require(block.timestamp < cAuction.endsAt, "ended!");

        
        uint price = getPrice(index);
        require(msg.value >= price, "not enougth funds!");
        cAuction.stopped = true;
        uint refund = msg.value - price;
        if (refund > 0){
            payable(msg.sender).transfer(refund);
        }

        uint ownerComission = (price * FEE) / 100;

        cAuction.seller.transfer(price - ownerComission);

        emit AuctionEnded(index, price, msg.sender);
    }
}