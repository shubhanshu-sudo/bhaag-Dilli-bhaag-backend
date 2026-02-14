const Coupon = require('../models/Coupon');
const { getRacePrice, isValidRaceCategory } = require('../config/raceConfig');

/**
 * @desc    Validate coupon code for checkout
 * @route   POST /api/coupons/validate
 * @access  Public
 */
const validateCoupon = async (req, res) => {
    try {
        const { couponCode, baseAmount, raceCategory } = req.body;

        if (!couponCode) {
            return res.status(200).json({
                valid: false,
                message: 'Coupon code is required'
            });
        }

        // Determine the correct base amount using backend config (Source of Truth)
        let finalBaseAmount;

        if (raceCategory && isValidRaceCategory(raceCategory)) {
            // Use backend config if race category is provided
            finalBaseAmount = getRacePrice(raceCategory);
        } else if (baseAmount) {
            // If only amount is provided, verify it's a known valid registration fee
            const validPrices = [499, 699, 1199];
            if (!validPrices.includes(Number(baseAmount))) {
                return res.status(200).json({
                    valid: false,
                    message: 'Invalid base amount provided'
                });
            }
            finalBaseAmount = Number(baseAmount);
        } else {
            return res.status(200).json({
                valid: false,
                message: 'Race category or valid base amount is required'
            });
        }

        // Find the coupon
        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase().trim()
        });

        // Validation Rules
        if (!coupon) {
            return res.status(200).json({
                valid: false,
                message: 'Invalid coupon code'
            });
        }

        if (!coupon.isActive) {
            return res.status(200).json({
                valid: false,
                message: 'This coupon is no longer active'
            });
        }

        // Check expiration
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return res.status(200).json({
                valid: false,
                message: 'This coupon has expired'
            });
        }

        // Check usage limits
        if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
            return res.status(200).json({
                valid: false,
                message: 'This coupon has reached its maximum usage limit'
            });
        }

        // Discount Logic (as per requirements)
        const { getPaymentBreakdown } = require('../config/raceConfig');
        const breakdown = getPaymentBreakdown(raceCategory || '10KM'); // Fallback if raceCategory not available

        const discountValue = coupon.discountValue;
        const discountAmount = Math.floor(finalBaseAmount * (discountValue / 100)); // Rounding down to nearest rupee
        const discountedAmount = Math.max(0, finalBaseAmount - discountAmount);

        // Gateway charges remain unchanged (not discounted)
        const gatewayCharges = breakdown.gatewayFee;
        const finalPayableAmount = Math.round(discountedAmount + gatewayCharges);

        return res.status(200).json({
            valid: true,
            message: 'Coupon applied successfully',
            paymentSummary: {
                baseAmount: finalBaseAmount,
                discountAmount: discountAmount,
                discountedAmount: discountedAmount,
                gatewayCharges: gatewayCharges,
                finalPayableAmount: finalPayableAmount,
                couponCode: coupon.code,
                discountPercent: discountValue
            }
        });

    } catch (error) {
        console.error('Validate Coupon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate coupon'
        });
    }
};

module.exports = {
    validateCoupon
};
