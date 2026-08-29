// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/console.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CommissionEscrow is ReentrancyGuard, AccessControl {
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");

    enum CommissionStatus {
        Active,
        Delivered,
        Paid,
        Refunded,
        Disputed
    }

    struct Commission {
        address collector;
        address artisan;
        uint256 amount;
        uint256 deadline;
        CommissionStatus status;
        address arbiter;
        bool deliveryConfirmed;
    }

    mapping(uint256 => Commission) public commissions;
    uint256 public commissionCount;

    event CommissionCreated(
        uint256 indexed commissionId,
        address indexed collector,
        address indexed artisan,
        uint256 amount,
        uint256 deadline
    );
    event DeliveryConfirmed(uint256 indexed commissionId, address indexed artisan);
    event CommissionPaid(uint256 indexed commissionId, address indexed artisan, uint256 amount);
    event CommissionRefunded(uint256 indexed commissionId, address indexed collector, uint256 amount);
    event CommissionDisputed(uint256 indexed commissionId, address indexed disputer);
    event CommissionResolved(uint256 indexed commissionId, address indexed resolver, bool artisanWins);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createCommission(address _artisan, uint256 _deadline, address _arbiter)
        external
        payable
        returns (uint256)
    {
        require(msg.value > 0, "Must send payment with commission creation");
        require(_artisan != address(0), "Invalid artisan address");
        require(_arbiter != address(0), "Invalid arbiter address");
        require(_arbiter != msg.sender, "Arbiter cannot be collector");
        require(_arbiter != _artisan, "Arbiter cannot be artisan");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        uint256 commissionId = commissionCount++;

        commissions[commissionId] = Commission({
            collector: msg.sender,
            artisan: _artisan,
            amount: msg.value,
            deadline: _deadline,
            status: CommissionStatus.Active,
            arbiter: _arbiter,
            deliveryConfirmed: false
        });

        _grantRole(ARBITER_ROLE, _arbiter);

        emit CommissionCreated(commissionId, msg.sender, _artisan, msg.value, _deadline);

        return commissionId;
    }

    function confirmDelivery(uint256 _commissionId) external nonReentrant {
        Commission storage commission = commissions[_commissionId];
        require(commission.status == CommissionStatus.Active, "Commission not active");
        require(msg.sender == commission.artisan, "Only artisan can confirm delivery");
        require(!commission.deliveryConfirmed, "Delivery already confirmed");

        commission.deliveryConfirmed = true;
        commission.status = CommissionStatus.Delivered;

        emit DeliveryConfirmed(_commissionId, msg.sender);
    }

    function releaseFunds(uint256 _commissionId) external nonReentrant {
        Commission storage commission = commissions[_commissionId];
        require(
            commission.status != CommissionStatus.Paid && commission.status != CommissionStatus.Refunded,
            "Already paid or refunded"
        );
        require(commission.status == CommissionStatus.Delivered, "Delivery not confirmed");

        commission.status = CommissionStatus.Paid;

        (bool success,) = commission.artisan.call{value: commission.amount}("");
        require(success, "Transfer failed");

        emit CommissionPaid(_commissionId, commission.artisan, commission.amount);
    }

    function refund(uint256 _commissionId) external nonReentrant {
        Commission storage commission = commissions[_commissionId];
        require(
            commission.status != CommissionStatus.Paid && commission.status != CommissionStatus.Refunded,
            "Already paid or refunded"
        );
        require(!commission.deliveryConfirmed, "Delivery confirmed, cannot refund");
        require(commission.status == CommissionStatus.Active, "Commission not active");
        require(block.timestamp >= commission.deadline, "Deadline not passed");

        commission.status = CommissionStatus.Refunded;

        (bool success,) = commission.collector.call{value: commission.amount}("");
        require(success, "Transfer failed");

        emit CommissionRefunded(_commissionId, commission.collector, commission.amount);
    }

    function dispute(uint256 _commissionId) external {
        Commission storage commission = commissions[_commissionId];
        require(
            commission.status == CommissionStatus.Active || commission.status == CommissionStatus.Delivered,
            "Cannot dispute"
        );
        require(msg.sender == commission.collector || msg.sender == commission.artisan, "Only parties can dispute");
        require(commission.status != CommissionStatus.Disputed, "Already disputed");

        commission.status = CommissionStatus.Disputed;

        emit CommissionDisputed(_commissionId, msg.sender);
    }

    function resolveDispute(uint256 _commissionId, bool _artisanWins) external {
        Commission storage commission = commissions[_commissionId];
        require(commission.status == CommissionStatus.Disputed, "Not disputed");
        require(hasRole(ARBITER_ROLE, msg.sender), "Only arbiter can resolve");

        if (_artisanWins) {
            require(commission.status != CommissionStatus.Paid, "Already paid");
            commission.status = CommissionStatus.Paid;
            (bool success,) = commission.artisan.call{value: commission.amount}("");
            require(success, "Transfer failed");
            emit CommissionPaid(_commissionId, commission.artisan, commission.amount);
        } else {
            require(commission.status != CommissionStatus.Refunded, "Already refunded");
            commission.status = CommissionStatus.Refunded;
            (bool success,) = commission.collector.call{value: commission.amount}("");
            require(success, "Transfer failed");
            emit CommissionRefunded(_commissionId, commission.collector, commission.amount);
        }

        emit CommissionResolved(_commissionId, msg.sender, _artisanWins);
    }

    function getCommission(uint256 _commissionId)
        external
        view
        returns (
            address collector,
            address artisan,
            uint256 amount,
            uint256 deadline,
            CommissionStatus status,
            address arbiter,
            bool deliveryConfirmed
        )
    {
        Commission storage c = commissions[_commissionId];
        return (c.collector, c.artisan, c.amount, c.deadline, c.status, c.arbiter, c.deliveryConfirmed);
    }
}
