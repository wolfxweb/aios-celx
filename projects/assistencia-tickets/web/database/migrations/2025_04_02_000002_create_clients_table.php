<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('code')->nullable()->unique();
            $table->string('company_name');
            $table->string('trade_name')->nullable();
            $table->string('tax_id', 32)->nullable()->index();
            $table->string('state_registration')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state', 8)->nullable();
            $table->string('zip', 16)->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('email')->nullable();
            $table->string('contact_person')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
