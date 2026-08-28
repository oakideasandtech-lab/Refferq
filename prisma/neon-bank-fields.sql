-- ============================================================
-- PulseISP Affiliate — Neon (PostgreSQL) migration
-- Add bank payout fields to the affiliates table.
--
-- Run this in the Neon SQL editor (or psql) against the
-- production database, then run `npx prisma generate`.
-- ============================================================

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS bank_name     TEXT,
  ADD COLUMN IF NOT EXISTS account_name  TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT;

-- Existing affiliates: default country to Nigeria and force Bank Transfer
UPDATE affiliates
SET payout_details = payout_details::jsonb
  || '{"country": "Nigeria", "paymentMethod": "Bank Transfer"}'::jsonb
WHERE NOT (payout_details::jsonb ? 'country');

-- Verify:
-- SELECT id, referral_code, bank_name, account_name, account_number,
--        payout_details->>'country' AS country,
--        payout_details->>'paymentMethod' AS payment_method
-- FROM affiliates;
