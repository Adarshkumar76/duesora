CREATE TABLE "exchange_rates" (
	"currency" varchar(3) PRIMARY KEY NOT NULL,
	"rate_to_usd" double precision NOT NULL,
	"source" varchar(50) DEFAULT 'open-exchange-rates' NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
