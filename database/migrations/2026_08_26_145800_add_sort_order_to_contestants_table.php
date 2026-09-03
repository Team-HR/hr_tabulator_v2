<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contestants', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('name');
            $table->index(['event_id', 'sort_order']);
        });

        $eventIds = DB::table('events')->pluck('id');

        foreach ($eventIds as $eventId) {
            $contestants = DB::table('contestants')
                ->where('event_id', $eventId)
                ->orderBy('id')
                ->get();

            foreach ($contestants as $index => $contestant) {
                DB::table('contestants')
                    ->where('id', $contestant->id)
                    ->update(['sort_order' => $index]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contestants', function (Blueprint $table) {
            $table->dropIndex(['event_id', 'sort_order']);
            $table->dropColumn('sort_order');
        });
    }
};
