-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'ADMIN', 'WORKER');

-- CreateEnum
CREATE TYPE "DepartmentCode" AS ENUM ('ROADS', 'WATER', 'SANITATION', 'LIGHTING', 'DRAINAGE', 'GENERAL');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'REOPENED');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('POTHOLES', 'ROAD_DAMAGE', 'TRAFFIC_INFRASTRUCTURE', 'WATER_LEAKAGE', 'GARBAGE_COLLECTION', 'PUBLIC_SANITATION', 'STREETLIGHT_FAILURE', 'DRAINAGE_PROBLEMS', 'PUBLIC_PROPERTY_DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('EVIDENCE', 'RESOLUTION');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('STATUS', 'ASSIGNMENT', 'NOTE', 'FEEDBACK');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'INTERNAL');

-- CreateEnum
CREATE TYPE "AiSource" AS ENUM ('GEMINI', 'RULES');

-- CreateEnum
CREATE TYPE "AiReview" AS ENUM ('PENDING', 'ACCEPTED', 'OVERRIDDEN');

-- CreateEnum
CREATE TYPE "BillService" AS ENUM ('ELECTRICITY', 'WATER', 'PROPERTY_TAX', 'WASTE');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethodCode" AS ENUM ('DEMO_UPI', 'DEMO_CARD', 'DEMO_NET_BANKING', 'DEMO_WALLET', 'DEMO_CASH_COUNTER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED');

-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('GENERAL', 'SERVICE_UPDATE', 'MAINTENANCE', 'EMERGENCY', 'EVENT', 'ADVISORY');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('ISSUED', 'PROCESSED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "department_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "code" "DepartmentCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contact_email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "tracking_seq" SERIAL NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "tracking_year" INTEGER NOT NULL,
    "citizen_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "public_area_label" VARCHAR(100),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "additional_notes" VARCHAR(1000),
    "status" "ComplaintStatus" NOT NULL DEFAULT 'DRAFT',
    "department_id" UUID,
    "assigned_worker_id" UUID,
    "ai_category" "ComplaintCategory",
    "ai_priority" "Priority",
    "ai_department_code" "DepartmentCode",
    "ai_explanation" VARCHAR(500),
    "ai_source" "AiSource",
    "ai_review" "AiReview" NOT NULL DEFAULT 'PENDING',
    "resolution_summary" VARCHAR(1000),
    "resolved_at" TIMESTAMP(3),
    "resolution_version" INTEGER NOT NULL DEFAULT 0,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_photos" (
    "id" UUID NOT NULL,
    "complaint_id" UUID NOT NULL,
    "uploader_id" UUID NOT NULL,
    "kind" "PhotoKind" NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'image/webp',
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "resolution_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_events" (
    "id" UUID NOT NULL,
    "complaint_id" UUID NOT NULL,
    "citizen_id" UUID NOT NULL,
    "actor_id" UUID,
    "type" "EventType" NOT NULL,
    "from_status" "ComplaintStatus",
    "to_status" "ComplaintStatus",
    "department_id" UUID,
    "body" VARCHAR(1000),
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "rating" INTEGER,
    "resolution_version" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" UUID NOT NULL,
    "citizen_id" UUID NOT NULL,
    "service" "BillService" NOT NULL,
    "period_label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "paid_at" TIMESTAMP(3),
    "is_demo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_payment_methods" (
    "id" UUID NOT NULL,
    "code" "PaymentMethodCode" NOT NULL,
    "display_name" VARCHAR(60) NOT NULL,
    "description" VARCHAR(200),
    "icon_name" VARCHAR(40) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_payment_method_services" (
    "id" UUID NOT NULL,
    "payment_method_id" UUID NOT NULL,
    "service" "BillService" NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_payment_method_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_payment_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "is_paused" BOOLEAN NOT NULL DEFAULT false,
    "notice_text" VARCHAR(300) NOT NULL DEFAULT 'DEMO ENVIRONMENT — All payment methods are simulated. No real currency is transferred.',
    "updated_by_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "bill_id" UUID NOT NULL,
    "citizen_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "payment_method_id" UUID NOT NULL,
    "method_code_snapshot" TEXT NOT NULL,
    "method_name_snapshot" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCEEDED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "summary" VARCHAR(300),
    "body" VARCHAR(4000) NOT NULL,
    "category" "AnnouncementCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "author_id" UUID NOT NULL,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "link" VARCHAR(200),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_intents" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "complaint_id" UUID NOT NULL,
    "kind" "PhotoKind" NOT NULL,
    "staging_path" TEXT NOT NULL,
    "upload_status" "UploadStatus" NOT NULL DEFAULT 'ISSUED',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_role_is_active_idx" ON "profiles"("role", "is_active");

-- CreateIndex
CREATE INDEX "profiles_department_id_idx" ON "profiles"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_tracking_number_key" ON "complaints"("tracking_number");

-- CreateIndex
CREATE INDEX "complaints_citizen_id_status_created_at_idx" ON "complaints"("citizen_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "complaints_department_id_status_priority_idx" ON "complaints"("department_id", "status", "priority");

-- CreateIndex
CREATE INDEX "complaints_assigned_worker_id_status_idx" ON "complaints"("assigned_worker_id", "status");

-- CreateIndex
CREATE INDEX "complaints_status_created_at_idx" ON "complaints"("status", "created_at");

-- CreateIndex
CREATE INDEX "complaints_is_public_status_idx" ON "complaints"("is_public", "status");

-- CreateIndex
CREATE INDEX "complaints_tracking_number_idx" ON "complaints"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_photos_storage_path_key" ON "complaint_photos"("storage_path");

-- CreateIndex
CREATE INDEX "complaint_photos_complaint_id_kind_idx" ON "complaint_photos"("complaint_id", "kind");

-- CreateIndex
CREATE INDEX "complaint_events_complaint_id_visibility_created_at_idx" ON "complaint_events"("complaint_id", "visibility", "created_at");

-- CreateIndex
CREATE INDEX "complaint_events_citizen_id_visibility_idx" ON "complaint_events"("citizen_id", "visibility");

-- CreateIndex
CREATE INDEX "bills_citizen_id_status_idx" ON "bills"("citizen_id", "status");

-- CreateIndex
CREATE INDEX "bills_service_status_idx" ON "bills"("service", "status");

-- CreateIndex
CREATE UNIQUE INDEX "demo_payment_methods_code_key" ON "demo_payment_methods"("code");

-- CreateIndex
CREATE INDEX "demo_payment_methods_is_enabled_sort_order_idx" ON "demo_payment_methods"("is_enabled", "sort_order");

-- CreateIndex
CREATE INDEX "demo_payment_method_services_service_is_default_idx" ON "demo_payment_method_services"("service", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "demo_payment_method_services_payment_method_id_service_key" ON "demo_payment_method_services"("payment_method_id", "service");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bill_id_key" ON "payments"("bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_citizen_id_created_at_idx" ON "payments"("citizen_id", "created_at");

-- CreateIndex
CREATE INDEX "announcements_status_published_at_expires_at_idx" ON "announcements"("status", "published_at", "expires_at");

-- CreateIndex
CREATE INDEX "announcements_pinned_published_at_idx" ON "announcements"("pinned", "published_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "upload_intents_staging_path_key" ON "upload_intents"("staging_path");

-- CreateIndex
CREATE INDEX "upload_intents_owner_id_upload_status_idx" ON "upload_intents"("owner_id", "upload_status");

-- CreateIndex
CREATE INDEX "upload_intents_expires_at_upload_status_idx" ON "upload_intents"("expires_at", "upload_status");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_worker_id_fkey" FOREIGN KEY ("assigned_worker_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_photos" ADD CONSTRAINT "complaint_photos_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_events" ADD CONSTRAINT "complaint_events_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_payment_method_services" ADD CONSTRAINT "demo_payment_method_services_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "demo_payment_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "demo_payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_intents" ADD CONSTRAINT "upload_intents_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
