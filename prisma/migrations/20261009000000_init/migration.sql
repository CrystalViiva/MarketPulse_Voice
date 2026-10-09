-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'real',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counterparty" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "Counterparty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "candidate" JSONB NOT NULL,
    "transcript" TEXT,
    "source" TEXT NOT NULL,
    "replacesId" TEXT,
    "correctionReason" TEXT,
    "confirmedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftVersion" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "candidate" JSONB NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "draftId" TEXT,
    "state" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "quantity" TEXT,
    "unit" TEXT,
    "amount" BIGINT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "counterparty" TEXT,
    "source" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "replacesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "draftId" TEXT,
    "originActivityId" TEXT,
    "direction" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "counterparty" TEXT,
    "source" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'preview',
    "rows" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportedPayment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "direction" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "method" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'merchant-upload',
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportShare" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationSession" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "expectedAmount" BIGINT,
    "confirmedAmount" BIGINT,
    "result" TEXT NOT NULL,
    "correction" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_key" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Counterparty_businessId_alias_key" ON "Counterparty"("businessId", "alias");

-- CreateIndex
CREATE INDEX "Draft_businessId_state_idx" ON "Draft"("businessId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Draft_id_businessId_key" ON "Draft"("id", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Draft_businessId_requestKey_key" ON "Draft"("businessId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "DraftVersion_draftId_version_key" ON "DraftVersion"("draftId", "version");

-- CreateIndex
CREATE INDEX "Interaction_businessId_idx" ON "Interaction"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_draftId_key" ON "Activity"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_replacesId_key" ON "Activity"("replacesId");

-- CreateIndex
CREATE INDEX "Activity_businessId_eventDate_idx" ON "Activity"("businessId", "eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_id_businessId_key" ON "Activity"("id", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_draftId_key" ON "Settlement"("draftId");

-- CreateIndex
CREATE INDEX "Settlement_businessId_eventDate_idx" ON "Settlement"("businessId", "eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_id_businessId_key" ON "Settlement"("id", "businessId");

-- CreateIndex
CREATE INDEX "Allocation_businessId_activityId_idx" ON "Allocation"("businessId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_settlementId_activityId_key" ON "Allocation"("settlementId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_id_businessId_key" ON "ImportBatch"("id", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_businessId_fingerprint_key" ON "ImportBatch"("businessId", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "ImportedPayment_id_businessId_key" ON "ImportedPayment"("id", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportedPayment_businessId_reference_key" ON "ImportedPayment"("businessId", "reference");

-- CreateIndex
CREATE INDEX "Match_businessId_paymentId_idx" ON "Match"("businessId", "paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_businessId_requestKey_key" ON "Match"("businessId", "requestKey");

-- CreateIndex
CREATE INDEX "Evidence_businessId_activityId_idx" ON "Evidence"("businessId", "activityId");

-- CreateIndex
CREATE INDEX "AuditEvent_businessId_createdAt_idx" ON "AuditEvent"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportShare_tokenHash_key" ON "ReportShare"("tokenHash");

-- CreateIndex
CREATE INDEX "ReportShare_businessId_idx" ON "ReportShare"("businessId");

-- CreateIndex
CREATE INDEX "ValidationSession_businessId_idx" ON "ValidationSession"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthRateLimit_key_key" ON "AuthRateLimit"("key");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counterparty" ADD CONSTRAINT "Counterparty_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftVersion" ADD CONSTRAINT "DraftVersion_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftVersion" ADD CONSTRAINT "DraftVersion_draftId_businessId_fkey" FOREIGN KEY ("draftId", "businessId") REFERENCES "Draft"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_draftId_businessId_fkey" FOREIGN KEY ("draftId", "businessId") REFERENCES "Draft"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_draftId_businessId_fkey" FOREIGN KEY ("draftId", "businessId") REFERENCES "Draft"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_replacesId_businessId_fkey" FOREIGN KEY ("replacesId", "businessId") REFERENCES "Activity"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_draftId_businessId_fkey" FOREIGN KEY ("draftId", "businessId") REFERENCES "Draft"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_originActivityId_businessId_fkey" FOREIGN KEY ("originActivityId", "businessId") REFERENCES "Activity"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_settlementId_businessId_fkey" FOREIGN KEY ("settlementId", "businessId") REFERENCES "Settlement"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_activityId_businessId_fkey" FOREIGN KEY ("activityId", "businessId") REFERENCES "Activity"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportedPayment" ADD CONSTRAINT "ImportedPayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportedPayment" ADD CONSTRAINT "ImportedPayment_batchId_businessId_fkey" FOREIGN KEY ("batchId", "businessId") REFERENCES "ImportBatch"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_paymentId_businessId_fkey" FOREIGN KEY ("paymentId", "businessId") REFERENCES "ImportedPayment"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_activityId_businessId_fkey" FOREIGN KEY ("activityId", "businessId") REFERENCES "Activity"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_settlementId_businessId_fkey" FOREIGN KEY ("settlementId", "businessId") REFERENCES "Settlement"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_activityId_businessId_fkey" FOREIGN KEY ("activityId", "businessId") REFERENCES "Activity"("id", "businessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationSession" ADD CONSTRAINT "ValidationSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
