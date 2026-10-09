-- Cross-business composite foreign keys are generated from schema.prisma.
-- Additional financial checks are maintained in SQL.
ALTER TABLE "Activity" ADD CONSTRAINT "activity_money_positive" CHECK (amount > 0);
ALTER TABLE "Activity" ADD CONSTRAINT "activity_kind" CHECK (type IN ('SALE','EXPENSE','INVENTORY'));
ALTER TABLE "Settlement" ADD CONSTRAINT "settlement_money_positive" CHECK (amount > 0);
ALTER TABLE "Settlement" ADD CONSTRAINT "settlement_direction" CHECK (direction IN ('IN','OUT'));
ALTER TABLE "Allocation" ADD CONSTRAINT "allocation_money_positive" CHECK (amount > 0);
ALTER TABLE "ImportedPayment" ADD CONSTRAINT "import_money_positive" CHECK (amount > 0);
ALTER TABLE "ImportedPayment" ADD CONSTRAINT "import_direction" CHECK (direction IN ('IN','OUT'));
ALTER TABLE "Match" ADD CONSTRAINT "match_money_positive" CHECK (amount > 0);
ALTER TABLE "Match" ADD CONSTRAINT "match_method" CHECK (method IN ('corroborate','settle'));
ALTER TABLE "Draft" ADD CONSTRAINT "draft_version_positive" CHECK (version > 0);
ALTER TABLE "Draft" ADD CONSTRAINT "draft_state" CHECK (state IN ('draft','needs_clarification','ready_for_confirmation','confirmed','cancelled','failed'));
ALTER TABLE "Business" ADD CONSTRAINT "business_mode" CHECK (mode IN ('real','demo'));
ALTER TABLE "ImportBatch" ADD CONSTRAINT "import_state" CHECK (state IN ('preview','confirmed'));
