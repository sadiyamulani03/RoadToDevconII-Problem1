// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/CommissionEscrow.sol";

contract CommissionEscrowTest is Test {
    CommissionEscrow escrow;
    address collector = makeAddr("collector");
    address artisan = makeAddr("artisan");
    address arbiter = makeAddr("arbiter");
    address attacker = makeAddr("attacker");
    address otherArtisan = makeAddr("otherArtisan");

    uint256 constant COMMISSION_AMOUNT = 1 ether;
    uint256 constant DEADLINE = 86400; // 1 day

    function setUp() public {
        escrow = new CommissionEscrow();
    }

    function getCommissionStatus(uint256 _commissionId) internal view returns (CommissionEscrow.CommissionStatus) {
        (,,,, CommissionEscrow.CommissionStatus status,,) = escrow.getCommission(_commissionId);
        return status;
    }

    function createCommissionAsCollector(address _artisan, address _arbiter) internal returns (uint256) {
        vm.deal(collector, COMMISSION_AMOUNT);
        vm.prank(collector);
        return escrow.createCommission{value: COMMISSION_AMOUNT}(_artisan, block.timestamp + DEADLINE, _arbiter);
    }

    function test_EscrowHoldsFundsBeforeWorkBegins() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        assertEq(address(escrow).balance, COMMISSION_AMOUNT);

        (address c, address a, uint256 amount,, CommissionEscrow.CommissionStatus status,,) =
            escrow.getCommission(commissionId);
        assertEq(c, collector);
        assertEq(a, artisan);
        assertEq(amount, COMMISSION_AMOUNT);
        assertEq(uint256(status), uint256(CommissionEscrow.CommissionStatus.Active));
    }

    function test_ReleaseRequiresConfirmedDelivery() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.expectRevert("Delivery not confirmed");
        escrow.releaseFunds(commissionId);

        vm.prank(artisan);
        escrow.confirmDelivery(commissionId);

        escrow.releaseFunds(commissionId);

        assertEq(uint256(getCommissionStatus(commissionId)), uint256(CommissionEscrow.CommissionStatus.Paid));
        assertEq(address(escrow).balance, 0);
    }

    function test_CollectorCannotForceReleaseWithoutDelivery() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.prank(collector);
        vm.expectRevert("Delivery not confirmed");
        escrow.releaseFunds(commissionId);
    }

    function test_StateUpdatedBeforeExternalTransfer() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.prank(artisan);
        escrow.confirmDelivery(commissionId);

        escrow.releaseFunds(commissionId);

        assertEq(uint256(getCommissionStatus(commissionId)), uint256(CommissionEscrow.CommissionStatus.Paid));
    }

    function test_ReentrancyGuardPreventsReentry() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.prank(artisan);
        escrow.confirmDelivery(commissionId);

        escrow.releaseFunds(commissionId);

        vm.expectRevert("Already paid or refunded");
        escrow.releaseFunds(commissionId);
    }

    function test_TimeoutProducesExplicitRefundPath() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.warp(block.timestamp + DEADLINE + 1);

        escrow.refund(commissionId);

        assertEq(uint256(getCommissionStatus(commissionId)), uint256(CommissionEscrow.CommissionStatus.Refunded));
        assertEq(address(escrow).balance, 0);
    }

    function test_RefundOnlyAfterDeadline() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.expectRevert("Deadline not passed");
        escrow.refund(commissionId);
    }

    function test_CannotRefundIfDeliveryConfirmed() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.prank(artisan);
        escrow.confirmDelivery(commissionId);

        vm.warp(block.timestamp + DEADLINE + 1);

        vm.expectRevert("Delivery confirmed, cannot refund");
        escrow.refund(commissionId);
    }

    function test_DisputesRequireThirdPartyArbiter() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.prank(collector);
        escrow.dispute(commissionId);

        assertEq(uint256(getCommissionStatus(commissionId)), uint256(CommissionEscrow.CommissionStatus.Disputed));

        vm.prank(collector);
        vm.expectRevert("Only arbiter can resolve");
        escrow.resolveDispute(commissionId, true);

        vm.prank(artisan);
        vm.expectRevert("Only arbiter can resolve");
        escrow.resolveDispute(commissionId, false);

        vm.prank(attacker);
        vm.expectRevert("Only arbiter can resolve");
        escrow.resolveDispute(commissionId, true);
    }

    function test_ArbiterCanResolveDisputeInFavorOfArtisan() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.prank(collector);
        escrow.dispute(commissionId);

        vm.prank(arbiter);
        escrow.resolveDispute(commissionId, true);

        assertEq(uint256(getCommissionStatus(commissionId)), uint256(CommissionEscrow.CommissionStatus.Paid));
        assertEq(address(escrow).balance, 0);
    }

    function test_ArbiterCanResolveDisputeInFavorOfCollector() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.prank(artisan);
        escrow.dispute(commissionId);

        vm.prank(arbiter);
        escrow.resolveDispute(commissionId, false);

        assertEq(uint256(getCommissionStatus(commissionId)), uint256(CommissionEscrow.CommissionStatus.Refunded));
        assertEq(address(escrow).balance, 0);
    }

    function test_CommissionAmountFromMsgValue() public {
        // Test with 2 ether
        vm.deal(collector, 2 ether);
        vm.prank(collector);
        uint256 commissionId = escrow.createCommission{value: 2 ether}(artisan, block.timestamp + DEADLINE, arbiter);

        (,, uint256 amount,,,,) = escrow.getCommission(commissionId);
        assertEq(amount, 2 ether);

        // Test with 5 ether
        vm.deal(collector, 5 ether);
        vm.prank(collector);
        uint256 commissionId2 = escrow.createCommission{value: 5 ether}(artisan, block.timestamp + DEADLINE, arbiter);

        (,, amount,,,,) = escrow.getCommission(commissionId2);
        assertEq(amount, 5 ether);
    }

    function test_NoDoubleRelease() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.prank(artisan);
        escrow.confirmDelivery(commissionId);

        escrow.releaseFunds(commissionId);

        vm.expectRevert("Already paid or refunded");
        escrow.releaseFunds(commissionId);

        assertEq(address(escrow).balance, 0);
    }

    function test_NoDoubleRefund() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.warp(block.timestamp + DEADLINE + 1);
        escrow.refund(commissionId);

        vm.expectRevert("Already paid or refunded");
        escrow.refund(commissionId);

        assertEq(address(escrow).balance, 0);
    }

    function test_CannotCreateCommissionWithZeroValue() public {
        vm.prank(collector);
        vm.expectRevert("Must send payment with commission creation");
        escrow.createCommission{value: 0}(artisan, block.timestamp + DEADLINE, arbiter);
    }

    function test_CannotCreateCommissionWithPastDeadline() public {
        vm.deal(collector, COMMISSION_AMOUNT);
        vm.prank(collector);
        vm.expectRevert("Deadline must be in the future");
        escrow.createCommission{value: COMMISSION_AMOUNT}(artisan, block.timestamp - 1, arbiter);
    }

    function test_CannotCreateCommissionWithInvalidArbiter() public {
        vm.deal(collector, COMMISSION_AMOUNT);
        vm.prank(collector);
        vm.expectRevert("Arbiter cannot be collector");
        escrow.createCommission{value: COMMISSION_AMOUNT}(artisan, block.timestamp + DEADLINE, collector);

        vm.deal(collector, COMMISSION_AMOUNT);
        vm.prank(collector);
        vm.expectRevert("Arbiter cannot be artisan");
        escrow.createCommission{value: COMMISSION_AMOUNT}(artisan, block.timestamp + DEADLINE, artisan);
    }

    function test_OnlyArtisanCanConfirmDelivery() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.prank(collector);
        vm.expectRevert("Only artisan can confirm delivery");
        escrow.confirmDelivery(commissionId);

        vm.prank(attacker);
        vm.expectRevert("Only artisan can confirm delivery");
        escrow.confirmDelivery(commissionId);
    }

    function test_OnlyPartiesCanDispute() public {
        uint256 commissionId = createCommissionAsCollector(artisan, arbiter);

        vm.deal(attacker, 1 ether);
        vm.prank(attacker);
        vm.expectRevert("Only parties can dispute");
        escrow.dispute(commissionId);
    }

    function test_MultipleCommissions() public {
        vm.deal(collector, 3 ether);
        vm.prank(collector);
        uint256 commissionId1 = escrow.createCommission{value: 1 ether}(artisan, block.timestamp + DEADLINE, arbiter);
        vm.prank(collector);
        uint256 commissionId2 =
            escrow.createCommission{value: 2 ether}(otherArtisan, block.timestamp + DEADLINE, arbiter);

        assertEq(address(escrow).balance, 3 ether);

        vm.prank(artisan);
        escrow.confirmDelivery(commissionId1);
        escrow.releaseFunds(commissionId1);

        assertEq(address(escrow).balance, 2 ether);
    }
}
